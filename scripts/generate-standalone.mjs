import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import ts from "typescript";
import { buildCurriculum, reviseWeeks } from "./verified-curriculum.mjs";

const root = process.cwd();
const sourceText = fs.readFileSync(path.join(root, "app", "Planner.tsx"), "utf8");
const source = ts.createSourceFile("Planner.tsx", sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function valueOf(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(valueOf);
  if (ts.isParenthesizedExpression(node)) return valueOf(node.expression);
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) return String(valueOf(node.left)) + String(valueOf(node.right));
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

reviseWeeks(plannedWeeks);
const curriculum = buildCurriculum(plannedWeeks, findConst("hot100Problems"));
plannedWeeks.forEach((week,i)=>{
  const days=curriculum.days.slice(i*7,i*7+7);
  week.days=days.map(day=>day.task);
  week.knowledge=[...new Set(days.flatMap(day=>day.knowledge))];
});
const DATA = {
  curriculum,
  weeks: plannedWeeks, phases: rawPhases, acceptancePlan: findConst("acceptancePlan"),
  phaseResources: findConst("phaseResources"), phaseReferences: findConst("phaseReferences"),
  weekLearningResources: findConst("weekLearningResources"), openSourceProjects: findConst("openSourceProjects"),
  detailSteps: findConst("detailSteps"), timePlan: findConst("timePlan"), jdSignals: findConst("jdSignals"),

  carlProblems: findConst("carlProblems"), hot100Problems: findConst("hot100Problems"),
  weekFileHints: findConst("weekFileHints"),
  weekKnowledgePoints: findConst("weekKnowledgePoints"),
};
const data = JSON.stringify(DATA).replaceAll("<", "\\u003c");

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI 编译器学习日志｜30 周核对版</title><meta name="description" content="真实原文阅读、逐日代码任务与明确验收；代码随想录从栈与队列继续。"><meta property="og:title" content="AI 编译器学习日志"><meta property="og:description" content="30 周 · 从基础到项目"><meta property="og:image" content="https://ai-compiler-year-one.worldhuang2002.chatgpt.site/og.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="AI 编译器学习日志"><meta name="twitter:description" content="30 周 · 从基础到项目"><meta name="twitter:image" content="https://ai-compiler-year-one.worldhuang2002.chatgpt.site/og.png"><style>
:root{--ink:#211c1a;--paper:#f7f1e9;--card:#fffaf4;--muted:#756d68;--line:#ded3c8;--accent:#ef6a4c;--purple:#7257aa}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,"Microsoft YaHei",sans-serif}button,input{font:inherit}button{cursor:pointer}a{color:inherit;text-decoration:none}.top{position:sticky;top:0;z-index:10;height:68px;padding:0 5vw;background:rgba(247,241,233,.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between}.brand{display:flex;align-items:center;gap:10px;font-size:12px;line-height:1}.mark{width:36px;height:36px;border-radius:50% 50% 50% 8px;background:var(--ink);color:#fff;display:grid;place-items:center;font:700 13px Georgia}.progress{display:flex;align-items:center;gap:10px;font:11px monospace}.bar{width:110px;height:5px;background:#dfd4ca}.bar i{display:block;height:100%;background:var(--accent)}.hero{padding:72px 7vw 58px;display:grid;grid-template-columns:1.35fr .65fr;gap:6vw;align-items:center}.eyebrow{font-size:10px;font-weight:800;letter-spacing:.2em;color:var(--accent)}h1{font:clamp(52px,7vw,94px)/.96 Georgia,"Songti SC",serif;letter-spacing:-.05em;margin:18px 0 26px}h1 em{font-weight:400;color:var(--accent)}.hero p{max-width:650px;line-height:1.8;color:var(--muted)}.stat{background:var(--card);border:1px solid var(--line);box-shadow:14px 14px 0 #e8ddd3;padding:28px}.stat strong{display:block;font:58px Georgia;color:var(--accent)}.stat label{display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);margin-top:24px;padding-top:16px;font-size:12px}.stat input{border:0;background:#eee4da;padding:8px}.signals{padding:35px 6vw;background:var(--ink);color:#fff;display:grid;grid-template-columns:repeat(4,1fr);gap:1px}.signal{padding:18px;border:1px solid #4a423e;display:flex;flex-direction:column;min-height:140px}.signal small{color:var(--accent);font:9px monospace}.signal b{margin:10px 0;font:17px Georgia}.signal span{font-size:9px;line-height:1.6;color:#bdb4ae}.tools{max-width:1320px;margin:55px auto 0;padding:0 5vw 22px;display:grid;grid-template-columns:1fr 310px;gap:16px}.phases{display:flex;flex-wrap:wrap;gap:8px}.phases button,.search{border:1px solid var(--line);background:var(--card);padding:11px 14px;font-size:11px}.phases button.active{background:var(--ink);color:white}.search{display:flex}.search input{width:100%;border:0;background:transparent;outline:0}.content{max-width:1320px;margin:auto;padding:0 5vw 100px}.week{background:rgba(255,250,244,.7);border:1px solid var(--line);margin:10px 0}.summary{width:100%;border:0;background:transparent;text-align:left;padding:18px;display:grid;grid-template-columns:54px 1fr 90px;gap:18px;align-items:center}.wn{width:50px;height:50px;border:1px solid var(--ink);display:grid;place-items:center;font:22px Georgia}.summary small{font:9px monospace;color:var(--accent);letter-spacing:.1em}.summary h2{font:21px Georgia,"Songti SC",serif;margin:5px 0}.summary p{font-size:12px;color:var(--muted);margin:0}.score{text-align:right;font:11px monospace}.body{display:none;border-top:1px solid var(--line);padding:18px}.week.open .body{display:block}.output{background:var(--ink);color:white;padding:16px 20px;margin-bottom:10px}.output span{font-size:9px;color:#c3b7ae;letter-spacing:.12em}.output b{display:block;font:18px Georgia;margin-top:6px}.resources{display:flex;flex-wrap:wrap;gap:7px;background:#eee5dc;border:1px solid var(--line);padding:12px;margin-bottom:10px}.resources strong{width:100%;font-size:9px;color:var(--purple);letter-spacing:.12em;margin-top:3px}.resources a,.links a{color:var(--ink);background:var(--card);border:1px solid var(--line);padding:8px 10px;text-decoration:none;font-size:10px}.resources a:hover,.links a:hover{border-color:var(--accent);color:var(--accent)}.days{display:grid;grid-template-columns:1fr 1fr;gap:7px}.day{border:1px solid var(--line);background:var(--card)}.day.done{opacity:.65;background:#eee8e1}.dayTop{display:grid;grid-template-columns:26px 64px 1fr auto;gap:10px;align-items:start;padding:13px;min-height:100px}.tick{width:21px;height:21px;border:1px solid #978a81;display:grid;place-items:center}.done .tick{background:#249577;color:#fff}.check{position:absolute;opacity:0}.date{font:9px monospace}.date span{display:block;color:var(--muted);margin-top:5px}.task{font-size:11px;line-height:1.55}.task small{display:block;color:var(--muted);font-size:9px;margin-top:5px}.expand{border:0;background:transparent;color:var(--purple);font-size:10px;font-weight:800}.detail{display:none;border-top:1px dashed #cfc1e7;background:#f5f0fb;padding:18px;grid-template-columns:1.1fr .9fr;gap:20px}.day.open .detail{display:grid}.detail ol{margin:0;padding-left:18px;font-size:11px;line-height:1.75}.links{display:flex;flex-wrap:wrap;align-content:start;gap:7px}.links strong{width:100%;font-size:9px;color:var(--purple);letter-spacing:.12em}.empty{text-align:center;padding:60px;color:var(--muted)}footer{background:var(--ink);color:#c7bdb5;padding:35px 7vw;font:12px Georgia;text-align:center}.offlineGate{position:fixed;inset:0;z-index:100;background:var(--paper);display:grid;place-items:center;padding:20px}.offlineGate section{width:min(470px,100%);background:var(--card);border:1px solid var(--line);box-shadow:14px 14px 0 #e5dad0;padding:38px}.offlineGate h2{font:44px/1 Georgia,"Songti SC",serif;margin:18px 0}.offlineGate h2 em{color:var(--accent);font-weight:400}.offlineGate p{font-size:12px;color:var(--muted)}.offlineGate form{display:grid;grid-template-columns:1fr auto;margin-top:24px}.offlineGate input{min-width:0;border:1px solid var(--ink);padding:14px;font:17px monospace;letter-spacing:.2em}.offlineGate button{border:0;background:var(--ink);color:white;padding:0 20px}.offlineGate .error{display:block;color:#c74435;font-size:10px;margin-top:8px}@media(max-width:900px){.hero{grid-template-columns:1fr}.signals{grid-template-columns:1fr 1fr}.tools{grid-template-columns:1fr}.days{grid-template-columns:1fr}}@media(max-width:600px){.hero{padding:48px 20px}.hero h1{font-size:48px}.content,.tools{padding-left:16px;padding-right:16px}.signals{grid-template-columns:1fr}.summary{grid-template-columns:46px 1fr}.score,.summary p{display:none}.dayTop{grid-template-columns:24px 58px 1fr}.expand{grid-column:3;justify-self:start}.detail{grid-template-columns:1fr}.top{padding:0 16px}.bar{width:70px}}
.detail{padding:20px 22px;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr)}.startHere{background:#211c1a;color:white;padding:15px 17px;margin-bottom:18px}.startHere span,.detailTitle{display:block;margin-bottom:8px;color:#7257aa;font-size:9px;font-weight:800;letter-spacing:.14em}.startHere span{color:#d3c6bd}.startHere code{display:block;color:#ffd2c6;font:11px/1.6 Consolas,monospace;overflow-wrap:anywhere}.startHere p{margin:8px 0 0;color:#c9bfb8;font-size:10px;line-height:1.6}.actionList{display:grid;gap:7px;margin:0;padding:0!important;list-style:none}.actionList li{margin:0}.actionList label{display:grid;grid-template-columns:26px 1fr;gap:9px;align-items:start;padding:10px 11px;border:1px solid #d8cce8;background:white;cursor:pointer}.actionList input{position:absolute;opacity:0}.actionList i{display:grid;width:22px;height:22px;place-items:center;border:1px solid #9b88c2;color:#7257aa;font:10px monospace;font-style:normal}.actionList input:checked+i{border-color:#249577;background:#249577;color:white}.actionList b{font-size:11px;font-weight:600;line-height:1.65}.actionList input:checked~b{color:#8b838f;text-decoration:line-through}.completeDay{width:100%;margin-top:10px;padding:11px 14px;border:0;background:#7257aa;color:white;font-size:10px;font-weight:800}.dayMeta pre{overflow:auto;margin:0 0 18px;padding:13px;border-left:3px solid #ef6a4c;background:#282321;color:#f7f1e9}.dayMeta pre code{white-space:pre-wrap;font:10px/1.7 Consolas,monospace}.dayMeta ul{margin:0 0 18px;padding-left:18px;font-size:10px;line-height:1.75}.methodNote{padding:9px 11px;border-left:3px solid #aa99d0;background:#eee7f7;color:#62596a;font-size:10px;line-height:1.65}@media(max-width:600px){.detail{grid-template-columns:1fr}}
.purposeCard,.knowledgeCard{margin-bottom:14px;padding:14px 16px;border:1px solid #d8cce8;background:#fffaf5}.purposeCard{border-left:4px solid #ef6a4c;background:#fff1eb}.purposeCard span,.knowledgeCard span{display:block;margin-bottom:8px;color:#6d55a1;font-size:9px;font-weight:800;letter-spacing:.14em}.purposeCard p{margin:0;color:#443c38;font-size:11px;line-height:1.75}.knowledgeCard ul{display:grid;gap:7px;margin:0;padding:0;list-style:none}.knowledgeCard li{position:relative;padding-left:16px;color:#514851;font-size:10px;line-height:1.65}.knowledgeCard li:before{content:"◆";position:absolute;top:0;left:0;color:#7e62c7;font-size:8px}
</style></head><body>
<div class="offlineGate" id="offlineGate"><section><span class="eyebrow">AI COMPILER · LEARNING LOG</span><h2>进入你的<br><em>学习日志</em></h2><p>输入 6 位数访问密码。勾选进度会保存在当前浏览器。</p><form id="unlockForm"><input id="unlockInput" type="password" inputmode="numeric" maxlength="6" placeholder="••••••" autofocus><button>进入 →</button></form><span class="error" id="unlockError"></span></section></div>
<header class="top"><div class="brand"><span class="mark">AC</span><span>AI COMPILER<br><b>LEARNING LOG</b></span></div><div class="progress"><span id="doneTop">0/210</span><div class="bar"><i id="topBar"></i></div><b id="percentTop">0%</b></div></header>
<section class="hero"><div><span class="eyebrow">210 天 · 30 周 · 2 个简历主项目 + 1 次开源协作</span><h1>AI 编译器<br><em>冲刺学习日志</em></h1><p>从 2026 年 8 月末到 2027 年 3 月底：完成 AI 编译器方向的核心知识、两个可复现主项目与秋招材料。已对照 AIInfraGuide 原文逐日核对。W02-D05 从代码随想录「栈与队列」继续；完成后续主目录、核对前置漏题，再完整刷 Hot 100。普通日约 4 小时，两项算法练习日约 4.5 小时；难题未完成顺延到周末缓冲，不强行打勾。</p></div><div class="stat"><span class="eyebrow">计划进度</span><strong id="percentBig">0%</strong><span id="doneBig">已完成 0 个任务</span><label>计划开始日 <input id="startDate" type="date" value="2026-08-31"></label></div></section>
<section class="signals" id="signals"></section><section class="tools"><div class="phases" id="phaseButtons"></div><label class="search"><input id="search" placeholder="搜索 CUDA、LayerNorm、Pass…"></label></section><main class="content" id="weeks"></main><footer>密码：020721 · 坚持不是堆时长，而是每周交付可运行、可复现、可解释的证据。</footer>
<script>const DATA=${data};
const dayNames=["一","二","三","四","五","六","日"];let saved={};try{saved=JSON.parse(localStorage.getItem("ai-compiler-standalone-v3")||"{}")||{}}catch{}let completed=saved.completed||{},subtasks=saved.subtasks||{},startDate=saved.startDate||"2026-08-31",active=0,query="",openWeeks=new Set([2]),openDays=new Set(["2-5"]);const total=DATA.weeks.length*7;
function dateLabel(w,d){const x=new Date(startDate+"T00:00:00");x.setDate(x.getDate()+(w-1)*7+d);return (x.getMonth()+1)+"/"+x.getDate()}function persist(){localStorage.setItem("ai-compiler-standalone-v3",JSON.stringify({completed,subtasks,startDate}))}function updateProgress(){const done=Object.values(completed).filter(Boolean).length,p=Math.round(done/total*100);doneTop.textContent=done+"/"+total;percentTop.textContent=p+"%";percentBig.textContent=p+"%";doneBig.textContent="已完成 "+done+" 个任务";topBar.style.width=p+"%"}
function weeklyClosure(w){return "周验收：在干净环境从零运行「"+w.output+"」；核对本周测试、代表性输入和一项已知限制，并把复现命令写入日志"}
function carlTopic(n){return n<=10?"数组与二分":n<=18?"链表":n<=26?"哈希与字符串":n<=34?"栈与队列":n<=50?"二叉树":n<=60?"回溯与贪心":"动态规划"}
function hotTopic(n){return["哈希与双指针","滑动窗口与子串","链表","二叉树","栈与单调栈","二分与矩阵","回溯","贪心","动态规划","图与综合"][Math.min(9,Math.floor((n-1)/10))]}
function algorithmSuffix(w,d){const items=DATA.curriculum.days[(w-1)*7+d].algorithms;return items.length?"；算法｜"+items.map(p=>p.stage+"："+p.title).join("；"):""}
function tasks(w){return DATA.curriculum.days.slice((w.index-1)*7,w.index*7).map((day,d)=>day.task+algorithmSuffix(w.index,d))}
function resources(w){return {videos:[],references:[]}}
function picks(items,d){return Array.from({length:Math.min(2,items.length)},(_,offset)=>items[(d+offset)%items.length])}
function esc(x){return String(x).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")} function guide(){return {ws:"",files:"",steps:[],cmd:"",done:[]}}
function learning(){return {purpose:"",points:[]}}
function renderSignals(){signals.innerHTML=DATA.jdSignals.map(x=>'<a class="signal" href="'+x.url+'" target="_blank" rel="noreferrer"><small>'+x.company+'</small><b>'+x.role+'</b><span>'+x.skills+'</span></a>').join('')}function renderPhases(){phaseButtons.innerHTML='<button data-p="0" class="'+(active===0?'active':'')+'">全部 30 周</button>'+DATA.phases.map((p,i)=>'<button data-p="'+(i+1)+'" class="'+(active===i+1?'active':'')+'">'+p.range+' · '+p.name+'</button>').join('');phaseButtons.querySelectorAll('button').forEach(b=>b.onclick=()=>{active=Number(b.dataset.p);renderPhases();render()})}
function render(){const list=DATA.weeks.map((w,i)=>({...w,index:i+1})).filter(w=>(!active||w.phase===active)&&JSON.stringify(w).toLowerCase().includes(query.toLowerCase()));weeks.innerHTML=list.map(w=>{const ts=tasks(w),lr=resources(w),wd=ts.filter((_,d)=>completed[w.index+"-"+(d+1)]).length,label=w.index<19?"本周能力验收物 · LAB":"本周简历项目里程碑";return '<article class="week '+(openWeeks.has(w.index)?'open':'')+'" data-week="'+w.index+'"><button class="summary"><span class="wn">W'+String(w.index).padStart(2,'0')+'</span><span><small>阶段 '+w.phase+' · '+dateLabel(w.index,0)+'—'+dateLabel(w.index,6)+'</small><h2>'+w.title+'</h2><p>'+w.goal+'</p></span><span class="score">'+wd+'/7</span></button><div class="body"><div class="output"><span>'+label+'</span><b>'+w.output+'</b></div><div class="resources"><strong>直达视频章节</strong>'+lr.videos.map(r=>'<a href="'+r.url+'" target="_blank" rel="noreferrer">'+r.label+' ▶</a>').join('')+'<strong>对应参考文献</strong>'+lr.references.map(r=>'<a href="'+r.url+'" target="_blank" rel="noreferrer">'+r.label+' ↗</a>').join('')+'</div><div class="days">'+ts.map((t,d)=>{const id=w.index+'-'+(d+1),done=!!completed[id],isOpen=openDays.has(id),g=guide(w,d,t),steps=g.steps.map((step,si)=>{const sid=id+'-v20260904-step-'+si;return '<li><label><input class="subcheck" data-step-id="'+sid+'" type="checkbox" '+(subtasks[sid]?'checked':'')+'><i>'+(subtasks[sid]?'✓':si+1)+'</i><b>'+esc(step)+'</b></label></li>'}).join('');return '<div class="day '+(done?'done ':'')+(isOpen?'open':'')+'" data-id="'+id+'"><div class="dayTop"><label><input class="check" type="checkbox" '+(done?'checked':'')+'><span class="tick">'+(done?'✓':'')+'</span></label><span class="date">DAY '+String(d+1).padStart(2,'0')+'<span>周'+dayNames[d]+' · '+dateLabel(w.index,d)+'</span></span><span class="task">'+esc(t)+'<small>'+DATA.timePlan[d]+'</small></span><button class="expand" type="button">'+(isOpen?'收起 −':'展开 +')+'</button></div><div class="detail"><div class="executionGuide"><div class="startHere"><span>今天从这里开始</span><code>'+esc(g.ws)+'</code><p>主要会改：'+esc(g.files)+'</p></div><span class="detailTitle">今天的具体执行</span><ol class="actionList">'+steps+'</ol><button class="completeDay" data-complete="'+id+'" data-count="'+g.steps.length+'" type="button">全部步骤完成，勾选今天 ✓</button></div><div class="dayMeta"><span class="detailTitle">最后运行这些命令</span><pre><code>'+esc(g.cmd)+'</code></pre><span class="detailTitle">满足这些条件才算完成</span><ul>'+g.done.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p class="methodNote">今天的方法焦点：'+esc(DATA.detailSteps[d]+' '+DATA.acceptancePlan[d])+'</p><div class="links"><strong>直达视频章节</strong>'+picks(lr.videos,d).map(x=>'<a href="'+x.url+'" target="_blank" rel="noreferrer">'+x.label+' ▶</a>').join('')+'<strong>对应参考文献</strong>'+picks(lr.references,d).map(x=>'<a href="'+x.url+'" target="_blank" rel="noreferrer">'+x.label+' ↗</a>').join('')+'</div></div></div></div>'}).join('')+'</div></div></article>'}).join('')||'<div class="empty">没有匹配的周计划</div>';weeks.querySelectorAll('.summary').forEach(b=>b.onclick=()=>{const a=b.parentElement,n=Number(a.dataset.week);a.classList.toggle('open');a.classList.contains('open')?openWeeks.add(n):openWeeks.delete(n)});weeks.querySelectorAll('.check').forEach(el=>el.onchange=e=>{e.stopPropagation();const id=el.closest('.day').dataset.id;completed[id]=el.checked;persist();updateProgress();render()});weeks.querySelectorAll('.subcheck').forEach(el=>el.onchange=()=>{subtasks[el.dataset.stepId]=el.checked;persist();render()});weeks.querySelectorAll('.completeDay').forEach(b=>b.onclick=()=>{const id=b.dataset.complete,count=Number(b.dataset.count);for(let i=0;i<count;i++)subtasks[id+'-v20260904-step-'+i]=true;completed[id]=true;persist();updateProgress();render()});weeks.querySelectorAll('.expand').forEach(b=>b.onclick=()=>{const id=b.closest('.day').dataset.id;openDays.has(id)?openDays.delete(id):openDays.add(id);render()})}
const renderCore=render;render=function(){renderCore();weeks.querySelectorAll('.day').forEach(day=>{const parts=day.dataset.id.split('-').map(Number),w={...DATA.weeks[parts[0]-1],index:parts[0]},t=tasks(w)[parts[1]-1],learn=learning(w,parts[1]-1,t),start=day.querySelector('.startHere');if(!start)return;start.insertAdjacentHTML('afterend','<div class="purposeCard"><span>今天学习的目的</span><p>'+esc(learn.purpose)+'</p></div><div class="knowledgeCard"><span>今天必须掌握的知识点</span><ul>'+learn.points.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>')})};
unlockForm.onsubmit=e=>{e.preventDefault();if(unlockInput.value==='020721'){sessionStorage.setItem('learning-log-unlocked','1');offlineGate.style.display='none'}else unlockError.textContent='密码不正确，请重试'};if(sessionStorage.getItem('learning-log-unlocked')==='1')offlineGate.style.display='none';startDate=document.getElementById('startDate').value=startDate;document.getElementById('startDate').onchange=e=>{startDate=e.target.value;persist();render()};search.oninput=e=>{query=e.target.value;render()};renderSignals();renderPhases();updateProgress();
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
  gate.innerHTML = '<article class="projectGate"><small>秋招主项目 A · GPU OPERATOR LAB</small><h2>不是 Kernel 作业，而是可接入框架的算子库</h2><p>简历上必须展示 Softmax、RMSNorm、RoPE 三类核心算子；GEMM/MLP 为选修或外部库基线，并说明不同 shape/dtype 的 dispatch。</p><ul><li>PyTorch custom op 或 torch.library 接入，且有 fallback。</li><li>正确性矩阵：FP32/FP16、非对齐 shape、极值和失败路径。</li><li>与 PyTorch、Triton、CUTLASS/cuBLAS 同口径性能对比。</li><li>性能图标注 GPU、shape、dtype、warmup、P50；有失败案例。</li><li>一键测试/benchmark、架构图、10 分钟讲解与可追问源码。</li></ul><a href="https://github.com/triton-lang/triton" target="_blank" rel="noreferrer">对标 Triton</a> · <a href="https://github.com/NVIDIA/cutlass" target="_blank" rel="noreferrer">对标 CUTLASS</a> · <a href="https://github.com/Dao-AILab/flash-attention" target="_blank" rel="noreferrer">对标 FlashAttention</a></article><article class="projectGate"><small>秋招主项目 B · TRANSFORMER SUBGRAPH COMPILER</small><h2>不是 TVM 跑通，而是端到端可诊断编译器</h2><p>简历上必须展示 PyTorch/ONNX 子图进入 IR、融合、TIR schedule、runtime/fallback 和端到端性能证据。</p><ul><li>支持 RMSNorm+MLP 或 attention 子图，并写明非目标。</li><li>保存前后 IR、20+ 图测试、dtype/layout/shape 支持矩阵。</li><li>至少一个 TensorIR schedule 与项目 A kernel 进行对照。</li><li>动态 shape guard、unsupported op、OOM/版本错配均有诊断或 fallback。</li><li>与 eager、torch.compile、TVM baseline 同口径比较并可复现。</li></ul><a href="https://github.com/apache/tvm" target="_blank" rel="noreferrer">对标 Apache TVM</a> · <a href="https://github.com/mlc-ai/mlc-llm" target="_blank" rel="noreferrer">对标 MLC-LLM</a> · <a href="https://github.com/vllm-project/vllm" target="_blank" rel="noreferrer">对标 vLLM</a></article><article class="projectGate resumeGate"><small>简历取舍 · 只写能被追问的成果</small><h2>两项主项目 + 一次真实开源协作，胜过把每周作业都写成项目</h2><p>MiniTensor 和 CUDA 实验是项目 A/B 的能力证据，不应在简历上拆成多个“项目”凑数量。</p><ul><li>简历主项目只保留 A 与 B；每个项目都要有代码、测试、性能表和一键复现命令。</li><li>第 28 周的开源贡献只有在真实提交、issue 复现或 PR 反馈存在时才写入简历；不为凑数而复制代码。</li><li>面试材料准备 2 分钟概览、5 分钟性能故事、10 分钟源码走读；每个数字都能回到原始日志。</li></ul></article>';
  const coverage = document.createElement("article");
  coverage.className = "projectGate resumeGate";
  coverage.innerHTML = '<small>AIInfraGuide 路线 → AI 编译器学习证据</small><h2>30 周只保留与目标岗位直接相关的知识闭环</h2><ul><li><b>C++、Linux、内存与 CPU 性能：</b>W01–W04 用 MiniTensor、Cache/SIMD 与 benchmark 建立代码和证据。</li><li><b>Transformer、GPU、CUDA、低精度与 Profiling：</b>W05–W09 覆盖模型 shape、GPU 微架构、GEMM/Softmax/LayerNorm、Triton、FlashAttention 与 Nsight。</li><li><b>框架、IR、Pass 与代码生成：</b>W10–W16 依次学习 PyTorch/FX/ONNX/torch.compile、传统 IR/SSA、MLIR、Relax/TensorIR/MetaSchedule。</li><li><b>分布式与推理：</b>W17 做 collective/DDP/FSDP/ZeRO 最小实验；W18 做 KV Cache、分页/调度模拟及可用设备上的推理实验；量化是选修。</li><li><b>两个秋招主项目：</b>W19–W22 做 GPU 算子库；W23–W27 做 Transformer 子图编译器，均要求测试、性能、fallback 和复现。</li><li><b>诚实边界：</b>DDP/FSDP 仅覆盖原理和小实验；没有真实多机集群证据，就不宣称千卡训练经验。</li></ul>';
  gate.append(coverage);
  document.querySelector(".hero").insertAdjacentElement("afterend", gate);

  function currentDay(w,d) { return DATA.curriculum.days[(w.index-1)*7+d]; }
  function commandFor(day) {
    if(day.week<=4) return "在 projects/minitensor 中运行：\ncmake -S . -B build -DCMAKE_BUILD_TYPE=Debug\ncmake --build build -j\nctest --test-dir build --output-on-failure\n性能实验另用 Release 构建；运行当天新增的 demo/benchmark target。";
    if(day.week>=6 && day.week<=8) return "在本周 CUDA 工程中运行：\ncmake -S . -B build -DCMAKE_BUILD_TYPE=Release\ncmake --build build -j\nctest --test-dir build --output-on-failure\n把今日输入写进已注册测试；GPU 不可用时保留未完成状态。";
    if(day.week===14) return "运行所选 Toy 章节的实际命令（与固定 LLVM/MLIR 版本一致）。\n把你的 .mlir 输入、Pass 参数、IR 输出和测试命令保存到今日日志。";
    return "从项目根目录运行今日编写的 Python/编译器示例与测试入口。\n若使用 pytest：python -m pytest -q\n日志必须保存真实可执行命令、输入和原始输出；不要求运行尚未创建的脚本。";
  }
  guide = function(w,d) {
    const day=currentDay(w,d);
    const algorithms=day.algorithms.map(p=>p.stage+"："+p.title+(p.instruction?"；"+p.instruction:""));
    return {ws:w.index<=4?"ai-compiler-year-one/projects/minitensor":"ai-compiler-year-one（按下列相对路径组织）",
      files:day.files,
      steps:[
        "阅读（约 35 分钟）：按下方原文标题与真实小节查阅。"+day.relation,
        "动手（约 95 分钟）："+day.task,
        "验证（约 30 分钟）："+day.expected,
        "留存（约 10 分钟）：在 "+day.evidence+" 保存实际命令、原始输出和测试输入；不要求回答阅读问题或写摘要。",
        ...algorithms.map(item=>"算法："+item+"。先独立尝试；卡住可看对应讲解，再关闭讲解重写。通过样例和自选边界，记录复杂度；理论条目需复写一个最小示例。")
      ],
      cmd:commandFor(day),
      done:[day.expected,"对应实现/实验与输入输出已保存；看过教程但未运行不算完成。",...(algorithms.length?["当天列出的算法练习均已有代码/验证；漏题核对项已有代码可复跑边界，无代码则补做。"]:[]),"未完成可顺延，不因日期过去或进入下一章自动勾选。"]};
  };
  learning = function(w,d) {const day=currentDay(w,d);return {purpose:day.purpose,points:day.knowledge};};
  const previousRender=render;
  render=function(){
    previousRender();
    weeks.querySelectorAll(".resources,.links,.methodNote").forEach(el=>el.remove());
    weeks.querySelectorAll(".day").forEach(el=>{
      const [wi,di]=el.dataset.id.split("-").map(Number);
      const day=DATA.curriculum.days[(wi-1)*7+di-1];
      el.querySelector(".date").innerHTML="第 "+day.globalDay+" 天<span>W"+String(wi).padStart(2,"0")+" · D"+String(di).padStart(2,"0")+" · "+dateLabel(wi,di-1)+"</span>";
      const minutes=Object.values(day.minutes).reduce((a,b)=>a+b,0);
      el.querySelector(".task small").textContent="阅读 35 分钟 · 实现 95 分钟 · 验证 30 分钟 · 算法 "+day.minutes.algorithm+" 分钟 · 总预算约 "+minutes+" 分钟";
      const start=el.querySelector(".startHere");
      const reads=day.readings.map(r=>'<a class="guideReadingCard" href="'+esc(r.url)+'" target="_blank" rel="noreferrer"><span>'+(r.kind==="guide"?"AIInfraGuide · 已核对原文":"官方补充 · 不冒充原文小节")+'</span><b>'+esc(r.title)+' ↗</b><p>'+esc(r.heading)+'</p>'+(r.line?'<small>原文第 '+r.line+' 行；点击精确定位到源码标题。</small>':'<small>查阅范围：'+esc(day.knowledge.join("、"))+'；不要求读完整份文档。</small>')+'</a>').join("");
      const algo=day.algorithms.length?'<div class="contractCard"><span>今天的算法 · 按实际进度继续</span>'+day.algorithms.map(p=>'<p><a href="'+esc(p.url)+'" target="_blank" rel="noreferrer">'+esc(p.stage+"："+p.title)+' ↗</a></p>'+(p.instruction?'<p>'+esc(p.instruction)+'</p>':'')).join("")+'</div>':"";
      start.insertAdjacentHTML("afterend",'<div class="contractCard"><span>'+esc(day.kind)+'</span><p>'+esc(day.relation)+'</p>'+(day.history?'<p>'+esc(day.history)+'</p>':'')+(day.bufferPolicy?'<p>'+esc(day.bufferPolicy)+'</p>':'')+'</div>'+reads+'<div class="contractCard"><span>完成到什么样才可以打勾</span><p>'+esc(day.expected)+'</p><small>证据：'+esc(day.evidence)+'</small></div>'+algo);
    });
  };
  const info=document.createElement("section");
  info.className="contractCard";
  info.style.cssText="max-width:1180px;margin:20px auto;padding:20px";
  info.innerHTML='<span>内容核对版 · '+DATA.curriculum.revision+'</span><p>原文没有“第1章第4节 storage/view 的内存布局”这一节。第 1 章 4.7 的 TensorView 只是 const 接口示例；Storage/View 完整设计是 MiniTensor 配套练习。形状操作对应 PyTorch 入门 1.2。AI 编译器第 7 章仅作路线概览，MLIR/TVM 细节明确标为官方补充。</p><p>算法范围：代码随想录 README 主目录后续 '+DATA.curriculum.algorithms.remainingCount+' 个题目/方法/理论练习条目（含栈队列），前置 '+DATA.curriculum.algorithms.priorCount+' 项核对，不是 '+(DATA.curriculum.algorithms.remainingCount+DATA.curriculum.algorithms.priorCount)+' 道不同 LeetCode 题。Hot 100 安排在全局第 '+DATA.curriculum.algorithms.hotStart+'–'+DATA.curriculum.algorithms.hotEnd+' 天。理论条目先复写示例；难题超时使用周末缓冲，不挤占下一项基础学习。</p><p>你的进度锚点是 W02-D05，不按电脑日期自动重置。每日勾选保存在当前浏览器；换设备不会自动同步。访问口令只是本地便利锁，不是安全身份认证。</p>';
  document.querySelector(".tools").insertAdjacentElement("beforebegin",info);
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
