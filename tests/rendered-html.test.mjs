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

test("server redirects to the generated static learning log", async () => {
  const response = await render();
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "http://localhost/worldhaung_ai.html");
});

test("standalone plan is 39 weeks and starts algorithms in December", async () => {
  const [standalone, publicStandalone] = await Promise.all([
    readFile(new URL("../worldhaung_ai.html", import.meta.url), "utf8"),
    readFile(new URL("../public/worldhaung_ai.html", import.meta.url), "utf8"),
  ]);
  assert.equal(publicStandalone, standalone);
  assert.match(standalone, /39 周行动计划/);
  assert.match(standalone, /273 天 · 39 周/);
  assert.match(standalone, /2026-12-01/);
  assert.match(standalone, /全部 39 周/);
  assert.match(standalone, /Transformer 子图编译器/);
  assert.match(standalone, /今天学习的目的/);
  assert.match(standalone, /今天必须掌握的知识点/);
  assert.match(standalone, /今天的具体执行/);
  assert.match(standalone, /今天交付什么 · 不用猜/);
  assert.match(standalone, /修改文件/);
  assert.match(standalone, /验收输入/);
  assert.match(standalone, /完成证据/);
  assert.match(standalone, /今天不写 benchmark、不写 Tensor 功能/);
  assert.match(standalone, /\{2,3,4\} 输出 numel=24、stride=\{12,4,1\}/);
  assert.match(standalone, /class="expand"/);
  assert.match(standalone, /class="subcheck"/);
  assert.match(standalone, /020721/);
  const inlineScript = standalone.match(/<script>([\s\S]*)<\/script>/)?.[1];
  assert.ok(inlineScript, "standalone page should contain its interactive script");
  assert.doesNotThrow(() => new Function(inlineScript));
});

test("static GitHub Pages entries match", async () => {
  const [rootEntry, docsEntry, standalone] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../docs/index.html", import.meta.url), "utf8"),
    readFile(new URL("../worldhaung_ai.html", import.meta.url), "utf8"),
  ]);
  assert.equal(rootEntry, docsEntry);
  assert.equal(rootEntry, standalone);
});
