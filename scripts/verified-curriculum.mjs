import fs from 'node:fs';
import path from 'node:path';

const base = path.resolve(import.meta.dirname, '..');
const snapshot = JSON.parse(fs.readFileSync(path.join(base, 'data/guide-sources.json'), 'utf8'));
const aliases = JSON.parse(fs.readFileSync(path.join(base, 'data/guide-aliases.json'), 'utf8'));
const algorithm = JSON.parse(fs.readFileSync(path.join(base, 'data/algorithm-roadmap.json'), 'utf8'));

export const planMeta = JSON.parse(fs.readFileSync(path.join(base, 'data/inference-plan.json'), 'utf8'));

const supplement = {
  'ort': ['ONNX Runtime：Python · InferenceSession 与输入', 'https://onnxruntime.ai/docs/get-started/with-python.html'],
  'ort-quant': ['ONNX Runtime：Quantization · 静态量化、校准与调试', 'https://onnxruntime.ai/docs/performance/model-optimizations/quantization.html'],
  'ort-graph': ['ONNX Runtime：Graph Optimizations · 等级与优化图导出', 'https://onnxruntime.ai/docs/performance/model-optimizations/graph-optimizations.html'],
  'ort-cuda': ['ONNX Runtime：CUDA EP · 安装兼容性与配置', 'https://onnxruntime.ai/docs/execution-providers/CUDA-ExecutionProvider.html'],
  'onnx-export': ['PyTorch：ONNX · torch.export-based exporter / dynamic_shapes', 'https://docs.pytorch.org/docs/stable/onnx.html'],
  'tensorrt': ['TensorRT：Quick Start · ONNX 部署与 Runtime', 'https://docs.nvidia.com/deeplearning/tensorrt/latest/getting-started/quick-start-guide.html'],
  'tensorrt-python': ['TensorRT：Python API · Build / Deserialize / Execute', 'https://docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/python-api-docs.html'],
  'tensorrt-shapes': ['TensorRT：Working with Dynamic Shapes · profiles', 'https://docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/work-with-dynamic-shapes.html'],
  'vllm-quant': ['vLLM：Quantization · Supported Hardware', 'https://docs.vllm.ai/en/latest/features/quantization/'],
  'vllm-parallel': ['vLLM：Parallelism and Scaling · TP / 副本', 'https://docs.vllm.ai/en/latest/serving/parallelism_scaling/'],
  'vllm-metrics': ['vLLM：Production Metrics · 请求/队列/KV', 'https://docs.vllm.ai/en/latest/usage/metrics/'],
  'vllm-docker': ['vLLM：Using Docker · 镜像与容器运行', 'https://docs.vllm.ai/en/latest/deployment/docker/'],
  'vllm-bench': ['vLLM：bench serve · 指标、数据与参数', 'https://docs.vllm.ai/en/latest/cli/bench/serve/'],
  'vllm-apc': ['vLLM：Automatic Prefix Caching', 'https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/'],
  'hf-quant': ['Hugging Face：Bitsandbytes · 4/8-bit 加载与硬件要求', 'https://huggingface.co/docs/transformers/quantization/bitsandbytes'],
  'cuda-graphs': ['PyTorch：CUDA semantics · CUDA Graphs', 'https://docs.pytorch.org/docs/stable/notes/cuda.html#cuda-graphs'],
  'fastapi': ['FastAPI：Tutorial · 路由与请求校验（按今日范围）', 'https://fastapi.tiangolo.com/tutorial/'],
  'fastapi-stream': ['FastAPI：Custom Response · StreamingResponse', 'https://fastapi.tiangolo.com/advanced/custom-response/'],

  'triton-add': ['Triton 官方：Vector Addition', 'https://triton-lang.org/main/getting-started/tutorials/01-vector-add.html'],
  'triton-softmax': ['Triton 官方：Fused Softmax', 'https://triton-lang.org/main/getting-started/tutorials/02-fused-softmax.html'],
  'triton-norm': ['Triton 官方：Layer Normalization', 'https://triton-lang.org/main/getting-started/tutorials/05-layer-norm.html'],
  'triton-matmul': ['Triton 官方：Matrix Multiplication', 'https://triton-lang.org/main/getting-started/tutorials/03-matrix-multiplication.html'],
  fx: ['PyTorch 官方：torch.fx', 'https://docs.pytorch.org/docs/stable/fx.html'],
  compile: ['PyTorch 官方：torch.compiler', 'https://docs.pytorch.org/docs/stable/torch.compiler.html'],
  'torch-custom': ['PyTorch 官方：Custom Operators', 'https://docs.pytorch.org/tutorials/advanced/custom_ops_landing_page.html'],
  onnx: ['ONNX 官方：Overview', 'https://github.com/onnx/onnx/blob/main/docs/Overview.md'],
  llvm: ['LLVM 官方：Language Reference', 'https://llvm.org/docs/LangRef.html'],
  tvm: ['Apache TVM 官方源码与文档入口（跟随选定版本）', 'https://github.com/apache/tvm'],
  ...Object.fromEntries(Array.from({length: 6}, (_, i) => ['toy' + (i + 1), ['MLIR 官方：Toy Chapter ' + (i + 1), 'https://mlir.llvm.org/docs/Tutorials/Toy/Ch-' + (i + 1) + '/']])),
};

