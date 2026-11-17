// Brief of 17 Nov 2026, fail-closed rules: approval lookup fails -> no Sanity posts; Sanity down -> no Sanity posts
// (the built-in posts still show); no Sanity posts -> the database is not queried.
import { describe, expect, it, vi } from "vitest";
import { assemblePosts } from "@/lib/content/public";
import type { Post } from "@/lib/content/types";

const post = (id: string): Post => ({ _id: id, _type: "post", _rev: "r", slug: id, title: id, description: "", mainImage: null, body: [] });

describe("posts", () => {
  it("no posts: database not queried (build stays database-free)", async () => {
    const db = vi.fn();
    expect(await assemblePosts(async () => [], db)).toEqual([]);
    expect(db).not.toHaveBeenCalled();
  });
  it("approval lookup fails: no Sanity posts at all", async () => {
    expect(await assemblePosts(async () => [post("a")], async () => { throw new Error("x"); })).toEqual([]);
  });
  it("Sanity down or unset: empty list, and the database is not asked", async () => {
    const db = vi.fn();
    expect(await assemblePosts(async () => { throw new Error("x"); }, db)).toEqual([]);
    expect(db).not.toHaveBeenCalled();
  });
  it("filters to approved posts", async () => {
    expect((await assemblePosts(async () => [post("a"), post("b")], async () => new Map([["b", "r"]]))).map((p) => p._id)).toEqual(["b"]);
  });
});
