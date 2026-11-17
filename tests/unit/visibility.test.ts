// Brief of 17 Nov 2026, "Core rule" and "Public site": the public visibility filter.
import { describe, expect, it } from "vitest";
import { isPublic, publicPosts } from "@/lib/content/visibility";
import type { Post } from "@/lib/content/types";

const post = (id: string, rev: string, slug: string | null = id, extra: Partial<Post> = {}) => ({ _id: id, _type: "post", _rev: rev, slug, title: id, description: "", mainImage: null, body: [], ...extra }) as Post;

describe("public visibility", () => {
  const approved = new Map([["a", "r1"], ["b", "r1"], ["drafts.c", "r1"], ["d", "r1"], ["e", "r1"]]);
  it("only approved-at-current-revision, valid-slug, not deletion-requested, published ids", () => {
    const list = publicPosts([
      post("a", "r1"),                       // public
      post("b", "r2"),                       // edited after approval
      post("drafts.c", "r1"),                // draft id
      post("d", "r1", "/test"),              // bad slug: never linked to a 404
      post("e", "r1", "e", { deletionRequested: true }),
      post("f", "r1"),                       // never approved
      post("versions.x.a", "r1"),            // release version id
    ], approved);
    expect(list.map((p) => p._id)).toEqual(["a"]);
  });
  it("a post deleted in Sanity is simply absent: an old approval alone shows nothing", () => {
    expect(publicPosts([], approved)).toEqual([]);
  });
  it("isPublic needs an approval at exactly the current revision", () => {
    expect(isPublic({ _id: "s1", _type: "post", _rev: "r" }, new Map([["s1", "r"]]))).toBe(true);
    expect(isPublic({ _id: "s1", _type: "post", _rev: "r" }, new Map([["s1", "older"]]))).toBe(false);
    expect(isPublic({ _id: "s1", _type: "post", _rev: "r" }, new Map())).toBe(false);
  });
});