export function reviseWeeks(weeks) {
  if(weeks.length!==planMeta.weeks.length) throw new Error('Week count mismatch');
  weeks.forEach((w,i)=>Object.assign(w,planMeta.weeks[i]));
}

export function resolveReading(spec) {
  if (spec.startsWith('!')) {
    const entry = supplement[spec.slice(1)];
    if (!entry) throw new Error('Unknown supplement: ' + spec);
    return [{kind: 'supplement', title: entry[0], url: entry[1], heading: '官方补充材料：按今日知识点查阅；不是 AIInfraGuide 的详细小节', sourceKey: spec}];
  }
  const [alias, ranges] = spec.split('@');
  const sourceKey = aliases[alias];
  const source = snapshot.sources[sourceKey];
  if (!source || !ranges) throw new Error('Unknown source: ' + spec);
  return ranges.split(',').map(number => {
    const section = source.sections.find(s => s.heading === number || s.heading.match(/^(\d+(?:\.\d+)*)(?:[ .：:]|$)/)?.[1] === number);
    if (!section) throw new Error('Section not in verified source: ' + spec + ' → ' + number);
    return {kind: 'guide', title: source.title, heading: section.heading, sourceKey, line: section.line,
      overview:!!source.overview, anchor:section.anchor,
      url: source.websiteUrl + (section.anchor ? '#' + section.anchor : ''),
      sourceUrl: source.url + '?plain=1#L' + section.line,
      readingScope: source.overview ? '该页目前是简介/提纲；只读本页与今日主题相关的段落，不存在完整的编号小节正文。' : '从此标题读到下一个同级标题；不要求读整章。原文示例先运行，再做本计划配套练习。'};
  });
}

export function buildAlgorithmSchedule(hot100) {
  if (hot100.length !== 100 || new Set(hot100.map(p => p.match(/^LC\d+/)?.[0])).size !== 100) throw new Error('Hot100 must contain exactly 100 unique IDs');
  const days = Array.from({length: 210}, () => []);
  // Past work is not re-assigned and never automatically marked complete.
  days[10] = [{stage:'历史记录', title:'保留 W02-D04 实际完成的算法题，不重排已学内容', url:algorithm.source}];
  const stack = algorithm.remaining.filter(p => p.chapter === '栈与队列');
  if (stack.length !== 8 || !/232/.test(stack[1].title)) throw new Error('Stack chapter changed: review the plan');
  days[11] = stack.slice(0,2).map(p => ({...p, stage:'代码随想录'}));
  stack.slice(2).forEach((p,i) => days[12+i] = [{...p,stage:'代码随想录'}]);
  let cursor = 18;
  const remaining = algorithm.remaining.filter(p => p.chapter !== '栈与队列');
  for(let i=0;i<remaining.length;i+=2) days[cursor++] = remaining.slice(i,i+2).map(p=>({...p,stage:'代码随想录'}));
  // Reaching stacks does not prove earlier chapters are complete. Reserve
  // explicit verification/backfill slots, without resetting past checkboxes.
  for(let i=0;i<algorithm.prior.length;i+=2) days[cursor++] = algorithm.prior.slice(i,i+2).map(p=>({...p,stage:'前置章节漏题核对', instruction:'已有独立通过代码则复跑边界即可；没有则补做。不自动宣称之前学完。'}));
  const hotStart = cursor + 1;
  for (const [i, p] of hot100.entries()) days[cursor++] = [{id:'hot-' + p.match(/^LC(\d+)/)[1],stage:'Hot 100',title:(i+1)+'/100 · '+p,url:'https://leetcode.cn/problemset/',instruction:'在 LeetCode 按题号打开；即使随想录做过也独立再写一次。'}];
  if(cursor>210) throw new Error('Algorithm plan exceeds 30 weeks: '+cursor);
  while(cursor<210) {days[cursor] = [{stage:'错题二刷', title:'限时重写错题清单中最早未独立通过的一题；无错题则重写 LC146 LRU 缓存',url:'https://leetcode.cn/problemset/'}];cursor++;}
  return {days,scope:algorithm.scope,remainingCount:algorithm.remaining.length,priorCount:algorithm.prior.length,hotStart,hotEnd:hotStart+99};
}

