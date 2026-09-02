import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
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
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "split" && node.arguments.length === 1) {
    return String(valueOf(node.expression.expression)).split(String(valueOf(node.arguments[0])));
  }
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
const rawPhases = findConst("phases");
const weekFileHints = findConst("weekFileHints");
const weekKnowledgePoints = findConst("weekKnowledgePoints");

// Keep every authored week. Compressing adjacent weeks made daily tasks point
// to the wrong files and silently removed the original sixth-day task.
const plannedWeeks = rawWeeks.map((week, index) => ({
  ...week,
  sourceWeek: week.resourceWeek || index + 1,
  fileHint: week.files || weekFileHints[index + 1] || "",
  knowledge: week.knowledge || weekKnowledgePoints[index + 1] || [],
}));

const DATA = {
  weeks: plannedWeeks, phases: rawPhases, acceptancePlan: findConst("acceptancePlan"),
  phaseResources: findConst("phaseResources"), phaseReferences: findConst("phaseReferences"),
  weekLearningResources: findConst("weekLearningResources"), openSourceProjects: findConst("openSourceProjects"),
  detailSteps: findConst("detailSteps"), timePlan: findConst("timePlan"), jdSignals: findConst("jdSignals"),
  guidePlan: findConst("aiInfraGuidePlan"), guideSections: findConst("aiInfraGuideSections"),
  weekFileHints: findConst("weekFileHints"),
  weekKnowledgePoints: findConst("weekKnowledgePoints"),
};
const data = JSON.stringify(DATA).replaceAll("<", "\\u003c");

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI 编译器学习日志｜30 周冲刺计划</title><style>
:root{--ink:#211c1a;--paper:#f7f1e9;--card:#fffaf4;--muted:#756d68;--line:#ded3c8;--accent:#ef6a4c;--purple:#7257aa}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,"Microsoft YaHei",sans-serif}button,input{font:inherit}button{cursor:pointer}a{color:inherit;text-decoration:none}.top{position:sticky;top:0;z-index:10;height:68px;padding:0 5vw;background:rgba(247,241,233,.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between}.brand{display:flex;align-items:center;gap:10px;font-size:12px;line-height:1}.mark{width:36px;height:36px;border-radius:50% 50% 50% 8px;background:var(--ink);color:#fff;display:grid;place-items:center;font:700 13px Georgia}.progress{display:flex;align-items:center;gap:10px;font:11px monospace}.bar{width:110px;height:5px;background:#dfd4ca}.bar i{display:block;height:100%;background:var(--accent)}.hero{padding:72px 7vw 58px;display:grid;grid-template-columns:1.35fr .65fr;gap:6vw;align-items:center}.eyebrow{font-size:10px;font-weight:800;letter-spacing:.2em;color:var(--accent)}h1{font:clamp(52px,7vw,94px)/.96 Georgia,"Songti SC",serif;letter-spacing:-.05em;margin:18px 0 26px}h1 em{font-weight:400;color:var(--accent)}.hero p{max-width:650px;line-height:1.8;color:var(--muted)}.stat{background:var(--card);border:1px solid var(--line);box-shadow:14px 14px 0 #e8ddd3;padding:28px}.stat strong{display:block;font:58px Georgia;color:var(--accent)}.stat label{display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);margin-top:24px;padding-top:16px;font-size:12px}.stat input{border:0;background:#eee4da;padding:8px}.signals{padding:35px 6vw;background:var(--ink);color:#fff;display:grid;grid-template-columns:repeat(4,1fr);gap:1px}.signal{padding:18px;border:1px solid #4a423e;display:flex;flex-direction:column;min-height:140px}.signal small{color:var(--accent);font:9px monospace}.signal b{margin:10px 0;font:17px Georgia}.signal span{font-size:9px;line-height:1.6;color:#bdb4ae}.tools{max-width:1320px;margin:55px auto 0;padding:0 5vw 22px;display:grid;grid-template-columns:1fr 310px;gap:16px}.phases{display:flex;flex-wrap:wrap;gap:8px}.phases button,.search{border:1px solid var(--line);background:var(--card);padding:11px 14px;font-size:11px}.phases button.active{background:var(--ink);color:white}.search{display:flex}.search input{width:100%;border:0;background:transparent;outline:0}.content{max-width:1320px;margin:auto;padding:0 5vw 100px}.week{background:rgba(255,250,244,.7);border:1px solid var(--line);margin:10px 0}.summary{width:100%;border:0;background:transparent;text-align:left;padding:18px;display:grid;grid-template-columns:54px 1fr 90px;gap:18px;align-items:center}.wn{width:50px;height:50px;border:1px solid var(--ink);display:grid;place-items:center;font:22px Georgia}.summary small{font:9px monospace;color:var(--accent);letter-spacing:.1em}.summary h2{font:21px Georgia,"Songti SC",serif;margin:5px 0}.summary p{font-size:12px;color:var(--muted);margin:0}.score{text-align:right;font:11px monospace}.body{display:none;border-top:1px solid var(--line);padding:18px}.week.open .body{display:block}.output{background:var(--ink);color:white;padding:16px 20px;margin-bottom:10px}.output span{font-size:9px;color:#c3b7ae;letter-spacing:.12em}.output b{display:block;font:18px Georgia;margin-top:6px}.resources{display:flex;flex-wrap:wrap;gap:7px;background:#eee5dc;border:1px solid var(--line);padding:12px;margin-bottom:10px}.resources strong{width:100%;font-size:9px;color:var(--purple);letter-spacing:.12em;margin-top:3px}.resources a,.links a{color:var(--ink);background:var(--card);border:1px solid var(--line);padding:8px 10px;text-decoration:none;font-size:10px}.resources a:hover,.links a:hover{border-color:var(--accent);color:var(--accent)}.days{display:grid;grid-template-columns:1fr 1fr;gap:7px}.day{border:1px solid var(--line);background:var(--card)}.day.done{opacity:.65;background:#eee8e1}.dayTop{display:grid;grid-template-columns:26px 64px 1fr auto;gap:10px;align-items:start;padding:13px;min-height:100px}.tick{width:21px;height:21px;border:1px solid #978a81;display:grid;place-items:center}.done .tick{background:#249577;color:#fff}.check{position:absolute;opacity:0}.date{font:9px monospace}.date span{display:block;color:var(--muted);margin-top:5px}.task{font-size:11px;line-height:1.55}.task small{display:block;color:var(--muted);font-size:9px;margin-top:5px}.expand{border:0;background:transparent;color:var(--purple);font-size:10px;font-weight:800}.detail{display:none;border-top:1px dashed #cfc1e7;background:#f5f0fb;padding:18px;grid-template-columns:1.1fr .9fr;gap:20px}.day.open .detail{display:grid}.detail ol{margin:0;padding-left:18px;font-size:11px;line-height:1.75}.links{display:flex;flex-wrap:wrap;align-content:start;gap:7px}.links strong{width:100%;font-size:9px;color:var(--purple);letter-spacing:.12em}.empty{text-align:center;padding:60px;color:var(--muted)}footer{background:var(--ink);color:#c7bdb5;padding:35px 7vw;font:12px Georgia;text-align:center}.offlineGate{position:fixed;inset:0;z-index:100;background:var(--paper);display:grid;place-items:center;padding:20px}.offlineGate section{width:min(470px,100%);background:var(--card);border:1px solid var(--line);box-shadow:14px 14px 0 #e5dad0;padding:38px}.offlineGate h2{font:44px/1 Georgia,"Songti SC",serif;margin:18px 0}.offlineGate h2 em{color:var(--accent);font-weight:400}.offlineGate p{font-size:12px;color:var(--muted)}.offlineGate form{display:grid;grid-template-columns:1fr auto;margin-top:24px}.offlineGate input{min-width:0;border:1px solid var(--ink);padding:14px;font:17px monospace;letter-spacing:.2em}.offlineGate button{border:0;background:var(--ink);color:white;padding:0 20px}.offlineGate .error{display:block;color:#c74435;font-size:10px;margin-top:8px}@media(max-width:900px){.hero{grid-template-columns:1fr}.signals{grid-template-columns:1fr 1fr}.tools{grid-template-columns:1fr}.days{grid-template-columns:1fr}}@media(max-width:600px){.hero{padding:48px 20px}.hero h1{font-size:48px}.content,.tools{padding-left:16px;padding-right:16px}.signals{grid-template-columns:1fr}.summary{grid-template-columns:46px 1fr}.score,.summary p{display:none}.dayTop{grid-template-columns:24px 58px 1fr}.expand{grid-column:3;justify-self:start}.detail{grid-template-columns:1fr}.top{padding:0 16px}.bar{width:70px}}
.detail{padding:20px 22px;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr)}.startHere{background:#211c1a;color:white;padding:15px 17px;margin-bottom:18px}.startHere span,.detailTitle{display:block;margin-bottom:8px;color:#7257aa;font-size:9px;font-weight:800;letter-spacing:.14em}.startHere span{color:#d3c6bd}.startHere code{display:block;color:#ffd2c6;font:11px/1.6 Consolas,monospace;overflow-wrap:anywhere}.startHere p{margin:8px 0 0;color:#c9bfb8;font-size:10px;line-height:1.6}.actionList{display:grid;gap:7px;margin:0;padding:0!important;list-style:none}.actionList li{margin:0}.actionList label{display:grid;grid-template-columns:26px 1fr;gap:9px;align-items:start;padding:10px 11px;border:1px solid #d8cce8;background:white;cursor:pointer}.actionList input{position:absolute;opacity:0}.actionList i{display:grid;width:22px;height:22px;place-items:center;border:1px solid #9b88c2;color:#7257aa;font:10px monospace;font-style:normal}.actionList input:checked+i{border-color:#249577;background:#249577;color:white}.actionList b{font-size:11px;font-weight:600;line-height:1.65}.actionList input:checked~b{color:#8b838f;text-decoration:line-through}.completeDay{width:100%;margin-top:10px;padding:11px 14px;border:0;background:#7257aa;color:white;font-size:10px;font-weight:800}.dayMeta pre{overflow:auto;margin:0 0 18px;padding:13px;border-left:3px solid #ef6a4c;background:#282321;color:#f7f1e9}.dayMeta pre code{white-space:pre-wrap;font:10px/1.7 Consolas,monospace}.dayMeta ul{margin:0 0 18px;padding-left:18px;font-size:10px;line-height:1.75}.methodNote{padding:9px 11px;border-left:3px solid #aa99d0;background:#eee7f7;color:#62596a;font-size:10px;line-height:1.65}@media(max-width:600px){.detail{grid-template-columns:1fr}}
.purposeCard,.knowledgeCard{margin-bottom:14px;padding:14px 16px;border:1px solid #d8cce8;background:#fffaf5}.purposeCard{border-left:4px solid #ef6a4c;background:#fff1eb}.purposeCard span,.knowledgeCard span{display:block;margin-bottom:8px;color:#6d55a1;font-size:9px;font-weight:800;letter-spacing:.14em}.purposeCard p{margin:0;color:#443c38;font-size:11px;line-height:1.75}.knowledgeCard ul{display:grid;gap:7px;margin:0;padding:0;list-style:none}.knowledgeCard li{position:relative;padding-left:16px;color:#514851;font-size:10px;line-height:1.65}.knowledgeCard li:before{content:"◆";position:absolute;top:0;left:0;color:#7e62c7;font-size:8px}
</style></head><body>
<div class="offlineGate" id="offlineGate"><section><span class="eyebrow">AI COMPILER · LEARNING LOG</span><h2>进入你的<br><em>学习日志</em></h2><p>输入 6 位数访问密码。勾选进度会保存在当前浏览器。</p><form id="unlockForm"><input id="unlockInput" type="password" inputmode="numeric" maxlength="6" placeholder="••••••" autofocus><button>进入 →</button></form><span class="error" id="unlockError"></span></section></div>
<header class="top"><div class="brand"><span class="mark">AC</span><span>AI COMPILER<br><b>LEARNING LOG</b></span></div><div class="progress"><span id="doneTop">0/210</span><div class="bar"><i id="topBar"></i></div><b id="percentTop">0%</b></div></header>
<section class="hero"><div><span class="eyebrow">210 天 · 30 周 · 2 个简历主项目 + 1 次开源协作</span><h1>AI 编译器<br><em>冲刺学习日志</em></h1><p>从 2026 年 8 月末到 2027 年 3 月底：完成 AI 编译器方向的核心知识、两个可复现主项目与秋招材料。Day 10 起先刷代码随想录核心 70 题，再完成 Hot100 100 题；项目 A 于 2027 年 1 月完成，项目 B 于 2—3 月完成。</p></div><div class="stat"><span class="eyebrow">计划进度</span><strong id="percentBig">0%</strong><span id="doneBig">已完成 0 个任务</span><label>计划开始日 <input id="startDate" type="date" value="2026-08-31"></label></div></section>
<section class="signals" id="signals"></section><section class="tools"><div class="phases" id="phaseButtons"></div><label class="search"><input id="search" placeholder="搜索 CUDA、LayerNorm、Pass…"></label></section><main class="content" id="weeks"></main><footer>密码：020721 · 坚持不是堆时长，而是每周交付可运行、可复现、可解释的证据。</footer>
<script>const DATA=${data};
const dayNames=["一","二","三","四","五","六","日"];let saved={};try{saved=JSON.parse(localStorage.getItem("ai-compiler-standalone-v3")||"{}")||{}}catch{}let completed=saved.completed||{},subtasks=saved.subtasks||{},startDate=saved.startDate||"2026-08-31",active=0,query="",openWeeks=new Set([1]),openDays=new Set();const total=DATA.weeks.length*7;
function dateLabel(w,d){const x=new Date(startDate+"T00:00:00");x.setDate(x.getDate()+(w-1)*7+d);return (x.getMonth()+1)+"/"+x.getDate()}function persist(){localStorage.setItem("ai-compiler-standalone-v3",JSON.stringify({completed,subtasks,startDate}))}function updateProgress(){const done=Object.values(completed).filter(Boolean).length,p=Math.round(done/total*100);doneTop.textContent=done+"/"+total;percentTop.textContent=p+"%";percentBig.textContent=p+"%";doneBig.textContent="已完成 "+done+" 个任务";topBar.style.width=p+"%"}
function weeklyClosure(w){return "周验收：在干净环境从零运行「"+w.output+"」；核对本周测试、代表性输入和一项已知限制，并把复现命令写入日志"}function carlTopic(n){return n<=10?"数组与二分":n<=18?"链表":n<=26?"哈希与字符串":n<=34?"栈与队列":n<=50?"二叉树":n<=60?"回溯与贪心":"动态规划"}function hotTopic(n){return["哈希与双指针","滑动窗口与子串","链表","二叉树","栈与单调栈","二分与矩阵","回溯","贪心","动态规划","图与综合"][Math.min(9,Math.floor((n-1)/10))]}function algorithmSuffix(w,d){if(w<2||(w===2&&d<2))return"";if(d===6)return"；算法｜复盘本周错题 2 道：口述思路、复杂度与边界，不开新题";const n=(w-1)*6+d-8+1;if(n<=70)return"；算法｜代码随想录核心 #"+n+"/70（"+carlTopic(n)+"）：独立写出 + 记录复杂度和边界";const hot=n-70;if(hot<=100)return"；算法｜LeetCode Hot 100 #"+hot+"/100（"+hotTopic(hot)+"）：独立写出 + 记录复杂度和边界";return"；算法｜Hot100 错题回炉：限时重做 1 题并口述两种解法"}function tasks(w){const core=[...w.days.slice(0,6),weeklyClosure(w)];return core.map((task,index)=>task+algorithmSuffix(w.index,index))}function resources(w){return DATA.weekLearningResources.find(x=>x.week===w.index)||{videos:DATA.phaseResources[w.phase-1],references:DATA.phaseReferences[w.phase-1]}}function picks(items,d){return Array.from({length:Math.min(2,items.length)},(_,offset)=>items[(d+offset)%items.length])}
function workspace(w){if(w<=4)return"ai-compiler-year-one/projects/minitensor";if(w===5)return"ai-compiler-year-one/labs/transformer-gpu";if(w<=9)return"ai-compiler-year-one/projects/cuda-kernels";if(w<=12)return"ai-compiler-year-one/projects/compiler-playground";if(w===13)return"ai-compiler-year-one/labs/compiler-core";if(w===14)return"ai-compiler-year-one/projects/mlir-toy-lab";if(w<=18)return"ai-compiler-year-one/labs/ai-infra-stack";if(w<=22)return"ai-compiler-year-one/projects/gpu-operator-lab";if(w<=27)return"ai-compiler-year-one/projects/transformer-compiler";return"ai-compiler-year-one/portfolio"}function command(w){if(w<=4)return"cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug\\ncmake --build build -j\\nctest --test-dir build --output-on-failure";if(w===5)return"python labs/transformer/decoder_shapes.py\\npython labs/gpu_microarch/kv_cache_bytes.py";if(w<=9)return"cmake -S . -B build -DCMAKE_BUILD_TYPE=Release\\ncmake --build build -j\\nctest --test-dir build --output-on-failure";if(w<=12)return"python -m pytest -q\\npython examples/run_week.py --week "+w;if(w===13)return"python -m pytest compiler_core -q\\npython compiler_core/ir.py --dump-cfg";if(w===14)return"cmake --build build --target check-mlir\\nbuild/bin/mlir-opt <当天的 .mlir 文件> --verify-diagnostics";if(w<=18)return"python -m pytest -q\\npython examples/run_week.py --week "+w;if(w<=22)return"python -m pytest -q\\npython benchmarks/run.py --quick";if(w<=27)return"python -m pytest tests -q\\npython benchmarks/e2e.py --quick";return"git status --short\\ngit diff --check"}function esc(x){return String(x).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function guide(w,d,t){const ws=workspace(w.index),files=w.fileHint,note="docs/learning-log/W"+String(w.index).padStart(2,"0")+"-D"+String(d+1).padStart(2,"0")+".md",main=t.split("；算法｜")[0],modes=["定义输入、输出和接口边界","实现最小正确版本","用正常与边界输入验证","定位一次中间状态或错误","记录可比较的结果","专题学习并复写最小示例","在干净环境复现本周交付"];const hasAlgo=t.includes("算法｜"),steps=["今天的唯一任务："+main,"按「"+modes[d]+"」执行；只修改与该任务直接相关的文件："+files,"在 "+note+" 记录本次输入、实际输出、一个失败现象（或风险）及其原因。","运行下方命令；若失败，只修复本任务相关问题后再运行。"+(hasAlgo?" 完成算法题并写时间/空间复杂度。":"")];const done=["能从零运行今天产物，并得到可核对的输出、测试结果或 IR。","能用一句话说明：今天改动解决了什么具体问题。","当天日志含输入、输出、命令和一个边界/失败情况。",hasAlgo?"算法题已记录思路、复杂度和边界。":"代码与验收结果一致后再勾选今天。"];return{ws,files,steps,cmd:command(w.index),done}}
function learning(w,d,t){const main=t.split("；算法｜")[0],themes=w.knowledge,files=w.fileHint,focus=["接口和数据边界","正确性 baseline","边界与数值验证","调试证据","性能或可比较数据","源码/视频到代码的迁移","模块集成与可复现交付"][d],purpose="今天只解决「"+main+"」。目的不是完成打卡，而是得到一份关于「"+focus+"」的可检查证据；它会直接推进本周交付物「"+w.output+"」。",points=["核心概念："+themes[d%themes.length],"关联概念："+themes[(d+1)%themes.length],"动手结果：不看答案完成“"+main+"”。","验证要求：输出、测试、IR 或 profile 至少保留一种客观证据。","工程位置：理解 "+files+" 中本次修改与「"+w.output+"」的关系。 "];return{purpose,points}}
function renderSignals(){signals.innerHTML=DATA.jdSignals.map(x=>'<a class="signal" href="'+x.url+'" target="_blank" rel="noreferrer"><small>'+x.company+'</small><b>'+x.role+'</b><span>'+x.skills+'</span></a>').join('')}function renderPhases(){phaseButtons.innerHTML='<button data-p="0" class="'+(active===0?'active':'')+'">全部 30 周</button>'+DATA.phases.map((p,i)=>'<button data-p="'+(i+1)+'" class="'+(active===i+1?'active':'')+'">'+p.range+' · '+p.name+'</button>').join('');phaseButtons.querySelectorAll('button').forEach(b=>b.onclick=()=>{active=Number(b.dataset.p);renderPhases();render()})}
function render(){const list=DATA.weeks.map((w,i)=>({...w,index:i+1})).filter(w=>(!active||w.phase===active)&&JSON.stringify(w).toLowerCase().includes(query.toLowerCase()));weeks.innerHTML=list.map(w=>{const ts=tasks(w),lr=resources(w),wd=ts.filter((_,d)=>completed[w.index+"-"+(d+1)]).length,label=w.index<19?"本周能力验收物 · LAB":"本周简历项目里程碑";return '<article class="week '+(openWeeks.has(w.index)?'open':'')+'" data-week="'+w.index+'"><button class="summary"><span class="wn">W'+String(w.index).padStart(2,'0')+'</span><span><small>阶段 '+w.phase+' · '+dateLabel(w.index,0)+'—'+dateLabel(w.index,6)+'</small><h2>'+w.title+'</h2><p>'+w.goal+'</p></span><span class="score">'+wd+'/7</span></button><div class="body"><div class="output"><span>'+label+'</span><b>'+w.output+'</b></div><div class="resources"><strong>直达视频章节</strong>'+lr.videos.map(r=>'<a href="'+r.url+'" target="_blank" rel="noreferrer">'+r.label+' ▶</a>').join('')+'<strong>对应参考文献</strong>'+lr.references.map(r=>'<a href="'+r.url+'" target="_blank" rel="noreferrer">'+r.label+' ↗</a>').join('')+'</div><div class="days">'+ts.map((t,d)=>{const id=w.index+'-'+(d+1),done=!!completed[id],isOpen=openDays.has(id),g=guide(w,d,t),steps=g.steps.map((step,si)=>{const sid=id+'-step-'+si;return '<li><label><input class="subcheck" data-step-id="'+sid+'" type="checkbox" '+(subtasks[sid]?'checked':'')+'><i>'+(subtasks[sid]?'✓':si+1)+'</i><b>'+esc(step)+'</b></label></li>'}).join('');return '<div class="day '+(done?'done ':'')+(isOpen?'open':'')+'" data-id="'+id+'"><div class="dayTop"><label><input class="check" type="checkbox" '+(done?'checked':'')+'><span class="tick">'+(done?'✓':'')+'</span></label><span class="date">DAY '+String(d+1).padStart(2,'0')+'<span>周'+dayNames[d]+' · '+dateLabel(w.index,d)+'</span></span><span class="task">'+esc(t)+'<small>'+DATA.timePlan[d]+'</small></span><button class="expand" type="button">'+(isOpen?'收起 −':'展开 +')+'</button></div><div class="detail"><div class="executionGuide"><div class="startHere"><span>今天从这里开始</span><code>'+esc(g.ws)+'</code><p>主要会改：'+esc(g.files)+'</p></div><span class="detailTitle">今天的具体执行</span><ol class="actionList">'+steps+'</ol><button class="completeDay" data-complete="'+id+'" data-count="'+g.steps.length+'" type="button">全部步骤完成，勾选今天 ✓</button></div><div class="dayMeta"><span class="detailTitle">最后运行这些命令</span><pre><code>'+esc(g.cmd)+'</code></pre><span class="detailTitle">满足这些条件才算完成</span><ul>'+g.done.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p class="methodNote">今天的方法焦点：'+esc(DATA.detailSteps[d]+' '+DATA.acceptancePlan[d])+'</p><div class="links"><strong>直达视频章节</strong>'+picks(lr.videos,d).map(x=>'<a href="'+x.url+'" target="_blank" rel="noreferrer">'+x.label+' ▶</a>').join('')+'<strong>对应参考文献</strong>'+picks(lr.references,d).map(x=>'<a href="'+x.url+'" target="_blank" rel="noreferrer">'+x.label+' ↗</a>').join('')+'</div></div></div></div>'}).join('')+'</div></div></article>'}).join('')||'<div class="empty">没有匹配的周计划</div>';weeks.querySelectorAll('.summary').forEach(b=>b.onclick=()=>{const a=b.parentElement,n=Number(a.dataset.week);a.classList.toggle('open');a.classList.contains('open')?openWeeks.add(n):openWeeks.delete(n)});weeks.querySelectorAll('.check').forEach(el=>el.onchange=e=>{e.stopPropagation();const id=el.closest('.day').dataset.id;completed[id]=el.checked;persist();updateProgress();render()});weeks.querySelectorAll('.subcheck').forEach(el=>el.onchange=()=>{subtasks[el.dataset.stepId]=el.checked;persist();render()});weeks.querySelectorAll('.completeDay').forEach(b=>b.onclick=()=>{const id=b.dataset.complete,count=Number(b.dataset.count);for(let i=0;i<count;i++)subtasks[id+'-step-'+i]=true;completed[id]=true;persist();updateProgress();render()});weeks.querySelectorAll('.expand').forEach(b=>b.onclick=()=>{const id=b.closest('.day').dataset.id;openDays.has(id)?openDays.delete(id):openDays.add(id);render()})}
const renderCore=render;render=function(){renderCore();weeks.querySelectorAll('.day').forEach(day=>{const parts=day.dataset.id.split('-').map(Number),w={...DATA.weeks[parts[0]-1],index:parts[0]},t=tasks(w)[parts[1]-1],learn=learning(w,parts[1]-1,t),start=day.querySelector('.startHere');if(!start)return;start.insertAdjacentHTML('afterend','<div class="purposeCard"><span>今天学习的目的</span><p>'+esc(learn.purpose)+'</p></div><div class="knowledgeCard"><span>今天必须掌握的知识点</span><ul>'+learn.points.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>')})};
unlockForm.onsubmit=e=>{e.preventDefault();if(unlockInput.value==='020721'){sessionStorage.setItem('learning-log-unlocked','1');offlineGate.style.display='none'}else unlockError.textContent='密码不正确，请重试'};if(sessionStorage.getItem('learning-log-unlocked')==='1')offlineGate.style.display='none';startDate=document.getElementById('startDate').value=startDate;document.getElementById('startDate').onchange=e=>{startDate=e.target.value;persist();render()};search.oninput=e=>{query=e.target.value;render()};renderSignals();renderPhases();render();updateProgress();
</script></body></html>`;

// Every day must read like a small engineering ticket: the learner sees the
// exact artifact, the minimum implementation, the acceptance input/output,
// and the evidence required before the checkbox can be used.
const deliveryLayer = String.raw`
(() => {
  const style = document.createElement("style");
  style.textContent = ".contractCard{margin:14px 0;padding:15px 16px;border:1px solid #d8cce8;border-left:4px solid #7257aa;background:#fff}.contractCard>span{display:block;margin-bottom:11px;color:#7257aa;font-size:9px;font-weight:800;letter-spacing:.14em}.contractGrid{display:grid;gap:8px}.contractRow{display:grid;grid-template-columns:72px 1fr;gap:9px;font-size:10px;line-height:1.65}.contractRow b{color:#6d55a1}.contractRow code{overflow-wrap:anywhere;font:10px/1.65 Consolas,monospace;color:#483d58}.contractRow em{font-style:normal;color:#443c38}.projectGates{max-width:1320px;margin:0 auto 34px;padding:0 5vw;display:grid;grid-template-columns:1fr 1fr;gap:12px}.projectGate{border:1px solid #d8cce8;background:#fff;padding:20px}.resumeGate{grid-column:1/-1;background:#faf7ff;border-left:4px solid #7257aa}.projectGate small{color:#7257aa;font-weight:800;letter-spacing:.13em}.projectGate h2{font:22px Georgia,'Songti SC',serif;margin:8px 0}.projectGate p,.projectGate li{font-size:11px;line-height:1.7;color:#514851}.projectGate ul{margin:10px 0;padding-left:18px}.projectGate a{font-size:11px;color:#7257aa;text-decoration:underline}@media(max-width:600px){.contractRow{grid-template-columns:1fr;gap:2px}.projectGates{grid-template-columns:1fr}.resumeGate{grid-column:auto}}";
  style.textContent += ".guideReadingCard{display:block;margin:14px 0;padding:14px 16px;border:1px solid #b9d6c8;border-left:4px solid #249577;background:#eff9f4;color:#1f3d34;text-decoration:none}.guideReadingCard:hover{border-color:#249577}.guideReadingCard span,.guideReadingCard small{display:block;color:#28735f;font-size:9px;font-weight:800;letter-spacing:.12em}.guideReadingCard b{display:block;margin:7px 0;font:16px Georgia,'Songti SC',serif}.guideReadingCard p{margin:0 0 8px;font-size:11px;line-height:1.7;color:#355449}.dayTop{grid-template-columns:26px 112px 1fr auto}@media(max-width:600px){.dayTop{grid-template-columns:24px 96px 1fr}}";
  document.head.append(style);
  const gate = document.createElement("section");
  gate.className = "projectGates";
  gate.innerHTML = '<article class="projectGate"><small>秋招主项目 A · GPU OPERATOR LAB</small><h2>不是 Kernel 作业，而是可接入框架的算子库</h2><p>简历上必须展示 Softmax、RMSNorm、GEMM/MLP、RoPE/KV Cache 中至少 3 类算子，并说明不同 shape/dtype 的 dispatch。</p><ul><li>PyTorch custom op 或 torch.library 接入，且有 fallback。</li><li>正确性矩阵：FP32/FP16、非对齐 shape、极值和失败路径。</li><li>与 PyTorch、Triton、CUTLASS/cuBLAS 同口径性能对比。</li><li>性能图标注 GPU、shape、dtype、warmup、P50；有失败案例。</li><li>一键测试/benchmark、架构图、10 分钟讲解与可追问源码。</li></ul><a href="https://github.com/triton-lang/triton" target="_blank" rel="noreferrer">对标 Triton</a> · <a href="https://github.com/NVIDIA/cutlass" target="_blank" rel="noreferrer">对标 CUTLASS</a> · <a href="https://github.com/Dao-AILab/flash-attention" target="_blank" rel="noreferrer">对标 FlashAttention</a></article><article class="projectGate"><small>秋招主项目 B · TRANSFORMER SUBGRAPH COMPILER</small><h2>不是 TVM 跑通，而是端到端可诊断编译器</h2><p>简历上必须展示 PyTorch/ONNX 子图进入 IR、融合、TIR schedule、runtime/fallback 和端到端性能证据。</p><ul><li>支持 RMSNorm+MLP 或 attention 子图，并写明非目标。</li><li>保存前后 IR、20+ 图测试、dtype/layout/shape 支持矩阵。</li><li>至少一个 TensorIR schedule 与项目 A kernel 进行对照。</li><li>动态 shape guard、unsupported op、OOM/版本错配均有诊断或 fallback。</li><li>与 eager、torch.compile、TVM baseline 同口径比较并可复现。</li></ul><a href="https://github.com/apache/tvm" target="_blank" rel="noreferrer">对标 Apache TVM</a> · <a href="https://github.com/mlc-ai/mlc-llm" target="_blank" rel="noreferrer">对标 MLC-LLM</a> · <a href="https://github.com/vllm-project/vllm" target="_blank" rel="noreferrer">对标 vLLM</a></article><article class="projectGate resumeGate"><small>简历取舍 · 只写能被追问的成果</small><h2>两项主项目 + 一次真实开源协作，胜过把每周作业都写成项目</h2><p>MiniTensor 和 CUDA 实验是项目 A/B 的能力证据，不应在简历上拆成多个“项目”凑数量。</p><ul><li>简历主项目只保留 A 与 B；每个项目都要有代码、测试、性能表和一键复现命令。</li><li>第 37 周的开源贡献只有在真实提交、issue 复现或 PR 反馈存在时才写入简历；不为凑数而复制代码。</li><li>面试材料准备 2 分钟概览、5 分钟性能故事、10 分钟源码走读；每个数字都能回到原始日志。</li></ul></article>';
  const coverage = document.createElement("article");
  coverage.className = "projectGate resumeGate";
  coverage.innerHTML = '<small>AIInfraGuide + AI 编译器 JD → 学习证据</small><h2>30 周只保留与目标岗位直接相关的知识闭环</h2><ul><li><b>C++、Linux、内存与 CPU 性能：</b>W01–W04 用 MiniTensor、Cache/SIMD 与 benchmark 建立代码和证据。</li><li><b>Transformer、GPU、CUDA、低精度与 Profiling：</b>W05–W09 覆盖模型 shape、GPU 微架构、GEMM/Softmax/LayerNorm、Triton、FlashAttention 与 Nsight。</li><li><b>框架、IR、Pass 与代码生成：</b>W10–W16 依次学习 PyTorch/FX/ONNX/torch.compile、传统 IR/SSA、MLIR、Relax/TensorIR/MetaSchedule。</li><li><b>分布式与推理：</b>W17 做 collective/DDP/FSDP/ZeRO 最小实验；W18 做 KV Cache、PagedAttention、量化、vLLM 调用链。</li><li><b>两个秋招主项目：</b>W19–W22 做 GPU 算子库；W23–W27 做 Transformer 子图编译器，均要求测试、性能、fallback 和复现。</li><li><b>诚实边界：</b>DDP/FSDP 仅覆盖原理和小实验；没有真实多机集群证据，就不宣称千卡训练经验。</li></ul>';
  gate.append(coverage);
  document.querySelector(".hero").insertAdjacentElement("afterend", gate);

  const detailedTopics = [
    "CMake target、静态库、CTest|Shape/Stride/DType 的职责|连续 stride 与 numel|二维索引到线性 offset|正常/边界/失败测试|vector、引用、构造函数|从零构建与 README",
    "栈堆与所有权图|RAII 与析构顺序|深拷贝、移动语义|shared_ptr 与 view 别名|reshape/transpose 的 stride|ASan/UBSan 定位内存错误|Rule of Five 与接口取舍",
    "模板声明/定义位置|泛型 Tensor<T> 与类型约束|逐元素算子与 shape 检查|广播的最小规则|naive matmul 与误差阈值|参数化测试与近似比较|clang-format、warning、preset",
    "任务队列与条件变量|线程池停止协议|输出行分块与负载均衡|warmup/P50/方差|profiler 热点与 Amdahl|tile/线程数扫描|README、性能图、发布",
    "补码与整数溢出|IEEE754 与浮点比较|寄存器、栈帧、调用约定|-O0/-O3 汇编差异|预处理到链接的产物|静态/动态库与符号|源码—汇编证据链",
    "cache line 与工作集|行列访问与 stride|TLB、预取、局部性|blocked transpose|带宽、miss、延迟|性能反例与噪声|Tensor stride 的硬件代价",
    "流水线与分支预测|自动向量化报告|AVX lane/对齐/尾部|memory model 与 atomic|false sharing|任务粒度与调度|TSan 与并发不变量",
    "块头/块脚与对齐|first-fit/split/coalesce|显式空闲链表|size class|heap checker|碎片率与吞吐|分配器接入 Tensor 的边界",
    "公平 baseline|naive/tiled/parallel matmul|tile×线程×shape|算术强度与 roofline|profiler 归因|Eigen/PyTorch 对照|CPU Runtime 项目表达",
    "GPU 环境与设备规格|grid/block/thread|SIMT 与 warp|host/device memory|grid-stride loop|CUDA 错误检查|H2D/kernel/D2H 计时",
    "global/shared/register memory|coalescing|bank conflict|tiled transpose|padding|Nsight Compute 指标|非整除边界 mask",
    "GEMM 的 M/N/K|每线程一个 C 元素|shared tile|协作加载与同步|K 尾部处理|cuBLAS 公平对照|索引图与访存分析",
    "register tile 与 ILP|occupancy 与寄存器压力|block shape|vectorized load|对齐与 fallback|achieved TFLOPS|dispatch 条件",
    "tree reduction|warp shuffle|stable softmax|max-subtract-exp|多 block/workspace|FP32 accumulate|NaN/极值诊断",
    "LayerNorm mean/var|Welford|row-wise mapping|gamma/beta|FP16/BF16 累加|vector load/tail|支持矩阵与 fallback",
    "Triton program/block/mask|CUDA 对照|Triton 调参|统一回归脚本|Python API|性能图统计口径|CUDA Kernel Lab 讲解",
    "autograd graph|topological backward|leaf/grad_fn|in-place 风险|TensorImpl/Storage|Dispatcher/schema|有限差分梯度检查",
    "FX GraphModule/Node|node meta shape|pattern rewrite|Conv-BN-ReLU 条件|ONNX graph/initializer|checker/Netron|Pass fallback",
    "eager/compile|graph break|Dynamo/AOT/Inductor|IR dump|shape guard|compile vs steady time|端到端正确性",
    "bytecode tracing|guard/recompile|alias/mutation|functionalization|AOT 分区|dynamic symbol|最小复现与 regression",
    "Inductor scheduler|fusion group|generated kernel|autotune/cache|backend contract|constant fold/DCE|性能回归",
    "FusionPass registry|模式支持矩阵|eval/train 条件|IR before/after|fallback|kernel 数与访存|RFC 与 README",
    "项目 RFC|非目标与指标|operator API|dispatch/fallback|shape/dtype matrix|benchmark JSON|Triton/CUTLASS/FA 对标",
    "RMSNorm 数学|stable softmax|warp/shared reduction|mask|FP16/BF16 误差|vector load|operator dispatch",
    "Transformer MLP shape|GEMM blocking|tensor core 条件|bias+GELU/SwiGLU|layout/workspace|cuBLAS/CUTLASS/Triton|融合反例",
    "RoPE 数学与配对维度|prefill/decode|KV Cache 字节数|连续/分页 layout|attention IO|FlashAttention|容量与正确性",
    "torch.library schema|C++/Python extension|fake/meta kernel|capability check|vLLM custom op|fallback|端到端收益",
    "API 支持矩阵|correctness regression|performance regression|环境锁定|README 架构图|失败案例|源码讲解",
    "项目 B RFC|Relax/TensorIR/runtime|子图边界|输入模型与 baseline|IR dump|测试计划|开源对标 TVM",
    "PrimFunc/block/buffer|TVMScript|split/reorder|cache_read/write|thread binding|cooperative fetch|生成 CUDA 对照",
    "DPL 模式|dataflow block|pattern matching|rewrite|融合合法性|dtype/layout 条件|前后 IR 与数值测试",
    "ShapeExpr/symbol|specialization|guard/recompile|MetaSchedule space|runner/database|cost model|holdout shape",
    "PackedFunc/NDArray|runtime call chain|BYOC/external codegen|能力检查|编译/加载/稳态拆分|诊断信息|fallback",
    "decoder block dataflow|RMSNorm/QKV/RoPE|prefill/decode 瓶颈|KV Cache layout|fusion/memory plan|kernel 数|端到端 latency",
    "framework 接入点|custom kernel call path|shape/dtype guard|fallback|数值回归|profiling|单算子到端到端",
    "frontend→runtime pipeline|Pass 不变量|unsupported op|三组模型/shape|e2e regression|性能报告|系统设计讲解",
    "开源 issue 筛选|最小复现|根因定位|目标测试|benchmark|commit/PR 描述|维护者反馈",
    "MLIR SSA/op/type|Dialect/TableGen|RewritePattern|canonicalization|PassManager|affine/scf/memref|lowering legality",
    "README 审计|可复现环境|性能图口径|简历量化|2/5/10 分钟讲解|JD 证据映射|模拟面试复盘"
  ].map((row) => row.split("|"));

  function dayTopic(w, d) {
    // The knowledge list is authored beside the matching raw week.  Prefer it
    // over a compressed index table so a day never receives another week's IR
    // or kernel topic.
    return w.knowledge?.[d % w.knowledge.length] || detailedTopics[w.index - 1]?.[d] || "本日任务的关键概念";
  }

  function guideSource(w, d, topic) {
    const source = DATA.guidePlan[w.index - 1];
    const section = DATA.guideSections?.[w.index - 1]?.[d] || source.title + " · 本章导读";
    return { source, section };
  }

  function dayFiles(w, d) {
    // fileHint is authored per week and follows the real deliverable.  Do not
    // reuse Week 1's Tensor paths for allocator, CUDA, compiler, or portfolio
    // work: doing so makes an otherwise good daily card actively misleading.
    const note = "docs/learning-log/W" + String(w.index).padStart(2, "0") + "-D" + String(d + 1).padStart(2, "0") + ".md";
    if (w.fileHint) return w.fileHint + " · " + note;
    if (w.index <= 16) return "src/ · kernels/ · tests/ · examples/ · " + note;
    if (w.index <= 22) return "compiler/ · passes/ · tests/ · examples/ · " + note;
    if (w.index <= 28) return "operators/ · tests/ · benchmarks/ · examples/ · " + note;
    if (w.index <= 37) return "compiler/ · runtime/ · operators/ · tests/ · " + note;
    return w.index === 38 ? "lib/ · test/ · examples/ · docs/ · " + note : "README.md · resume/ · benchmarks/ · docs/ · " + note;
  }

  function pace(task) {
    const main = task.split("；算法｜")[0];
    if (/性能|benchmark|基准|profile|Nsight|调优|对比|扫描|吞吐|延迟/.test(main)) {
      return "20 分钟冻结输入与 baseline → 90 分钟完成/修改实验 → 45 分钟重复测量与记录 → 25 分钟解释结果；没有同口径 baseline 不勾选。";
    }
    if (/学习|阅读|视频|源码|概念|理解/.test(main)) {
      return "45 分钟学习一个小节 → 60 分钟暂停复写最小示例 → 30 分钟只改一个变量验证 → 25 分钟把定义、现象和疑问写入日志。";
    }
    if (/测试|验证|正确性|边界|异常/.test(main)) {
      return "30 分钟列正常/边界/失败输入 → 90 分钟写测试与实现 → 40 分钟故意让一个测试失败后修复 → 20 分钟保存完整输出。";
    }
    if (/画|设计|定义|冻结|整理|写.*RFC|写.*README|列出|推导|统计|跟踪|建立.*协议/.test(main)) {
      return "30 分钟明确目标与非目标 → 75 分钟画接口、数据流或实验表 → 45 分钟用下一天的实现反推缺口 → 30 分钟写下可检验断言。";
    }
    if (/从零|复现|发布|封版|接入|打通|准备|录制|提交|贡献/.test(main)) {
      return "30 分钟清理环境或创建新输入 → 100 分钟从零跑通 → 40 分钟处理一个真实失败点 → 20 分钟把复现命令和限制写进 README/日志。";
    }
    return "30 分钟读清接口和输入输出 → 120 分钟完成最小正确实现 → 40 分钟跑正常与边界输入 → 20 分钟保存命令、输出和一个设计取舍。";
  }

  function weekOneContract(d, note) {
    const contracts = [
      {
        files: "CMakeLists.txt；include/minitensor/；src/；tests/；benchmarks/；examples/",
        artifact: "一个可构建的 MiniTensor 工程骨架",
        must: "创建上述目录；在 CMakeLists.txt 中声明 minitensor 静态库、minitensor_demo 可执行程序和 minitensor_test 测试目标。今天不写 benchmark、不写 Tensor 功能。",
        input: "空的最小 tensor.cpp、demo.cpp、tensor_test.cpp",
        expected: "cmake --build build 成功；能看到 minitensor_demo 和 minitensor_test 两个 target；ctest 可以执行并返回通过。",
        evidence: note + " 保存目录树、构建命令、ctest 输出和一句“library / demo / test 各自作用”的说明"
      },
      {
        files: "include/minitensor/tensor.hpp",
        artifact: "Tensor 的接口草图，不实现数据存储",
        must: "声明 Shape、Stride、DType 和 Tensor；为构造函数、shape()、strides()、numel() 写出函数签名；参数使用 const reference。",
        input: "shape={2,3,4} 与 shape={5}",
        expected: "demo 能编译并打印接口对应的 shape；你能指出每个字段将来保存什么信息。",
        evidence: note + " 保存接口截图/代码片段，并写清 Shape 与 Stride 的区别"
      },
      {
        files: "include/minitensor/tensor.hpp；src/tensor.cpp；tests/tensor_test.cpp",
        artifact: "可计算 numel 与连续 stride 的 Tensor",
        must: "实现 shape 非空且维度非零的检查；实现 numel()；从最后一维向前计算连续 stride；提供 shape()/strides() 只读访问。",
        input: "{2,3,4}、{5}、{2,0,4}",
        expected: "{2,3,4} 输出 numel=24、stride={12,4,1}；{5} 输出 stride={1}；{2,0,4} 抛出明确异常。",
        evidence: note + " 保存三组测试输出，并用一句话解释为什么最后一维 stride=1"
      },
      {
        files: "src/tensor.cpp；examples/demo.cpp；tests/tensor_test.cpp",
        artifact: "一维/二维索引与 fill 的最小实现",
        must: "实现 fill(value) 与 index(i) / index(i,j)；二维下标换成连续偏移；越界必须抛异常。",
        input: "shape={2,3}；fill(7)；访问 (1,2)、(-1 等非法输入) 或越界索引",
        expected: "(1,2) 映射到连续偏移 5；正常读取值为 7；越界调用失败且错误信息明确。",
        evidence: note + " 保存一次断点或打印的 index→offset 过程，以及一个越界输出"
      },
      {
        files: "tests/tensor_test.cpp；CMakeLists.txt",
        artifact: "Tensor 的第一组自动化测试",
        must: "写 1 个正常用例、1 个单维边界用例、1 个零维度非法用例、1 个越界索引用例；把它们注册到 CTest。",
        input: "{2,3,4}、{5}、{2,0,4} 与 shape={2,3} 的越界索引",
        expected: "ctest --output-on-failure 全部通过；故意删掉边界检查后至少一个测试会失败。",
        evidence: note + " 保存测试名、通过输出，以及“测试实际防住了哪种错误”的一句话"
      },
      {
        files: "labs/W01-D06/；docs/learning-log/W01-D06.md",
        artifact: "数组、引用、类三个最小 C++ 实验",
        must: "看当天视频章节；分别写一个 vector 遍历、const reference 传参、类构造函数实验；每个实验只需 10 行以内。",
        input: "vector<int>{1,2,3}；一个 const reference 函数；一个带成员变量的类",
        expected: "三个程序/函数均能编译运行；日志回答“值传递与 const reference 的差别是什么”。",
        evidence: note + " 保存三个代码片段、运行输出、3 条知识点和 1 个疑问"
      },
      {
        files: "README.md；examples/demo.cpp；tests/tensor_test.cpp",
        artifact: "Week 1 可复现交付",
        must: "从空 build 目录重新配置、构建、跑 demo 和 ctest；README 写出三条命令、当前能力与一个已知限制。",
        input: "删除 build 后重新执行 CMake；demo 的 {2,3,4} 示例",
        expected: "新 build 目录也能通过所有测试；README 的命令可复制运行。",
        evidence: note + " 保存从零构建输出、README 链接和下周要实现的 Storage 接口"
      }
    ];
    return contracts[d];
  }

  function dailyContract(w, d, task) {
    const main = task.split("；算法｜")[0];
    const files = dayFiles(w, d);
    const note = "docs/learning-log/W" + String(w.index).padStart(2, "0") + "-D" + String(d + 1).padStart(2, "0") + ".md";
    if (w.index === 1) return weekOneContract(d, note);
    const topic = dayTopic(w, d);
    const isStudy = /学习|阅读|视频|源码|概念|理解/.test(main);
    const isMeasure = /性能|benchmark|基准|profile|Nsight|调优|对比|扫描|吞吐|延迟/.test(main);
    const isTest = /测试|验证|正确性|边界|异常/.test(main);
    const isDesign = /画|设计|定义|冻结|整理|写.*RFC|写.*README|列出|推导|统计|跟踪|建立.*协议/.test(main);
    const isIntegration = /从零|复现|发布|封版|接入|打通|准备|录制|提交|贡献/.test(main);
    const base = {
      files,
      artifact: "围绕「" + topic + "」完成一个可运行、可验证的小交付",
      must: "只完成：「" + main + "」。先用自己的话写出「" + topic + "」的定义、输入输出与一个边界，再实现最小正确版本；不要提前写明天的功能。",
      input: "一个正常输入 + 两个边界/失败输入",
      expected: "构建和测试通过；你能解释「" + topic + "」在本周模块中的作用，并逐项核对输出",
      evidence: note + " 中保存概念定义、命令、原始输出、边界情况和一句“为什么这样设计”的结论"
    };

    if (isDesign) {
      base.artifact = "一份可执行的设计/实验说明，而不是泛泛笔记";
      base.must = "围绕「" + topic + "」完成：「" + main + "」。说明至少包含目标、输入输出/接口、一个边界或非目标，以及它如何被下一天代码验证。";
      base.input = "本周模块的真实数据结构、shape、IR 或 benchmark 需求";
      base.expected = "文档或图中能找到目标、非目标、接口/数据流和一个可检验断言；随后一天可以按它直接实现。";
      base.evidence = note + " 中保存图/表/伪代码、一个非目标和下一天的第一条实现步骤";
      return base;
    }
    if (isStudy) {
      base.artifact = "一份 1 页学习记录 + 一个亲手运行的最小复现";
      base.must = "围绕「" + topic + "」阅读或观看一个章节；暂停复写一个示例，并只改变一个变量（shape、参数或编译选项）。";
      base.input = "视频/文档中的最小示例 + 你自己改动后的输入";
      base.expected = "示例能运行；记录「" + topic + "」的定义、3 个关联概念、1 个证据和 1 个未解决问题";
      return base;
    }
    if (isIntegration) {
      base.artifact = "一个从零可运行的集成结果或发布记录";
      base.must = "完成「" + main + "」；使用干净 build/venv 或新输入运行，不依赖本机残留产物。";
      base.input = "全新构建目录或全新进程 + 本周代表性输入";
      base.expected = "从零运行成功；README/日志写明命令、版本、输入、输出和一个已知限制。";
      base.evidence = note + " 中保存从零命令、完整输出、版本号/commit 和限制说明";
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
    const hasAlgo = task.includes("算法｜");
    const source = guideSource(w, d, dayTopic(w, d));
    const steps = [
      "先读 AIInfraGuide《" + source.source.title + "》的「" + source.section + "」（25–35 分钟）：" + source.source.readingGoal + "不答题、不写阅读摘要；读完直接开始编码。",
      "交付物：" + c.artifact,
      "打开并只修改：" + c.files,
      "必须写出：" + c.must,
      "验收输入：" + c.input + "。预期结果：" + c.expected,
      "保存证据：" + c.evidence + (hasAlgo ? "；另附算法题思路、复杂度和边界。" : "")
    ];
    const done = [
      "已完成指定章节阅读，并直接完成与该小节对应的代码、实验或测试；不需要提交阅读问答。",
      "目标文件已创建或更新，且内容只覆盖今天的任务。",
      c.expected,
      "当天日志包含实际运行命令、原始输出和至少一个边界/失败情况。",
      hasAlgo ? "算法题已记录思路、复杂度、边界和错因。" : "以上四项均完成后，才勾选今天。"
    ];
    return { ws: workspace(w.index), files: c.files, steps, cmd: command(w.index), done };
  };

  learning = function(w, d, task) {
    const topic = dayTopic(w, d);
    const main = task.split("；算法｜")[0];
    const next = dayTopic(w, (d + 1) % 7);
    const purpose = "今天不是泛泛学习「" + w.title + "」。你只需通过「" + main + "」掌握「" + topic + "」，并留下一个能运行或能检查的证据。完成后，你应能向面试官说明它的定义、为什么需要它、以及它在本周交付物「" + w.output + "」中处于哪一层。";
    const points = [
      "今天的核心知识：" + topic,
      "必须说清：它的输入、输出、关键约束或边界条件分别是什么。",
      "必须动手：完成“" + main + "”，不能只看资料或只写笔记。",
      "必须验证：至少用一个正常输入和一个边界/失败输入检查结果。",
      "衔接下一天：" + next + "；今天留下的接口、数据或结论要能被下一天复用。"
    ];
    return { purpose, points };
  };

  const previousRender = render;
  render = function() {
    previousRender();
    weeks.querySelectorAll(".day").forEach(day => {
      const parts = day.dataset.id.split("-").map(Number);
      const w = { ...DATA.weeks[parts[0] - 1], index: parts[0] };
      const task = tasks(w)[parts[1] - 1];
      const c = dailyContract(w, parts[1] - 1, task);
      const topic = dayTopic(w, parts[1] - 1);
      const source = guideSource(w, parts[1] - 1, topic);
      const globalDay = (parts[0] - 1) * 7 + parts[1];
      const date = day.querySelector(".date");
      if (date) date.innerHTML = "第 " + globalDay + " 天<span>W" + String(parts[0]).padStart(2, "0") + " · D" + String(parts[1]).padStart(2, "0") + " · 周" + dayNames[parts[1] - 1] + " · " + dateLabel(parts[0], parts[1] - 1) + "</span>";
      const schedule = pace(task);
      const start = day.querySelector(".startHere");
      if (!start) return;
      start.insertAdjacentHTML("afterend", '<div class="contractCard"><span>今天具体要学什么</span><div class="contractGrid"><div class="contractRow"><b>核心知识</b><em>' + esc(topic) + '</em></div><div class="contractRow"><b>你要会说</b><em>定义、输入输出、一个边界条件，以及它为何服务于本周模块。</em></div><div class="contractRow"><b>你要会做</b><em>' + esc(task.split("；算法｜")[0]) + '</em></div></div></div>');
      start.insertAdjacentHTML("afterend", '<div class="contractCard"><span>今天交付什么 · 不用猜</span><div class="contractGrid"><div class="contractRow"><b>修改文件</b><code>' + esc(c.files) + '</code></div><div class="contractRow"><b>建议推进</b><em>' + esc(schedule) + '</em></div><div class="contractRow"><b>必须完成</b><em>' + esc(c.must) + '</em></div><div class="contractRow"><b>验收输入</b><em>' + esc(c.input) + '</em></div><div class="contractRow"><b>预期结果</b><em>' + esc(c.expected) + '</em></div><div class="contractRow"><b>完成证据</b><code>' + esc(c.evidence) + '</code></div><div class="contractRow"><b>何时勾选</b><em>仅当预期结果成立、完成证据已写入当天日志，并且至少验证过一个边界或失败输入时，才勾选完成。</em></div></div></div>');
      start.insertAdjacentHTML("afterend", '<a class="guideReadingCard" href="' + source.source.url + '" target="_blank" rel="noreferrer"><span>先读，再写代码 · AIInfraGuide</span><b>' + esc(source.source.title) + ' ↗</b><p>指定阅读：' + esc(source.section) + '</p><small>' + esc(source.source.readingGoal) + ' 阅读后直接做下方代码；不需要回答提问或写阅读摘要。</small></a>');
    });
  };
  render();
})();`;

const enhancedHtml = html.replace("</script>", deliveryLayer + "</script>");

// GitHub's web contents endpoint truncates the full standalone page in this
// environment.  The Pages entry keeps the same HTML payload but stores it as
// gzip + base64, which modern browsers expand before rendering.  The normal
// local and app-hosted entries remain plain HTML for easy inspection.
function githubPagesEntry(sourceHtml) {
  const compressed = gzipSync(Buffer.from(sourceHtml, "utf8")).toString("base64");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI 编译器学习日志</title></head><body><script>(async()=>{try{const b="${compressed}",bytes=Uint8Array.from(atob(b),c=>c.charCodeAt(0)),stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));document.open();document.write(await new Response(stream).text());document.close()}catch(error){document.body.innerHTML="<main style='font-family:system-ui;padding:2rem;line-height:1.7'><h1>学习日志加载失败</h1><p>请使用最新版本的 Chrome、Edge、Safari 或 Firefox 后重试。</p></main>"}})()</script></body></html>`;
}

const output = path.join(root, "worldhaung_ai.html");
const rootOutput = path.join(root, "index.html");
const pagesOutput = path.join(root, "docs", "index.html");
const publicOutput = path.join(root, "public", "worldhaung_ai.html");
fs.writeFileSync(output, enhancedHtml, "utf8");
fs.writeFileSync(rootOutput, githubPagesEntry(enhancedHtml), "utf8");
fs.mkdirSync(path.dirname(pagesOutput), { recursive: true });
fs.writeFileSync(pagesOutput, githubPagesEntry(enhancedHtml), "utf8");
fs.writeFileSync(publicOutput, enhancedHtml, "utf8");
console.log(`${output}\n${rootOutput}\n${pagesOutput}\n${publicOutput}`);
