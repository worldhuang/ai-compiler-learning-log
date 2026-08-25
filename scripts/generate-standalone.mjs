import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const sourceText = fs.readFileSync(path.join(root, "app", "Planner.tsx"), "utf8");
const source = ts.createSourceFile("Planner.tsx", sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function valueOf(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(valueOf);
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map((property) => {
    const name = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) ? property.name.text : property.name.getText(source);
    return [name, valueOf(property.initializer)];
  }));
  throw new Error(`Unsupported data node: ${ts.SyntaxKind[node.kind]}`);
}

function findConst(name) {
  let result;
  source.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name && declaration.initializer) result = valueOf(declaration.initializer);
    }
  });
  if (!result) throw new Error(`Missing ${name}`);
  return result;
}

const rawWeeks = findConst("weeks");

// 2026-08-31 to 2027-05-30: keep the two flagship projects, merge only
// adjacent foundation labs, and never use a "review-only" day as a task.
const compressedPlan = [
  [1], [2], [3], [4], [5], [6], [7, 8], [9, 10], [11, 12],
  [13], [14], [15], [16], [17], [18], [19, 20],
  [21], [22, 23], [24], [25, 26], [27, 28], [29],
  [30], [31], [32], [33], [34], [35],
  [36], [37], [38], [39], [40], [41], [42], [43], [44],
  [45, 46, 47], [48, 49, 50],
];

const compressedTitles = [
  "MiniTensor I：工程骨架与张量接口", "MiniTensor II：Storage、RAII 与视图",
  "MiniTensor III：模板、算子与测试", "MiniTensor IV：线程池、基准与发布",
  "机器表示、汇编与链接", "CPU Cache 与数据局部性",
  "SIMD、并发与 False Sharing", "内存分配器：块布局到分离链表",
  "可信性能工程与 MiniTensor v0.2", "CUDA 编程模型", "CUDA 内存层次与转置",
  "矩阵乘法 I：Shared Memory Tiling", "矩阵乘法 II：寄存器分块与 Occupancy",
  "归约与数值稳定 Softmax", "LayerNorm Kernel", "Triton 对照与 CUDA 项目封版",
  "PyTorch Autograd、Dispatcher 与 Extension", "FX 图变换与 ONNX 导出",
  "torch.compile 全栈实验", "TorchDynamo 与 AOTAutograd 调试",
  "Inductor 代码生成与自定义 Backend", "FX 融合 Pass 工程化",
  "项目 A 立项：GPU 算子库", "项目 A：Softmax 与 RMSNorm",
  "项目 A：GEMM 与 Transformer MLP", "项目 A：RoPE、Attention 与 KV Cache",
  "项目 A：PyTorch / vLLM 接入", "项目 A 封版：性能证据与复现",
  "项目 B 立项：Transformer 子图编译器", "项目 B：TensorIR Lowering 与 GPU Schedule",
  "项目 B：图融合 Pass", "项目 B：动态 Shape 与 MetaSchedule",
  "项目 B：Runtime、External Codegen 与诊断", "项目 B：Decoder Block 与 KV Cache",
  "项目 B：真实框架接入", "项目 B：端到端验收", "TVM 开源贡献冲刺",
  "MLIR：IR、Rewrite 与 Lowering", "作品集、简历与 AI Compiler 面试",
];

function selectSevenDays(sources) {
  const all = sources.flatMap((source) => source.days);
  if (sources.length === 1) {
    return [...all.slice(0, 6), `把「${sources[0].output}」从零重跑一次；修复一个最明显的问题并写下下周要保留的接口`];
  }
  if (sources.length === 2) return [...sources[0].days.slice(0, 4), ...sources[1].days.slice(0, 3)];
  return [...sources[0].days.slice(0, 2), ...sources[1].days.slice(0, 3), ...sources[2].days.slice(0, 2)];
}

const compressedWeeks = compressedPlan.map((sourceIds, index) => {
  const sources = sourceIds.map((id) => rawWeeks[id - 1]);
  const first = sources[0];
  const phase = index < 9 ? 1 : index < 16 ? 2 : index < 22 ? 3 : index < 37 ? 4 : 5;
  return {
    ...first,
    phase,
    title: compressedTitles[index],
    goal: sources.map((source) => source.goal).join("；"),
    output: sources.map((source) => source.output).join(" + "),
    days: selectSevenDays(sources),
    sourceWeek: sourceIds[0],
    fileHint: sourceIds.map((id) => findConst("weekFileHints")[id]).filter(Boolean).join(" · "),
    knowledge: sourceIds.flatMap((id) => findConst("weekKnowledgePoints")[id] || []),
  };
});