export function buildCurriculum(weeks, hot100) {
  const lines = fs.readFileSync(path.join(base,'data/daily-plan.txt'),'utf8').split(/\r?\n/).filter(line=>line.trim() && !line.startsWith('#'));
  if(lines.length!==210) throw new Error('Expected 210 explicit days, found '+lines.length);
  const algorithms=buildAlgorithmSchedule(hot100);
  const days=lines.map((line,i)=>{
    const fields=line.split('|');
    if(![4,6].includes(fields.length) || fields.some(x=>!x.trim())) throw new Error('Bad daily row '+(i+1));
    const [refs,knowledge,task,expected,dailyFiles,purpose]=fields;
    const week=Math.floor(i/7)+1, day=i%7+1;
    const readings=refs.split(';').flatMap(resolveReading);
    const id=week+'-'+day;
    const kind=readings.some(r=>r.kind==='supplement')?'补充专题 / 配套实现':'原文概念 → 配套练习';
    return {id,week,day,globalDay:i+1,readings,knowledge:knowledge.split(';'),task,expected,
      kind,
      relation:readings.some(r=>r.kind==='supplement')
        ? 'AIInfraGuide 提供路线或基础；今日实现细节补充自官方材料。下方任务为学习计划设计，不是原文的章节标题或现成作业。'
        : '先读上方真实小节，再把这些概念用于下方练习。MiniTensor、CPU 实验和项目 A/B 是配套练习，不是原文提供的完整项目。',
      purpose:purpose || '通过「'+task+'」，掌握'+knowledge.split(';').join('、')+'，服务于本周目标：'+weeks[week-1].goal,
      bufferPolicy:day===7?'本日优先处理本周未完成的代码/难题；全部完成才做下面的巩固任务。若巩固任务顺延，保留未勾选，不把补课等同该任务完成。':null,
      files:(()=>{
        if(!dailyFiles)return weeks[week-1].fileHint;
        const projectRoot=dailyFiles.match(/^projects\/[^/]+\//)?.[0];
        return dailyFiles.split('；').map(p=>projectRoot&&!/^(projects\/|labs\/|docs\/learning-log\/)/.test(p)?projectRoot+p:p).join('；');
      })(),
      evidence:'docs/learning-log/W'+String(week).padStart(2,'0')+'-D'+String(day).padStart(2,'0')+'.md',
      algorithms:algorithms.days[i],
      minutes:(()=>{
        const algo=algorithms.days[i].length>1?90:algorithms.days[i].length?60:0;
        return day===7
          ? {reading:15,coding:30,validation:15,evidence:10,algorithm:algo,buffer:170-algo}
          : {reading:35,coding:165-algo,validation:20,evidence:10,algorithm:algo,buffer:10};
      })(),
      date:new Date(Date.UTC(2026,7,31+i)).toISOString().slice(0,10),
      history:i<14?'保留历史：已完成则无需重做，只有原文定位被纠正。':null,
    };
  });
  return {revision:planMeta.revision,checkedAt:snapshot.checkedAt,deadline:planMeta.deadline,lastCoreDate:planMeta.lastCoreDate,days,algorithms:{...algorithms,days:undefined}};
}
