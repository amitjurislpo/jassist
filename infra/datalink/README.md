# Data link: the site's secured HTTPS link to the group database

The Founding CTO's decision of 10 Nov 2026 (IamJCG D-94): "the Academy site reaches its data on the
group database only over a secured HTTPS link from a component inside our AWS network, with no new
monthly cost and the database port closed to the internet."

```
Vercel (site) --HTTPS, signed--> Lambda function URL --(inside the group VPC)--> group database
                                  jassist-datalink-prod     -> jassist_prod
                                  jassist-datalink-preview  -> jassist_preview
```

- **The database stays private.** No public address. Its security group admits this module's
  security group on 5432 by name (IamJCG `infra/rds`), never an address range.
- **Only named operations.** The Lambda runs the list in `lib/data/operations.ts` and the
  migrations bundled into it. There is no way to send it SQL.
- **Every request is signed** (HMAC-SHA256 over environment, time and body; `scripts/data-link.mjs`)
  with a secret per environment, and is refused if older than five minutes, for the other
  environment, or wrongly signed, before the database is touched. The site signs its own
  `VERCEL_ENV`, so a preview can never be answered by production.
- **No monthly cost.** Lambda bills per use, far inside the always-free allowance; the function
  URL, security group, role and network interfaces are free. No NAT gateway, VPC endpoint, load
  balancer or Secrets Manager secret. Logs are kept 14 days.
- **Secrets never enter Terraform.** `scripts/datalink-config.sh` sets each Lambda's
  `DATABASE_URL` and `DATA_LINK_SECRET` from Doppler `juris_assist` (prd, stg), piped, never printed.

## Doppler (project `juris_assist`)

| Key | prd / stg | Who reads it |
|---|---|---|
| `DATALINK_DATABASE_URL` | that environment's login, `postgres://jassist_prod_owner:…@<endpoint>:5432/jassist_prod` (no `sslmode`: the code verifies TLS against the RDS certificate bundle itself, and an `sslmode` in the address would replace that) (preview: `jassist_preview_owner`, `jassist_preview`) | the Lambda only |
| `DATA_LINK_SECRET` | 64 random hex characters, different per environment | the Lambda and the site |
| `DATA_LINK_URL` | the function URL from `terraform output urls` | the site |

## First set-up (admin AWS login, each a named step)

1. `npm run datalink:build`
2. `cd infra/datalink && terraform init && terraform plan` (expect 9 to add, 0 to change, 0 to
   destroy), then `terraform apply`.
3. IamJCG `infra/rds`: the database's security group admits `jassist-datalink-sg` on 5432
   (a rule naming a security group). `terraform plan` there shows 0 to add, 1 to change, 0 to destroy.
4. Making JurisAssist's databases: open the SSM tunnel through `iamjcg-service` to the database
   on local port 55432, then, with the two passwords in `JASSIST_PROD_PASSWORD` /
   `JASSIST_PREVIEW_PASSWORD` and the master password piped from Secrets Manager into `PGPASSWORD`
   for this one command:
   `psql "host=127.0.0.1 port=55432 dbname=postgres user=jcg_master sslmode=require" -v ON_ERROR_STOP=1 -f infra/datalink/bootstrap.sql`
5. Put the three keys above into Doppler, then `scripts/datalink-config.sh` and
   `scripts/sync-secrets.sh`.
6. Redeploy the site: the build applies the migrations through the link.

## Changing the code or adding a migration

Add the migration in `db/migrations`, run `npm run datalink:build` (this also refreshes
`datalink/migrations.json`, which a test checks), and `terraform apply` here **before** the site's
deployment: the site's build fails, and its current deployment stays live, until the Lambda has
every migration the site's code expects.
