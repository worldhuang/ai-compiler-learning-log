import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the 50-week password gate", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /AI 编译器学习日志｜50 周秋招计划/);
  assert.match(html, /PRIVATE LEARNING LOG · 50 WEEKS/);
  assert.match(html, /350 TASKS/);
  assert.match(html, /type="password"/);
});

test("planner and standalone file include the requested behavior", async () => {
  const [planner, standalone] = await Promise.all([
    readFile(new URL("../app/Planner.tsx", import.meta.url), "utf8"),
    readFile(new URL("../worldhaung_ai.html", import.meta.url), "utf8"),
  ]);
  assert.match(planner, /全部 50 周/);
  assert.match(planner, /day6Knowledge/);
  assert.match(planner, /LeetCode 2 题/);
  assert.match(planner, /Transformer Subgraph Compiler/);
  assert.match(standalone, /class="expand"/);
  assert.match(standalone, /020721/);
  assert.match(standalone, /2027\.02 开始每周约 5 道 LeetCode/);
  assert.match(standalone, /简历项目里程碑/);
});

test("C++ recovery phase and daily resources are video-first", async () => {
  const planner = await readFile(new URL("../app/Planner.tsx", import.meta.url), "utf8");
  const resourceBlock = planner.slice(planner.indexOf("const phaseResources"), planner.indexOf("const openSourceProjects"));
  assert.match(planner, /C\+\+ 恢复训练：语法与函数/);
  assert.match(planner, /C\+\+ 恢复验收：迷你张量容器/);
  assert.match(planner, /今日可观看视频/);
  assert.ok((resourceBlock.match(/https:\/\/www\.bilibili\.com\/video\//g) ?? []).length >= 20);
  assert.doesNotMatch(resourceBlock, /docs\.|github\.com|youtube\.com/);
});
