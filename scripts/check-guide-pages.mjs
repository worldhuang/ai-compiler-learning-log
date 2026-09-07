import fs from 'node:fs';
const snapshot=JSON.parse(fs.readFileSync('data/guide-sources.json','utf8'));
const items=Object.values(snapshot.sources);
const results=[];
let cursor=0;
await Promise.all(Array.from({length:4},async()=>{
  while(cursor<items.length){
    const s=items[cursor++];
    try{
      const res=await fetch(s.websiteUrl,{signal:AbortSignal.timeout(30000)});
      const html=await res.text();
      const headings=[...html.matchAll(/<h[1-6][^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h[1-6]>/g)].map(m=>({id:m[1],text:m[2].replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').trim()}));
      results.push({path:s.path,url:s.websiteUrl,status:res.status,headings});
    }catch(e){results.push({path:s.path,url:s.websiteUrl,error:e.message});}
  }
}));
console.log(JSON.stringify(results));
if(results.some(r=>r.status!==200||!r.headings?.length))process.exitCode=1;