const compressedPhases = [
  { name: "C++ / 体系结构", range: "W01–W09", color: "#ef6a4c" },
  { name: "CUDA / Kernel", range: "W10–W16", color: "#e49b32" },
  { name: "PyTorch 编译栈", range: "W17–W22", color: "#4f80c8" },
  { name: "旗舰项目 A + B", range: "W23–W37", color: "#7e62c7" },
  { name: "MLIR / 面试", range: "W38–W39", color: "#249577" },
];

const DATA = {
  weeks: compressedWeeks, phases: compressedPhases, acceptancePlan: findConst("acceptancePlan"),
  phaseResources: findConst("phaseResources"), phaseReferences: findConst("phaseReferences"),
  weekLearningResources: findConst("weekLearningResources"), openSourceProjects: findConst("openSourceProjects"),
  detailSteps: findConst("detailSteps"), timePlan: findConst("timePlan"), jdSignals: findConst("jdSignals"),
  weekFileHints: findConst("weekFileHints"),
  weekKnowledgePoints: findConst("weekKnowledgePoints"),
};
const data = JSON.stringify(DATA).replaceAll("<", "\\u003c");

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI 编译器学习日志｜39 周行动计划</title><style>
:root{--ink:#211c1a;--paper:#f7f1e9;--card:#fffaf4;--muted:#756d68;--line:#ded3c8;--accent:#ef6a4c;--purple:#7257aa}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,"Microsoft YaHei",sans-serif}button,input{font:inherit}button{cursor:pointer}a{color:inherit;text-decoration:none}.top{position:sticky;top:0;z-index:10;height:68px;padding:0 5vw;background:rgba(247,241,233,.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between}.brand{display:flex;align-items:center;gap:10px;font-size:12px;line-height:1}.mark{width:36px;height:36px;border-radius:50% 50% 50% 8px;background:var(--ink);color:#fff;display:grid;place-items:center;font:700 13px Georgia}.progress{display:flex;align-items:center;gap:10px;font:11px monospace}.bar{width:110px;height:5px;background:#dfd4ca}.bar i{display:block;height:100%;background:var(--accent)}.hero{padding:72px 7vw 58px;display:grid;grid-template-columns:1.35fr .65fr;gap:6vw;align-items:center}.eyebrow{font-size:10px;font-weight:800;letter-spacing:.2em;color:var(--accent)}h1{font:clamp(52px,7vw,94px)/.96 Georgia,"Songti SC",serif;letter-spacing:-.05em;margin:18px 0 26px}h1 em{font-weight:400;color:var(--accent)}.hero p{max-width:650px;line-height:1.8;color:var(--muted)}.stat{background:var(--card);border:1px solid var(--line);box-shadow:14px 14px 0 #e8ddd3;padding:28px}.stat strong{display:block;font:58px Georgia;color:var(--accent)}.stat label{display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);margin-top:24px;padding-top:16px;font-size:12px}.stat input{border:0;background:#eee4da;padding:8px}.signals{padding:35px 6vw;background:var(--ink);color:#fff;display:grid;grid-template-columns:repeat(4,1fr);gap:1px}.signal{padding:18px;border:1px solid #4a423e;display:flex;flex-direction:column;min-height:140px}.signal small{color:var(--accent);font:9px monospace}.signal b{margin:10px 0;font:17px Georgia}.signal span{font-size:9px;line-height:1.6;color:#bdb4ae}.tools{max-width:1320px;margin:55px auto 0;padding:0 5vw 22px;display:grid;grid-template-columns:1fr 310px;gap:16px}.phases{display:flex;flex-wrap:wrap;gap:8px}.phases button,.search{border:1px solid var(--line);background:var(--card);padding:11px 14px;font-size:11px}.phases button.active{background:var(--ink);color:white}.search{display:flex}.search input{width:100%;border:0;background:transparent;outline:0}.content{max-width:1320px;margin:auto;padding:0 5vw 100px}.week{background:rgba(255,250,244,.7);border:1px solid var(--line);margin:10px 0}.summary{width:100%;border:0;background:transparent;text-align:left;padding:18px;display:grid;grid-template-columns:54px 1fr 90px;gap:18px;align-items:center}.wn{width:50px;height:50px;border:1px solid var(--ink);display:grid;place-items:center;font:22px Georgia}.summary small{font:9px monospace;color:var(--accent);letter-spacing:.1em}.summary h2{font:21px Georgia,"Songti SC",serif;margin:5px 0}.summary p{font-size:12px;color:var(--muted);margin:0}.score{text-align:right;font:11px monospace}.body{display:none;border-top:1px solid var(--line);padding:18px}.week.open .body{display:block}.output{background:var(--ink);color:white;padding:16px 20px;margin-bottom:10px}.output span{font-size:9px;color:#c3b7ae;letter-spacing:.12em}.output b{display:block;font:18px Georgia;margin-top:6px}.resources{display:flex;flex-wrap:wrap;gap:7px;background:#eee5dc;border:1px solid var(--line);padding:12px;margin-bottom:10px}.resources strong{width:100%;font-size:9px;color:var(--purple);letter-spacing:.12em;margin-top:3px}.resources a,.links a{color:var(--ink);background:var(--card);border:1px solid var(--line);padding:8px 10px;text-decoration:none;font-size:10px}.resources a:hover,.links a:hover{border-color:var(--accent);color:var(--accent)}.days{display:grid;grid-template-columns:1fr 1fr;gap:7px}.day{border:1px solid var(--line);background:var(--card)}.day.done{opacity:.65;background:#eee8e1}.dayTop{display:grid;grid-template-columns:26px 64px 1fr auto;gap:10px;align-items:start;padding:13px;min-height:100px}.tick{width:21px;height:21px;border:1px solid #978a81;display:grid;place-items:center}.done .tick{background:#249577;color:#fff}.check{position:absolute;opacity:0}.date{font:9px monospace}.date span{display:block;color:var(--muted);margin-top:5px}.task{font-size:11px;line-height:1.55}.task small{display:block;color:var(--muted);font-size:9px;margin-top:5px}.expand{border:0;background:transparent;color:var(--purple);font-size:10px;font-weight:800}.detail{display:none;border-top:1px dashed #cfc1e7;background:#f5f0fb;padding:18px;grid-template-columns:1.1fr .9fr;gap:20px}.day.open .detail{display:grid}.detail ol{margin:0;padding-left:18px;font-size:11px;line-height:1.75}.links{display:flex;flex-wrap:wrap;align-content:start;gap:7px}.links strong{width:100%;font-size:9px;color:var(--purple);letter-spacing:.12em}.empty{text-align:center;padding:60px;color:var(--muted)}footer{background:var(--ink);color:#c7bdb5;padding:35px 7vw;font:12px Georgia;text-align:center}.offlineGate{position:fixed;inset:0;z-index:100;background:var(--paper);display:grid;place-items:center;padding:20px}.offlineGate section{width:min(470px,100%);background:var(--card);border:1px solid var(--line);box-shadow:14px 14px 0 #e5dad0;padding:38px}.offlineGate h2{font:44px/1 Georgia,"Songti SC",serif;margin:18px 0}.offlineGate h2 em{color:var(--accent);font-weight:400}.offlineGate p{font-size:12px;color:var(--muted)}.offlineGate form{display:grid;grid-template-columns:1fr auto;margin-top:24px}.offlineGate input{min-width:0;border:1px solid var(--ink);padding:14px;font:17px monospace;letter-spacing:.2em}.offlineGate button{border:0;background:var(--ink);color:white;padding:0 20px}.offlineGate .error{display:block;color:#c74435;font-size:10px;margin-top:8px}@media(max-width:900px){.hero{grid-template-columns:1fr}.signals{grid-template-columns:1fr 1fr}.tools{grid-template-columns:1fr}.days{grid-template-columns:1fr}}@media(max-width:600px){.hero{padding:48px 20px}.hero h1{font-size:48px}.content,.tools{padding-left:16px;padding-right:16px}.signals{grid-template-columns:1fr}.summary{grid-template-columns:46px 1fr}.score,.summary p{display:none}.dayTop{grid-template-columns:24px 58px 1fr}.expand{grid-column:3;justify-self:start}.detail{grid-template-columns:1fr}.top{padding:0 16px}.bar{width:70px}}
.detail{padding:20px 22px;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr)}.startHere{background:#211c1a;color:white;padding:15px 17px;margin-bottom:18px}.startHere span,.detailTitle{display:block;margin-bottom:8px;color:#7257aa;font-size:9px;font-weight:800;letter-spacing:.14em}.startHere span{color:#d3c6bd}.startHere code{display:block;color:#ffd2c6;font:11px/1.6 Consolas,monospace;overflow-wrap:anywhere}.startHere p{margin:8px 0 0;color:#c9bfb8;font-size:10px;line-height:1.6}.actionList{display:grid;gap:7px;margin:0;padding:0!important;list-style:none}.actionList li{margin:0}.actionList label{display:grid;grid-template-columns:26px 1fr;gap:9px;align-items:start;padding:10px 11px;border:1px solid #d8cce8;background:white;cursor:pointer}.actionList input{position:absolute;opacity:0}.actionList i{display:grid;width:22px;height:22px;place-items:center;border:1px solid #9b88c2;color:#7257aa;font:10px monospace;font-style:normal}.actionList input:checked+i{border-color:#249577;background:#249577;color:white}.actionList b{font-size:11px;font-weight:600;line-height:1.65}.actionList input:checked~b{color:#8b838f;text-decoration:line-through}.completeDay{width:100%;margin-top:10px;padding:11px 14px;border:0;background:#7257aa;color:white;font-size:10px;font-weight:800}.dayMeta pre{overflow:auto;margin:0 0 18px;padding:13px;border-left:3px solid #ef6a4c;background:#282321;color:#f7f1e9}.dayMeta pre code{white-space:pre-wrap;font:10px/1.7 Consolas,monospace}.dayMeta ul{margin:0 0 18px;padding-left:18px;font-size:10px;line-height:1.75}.methodNote{padding:9px 11px;border-left:3px solid #aa99d0;background:#eee7f7;color:#62596a;font-size:10px;line-height:1.65}@media(max-width:600px){.detail{grid-template-columns:1fr}}
.purposeCard,.knowledgeCard{margin-bottom:14px;padding:14px 16px;border:1px solid #d8cce8;background:#fffaf5}.purposeCard{border-left:4px solid #ef6a4c;background:#fff1eb}.purposeCard span,.knowledgeCard span{display:block;margin-bottom:8px;color:#6d55a1;font-size:9px;font-weight:800;letter-spacing:.14em}.purposeCard p{margin:0;color:#443c38;font-size:11px;line-height:1.75}.knowledgeCard ul{display:grid;gap:7px;margin:0;padding:0;list-style:none}.knowledgeCard li{position:relative;padding-left:16px;color:#514851;font-size:10px;line-height:1.65}.knowledgeCard li:before{content:"◆";position:absolute;top:0;left:0;color:#7e62c7;font-size:8px}
</style></head><body>
<div class="offlineGate" id="offlineGate"><section><span class="eyebrow">AI COMPILER · LEARNING LOG</span><h2>进入你的<br><em>学习日志</em></h2><p>输入 6 位数访问密码。勾选进度会保存在当前浏览器。</p><form id="unlockForm"><input id="unlockInput" type="password" inputmode="numeric" maxlength="6" placeholder="••••••" autofocus><button>进入 →</button></form><span class="error" id="unlockError"></span></section></div>
<header class="top"><div class="brand"><span class="mark">AC</span><span>AI COMPILER<br><b>LEARNING LOG</b></span></div><div class="progress"><span id="doneTop">0/273</span><div class="bar"><i id="topBar"></i></div><b id="percentTop">0%</b></div></header>
<section class="hero"><div><span class="eyebrow">273 天 · 39 周 · 2 个简历主项目</span><h1>AI 编译器<br><em>学习日志</em></h1><p>从 2026 年 8 月末到 2027 年 5 月底：每一天只解决一个明确问题，并留下可运行代码、测试或性能证据。12 月起每周加入 5 道 LeetCode；项目 A 与项目 B 在 3—5 月完成。</p></div><div class="stat"><span class="eyebrow">计划进度</span><strong id="percentBig">0%</strong><span id="doneBig">已完成 0 个任务</span><label>计划开始日 <input id="startDate" type="date" value="2026-08-31"></label></div></section>
<section class="signals" id="signals"></section><section class="tools"><div class="phases" id="phaseButtons"></div><label class="search"><input id="search" placeholder="搜索 CUDA、LayerNorm、Pass…"></label></section><main class="content" id="weeks"></main><footer>密码：020721 · 坚持不是堆时长，而是每周交付可运行、可复现、可解释的证据。</footer>
<script>const DATA=${data};
const dayNames=["一","二","三","四","五","六","日"];let saved={};try{saved=JSON.parse(localStorage.getItem("ai-compiler-standalone-v3")||"{}")||{}}catch{}let completed=saved.completed||{},subtasks=saved.subtasks||{},startDate=saved.startDate||"2026-08-31",active=0,query="",openWeeks=new Set([1]),openDays=new Set();const total=DATA.weeks.length*7;
function dateLabel(w,d){const x=new Date(startDate+"T00:00:00");x.setDate(x.getDate()+(w-1)*7+d);return (x.getMonth()+1)+"/"+x.getDate()}function persist(){localStorage.setItem("ai-compiler-standalone-v3",JSON.stringify({completed,subtasks,startDate}))}function updateProgress(){const done=Object.values(completed).filter(Boolean).length,p=Math.round(done/total*100);doneTop.textContent=done+"/"+total;percentTop.textContent=p+"%";percentBig.textContent=p+"%";doneBig.textContent="已完成 "+done+" 个任务";topBar.style.width=p+"%"}
function leetcodeActive(w){const x=new Date(startDate+"T00:00:00");x.setDate(x.getDate()+(w.index-1)*7);return x>=new Date("2026-12-01T00:00:00")}function tasks(w){const algo=["；LeetCode 1 题：写复杂度和 2 个边界","","；LeetCode 1 题：口头复述思路","","；LeetCode 1 题：补一个替代解法","；LeetCode 1 题：写错因","；LeetCode 1 题：整理模板"];return w.days.map((task,index)=>task+(leetcodeActive(w)?algo[index]:""))}function resources(w){return DATA.weekLearningResources.find(x=>x.week===(w.sourceWeek||w.index))||{videos:DATA.phaseResources[w.phase-1],references:DATA.phaseReferences[w.phase-1]}}function picks(items,d){return Array.from({length:Math.min(2,items.length)},(_,offset)=>items[(d+offset)%items.length])}
function workspace(w){if(w<=9)return"ai-compiler-year-one/projects/minitensor";if(w<=16)return"ai-compiler-year-one/projects/cuda-kernels";if(w<=22)return"ai-compiler-year-one/projects/compiler-playground";if(w<=28)return"ai-compiler-year-one/projects/gpu-operator-lab";if(w<=37)return"ai-compiler-year-one/projects/transformer-compiler";if(w===38)return"ai-compiler-year-one/projects/mlir-toy-lab";return"ai-compiler-year-one/portfolio"}function command(w){if(w<=9)return"cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug\\ncmake --build build -j\\nctest --test-dir build --output-on-failure";if(w<=16)return"cmake -S . -B build -DCMAKE_BUILD_TYPE=Release\\ncmake --build build -j\\nctest --test-dir build --output-on-failure";if(w<=22)return"python -m pytest -q\\npython examples/run_week.py --week "+w;if(w<=28)return"python -m pytest -q\\npython benchmarks/run.py --quick";if(w<=37)return"python -m pytest tests -q\\npython benchmarks/e2e.py --quick";if(w===38)return"cmake --build build --target check-mlir\\nbuild/bin/mlir-opt <当天的 .mlir 文件> --verify-diagnostics";return"git status --short\\ngit diff --check"}function esc(x){return String(x).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function guide(w,d,t){const ws=workspace(w.index),files=w.fileHint,note="docs/learning-log/W"+String(w.index).padStart(2,"0")+"-D"+String(d+1).padStart(2,"0")+".md",main=t.split("；LeetCode")[0],modes=["定义输入、输出和接口边界","实现最小正确版本","用正常与边界输入验证","定位一次中间状态或错误","记录可比较的结果","复写参考实现并改变一个变量","把本周模块接入并从零复现"];const steps=["今天的唯一任务："+main,"按「"+modes[d]+"」执行；只修改与该任务直接相关的文件："+files,"在 "+note+" 记录本次输入、实际输出、一个失败现象（或风险）及其原因。","运行下方命令；若失败，只修复本任务相关问题后再运行。"+(t.includes("LeetCode")?" 完成算法题并写时间/空间复杂度。":"")];const done=["能从零运行今天产物，并得到可核对的输出、测试结果或 IR。","能用一句话说明：今天改动解决了什么具体问题。","当天日志含输入、输出、命令和一个边界/失败情况。",t.includes("LeetCode")?"LeetCode 题目记录了思路、复杂度和边界。":"代码与验收结果一致后再勾选今天。"];return{ws,files,steps,cmd:command(w.index),done}}
function learning(w,d,t){const main=t.split("；LeetCode")[0],themes=w.knowledge,files=w.fileHint,focus=["接口和数据边界","正确性 baseline","边界与数值验证","调试证据","性能或可比较数据","源码/视频到代码的迁移","模块集成与可复现交付"][d],purpose="今天只解决「"+main+"」。目的不是完成打卡，而是得到一份关于「"+focus+"」的可检查证据；它会直接推进本周交付物「"+w.output+"」。",points=["核心概念："+themes[d%themes.length],"关联概念："+themes[(d+1)%themes.length],"动手结果：不看答案完成“"+main+"”。","验证要求：输出、测试、IR 或 profile 至少保留一种客观证据。","工程位置：理解 "+files+" 中本次修改与「"+w.output+"」的关系。 "];return{purpose,points}}
function renderSignals(){signals.innerHTML=DATA.jdSignals.map(x=>'<a class="signal" href="'+x.url+'" target="_blank" rel="noreferrer"><small>'+x.company+'</small><b>'+x.role+'</b><span>'+x.skills+'</span></a>').join('')}function renderPhases(){phaseButtons.innerHTML='<button data-p="0" class="'+(active===0?'active':'')+'">全部 39 周</button>'+DATA.phases.map((p,i)=>'<button data-p="'+(i+1)+'" class="'+(active===i+1?'active':'')+'">'+p.range+' · '+p.name+'</button>').join('');phaseButtons.querySelectorAll('button').forEach(b=>b.onclick=()=>{active=Number(b.dataset.p);renderPhases();render()})}
function render(){const list=DATA.weeks.map((w,i)=>({...w,index:i+1})).filter(w=>(!active||w.phase===active)&&JSON.stringify(w).toLowerCase().includes(query.toLowerCase()));weeks.innerHTML=list.map(w=>{const ts=tasks(w),lr=resources(w),wd=ts.filter((_,d)=>completed[w.index+"-"+(d+1)]).length,label=w.phase<4?"本周能力验收物 · LAB":"本周简历项目里程碑";return '<article class="week '+(openWeeks.has(w.index)?'open':'')+'" data-week="'+w.index+'"><button class="summary"><span class="wn">W'+String(w.index).padStart(2,'0')+'</span><span><small>阶段 '+w.phase+' · '+dateLabel(w.index,0)+'—'+dateLabel(w.index,6)+'</small><h2>'+w.title+'</h2><p>'+w.goal+'</p></span><span class="score">'+wd+'/7</span></button><div class="body"><div class="output"><span>'+label+'</span><b>'+w.output+'</b></div><div class="resources"><strong>直达视频章节</strong>'+lr.videos.map(r=>'<a href="'+r.url+'" target="_blank" rel="noreferrer">'+r.label+' ▶</a>').join('')+'<strong>对应参考文献</strong>'+lr.references.map(r=>'<a href="'+r.url+'" target="_blank" rel="noreferrer">'+r.label+' ↗</a>').join('')+'</div><div class="days">'+ts.map((t,d)=>{const id=w.index+'-'+(d+1),done=!!completed[id],isOpen=openDays.has(id),g=guide(w,d,t),steps=g.steps.map((step,si)=>{const sid=id+'-step-'+si;return '<li><label><input class="subcheck" data-step-id="'+sid+'" type="checkbox" '+(subtasks[sid]?'checked':'')+'><i>'+(subtasks[sid]?'✓':si+1)+'</i><b>'+esc(step)+'</b></label></li>'}).join('');return '<div class="day '+(done?'done ':'')+(isOpen?'open':'')+'" data-id="'+id+'"><div class="dayTop"><label><input class="check" type="checkbox" '+(done?'checked':'')+'><span class="tick">'+(done?'✓':'')+'</span></label><span class="date">DAY '+String(d+1).padStart(2,'0')+'<span>周'+dayNames[d]+' · '+dateLabel(w.index,d)+'</span></span><span class="task">'+esc(t)+'<small>'+DATA.timePlan[d]+'</small></span><button class="expand" type="button">'+(isOpen?'收起 −':'展开 +')+'</button></div><div class="detail"><div class="executionGuide"><div class="startHere"><span>今天从这里开始</span><code>'+esc(g.ws)+'</code><p>主要会改：'+esc(g.files)+'</p></div><span class="detailTitle">今天的具体执行</span><ol class="actionList">'+steps+'</ol><button class="completeDay" data-complete="'+id+'" data-count="'+g.steps.length+'" type="button">全部步骤完成，勾选今天 ✓</button></div><div class="dayMeta"><span class="detailTitle">最后运行这些命令</span><pre><code>'+esc(g.cmd)+'</code></pre><span class="detailTitle">满足这些条件才算完成</span><ul>'+g.done.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p class="methodNote">今天的方法焦点：'+esc(DATA.detailSteps[d]+' '+DATA.acceptancePlan[d])+'</p><div class="links"><strong>直达视频章节</strong>'+picks(lr.videos,d).map(x=>'<a href="'+x.url+'" target="_blank" rel="noreferrer">'+x.label+' ▶</a>').join('')+'<strong>对应参考文献</strong>'+picks(lr.references,d).map(x=>'<a href="'+x.url+'" target="_blank" rel="noreferrer">'+x.label+' ↗</a>').join('')+'</div></div></div></div>'}).join('')+'</div></div></article>'}).join('')||'<div class="empty">没有匹配的周计划</div>';weeks.querySelectorAll('.summary').forEach(b=>b.onclick=()=>{const a=b.parentElement,n=Number(a.dataset.week);a.classList.toggle('open');a.classList.contains('open')?openWeeks.add(n):openWeeks.delete(n)});weeks.querySelectorAll('.check').forEach(el=>el.onchange=e=>{e.stopPropagation();const id=el.closest('.day').dataset.id;completed[id]=el.checked;persist();updateProgress();render()});weeks.querySelectorAll('.subcheck').forEach(el=>el.onchange=()=>{subtasks[el.dataset.stepId]=el.checked;persist();render()});weeks.querySelectorAll('.completeDay').forEach(b=>b.onclick=()=>{const id=b.dataset.complete,count=Number(b.dataset.count);for(let i=0;i<count;i++)subtasks[id+'-step-'+i]=true;completed[id]=true;persist();updateProgress();render()});weeks.querySelectorAll('.expand').forEach(b=>b.onclick=()=>{const id=b.closest('.day').dataset.id;openDays.has(id)?openDays.delete(id):openDays.add(id);render()})}
const renderCore=render;render=function(){renderCore();weeks.querySelectorAll('.day').forEach(day=>{const parts=day.dataset.id.split('-').map(Number),w={...DATA.weeks[parts[0]-1],index:parts[0]},t=tasks(w)[parts[1]-1],learn=learning(w,parts[1]-1,t),start=day.querySelector('.startHere');if(!start)return;start.insertAdjacentHTML('afterend','<div class="purposeCard"><span>今天学习的目的</span><p>'+esc(learn.purpose)+'</p></div><div class="knowledgeCard"><span>今天必须掌握的知识点</span><ul>'+learn.points.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>')})};
unlockForm.onsubmit=e=>{e.preventDefault();if(unlockInput.value==='020721'){sessionStorage.setItem('learning-log-unlocked','1');offlineGate.style.display='none'}else unlockError.textContent='密码不正确，请重试'};if(sessionStorage.getItem('learning-log-unlocked')==='1')offlineGate.style.display='none';startDate=document.getElementById('startDate').value=startDate;document.getElementById('startDate').onchange=e=>{startDate=e.target.value;persist();render()};search.oninput=e=>{query=e.target.value;render()};renderSignals();renderPhases();render();updateProgress();
</script></body></html>`;

// Every day must read like a small engineering ticket: the learner sees the
// exact artifact, the minimum implementation, the acceptance input/output,
// and the evidence required before the checkbox can be used.
const deliveryLayer = String.raw`
(() => {
  const style = document.createElement("style");
  style.textContent = ".contractCard{margin:14px 0;padding:15px 16px;border:1px solid #d8cce8;border-left:4px solid #7257aa;background:#fff}.contractCard>span{display:block;margin-bottom:11px;color:#7257aa;font-size:9px;font-weight:800;letter-spacing:.14em}.contractGrid{display:grid;gap:8px}.contractRow{display:grid;grid-template-columns:72px 1fr;gap:9px;font-size:10px;line-height:1.65}.contractRow b{color:#6d55a1}.contractRow code{overflow-wrap:anywhere;font:10px/1.65 Consolas,monospace;color:#483d58}.contractRow em{font-style:normal;color:#443c38}@media(max-width:600px){.contractRow{grid-template-columns:1fr;gap:2px}}";
  document.head.append(style);

  function dayFiles(w, d) {
    if (w.index <= 9) {
      const files = [
        "CMakeLists.txt；include/、src/、tests/、benchmarks/目录",
        "include/minitensor/tensor.hpp",
        "include/minitensor/tensor.hpp；src/tensor.cpp；tests/tensor_test.cpp",
        "src/tensor.cpp；examples/demo.cpp；tests/tensor_test.cpp",
        "tests/tensor_test.cpp；CMakeLists.txt",
        "docs/learning-log/W" + String(w.index).padStart(2, "0") + "-D06.md；labs/W" + String(w.index).padStart(2, "0") + "-D06",
        "README.md；examples/；tests/"
      ];
      return files[d];
    }
    if (w.index <= 16) return d === 5 ? "labs/W" + String(w.index).padStart(2, "0") + "-D06；docs/learning-log/" : (d === 4 ? "benchmarks/；reports/；tests/" : "src/；kernels/；tests/；examples/");
    if (w.index <= 22) return d === 5 ? "notes/；labs/；tests/" : "compiler/；passes/；tests/；examples/";
    if (w.index <= 28) return d === 4 ? "benchmarks/；reports/；tests/" : "operators/；tests/；benchmarks/；examples/";
    if (w.index <= 37) return d === 4 ? "benchmarks/；reports/；tests/" : "compiler/；runtime/；operators/；tests/";
    return w.index === 38 ? "lib/；test/；examples/；docs/" : "README.md；resume/；benchmarks/；docs/";
  }

  function dailyContract(w, d, task) {
    const main = task.split("；LeetCode")[0];
    const files = dayFiles(w, d);
    const note = "docs/learning-log/W" + String(w.index).padStart(2, "0") + "-D" + String(d + 1).padStart(2, "0") + ".md";
    const isStudy = d === 5 || /学习|阅读|视频|源码|概念|理解/.test(main);
    const isMeasure = d === 4 || /性能|benchmark|基准|profile|Nsight|调优|对比|扫描/.test(main);
    const isTest = d === 2 || /测试|验证|正确性|边界|异常/.test(main);
    const base = {
      files,
      artifact: "完成「" + main + "」对应的最小可运行改动",
      must: "只实现今天这一个任务；不要提前写明天的功能。",
      input: "一个正常输入 + 两个边界/失败输入",
      expected: "构建和测试通过；输出能与预期逐项核对",
      evidence: note + " 中保存命令、输出、边界情况和一句结论"
    };

    if (isStudy) {
      base.artifact = "一份 1 页学习记录 + 一个亲手运行的最小复现";
      base.must = "观看当天链接的一个章节；暂停复写一个示例，并只改变一个变量（shape、参数或编译选项）。";
      base.input = "视频/文档中的最小示例 + 你自己改动后的输入";
      base.expected = "示例能运行；记录 3 个概念、1 个证据和 1 个未解决问题";
      return base;
    }
    if (isMeasure) {
      base.artifact = "一份可复现 benchmark 结果（终端输出或 CSV）";
      base.must = "固定输入规模、warmup、重复次数和硬件信息；至少比较 baseline 与一个改动版本。";
      base.input = "同一输入、同一环境下的 baseline 与优化版本";
      base.expected = "记录 latency/throughput 中至少一个指标，并写清是否真的变快及原因";
      return base;
    }
    if (isTest) {
      base.artifact = "新增或补齐测试，并让失败用例真正失败一次后修复";
      base.must = "至少写 1 个正常用例、1 个边界用例、1 个非法/失败用例。";
      base.input = "正常、边界、非法三类输入";
      base.expected = "正常用例通过；非法输入得到明确报错或 fallback，而不是静默出错";
      return base;
    }
    return base;
  }

  guide = function(w, d, task) {
    const c = dailyContract(w, d, task);
    const hasAlgo = task.includes("LeetCode");
    const steps = [
      "交付物：" + c.artifact,
      "打开并只修改：" + c.files,
      "必须写出：" + c.must,
      "验收输入：" + c.input + "。预期结果：" + c.expected,
      "保存证据：" + c.evidence + (hasAlgo ? "；另附算法题思路、复杂度和边界。" : "")
    ];
    const done = [
      "目标文件已创建或更新，且内容只覆盖今天的任务。",
      c.expected,
      "当天日志包含实际运行命令、原始输出和至少一个边界/失败情况。",
      hasAlgo ? "LeetCode 已记录思路、复杂度、边界和错因。" : "以上四项均完成后，才勾选今天。"
    ];
    return { ws: workspace(w.index), files: c.files, steps, cmd: command(w.index), done };
  };

  const previousRender = render;
  render = function() {
    previousRender();
    weeks.querySelectorAll(".day").forEach(day => {
      const parts = day.dataset.id.split("-").map(Number);
      const w = { ...DATA.weeks[parts[0] - 1], index: parts[0] };
      const task = tasks(w)[parts[1] - 1];
      const c = dailyContract(w, parts[1] - 1, task);
      const start = day.querySelector(".startHere");
      if (!start) return;
      start.insertAdjacentHTML("afterend", '<div class="contractCard"><span>今天交付什么 · 不用猜</span><div class="contractGrid"><div class="contractRow"><b>修改文件</b><code>' + esc(c.files) + '</code></div><div class="contractRow"><b>必须完成</b><em>' + esc(c.must) + '</em></div><div class="contractRow"><b>验收输入</b><em>' + esc(c.input) + '</em></div><div class="contractRow"><b>预期结果</b><em>' + esc(c.expected) + '</em></div><div class="contractRow"><b>完成证据</b><code>' + esc(c.evidence) + '</code></div></div></div>');
    });
  };
  render();
})();`;

const enhancedHtml = html.replace("</script>", deliveryLayer + "</script>");

const output = path.join(root, "worldhaung_ai.html");
const rootOutput = path.join(root, "index.html");
const pagesOutput = path.join(root, "docs", "index.html");
const publicOutput = path.join(root, "public", "worldhaung_ai.html");
fs.writeFileSync(output, enhancedHtml, "utf8");
fs.writeFileSync(rootOutput, enhancedHtml, "utf8");
fs.mkdirSync(path.dirname(pagesOutput), { recursive: true });
fs.writeFileSync(pagesOutput, enhancedHtml, "utf8");
fs.writeFileSync(publicOutput, enhancedHtml, "utf8");
console.log(`${output}\n${rootOutput}\n${pagesOutput}\n${publicOutput}`);
