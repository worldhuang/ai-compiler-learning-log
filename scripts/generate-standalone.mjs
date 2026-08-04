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
  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map((property) => {
      const name = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
        ? property.name.text
        : property.name.getText(source);
      return [name, valueOf(property.initializer)];
    }));
  }
  throw new Error(`Unsupported data node: ${ts.SyntaxKind[node.kind]}`);
}

function findConst(name) {
  let result;
  source.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name && declaration.initializer) {
        result = valueOf(declaration.initializer);
      }
    }
  });
  if (!result) throw new Error(`Missing ${name}`);
  return result;
}

const weeks = findConst("weeks");
const phases = findConst("phases");
const acceptancePlan = findConst("acceptancePlan");
const phaseResources = findConst("phaseResources");
const data = JSON.stringify({ weeks, phases, acceptancePlan, phaseResources }).replaceAll("<", "\\u003c");

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI 编译器学习日志｜52 周年度计划</title>
<style>
:root{--ink:#211c1a;--paper:#f7f1e9;--card:#fffaf4;--muted:#756d68;--line:#ded3c8;--accent:#ef6a4c}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,"Microsoft YaHei",sans-serif}button,input{font:inherit}button{cursor:pointer}.top{position:sticky;top:0;z-index:10;height:68px;padding:0 5vw;background:rgba(247,241,233,.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between}.brand{display:flex;align-items:center;gap:10px;font-size:12px;line-height:1}.mark{width:36px;height:36px;border-radius:50% 50% 50% 8px;background:var(--ink);color:#fff;display:grid;place-items:center;font:700 13px Georgia}.progress{display:flex;align-items:center;gap:10px;font:11px monospace}.bar{width:110px;height:5px;background:#dfd4ca}.bar i{display:block;height:100%;background:var(--accent)}.hero{padding:72px 7vw 58px;display:grid;grid-template-columns:1.35fr .65fr;gap:6vw;align-items:center}.eyebrow{font-size:10px;font-weight:800;letter-spacing:.2em;color:var(--accent)}h1{font:clamp(52px,7vw,94px)/.96 Georgia,"Songti SC",serif;letter-spacing:-.05em;margin:18px 0 26px}h1 em{font-weight:400;color:var(--accent)}.hero p{max-width:650px;line-height:1.8;color:var(--muted)}.stat{background:var(--card);border:1px solid var(--line);box-shadow:14px 14px 0 #e8ddd3;padding:28px}.stat strong{display:block;font:58px Georgia;color:var(--accent)}.stat label{display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);margin-top:24px;padding-top:16px;font-size:12px}.stat input{border:0;background:#eee4da;padding:8px}.tools{max-width:1320px;margin:auto;padding:0 5vw 22px;display:grid;grid-template-columns:1fr 310px;gap:16px}.phases{display:flex;flex-wrap:wrap;gap:8px}.phases button,.search{border:1px solid var(--line);background:var(--card);padding:11px 14px;font-size:11px}.phases button.active{background:var(--ink);color:white}.search{display:flex}.search input{width:100%;border:0;background:transparent;outline:0}.content{max-width:1320px;margin:auto;padding:0 5vw 100px}.week{background:rgba(255,250,244,.7);border:1px solid var(--line);margin:10px 0}.summary{width:100%;border:0;background:transparent;text-align:left;padding:18px;display:grid;grid-template-columns:54px 1fr 90px;gap:18px;align-items:center}.wn{width:50px;height:50px;border:1px solid var(--ink);display:grid;place-items:center;font:22px Georgia}.summary small{font:9px monospace;color:var(--accent);letter-spacing:.1em}.summary h2{font:21px Georgia,"Songti SC",serif;margin:5px 0}.summary p{font-size:12px;color:var(--muted);margin:0}.score{text-align:right;font:11px monospace}.body{display:none;border-top:1px solid var(--line);padding:18px}.week.open .body{display:block}.output{background:var(--ink);color:white;padding:16px 20px;margin-bottom:10px}.output span{font-size:9px;color:#c3b7ae;letter-spacing:.12em}.output b{display:block;font:18px Georgia;margin-top:6px}.resources{display:flex;flex-wrap:wrap;gap:7px;background:#eee5dc;border:1px solid var(--line);padding:12px;margin-bottom:10px}.resources a{color:var(--ink);background:var(--card);border:1px solid var(--line);padding:8px 10px;text-decoration:none;font-size:10px}.resources a:hover{border-color:var(--accent);color:var(--accent)}.days{display:grid;grid-template-columns:1fr 1fr;gap:7px}.day{display:grid;grid-template-columns:26px 64px 1fr;gap:10px;align-items:start;border:1px solid var(--line);padding:13px;min-height:96px;cursor:pointer}.day input{display:none}.check{width:21px;height:21px;border:1px solid #978a81;display:grid;place-items:center}.day.done{opacity:.58;background:#eee8e1}.day.done .check{background:#249577;color:white}.date{font:9px monospace}.date span{display:block;color:var(--muted);margin-top:5px}.task{font-size:11px;line-height:1.55}.task small{display:block;color:var(--muted);font-size:9px;margin-top:5px}.task .accept{color:#735ba6;border-top:1px dashed var(--line);padding-top:5px}.empty{text-align:center;padding:60px;color:var(--muted)}footer{background:var(--ink);color:#c7bdb5;padding:35px 7vw;font:12px Georgia;text-align:center}.offlineGate{position:fixed;inset:0;z-index:100;background:var(--paper);display:grid;place-items:center;padding:20px}.offlineGate section{width:min(470px,100%);background:var(--card);border:1px solid var(--line);box-shadow:14px 14px 0 #e5dad0;padding:38px}.offlineGate h2{font:44px/1 Georgia,"Songti SC",serif;margin:18px 0}.offlineGate h2 em{color:var(--accent);font-weight:400}.offlineGate p{font-size:12px;color:var(--muted)}.offlineGate form{display:grid;grid-template-columns:1fr auto;margin-top:24px}.offlineGate input{min-width:0;border:1px solid var(--ink);padding:14px;font:17px monospace;letter-spacing:.2em}.offlineGate button{border:0;background:var(--ink);color:white;padding:0 20px}.offlineGate .error{display:block;color:#c74435;font-size:10px;margin-top:8px}@media(max-width:760px){.hero{grid-template-columns:1fr;padding:48px 20px}.hero h1{font-size:48px}.tools{padding:0 16px 18px;grid-template-columns:1fr}.content{padding:0 16px 70px}.days{grid-template-columns:1fr}.summary{grid-template-columns:46px 1fr}.score{display:none}.summary p{display:none}.top{padding:0 16px}.bar{width:70px}.stat{box-shadow:8px 8px 0 #e8ddd3}.offlineGate section{padding:28px}}
</style></head><body>
<div class="offlineGate" id="offlineGate"><section><span class="eyebrow">AI COMPILER · LEARNING LOG</span><h2>进入你的<br><em>学习日志</em></h2><p>输入 6 位数访问密码。勾选进度会保存在当前浏览器。</p><form id="unlockForm"><input id="unlockInput" type="password" inputmode="numeric" maxlength="6" placeholder="••••••" autofocus><button>进入 →</button></form><span class="error" id="unlockError"></span></section></div>
<header class="top"><div class="brand"><span class="mark">AC</span><span>AI COMPILER<br><b>LEARNING LOG</b></span></div><div class="progress"><span id="doneTop">0/364</span><div class="bar"><i id="topBar"></i></div><b id="percentTop">0%</b></div></header>
<section class="hero"><div><span class="eyebrow">365 天 · 52 周 · 3 条硬核项目线</span><h1>AI 编译器<br><em>学习日志</em></h1><p>把学习、实验与性能证据沉淀成可追踪的工程日志。每周有验收物，每天有主任务、时间预算、完成标准和官方知识链接。</p></div><div class="stat"><span class="eyebrow">年度进度</span><strong id="percentBig">0%</strong><span id="doneBig">已完成 0 个任务</span><label>计划开始日 <input id="startDate" type="date" value="2026-08-10"></label></div></section>
<section class="tools"><div class="phases" id="phaseButtons"></div><label class="search"><input id="search" placeholder="搜索 CUDA、LayerNorm、Pass…"></label></section>
<main class="content" id="weeks"></main><footer>坚持不是每天满负荷，而是每周都有可验收的前进。</footer>
<script>const DATA=${data};
const dayNames=["一","二","三","四","五","六","日"],timePlan=["理论 45m · 编码 105m · 记录 30m","复习 20m · 编码 130m · 测试 30m","理论 30m · 实验 120m · 复盘 30m","编码 120m · 调试 40m · 记录 20m","实验 120m · 性能分析 40m · 记录 20m","验收 90m · 文档 60m · 周复盘 30m","休息；仅补漏 ≤ 90m，不开新内容"];
let saved={};try{saved=JSON.parse(localStorage.getItem("ai-compiler-standalone")||"{}")||{}}catch{}let completed=saved.completed||{},startDate=saved.startDate||"2026-08-10",active=0,query="",openWeeks=new Set([1]);const total=DATA.weeks.length*7;
function dateLabel(w,d){const x=new Date(startDate+"T00:00:00");x.setDate(x.getDate()+(w-1)*7+d);return (x.getMonth()+1)+"/"+x.getDate()}function persist(){localStorage.setItem("ai-compiler-standalone",JSON.stringify({completed,startDate}))}function updateProgress(){const done=Object.values(completed).filter(Boolean).length,p=Math.round(done/total*100);doneTop.textContent=done+"/"+total;percentTop.textContent=p+"%";percentBig.textContent=p+"%";doneBig.textContent="已完成 "+done+" 个任务";topBar.style.width=p+"%"}
function renderPhases(){phaseButtons.innerHTML='<button data-p="0" class="'+(active===0?'active':'')+'">全部 52 周</button>'+DATA.phases.map((p,i)=>'<button data-p="'+(i+1)+'" class="'+(active===i+1?'active':'')+'">'+p.range+' · '+p.name+'</button>').join('');phaseButtons.querySelectorAll('button').forEach(b=>b.onclick=()=>{active=Number(b.dataset.p);renderPhases();render()})}
function render(){const list=DATA.weeks.map((w,i)=>({...w,index:i+1})).filter(w=>(!active||w.phase===active)&&JSON.stringify(w).toLowerCase().includes(query.toLowerCase()));weeks.innerHTML=list.map(w=>{const tasks=[...w.days,"恢复或补漏；如果没有遗留任务，从本周知识链接中任选 1 篇精读，并写 3 条摘要和 1 个问题。"],wd=tasks.filter((_,d)=>completed[w.index+"-"+(d+1)]).length,resources=DATA.phaseResources[w.phase-1];return '<article class="week '+(openWeeks.has(w.index)?'open':'')+'" data-week="'+w.index+'"><button class="summary"><span class="wn">W'+String(w.index).padStart(2,'0')+'</span><span><small>阶段 '+w.phase+' · '+dateLabel(w.index,0)+'—'+dateLabel(w.index,6)+'</small><h2>'+w.title+'</h2><p>'+w.goal+'</p></span><span class="score">'+wd+'/7</span></button><div class="body"><div class="output"><span>本周验收物</span><b>'+w.output+'</b></div><div class="resources">'+resources.map(r=>'<a href="'+r.url+'" target="_blank" rel="noreferrer">'+r.label+' ↗</a>').join('')+'</div><div class="days">'+tasks.map((t,d)=>{const id=w.index+'-'+(d+1),done=!!completed[id];return '<label class="day '+(done?'done':'')+'" data-id="'+id+'"><input type="checkbox" '+(done?'checked':'')+'><span class="check">'+(done?'✓':'')+'</span><span class="date">DAY '+String(d+1).padStart(2,'0')+'<span>周'+dayNames[d]+' · '+dateLabel(w.index,d)+'</span></span><span class="task">'+t+'<small>'+timePlan[d]+'</small><small class="accept">'+DATA.acceptancePlan[d]+'</small></span></label>'}).join('')+'</div></div></article>'}).join('')||'<div class="empty">没有匹配的周计划</div>';weeks.querySelectorAll('.summary').forEach(b=>b.onclick=()=>{const article=b.parentElement,index=Number(article.dataset.week);article.classList.toggle('open');article.classList.contains('open')?openWeeks.add(index):openWeeks.delete(index)});weeks.querySelectorAll('.day').forEach(el=>el.onchange=()=>{completed[el.dataset.id]=!completed[el.dataset.id];persist();updateProgress();render()})}
document.getElementById('unlockForm').onsubmit=e=>{e.preventDefault();if(document.getElementById('unlockInput').value==='020721'){sessionStorage.setItem('learning-log-unlocked','1');document.getElementById('offlineGate').style.display='none'}else document.getElementById('unlockError').textContent='密码不正确，请重试'};if(sessionStorage.getItem('learning-log-unlocked')==='1')document.getElementById('offlineGate').style.display='none';document.getElementById('startDate').value=startDate;document.getElementById('startDate').onchange=e=>{startDate=e.target.value;persist();render()};document.getElementById('search').oninput=e=>{query=e.target.value;render()};renderPhases();render();updateProgress();
</script></body></html>`;

const output = path.join(root, "AI编译器年度学习计划.html");
fs.writeFileSync(output, html, "utf8");
console.log(output);
