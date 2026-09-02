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

test("standalone plan is a 30-week AI compiler sprint with algorithms from Day 10", async () => {
  const [standalone, publicStandalone] = await Promise.all([
    readFile(new URL("../worldhaung_ai.html", import.meta.url), "utf8"),
    readFile(new URL("../public/worldhaung_ai.html", import.meta.url), "utf8"),
  ]);
  assert.equal(publicStandalone, standalone);
  assert.match(standalone, /30 周冲刺计划/);
  assert.match(standalone, /210 天 · 30 周/);
  assert.match(standalone, /代码随想录核心 70 题/);
  assert.match(standalone, /Hot100 100 题/);
  assert.match(standalone, /全部 30 周/);
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
  assert.match(standalone, /今天具体要学什么/);
  assert.match(standalone, /CMake target、静态库、CTest/);
  assert.match(standalone, /GPU OPERATOR LAB/);
  assert.match(standalone, /TRANSFORMER SUBGRAPH COMPILER/);
  assert.match(standalone, /Tensor Core/);
  assert.match(standalone, /DDP\/FSDP\/ZeRO/);
  assert.match(standalone, /weight-only INT8/);
  assert.match(standalone, /周验收：在干净环境从零运行/);
  assert.match(standalone, /function pace\(task\)/);
  assert.match(standalone, /fileHint is authored per week/);
  assert.match(standalone, /resumeGate/);
  assert.match(standalone, /guideReadingCard/);
  assert.match(standalone, /AIInfraGuide/);
  assert.match(standalone, /guidePlan/);
  assert.doesNotMatch(standalone, /if \(w\.index <= 9\) \{/);
  assert.match(standalone, /class="expand"/);
  assert.match(standalone, /class="subcheck"/);
  assert.match(standalone, /020721/);
  assert.doesNotMatch(standalone, /全部 50 周/);
  const dataText = standalone.match(/const DATA=(\{[\s\S]*?\});\nconst dayNames/)?.[1];
  assert.ok(dataText, "standalone page should embed its plan data");
  const planData = JSON.parse(dataText);
  assert.equal(planData.weeks.length, 30);
  assert.equal(planData.guidePlan.length, 30);
  assert.ok(planData.guidePlan.every((guide) => guide.title && guide.url && guide.readingGoal));
  assert.ok(planData.weeks.every((week) => week.days.length === 6 && week.fileHint && week.knowledge.length >= 4));
  assert.match(planData.weeks[1].days[1], /实现深拷贝、移动构造和移动赋值/);
  assert.match(planData.weeks[15].days[4], /MetaSchedule/);
  assert.match(planData.weeks[21].days[2], /从干净环境/);
  assert.match(standalone, /\.\.\.w\.days\.slice\(0,6\),weeklyClosure\(w\)/);
  assert.match(standalone, /代码随想录核心 #/);
  assert.match(standalone, /LeetCode Hot 100 #/);
  const inlineScript = standalone.match(/<script>([\s\S]*)<\/script>/)?.[1];
  assert.ok(inlineScript, "standalone page should contain its interactive script");
  assert.doesNotThrow(() => new Function(inlineScript));
});

test("GitHub Pages entries embed the current standalone page", async () => {
  const [rootEntry, docsEntry, standalone] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../docs/index.html", import.meta.url), "utf8"),
    readFile(new URL("../worldhaung_ai.html", import.meta.url), "utf8"),
  ]);
  assert.equal(rootEntry, docsEntry);
  assert.match(rootEntry, /DecompressionStream\("gzip"\)/);
  assert.match(rootEntry, /AI 编译器学习日志/);
  assert.ok(rootEntry.length < standalone.length, "compressed Pages entry should fit GitHub file updates");
});
