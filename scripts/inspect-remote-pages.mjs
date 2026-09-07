import {execFileSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import fs from 'node:fs';
const baseline=JSON.parse(fs.readFileSync('tests/algorithm-baseline.json','utf8'));
for(const file of ['docs/index.html','docs/worldhaung_ai.html','index.html','worldhaung_ai.html']){
  let html=execFileSync('git',['show','origin/main:'+file],{encoding:'utf8',maxBuffer:5000000});
  const b=html.match(/const b="([A-Za-z0-9+/=]+)"/);
  if(b)html=gunzipSync(Buffer.from(b[1],'base64')).toString('utf8');
  const match=html.match(/const DATA=(\{[\s\S]*?\});\nconst dayNames/);
  if(!match){console.log(JSON.stringify({file,format:'legacy/no DATA',bytes:html.length}));continue;}
  const d=JSON.parse(match[1]);
  console.log(JSON.stringify({file,revision:d.curriculum?.revision,weeks:d.weeks?.length,days:d.curriculum?.days?.length,algorithmSame:JSON.stringify(d.curriculum?.days?.map(x=>({id:x.id,algorithms:x.algorithms})))===JSON.stringify(baseline)}));
}
