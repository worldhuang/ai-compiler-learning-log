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
  const ids=Object.fromEntries(['weeks','signals','phaseButtons','unlockForm','unlockInput','unlockError','offlineGate','search','startDate','doneTop','percentTop','percentBig','doneBig','topBar'].map(id=>[id,element()]));
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
        assert.ok(r.url.endsWith('#L'+r.line));
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

test('actual renderer uses the explicit daily contract on every day',()=>{
  assert.doesNotThrow(()=>new Function(script));
  const {ctx,ids}=contextWithStorage();
  assert.equal((ids.weeks.innerHTML.match(/class="day /g)||[]).length,210);
  for(const day of data.curriculum.days){
    const result=vm.runInContext('guide({...DATA.weeks['+(day.week-1)+'],index:'+day.week+'},'+(day.day-1)+')',ctx);
    assert.equal(result.steps[1],'动手（约 95 分钟）：'+day.task);
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
