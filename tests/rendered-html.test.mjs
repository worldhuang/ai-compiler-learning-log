import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';
import test from 'node:test';

const html=await readFile(new URL('../worldhaung_ai.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)?.[1];
const data=JSON.parse(html.match(/const DATA=(\{[\s\S]*?\});\nconst dayNames/)[1]);
const snapshot=JSON.parse(await readFile(new URL('../data/guide-sources.json',import.meta.url),'utf8'));
const algorithm=JSON.parse(await readFile(new URL('../data/algorithm-roadmap.json',import.meta.url),'utf8'));

function contextWithStorage(saved={}) {
  const element=()=>({innerHTML:'',textContent:'',value:'',style:{},append(){},insertAdjacentElement(){},querySelectorAll(){return []}});
  const ids=Object.fromEntries(['weeks','signals','phaseButtons','unlockForm','unlockInput','unlockError','offlineGate','search','startDate','doneTop','percentTop','percentBig','doneBig','topBar','timingNotice'].map(id=>[id,element()]));
  const storage=new Map([['ai-compiler-standalone-v3',JSON.stringify(saved)]]);
  const localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
  const ctx=vm.createContext({...ids,document:{head:element(),createElement:element,querySelector:element,getElementById:id=>ids[id]},localStorage,sessionStorage:{getItem(){},setItem(){}},console});
  vm.runInContext(script,ctx);
  return {ctx,ids,storage};
}

test('210 explicit day records: stable IDs, real sections, no guessed weekday contracts',()=>{
  assert.equal(data.weeks.length,30);
  assert.equal(data.curriculum.days.length,210);
  assert.equal(new Set(data.curriculum.days.map(d=>d.id)).size,210);
  assert.ok(data.weeks.every(w=>w.days.length===7));
  for(const [i,d] of data.curriculum.days.entries()){
    assert.equal(d.globalDay,i+1);
    assert.equal(d.id,Math.floor(i/7)+1+'-'+(i%7+1));
    assert.ok(d.task.length>10 && d.expected.length>15);
    assert.ok(d.knowledge.length>=2 && d.files && d.evidence);
    assert.ok(d.readings.length);
    for(const r of d.readings){
      if(r.kind==='guide'){
        assert.ok(snapshot.sources[r.sourceKey].sections.some(s=>s.heading===r.heading&&s.line===r.line),r.heading);
        assert.ok(r.sourceUrl.endsWith('#L'+r.line));
        assert.ok(r.anchor, 'Exact website heading anchor required: '+r.heading);
        assert.equal(r.url,snapshot.sources[r.sourceKey].websiteUrl+'#'+r.anchor);
        assert.equal(snapshot.sources[r.sourceKey].websiteCheckedAt,'2026-09-07');
        assert.doesNotMatch(r.heading,/storage\/view 的内存布局/);
      } else assert.match(r.heading,/不是 AIInfraGuide/);
    }
    if(i>=11)assert.ok(d.algorithms.length>=1 && d.algorithms.length<=2);
  }
  assert.doesNotMatch(script,/const isMeasure|const detailedTopics|function dayTopic/);
});

test('storage/view correction and pacing at current progress are explicit',()=>{
  const view=data.curriculum.days[10],now=data.curriculum.days[11];
  assert.ok(view.readings.some(r=>r.sourceKey==='PyTorch框架入门' && r.heading.startsWith('1.2 ')));
  assert.ok(view.readings.some(r=>r.sourceKey==='第1章-编程语言基础' && r.heading.startsWith('4.5 ')));
  assert.match(view.relation,/配套练习/);
  assert.match(now.task,/只实现 naive CPU matmul/);
  assert.match(now.expected,/58,64/);
  assert.match(now.algorithms[1].title,/232/);
  assert.match(data.curriculum.days[12].algorithms[0].title,/225/);
  assert.match(data.curriculum.days[13].algorithms[0].title,/20/);
  assert.match(data.curriculum.days[0].task,/CMake/);
  assert.match(data.curriculum.days[0].expected,/今天不做性能测试/);
  assert.ok(!data.curriculum.days.filter(d=>d.day===6).some(d=>/问答|复述.*问题/.test(d.task)));
});

test('Carl main directory is fully scheduled before 100 distinct Hot100 entries',()=>{
  const all=data.curriculum.days.flatMap(d=>d.algorithms);
  const carl=all.filter(p=>p.stage==='代码随想录');
  const prior=all.filter(p=>p.stage==='前置章节漏题核对');
  assert.deepEqual(carl.map(p=>p.id),algorithm.remaining.map(p=>p.id));
  assert.deepEqual(prior.map(p=>p.id),algorithm.prior.map(p=>p.id));
  const hot=all.filter(p=>p.stage==='Hot 100');
  assert.equal(hot.length,100);
  assert.equal(new Set(hot.map(p=>p.id)).size,100);
  assert.equal(data.curriculum.algorithms.hotStart,108);
  assert.equal(data.curriculum.algorithms.hotEnd,207);
  const firstHot=data.curriculum.days.findIndex(d=>d.algorithms.some(p=>p.stage==='Hot 100'));
  assert.ok(!data.curriculum.days.slice(firstHot).some(d=>d.algorithms.some(p=>p.stage==='代码随想录'||p.stage==='前置章节漏题核对')));
});

test('algorithm schedule is byte-for-byte equivalent per day to the previous version',async()=>{
  const baseline=JSON.parse(await readFile(new URL('./algorithm-baseline.json',import.meta.url),'utf8'));
  assert.deepEqual(data.curriculum.days.map(d=>({id:d.id,algorithms:d.algorithms})),baseline);
});

test('deadline, daily capacity and weekly catch-up time are explicit',()=>{
  assert.equal(data.curriculum.days[0].date,'2026-08-31');
  assert.equal(data.curriculum.days.at(-1).date,'2027-03-28');
  assert.equal(data.curriculum.deadline,'2027-03-31');
  for(const d of data.curriculum.days){
    assert.equal(Object.values(d.minutes).reduce((a,b)=>a+b,0),240,d.id);
    if(d.day===7){assert.ok(d.minutes.buffer>=80,d.id);assert.equal(d.minutes.coding,30);}
    if(d.week>2){assert.ok(d.purpose.length>15);assert.ok(d.files.includes('.'));}
    assert.ok(d.readings.some(r=>r.kind==='guide'),d.id);
  }
});

test('inference dependencies precede projects and hardware extensions are honest',()=>{
  const w=n=>data.curriculum.days.filter(d=>d.week===n);
  assert.match(w(4).map(d=>d.task).join(' '),/MLP/);
  assert.match(w(6).map(d=>d.task).join(' '),/KV Cache/);
  assert.match(w(12).map(d=>d.task).join(' '),/ONNX/);
  assert.match(w(13).map(d=>d.task).join(' '),/TensorRT/);
  assert.match(w(14).map(d=>d.task).join(' '),/量化/);
  assert.match(w(15).map(d=>d.task).join(' '),/vLLM/);
  assert.match(data.weeks[18].title,/项目 A/);
  assert.match(data.weeks[23].title,/项目 B/);
  assert.match(w(22)[4].expected,/CPU 模拟结果绝不标成双卡吞吐/);
  assert.match(w(26)[3].expected,/不宣称在 HF 模型中融合/);
  assert.equal(data.phases.length,6);
  assert.ok(data.weeks.every(w=>data.phases[w.phase-1]));
  assert.doesNotMatch(data.curriculum.days.map(d=>d.task).join(' '),/用两进程.*DDP|本周.*FSDP/);
  assert.doesNotMatch(script,/W17 做 collective\/DDP|量化是选修|Transformer 子图编译器/);
});

test('a changed start date reports a missed deadline without resetting completion',()=>{
  const {ctx,ids}=contextWithStorage({completed:{'2-5':true},startDate:'2026-10-01'});
  assert.match(ids.timingNotice.textContent,/晚于4月前目标/);
  assert.equal(vm.runInContext('completed["2-5"]',ctx),true);
});

test('actual renderer uses the explicit daily contract on every day',()=>{
  assert.doesNotThrow(()=>new Function(script));
  const {ctx,ids}=contextWithStorage();
  assert.equal((ids.weeks.innerHTML.match(/class="day /g)||[]).length,210);
  for(const day of data.curriculum.days){
    const result=vm.runInContext('guide({...DATA.weeks['+(day.week-1)+'],index:'+day.week+'},'+(day.day-1)+')',ctx);
    assert.equal(result.steps[1],'动手（约 '+day.minutes.coding+' 分钟）：'+day.task);
    assert.equal(result.done[0],day.expected);
    const learning=vm.runInContext('learning({...DATA.weeks['+(day.week-1)+'],index:'+day.week+'},'+(day.day-1)+')',ctx);
    assert.deepEqual(Array.from(learning.points),day.knowledge);
  }
  assert.match(ids.weeks.innerHTML,/58,64/);
  assert.match(ids.weeks.innerHTML,/栈与队列/);
});

test('history and expansion state are not reset by rerender or persistence',()=>{
  const {ctx,storage}=contextWithStorage({completed:{'1-1':true,'2-2':true},subtasks:{'2-2-step-0':true},startDate:'2026-08-31'});
  vm.runInContext('openWeeks.add(2);openDays.add("2-5");completed["2-5"]=true;persist();render()',ctx);
  assert.equal(vm.runInContext('openWeeks.has(2)&&openDays.has("2-5")',ctx),true);
  assert.equal(vm.runInContext('completed["1-1"]&&completed["2-2"]',ctx),true);
  assert.equal(JSON.parse(storage.get('ai-compiler-standalone-v3')).completed['2-5'],true);
});

test('local, public, root Pages and docs Pages have exactly the same payload',async()=>{
  assert.equal(await readFile(new URL('../public/worldhaung_ai.html',import.meta.url),'utf8'),html);
  assert.equal(await readFile(new URL('../docs/worldhaung_ai.html',import.meta.url),'utf8'),html);
  for(const p of ['../index.html','../docs/index.html']){
    const wrapper=await readFile(new URL(p,import.meta.url),'utf8');
    const encoded=wrapper.match(/const b="([A-Za-z0-9+/=]+)"/)[1];
    assert.equal(gunzipSync(Buffer.from(encoded,'base64')).toString('utf8'),html);
  }
});

test('production server redirects to the validated standalone page',async()=>{
  const {default:worker}=await import('../dist/server/index.js');
  const res=await worker.fetch(new Request('http://localhost/',{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});
  assert.equal(res.status,307);
  assert.equal(res.headers.get('location'),'http://localhost/worldhaung_ai.html');
});
