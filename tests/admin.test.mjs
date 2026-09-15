import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  validateContent,
  escapeHtml,
  iconHtml,
  isImage,
} from "../public/content-model.js";
import { GitHubStore } from "../public/github-store.js";
const reference = JSON.parse(
  await readFile(new URL("../public/content.json", import.meta.url), "utf8"),
);
test("all content survives Unicode and multiline serialization", () => {
  const value = structuredClone(reference);
  value.letter.body = "다은 ♡\n1000일\n<script>alert(1)</script>";
  assert.equal(validateContent(value, reference), value);
  assert.ok(escapeHtml(value.letter.body).includes("&lt;script&gt;"));
  assert.equal(isImage("javascript:alert(1)"), false);
  assert.equal(isImage("data:image/svg+xml,<svg onload=alert(1)>"), false);
  assert.ok(!iconHtml("<img src=x onerror=alert(1)>").includes("<img"));
});
test("empty collections can be edited again", () => {
  const empty = structuredClone(reference);
  empty.photos.items = [];
  const value = structuredClone(empty);
  value.photos.items.push({
    icon: "♡",
    image: "",
    title: "추억",
    caption: "메모",
  });
  assert.doesNotThrow(() => validateContent(value, empty));
});
test("invalid shape and image protocols are rejected", () => {
  const value = structuredClone(reference);
  value.photos.items[0].image = "https://untrusted.example/a.svg";
  assert.throws(() => validateContent(value, reference));
  value.photos.items = [];
  value.site.heading = {};
  assert.throws(() => validateContent(value, reference));
});
test("publish creates only the content blob and a non-forced ref update", async () => {
  const calls = [];
  const replies = [
    { object: { sha: "base" } },
    { tree: { sha: "tree-base" } },
    { sha: "blob" },
    { sha: "tree-new" },
    { sha: "commit-new" },
    { object: { sha: "commit-new" } },
  ];
  const store = new GitHubStore("fake", async (url, options) => {
    calls.push({ url, ...options });
    return { ok: true, status: 200, json: async () => replies.shift() };
  });
  store.head = "base";
  assert.equal(await store.publish(reference), "commit-new");
  const tree = JSON.parse(calls[3].body);
  assert.deepEqual(tree.tree, [
    { path: "public/content.json", mode: "100644", type: "blob", sha: "blob" },
  ]);
  assert.deepEqual(JSON.parse(calls[5].body), {
    sha: "commit-new",
    force: false,
  });
  assert.equal(store.head, "commit-new");
  assert.ok(
    calls.every((c) =>
      c.url.startsWith(
        "https://api.github.com/repos/leedaeun31/usos-1000-days/",
      ),
    ),
  );
});
test("conflict prevents all writes", async () => {
  let writes = 0;
  const store = new GitHubStore("fake", async (url, options) => {
    if (options.method !== "GET") writes++;
    return {
      ok: true,
      status: 200,
      json: async () => ({ object: { sha: "someone-else" } }),
    };
  });
  store.head = "base";
  await assert.rejects(() => store.publish(reference), /최신 변경/);
  assert.equal(writes, 0);
});
test("failed ref write is safely reconciled without duplicate publication", async () => {
  let index = 0;
  const replies = [
    { object: { sha: "base" } },
    { tree: { sha: "tree-base" } },
    { sha: "blob" },
    { sha: "tree-new" },
    { sha: "commit-new" },
    null,
    { object: { sha: "commit-new" } },
  ];
  const store = new GitHubStore("fake", async () => {
    const i = index++;
    if (i === 5) throw new Error("connection lost");
    return { ok: true, status: 200, json: async () => replies[i] };
  });
  store.head = "base";
  assert.equal(await store.publish(reference), "commit-new");
});
test("wrong identity and expired credentials never authenticate", async () => {
  const wrong = new GitHubStore("fake", async () => ({
    ok: true,
    status: 200,
    json: async () => ({ login: "someone-else" }),
  }));
  await assert.rejects(() => wrong.login(), /leedaeun31/);
  const expired = new GitHubStore("fake", async () => ({
    ok: false,
    status: 401,
  }));
  await assert.rejects(() => expired.login(), /만료/);
  expired.logout();
  assert.equal(expired.token, "");
});
