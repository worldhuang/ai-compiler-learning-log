import fs from 'node:fs';
import path from 'node:path';

const base = path.resolve(import.meta.dirname, '..');
const snapshot = JSON.parse(fs.readFileSync(path.join(base, 'data/guide-sources.json'), 'utf8'));
const aliases = JSON.parse(fs.readFileSync(path.join(base, 'data/guide-aliases.json'), 'utf8'));
const algorithm = JSON.parse(fs.readFileSync(path.join(base, 'data/algorithm-roadmap.json'), 'utf8'));

const supplement = {
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
  const outputs = [
    'MiniTensor 工程骨架、元数据、索引与 CTest',
    'RAII Storage、共享 View、naive matmul 与 Sanitizer',
    '泛型算子、CPU tiled/parallel matmul 与 v0.1',
    'CPU 访存/汇编/并发微实验与测量基线',
    '小型 Decoder reference、KV Cache 与 GPU 性能模型',
    'CUDA vector add、三版 transpose 与可靠计时',
    'reduction、stable softmax、LayerNorm 正确基线',
    'CUDA tiled GEMM、外部 Tensor Core 基线与性能证据',
    'Triton 三类算子、分块 attention reference 与小规模调参',
    '标量 autograd、PyTorch custom op 与非连续输入检查',
    'FX eval Conv+BN 折叠、ONNX 对照与安全图改写',
    'torch.compile 捕获、guard、graph break 与回归实验',
    '小型 IR/CFG/SSA、fold/DCE 与 verifier',
    'Toy 第 1–6 章运行、rewrite 与 lowering 测试',
    '固定版本 TVM 的 MLP 导入、编译与执行',
    'TIR baseline、GPU schedule 与有预算的调优',
    '两进程 DDP/collective、状态分片实验或明确标注的模拟',
    'KV 分页/批处理/前缀缓存模拟与推理指标',
    '项目 A RFC、三类 reference 与测试/benchmark 协议',
    'Softmax/RMSNorm 优化、PyTorch 接入与 dispatch',
    'RoPE、支持矩阵与统一性能报告（MLP 选修）',
    '项目 A mini Decoder 接入、干净复现与 v1.0',
    '项目 B 固定 RMSNorm+MLP 子图导入与三条基线',
    '项目 B RMSNorm TIR、GPU schedule 与重放测试',
    '项目 B 一个安全融合模式、有限 shape guard 与 fallback',
    '项目 B 外部 kernel、runtime 诊断与 Decoder 接入',
    '项目 B 20+ 图测试、三组 workload 与 v1.0',
    '真实 issue 最小复现、根因证据与贡献草稿',
    '两个项目复现审计、简历与源码演示',
    '模拟、查漏、投递材料与未完成项清单',
  ];
  const files = {
    2:'include/minitensor/storage.hpp · include/minitensor/tensor_view.hpp · src/operators.cpp · tests/test_storage.cpp · tests/test_matmul.cpp',
    5:'labs/transformer/attention.py · norms.py · decoder.py · kv_cache.py · tests/ · labs/gpu_microarch/device_info.py',
    9:'triton_kernels/add.py · softmax.py · rmsnorm.py · labs/attention/blocked_reference.py · tests/',
    10:'autograd/scalar.py · extensions/ · tests/test_autograd.py · tests/test_custom_op.py',
    13:'compiler_core/ir.py · cfg.py · interpreter.py · passes.py · tests/test_ir.py',
    14:'mlir-toy/ · saved_ir/ · tests/（按固定版本的 Toy 工程组织）',
    17:'distributed_labs/collective.py · ddp.py · memory_estimate.py · sharding_sim.py',
    18:'inference_labs/decoder_bench.py · paged_cache.py · scheduler.py · prefix_cache.py · tests/',
  };
  weeks.forEach((w,i)=>{w.output=outputs[i];if(files[i+1])w.fileHint=files[i+1];});
  weeks[1].title='MiniTensor II：Storage、View 与正确性基线';
  weeks[4].title='Transformer 最小实现与 GPU 基础';
  weeks[4].goal='先逐个实现 attention、norm、FFN、RoPE，再拼小 Decoder；用容量和算量理解 GPU 场景。';
  weeks[8].goal='以 Triton 算子与分块 attention reference 理解 DSL 和 IO；不要求本周自研完整 FlashAttention。';
  weeks[13].title='MLIR：Toy、Rewrite 与 Lowering';
  weeks[13].goal='用 Toy 的真实章节理解多层 IR 与 rewrite；tiny-gpu-compiler 是选修，不挤占主线。';
  weeks[17].title='推理基础：KV Cache、分页与调度';
  weeks[17].goal='用可运行模拟学会缓存和调度，再在可用硬件上检查真实引擎；量化和完整服务列选修。';
  weeks[18].goal='核心范围固定为 Softmax/RMSNorm/RoPE；工程化、测试、框架接入与性能证据优先。';
  weeks[20].title='项目 A：RoPE 与完整性能证据';
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
    return {kind: 'guide', title: source.title, heading: section.heading, sourceKey, line: section.line, url: source.url + '?plain=1#L' + section.line};
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
    if(fields.length!==4 || fields.some(x=>!x.trim())) throw new Error('Bad daily row '+(i+1));
    const [refs,knowledge,task,expected]=fields;
    const week=Math.floor(i/7)+1, day=i%7+1;
    const readings=refs.split(';').flatMap(resolveReading);
    const id=week+'-'+day;
    const kind=readings.some(r=>r.kind==='supplement')?'补充专题 / 配套实现':'原文概念 → 配套练习';
    return {id,week,day,globalDay:i+1,readings,knowledge:knowledge.split(';'),task,expected,
      kind,
      relation:readings.some(r=>r.kind==='supplement')
        ? 'AIInfraGuide 提供路线或基础；今日实现细节补充自官方材料。下方任务为学习计划设计，不是原文的章节标题或现成作业。'
        : '先读上方真实小节，再把这些概念用于下方练习。MiniTensor、CPU 实验和项目 A/B 是配套练习，不是原文提供的完整项目。',
      purpose:'通过「'+task+'」，掌握'+knowledge.split(';').join('、')+'，服务于本周目标：'+weeks[week-1].goal,
      bufferPolicy:day===7?'本日优先处理本周未完成的代码/难题；全部完成才做下面的巩固任务。若巩固任务顺延，保留未勾选，不把补课等同该任务完成。':null,
      files:weeks[week-1].fileHint,
      evidence:'docs/learning-log/W'+String(week).padStart(2,'0')+'-D'+String(day).padStart(2,'0')+'.md',
      algorithms:algorithms.days[i],
      minutes:{reading:35,coding:95,validation:30,evidence:10,algorithm:algorithms.days[i].length>1?90:algorithms.days[i].length?60:0,buffer:10},
      history:i<11?'保留历史：已完成则无需重做，只有原文定位被纠正。':null,
    };
  });
  return {revision:'2026-09-04-verified',checkedAt:snapshot.checkedAt,days,algorithms:{...algorithms,days:undefined}};
}
