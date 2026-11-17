import type { Pool } from "pg";
import type { ApprovalRecord } from "./machine";
import type { DecisionStore } from "./decide";

type Row = { object_type: string; object_id: string; title: string; revision: string; state: "approved" | "rejected"; decided_by: string; decided_at: Date; reason: string | null };

const toRecord = (r: Row): ApprovalRecord => ({
  objectType: r.object_type, objectId: r.object_id, title: r.title, revision: r.revision, state: r.state,
  decidedBy: r.decided_by, decidedAt: r.decided_at, reason: r.reason,
});

export function pgDecisionStore(pool: Pool): DecisionStore & {
  listAll(): Promise<ApprovalRecord[]>;
  approvedRevisions(): Promise<Map<string, string>>;
} {
  return {
    async getLatest(objectType, objectId) {
      const { rows } = await pool.query<Row>("select * from approval where object_type = $1 and object_id = $2", [objectType, objectId]);
      return rows[0] ? toRecord(rows[0]) : null;
    },

    async writeDecision(record, expected, fromState) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        // Compare-and-set: the row must still be what the decision was based on.
        const res = expected
          ? await client.query(
              `update approval set revision = $3, state = $4, decided_by = $5, decided_at = $6, reason = $7, title = $10
                 where object_type = $1 and object_id = $2 and revision = $8 and state = $9`,
              [record.objectType, record.objectId, record.revision, record.state, record.decidedBy, record.decidedAt, record.reason, expected.revision, expected.state, record.title ?? ""],
            )
          : await client.query(
              `insert into approval (object_type, object_id, revision, state, decided_by, decided_at, reason, title)
                 values ($1, $2, $3, $4, $5, $6, $7, $8) on conflict do nothing`,
              [record.objectType, record.objectId, record.revision, record.state, record.decidedBy, record.decidedAt, record.reason, record.title ?? ""],
            );
        if (res.rowCount !== 1) {
          await client.query("rollback");
          return false;
        }
        await client.query(
          `insert into approval_audit (object_type, object_id, revision, from_state, to_state, actor, at, reason)
             values ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [record.objectType, record.objectId, record.revision, fromState, record.state, record.decidedBy, record.decidedAt, record.reason],
        );
        await client.query("commit");
        return true;
      } catch (err) {
        await client.query("rollback").catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    },

    async listAll() {
      const { rows } = await pool.query<Row>("select * from approval order by decided_at desc");
      return rows.map(toRecord);
    },

    async approvedRevisions() {
      const { rows } = await pool.query<{ object_id: string; revision: string }>("select object_id, revision from approval where state = 'approved'");
      return new Map(rows.map((r) => [r.object_id, r.revision]));
    },
  };
}

export async function isCheckerEmail(pool: Pool, email: string): Promise<boolean> {
  try {
    const { rowCount } = await pool.query("select 1 from blog_checker where email = $1", [email.trim().toLowerCase()]);
    return rowCount === 1;
  } catch {
    return false; // fail closed
  }
}
