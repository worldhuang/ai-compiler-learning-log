"use client";

import { useEffect, useMemo, useState } from "react";

type Week = {
  phase: number;
  title: string;
  goal: string;
  output: string;
  days: string[];
  resourceWeek?: number;
  files?: string;
  knowledge?: string[];
};

type DailyGuide = {
  workspace: string;
  files: string;
  purpose: string;
  knowledgePoints: string[];
  source: GuideReference;
  steps: string[];
  command: string;
  doneWhen: string[];
};

type GuideReference = {
  title: string;
  url: string;
  readingGoal: string;
};

const phases = [
  { name: "MiniTensor · CPU 性能基础", range: "W01–W04", color: "#ef6a4c" },
  { name: "Transformer · GPU · CUDA", range: "W05–W09", color: "#e6a83e" },
  { name: "框架 · 编译器 · 推理基础", range: "W10–W18", color: "#3c86c6" },
  { name: "简历项目 A · GPU 算子库", range: "W19–W22", color: "#7e62c7" },
  { name: "简历项目 B · 编译器 · 秋招", range: "W23–W30", color: "#249577" },
];

const legacyWeeks: Week[] = [
  { phase:1,title:"MiniTensor I：工程骨架与张量接口",goal:"不再按语法章节重学 C++；从一个可运行的张量项目中按需找回类型、函数、引用、类、STL 与构建知识",output:"minitensor 仓库骨架 + Tensor<float> 接口 + 8 个测试",days:["创建 include/src/tests/benchmarks 目录；用 CMake 构建 library、demo 与 test target","设计 Shape、Stride、DType 与 Tensor 接口；用 vector/span/const reference 表达参数","实现 numel、连续 stride、边界检查和打印；补齐循环、函数、namespace 与异常知识","实现一维/二维索引和 fill；用 debugger 跟踪一次构造与索引调用","接入 GoogleTest，覆盖空 shape、越界、零维和普通矩阵；开启 warnings-as-errors","直达视频章节学习数组、函数、引用与类；只补项目当天卡住的语法"]},
  { phase:1,title:"MiniTensor II：Storage、RAII 与视图",goal:"通过真实 storage/view 设计掌握栈/堆、所有权、智能指针、拷贝移动与对象生命周期",output:"Storage<T> + Tensor<T> + reshape/view + ASan 全绿",days:["画 Storage/Tensor/View 所有权图；实现模板 Storage<T> 连续分配与 RAII 释放","实现深拷贝、移动构造和移动赋值；打印验证资源转移并解释 std::move 不等于移动","用 shared_ptr<Storage<T>> 让 view 共享底层数据；处理 offset、shape 与 stride","实现 reshape、transpose view 与 contiguous 判断；补悬空引用和别名测试","开启 ASan/UBSan，主动制造 use-after-free、越界和 double free 后逐一修复","直达 new/delete、构造析构、深浅拷贝章节；对照项目写一页 Rule of Five 说明"]},
  { phase:1,title:"MiniTensor III：模板、算子与测试体系",goal:"用 add/mul/matmul 的泛型实现恢复模板、STL、算法、运算符重载与异常安全",output:"add/mul/naive matmul + 25 个测试 + clang-format",days:["把 Tensor 固化为 Tensor<T>；约束支持类型并处理模板声明/定义位置","实现逐元素 add/mul 与标量运算；用 algorithm/ranges 替换重复循环","实现最小二维广播与 shape 校验；写参数化测试覆盖 float/double","实现 naive matmul，和手算/Python 参考值对齐；定义误差阈值","加入 clang-format、CTest 和 Debug/Release preset；检查 include 边界与命名","直达类模板、vector 与深浅拷贝章节；对照 xtensor 的 API 写 5 条设计取舍"]},
  { phase:1,title:"MiniTensor IV：线程池、基准与 v0.1",goal:"在同一项目里补齐并发、性能测量和发布能力，形成后续 CPU/CUDA 实验的统一载体",output:"MiniTensor v0.1：并行 matmul + benchmark 报告 + README",days:["实现阻塞任务队列与固定线程池，覆盖停止、空队列和异常传播","把 matmul 按输出行分块并行；比较 1/2/4/8 线程扩展性","接入 Google Benchmark，固定 warmup、重复、P50 与硬件信息","用 profiler 定位热点；记录优化前后数据，不做无证据微优化","整理 README：架构图、构建命令、测试、benchmark、限制与路线图","录制 6 分钟项目讲解并打 v0.1 tag；C++ 集中复习到此结束"]},
  { phase:1,title:"机器表示、汇编与链接",goal:"从 MiniTensor 的 C++ 源码追到汇编，理解整数、浮点、栈帧和链接",output:"6 个 C++/汇编对照案例 + 构建链路图",days:["CSAPP 数据表示：整数溢出、补码和浮点误差实验","学习 x86-64 寄存器、调用约定与栈帧","用 Compiler Explorer 比较 MiniTensor 核心循环的 -O0/-O3 汇编","观察 move、内联、虚函数和模板实例化的生成代码","追踪预处理、编译、汇编、链接与静态/动态库产物","直达 CSAPP 数据表示、机器级代码与链接章节并手算一次栈帧"]},
  { phase:1,title:"CPU Cache 与数据局部性",goal:"让张量 layout 与硬件缓存建立联系，形成可测量的局部性直觉",output:"stride/transpose/tile 微基准报告",days:["学习 L1/L2/L3、cache line、组相联、TLB 与工作集","在 MiniTensor 写 stride sweep 和行/列优先遍历 benchmark","实现 blocked transpose 并扫描 tile size","用缓存计数器或 profiler 观察 miss 与带宽变化","把 shape/stride/view 的代价写进项目文档","直达 CSAPP 存储层次章节；画出访问模式→cache miss→延迟的因果链"]},
  { phase:1,title:"流水线、分支与 SIMD",goal:"掌握编译器优化、分支预测、自动向量化和 intrinsic 的适用边界",output:"branch/SIMD benchmark + 向量化报告",days:["学习流水线、数据相关、分支预测与乱序执行","比较 sorted/unsorted 分支和 branchless 写法","让 add/dot 自动向量化并读取 vectorization report","查看 AVX2/AVX-512 intrinsic，手写一版 vector add","检查尾部处理、对齐和不同规模下的性能","直达程序性能优化章节；用汇编解释一次加速和一次退化"]},
  { phase:1,title:"并发、原子与 False Sharing",goal:"深化线程、锁、条件变量、happens-before 与缓存一致性，而非重复造线程池",output:"线程池 v2 + false-sharing 实验",days:["审计 MiniTensor 线程池的竞态、停止协议和异常传播","学习 C++ memory model、happens-before 与 atomic 基础","构造 false sharing，padding 后对比吞吐","实现 work partitioning，比较静态分块与动态任务粒度","用 TSan/代码审查验证 5 条并发不变量","直达 CSAPP 并发章节；画任务队列的同步时序图"]},
  { phase:1,title:"内存分配器 I：块布局与合并",goal:"理解对齐、碎片、隐式空闲链表与堆不变量，并连接到 Tensor storage",output:"implicit free-list allocator + heap checker",days:["定义块头、块脚、对齐和 prologue/epilogue","实现 heap 初始化、extend_heap 与 first-fit","实现 malloc 放置和块分割","实现 free 与相邻块合并","写 heap checker 和 6 组边界 trace","把分配器接入 MiniTensor 的可选 Storage 后端并测正确性"]},
  { phase:1,title:"内存分配器 II：分离链表",goal:"用显式/分离链表提升分配性能并理解空间—时间权衡",output:"segregated allocator + 碎片分析",days:["实现显式双向空闲链表插入/删除并维护不变量","设计 size class，迁移到 segregated free list","补对齐、重复块、未合并和链表一致性检查","设计 Tensor 常见尺寸的 allocation trace","比较系统 malloc 与两版 allocator 的吞吐和利用率","精读 mimalloc 的 size class/segment 设计并写差异表"]},
  { phase:1,title:"可信性能工程方法",goal:"掌握 warmup、重复、方差、P50/P95、roofline 与 profiler 证据链",output:"统一 benchmark harness + 性能实验模板",days:["统一环境、随机种子、输入 shape、线程数和计时边界","实现 warmup、重复、P50/P95 与异常值输出","区分延迟、吞吐、带宽、FLOPS 和利用率指标","用 profiler/硬件计数器定位一个 MiniTensor 热点","写一份可复现实验模板：问题→假设→实验→数据→结论","直达 CSAPP 程序优化章节；复查三组旧数据并纠正测量陷阱"]},
  { phase:1,title:"MiniTensor CPU Runtime：性能验收",goal:"把前 11 周知识收束回同一工程，为 CUDA 阶段提供可靠 CPU baseline",output:"MiniTensor v0.2：tiled/parallel matmul + allocator + 完整性能报告",days:["冻结 Tensor/Storage/Operator/ThreadPool/Allocator 模块边界与测试矩阵","实现 naive、tiled、parallel matmul 三版本并校验","扫描 tile、线程数和 shape，输出性能曲线","用 profiler/计数器解释瓶颈从访存到计算的迁移","与 Eigen 或 PyTorch CPU 做诚实 baseline，写限制和下一步","发布 v0.2：架构图、复现脚本、测试结果、性能图与口头讲解"]},
  { phase:2,title:"CUDA 编程模型",goal:"掌握 grid/block/thread、host/device 与错误检查",output:"vector add + 带宽基准",days:["确认 GPU/驱动/CUDA 环境；记录设备规格","学习 SIMT、warp、grid/block 映射","写 vector add kernel 与 CPU 对照测试","加入 grid-stride loop 和统一错误检查宏","测 H2D/D2H/kernel 时间与有效带宽","Nsight Systems 观察时间线并输出截图"]},
  { phase:2,title:"CUDA 内存层次",goal:"理解 coalescing、shared memory 与 bank conflict",output:"三版 transpose kernel",days:["学习 global/shared/register/constant memory","写 naive transpose，检查 global load/store 合并","写 tiled shared-memory transpose","制造并消除 bank conflict（padding）","用 Nsight Compute 看吞吐与相关指标","整理三版结果和瓶颈迁移解释"]},
  { phase:2,title:"矩阵乘法 I",goal:"从 naive GEMM 到 shared-memory tiling",output:"正确、可测的 tiled GEMM",days:["定义 M/N/K、多尺寸和误差容限测试矩阵","写 naive GEMM 与边界保护","实现 shared-memory tiled GEMM","处理非 tile 整倍数与多数据类型测试","用 CUDA Events 正确计时并算 GFLOPS","对比 cuBLAS baseline，解释差距而非追平"]},
  { phase:2,title:"矩阵乘法 II：Tensor Core、寄存器分块与 Occupancy",goal:"理解寄存器分块、占用率、低精度累加和 Tensor Core 路径的工程取舍",output:"GEMM v2 + FP16/BF16 正确性矩阵 + Tensor Core 路径报告",days:["学习 occupancy、寄存器压力、launch 配置与 Tensor Core 的输入/累加精度约束","实现每线程多输出的寄存器分块","为 FP16/BF16 输入与 FP32 累加写正确性测试；用 CUTLASS 或 WMMA 跑通一条 Tensor Core 对照路径","尝试向量化 load/store，检查对齐、尾部和 fallback","查看 SASS/PTX 和编译器资源报告，确认 Tensor Core 路径是否真正生成","扫描 block/tile/dtype 参数，写 roofline 判断并解释算力受限还是带宽受限"]},
  { phase:2,title:"归约与 Softmax",goal:"掌握 warp primitive 与数值稳定性",output:"reduce + online softmax kernels",days:["写多 block sum reduction 基线","用 shared memory 优化归约","用 warp shuffle 完成 warp/block reduce","实现稳定 softmax（减 max）并测误差","实现 online softmax 思路并比较访存","与 PyTorch baseline 比较多种行宽"]},
  { phase:2,title:"LayerNorm Kernel",goal:"融合统计、归一化和仿射操作",output:"手写 CUDA LayerNorm v1",days:["推导 LayerNorm、Welford 与误差来源","写标量/naive CUDA baseline","用 block reduce 合并均值与方差计算","融合 gamma/beta，优化读写次数","覆盖 128–8192 hidden size 并剖析","发布独立 benchmark 和性能折线图"]},
  { phase:2,title:"Triton 对照实验",goal:"理解高层 kernel DSL 与 CUDA 的权衡",output:"Triton LayerNorm/Softmax 对照",days:["完成 Triton vector add 教程并看生成结构","写 Triton softmax，校验数值","写 Triton LayerNorm 或复现官方实现","做 CUDA/Triton/PyTorch 三方基准","比较开发成本、可移植性与性能","整理 10 个 CUDA 高频面试问题"]},
  { phase:2,title:"CUDA 阶段项目",goal:"形成可展示的 kernel 优化故事",output:"cuda-kernels v1 + 8 分钟讲解",days:["统一 benchmark harness 与设备信息输出","补齐 GEMM/Softmax/LayerNorm 测试矩阵","做 Nsight Systems 全局定位","做 Nsight Compute 单 kernel 深挖","重跑稳定数据并生成图表/结论","录制讲解：问题→基线→优化→证据→限制"]},
  { phase:3,title:"PyTorch 执行链：Autograd、Dispatcher、Extension 与 DDP",goal:"理解 Tensor、算子注册、反向图和调度；用一个最小实验认识 DDP 的梯度 AllReduce 边界",output:"mini autograd + dispatcher 调研图 + 2 进程 DDP trace",days:["复习 Tensor storage/stride/view 与广播，区分单卡张量和多进程 rank 的职责","手写标量/小张量 autograd 拓扑排序","实现 add/mul/matmul backward 并梯度检查","阅读 PyTorch dispatcher 官方说明/代码入口","写 C++/CUDA extension 最小算子","用 torchrun 启动 2 个 CPU/Gloo 进程训练小网络，打印 rank、梯度同步前后值与 AllReduce 时机；写清 DDP 不解决什么"]},
  { phase:3,title:"FX 与图变换",goal:"能捕获、检查、改写并验证计算图",output:"FX Conv-BN-ReLU 融合原型",days:["学习 FX symbolic_trace、Graph、GraphModule","打印 ResNet 子图并理解 node 元数据","写模式匹配：Conv→BN→ReLU","实现 eval 模式 BN folding 或安全替换","做数值一致性与多输入 shape 测试","统计节点数和 latency，写 Pass 设计说明"]},
  { phase:3,title:"ONNX 与模型可移植性",goal:"理解 IR、shape inference 和模型检查",output:"ResNet50 ONNX 分析包",days:["学习 ONNX protobuf、opset、initializer/value_info","导出 ResNet50，运行 checker/shape inference","用 ONNX Runtime 对齐 PyTorch 输出","用 Netron 观察结构并统计 op 分布","写脚本做一次安全图改写/常量折叠","输出导出失败与动态 shape 排错清单"]},
  { phase:3,title:"torch.compile 总览",goal:"理解 Dynamo→AOTAutograd→Inductor 的分层",output:"编译栈一页图 + 10 个实验",days:["跑 torch.compile quickstart，区分冷启动/稳态","用 explain/export 观察捕获图与 guards","制造 graph break 并定位原因","测试 dynamic shapes 与 recompilation","比较 eager/compile 的时间和显存","画全栈数据流并解释每层职责"]},
  { phase:3,title:"TorchDynamo 深入",goal:"理解 Python bytecode 捕获、guards 与 graph breaks",output:"Dynamo 调试手册",days:["阅读 Dynamo 架构与 frame evaluation 概念","观察简单函数 bytecode 与 FX graph 对应","实验数据依赖控制流和 Python side effect","实验 guard 失败与缓存重编译","用日志定位 5 类 graph break 并修复","整理可复制的最小复现模板"]},
  { phase:3,title:"AOTAutograd、分解与 FSDP 边界",goal:"理解前后向联合捕获和 operator decomposition；用最小实验区分 DDP 与参数/梯度分片",output:"前/后向图解剖报告 + DDP/FSDP 对照笔记",days:["复习 autograd tape 与 saved tensor","导出训练函数并观察 forward/backward graph","比较 functionalization 前后 mutation/view","追踪一个复合算子的 decomposition","写一个自定义 decomposition 小实验","运行官方 FSDP 最小示例（无多卡时用 CPU/Gloo 只观察语义），画 DDP 与 FSDP 的参数、梯度、optimizer state 分布图；不把它包装成集群性能结论"]},
  { phase:3,title:"Inductor 与 Triton Codegen",goal:"从 FX graph 追到生成 kernel",output:"generated-code 注释样例",days:["保存 Inductor 生成代码与缓存目录","选 pointwise fusion 案例逐行标注","选 reduction 案例观察调度与 autotune","修改输入 shape 看代码和 guard 如何变化","对照 Triton 手写版本做性能/代码比较","写《一次 torch.compile 性能回归怎么查》"]},
  { phase:3,title:"自定义后端与 Pass",goal:"实现可插拔 backend 和图级优化",output:"mini torch.compile backend",days:["实现接收 FX GraphModule 的 eager backend","加入图打印、计时和 fallback","在 backend 前执行常量/冗余算子简化","处理 unsupported op 与动态 shape 边界","构造 8 个正确性/回归测试","发布 PyTorch compiler-playground"]},
  { phase:3,title:"融合项目升级",goal:"把 FX 原型变成可复现项目",output:"fusion-pass v1 + benchmark dashboard",days:["明确支持条件：eval/train、dtype、shape","补图模式匹配的负例与回退策略","覆盖 ResNet18/50 的子图测试","用 profiler 证明 kernel launch/访存变化","在不同 batch 测 eager/compile/custom pass","写项目文档与 12 个面试追问答案"]},
  { phase:3,title:"简历项目 A 立项：GPU 算子库",goal:"从 3 月开始把前期 CUDA Lab 合并为完整工程，而不是新增小 Demo",output:"项目 RFC、支持矩阵、仓库骨架与 benchmark 协议",days:["确定项目问题、目标用户、非目标和验收指标","设计 operators/backend/tests/benchmarks/docs 目录","冻结硬件、软件版本、输入 shape 与精度阈值","迁移前期 Softmax/LayerNorm/GEMM 并保留演进历史","建立 PyTorch/CUTLASS/Triton baseline 与结果格式","精读成熟算子库的测试、benchmark 与发布结构"]},
  { phase:4,title:"项目 A：Softmax 与 RMSNorm 工程化",goal:"将课堂 kernel 升级为支持多 shape/dtype 的可维护组件",output:"Softmax/RMSNorm v1 + correctness matrix",days:["重构 API、dispatch 和错误检查","覆盖 FP32/FP16、非对齐 shape 与极值输入","实现 naive/shared/warp/Triton 多版本","加入自动正确性、数值误差与回归测试","用 Nsight 解释访存、occupancy 和瓶颈迁移","精读 FlashAttention/Triton 中的归约实现"]},
  { phase:4,title:"项目 A：GEMM 与 Transformer MLP",goal:"将 GEMM、bias、activation 组合成真实 Transformer 热点",output:"GEMM/MLP benchmark suite",days:["定义 M/N/K 与 Transformer 典型 shape 集","整理 tiled/register-blocked GEMM 实现","实现 bias+GELU/SwiGLU epilogue fusion","对比 cuBLAS/CUTLASS/Triton 并控制变量","分析小矩阵、大矩阵和不同 dtype 的性能差异","精读 CUTLASS mainloop 与 epilogue 设计"]},
  { phase:4,title:"项目 A：RoPE、Attention、KV Cache 与量化",goal:"覆盖 LLM 推理中的布局、融合、IO 与低精度容量取舍",output:"RoPE/attention hotspot kernels + KV Cache/量化 IO 分析",days:["实现 RoPE reference 与 CUDA/Triton kernel","推导 prefill/decode shape、KV cache 字节数与 FP16/INT8 容量上限","实现小型 fused attention 或关键子算子","比较连续与分页 KV 布局的访问代价","用 Roofline/Nsight 解释热点而非只报加速比","完成一个 weight-only INT8 或 KV Cache 量化的最小对照实验，记录误差、显存节省和不适用条件"]},
  { phase:4,title:"项目 A：PyTorch / vLLM 接入",goal:"证明算子库能进入真实框架调用链",output:"PyTorch custom op + vLLM 可选集成 demo",days:["用 torch.library/C++ extension 注册自定义算子","加入 fake/meta kernel 和 torch.compile 兼容检查","实现能力判断、fallback 与异常诊断","接入 mini Transformer 或 vLLM 单个 custom op","对比单 kernel 收益与端到端收益","精读 PyTorch custom op 与 vLLM 调用链"]},
  { phase:4,title:"项目 A 封版：GPU Operator Library",goal:"形成第一个可写简历、可被陌生人复现的主项目",output:"gpu-operator-lab v1.0 + 性能报告 + 10 分钟讲解",days:["冻结 API、支持矩阵、环境与一键运行脚本","跑全量 correctness/performance regression","生成跨 shape/dtype 性能图和失败案例","补架构图、优化演进、限制与复现说明","邀请他人按 README 复现并修复全部阻塞项","精读核心实现并准备 20 个源码追问"]},
  { phase:4,title:"项目 B 立项：Transformer 子图编译器",goal:"从 4 月中旬启动端到端编译器主项目",output:"编译器 RFC + PyTorch/ONNX→Relax 最小链路",days:["冻结支持的 Transformer 子图与非目标","从源码构建 TVM 并锁定版本","学习 IRModule、Relax、TensorIR 与 Runtime 分层","导入 MLP/RMSNorm 子图并保存规范化 IR","建立 eager/torch.compile/TVM baseline","精读 TVM 端到端编译流程与关键入口"]},
  { phase:4,title:"项目 B：TensorIR Lowering 与 GPU Schedule",goal:"从高层算子降到可解释、可优化的 GPU PrimFunc",output:"Matmul/RMSNorm/Softmax TIR schedule 库",days:["用 TVMScript 写三个正确 baseline","应用 split/reorder/cache_read/cache_write","完成 block/thread 绑定和 cooperative fetch","加入归约、向量化与寄存器分块","对照项目 A kernel 与生成代码做性能分析","精读 schedule legality 与生成 CUDA"]},
  { phase:4,title:"项目 B：Relax 融合 Pass",goal:"实现可靠的模式匹配、融合、回退与结构验证",output:"Transformer fusion pipeline + 20 个图测试",days:["用 DPL 描述 MLP/RMSNorm/attention 模式","实现匹配、重写和前后 IR 保存","加入 dtype/layout/shape 支持矩阵","实现 unsupported op 与混合子图 fallback","验证数值、kernel 数和访存变化","精读 FuseOps/FuseTIR 与 dataflow rewrite"]},
  { phase:4,title:"项目 B：动态 Shape 与 MetaSchedule",goal:"处理真实 batch/sequence 变化并构建可复现调优流程",output:"动态 shape 策略 + tuning database",days:["学习 ShapeExpr、symbolic vars 与约束","实现 specialization/guard/recompile 实验","构造动态 batch/sequence 正负测试","建立 MetaSchedule runner 与数据库","比较人工 schedule、top-k trace 与 holdout shape","精读 shape inference 与 MetaSchedule cost model"]},
  { phase:4,title:"项目 B：Runtime、BYOC 与框架集成",goal:"打通代码生成、模块加载、内存和外部 kernel",output:"可部署 runtime package + external backend",days:["追踪 PackedFunc、NDArray、device API 与执行器","实现 external codegen 或调用项目 A kernel","加入能力检查、分区与 fallback","测编译/加载/首轮/稳态 latency 和峰值显存","制造版本错配、缺算子和 OOM 诊断案例","精读 Runtime/BYOC 的关键源码调用链"]},
  { phase:4,title:"LLM 算子编译：Attention 与 KV Cache",goal:"把 AI Infra 场景转化为编译器可优化的算子与布局问题",output:"小型 decoder block 的融合与内存规划报告",days:["推导 prefill/decode 的 shape、算量与访存","实现 RMSNorm+QKV+RoPE 的参考图","为 attention/KV cache 选择布局并写 TIR kernel","比较连续/分页 KV 布局的访问与容量代价","编译 mini decoder，记录 kernel 数、显存和 latency","精读 FlashAttention 与 PagedAttention 的 IO 思路"]},
  { phase:4,title:"编译器接入推理框架",goal:"证明自定义 kernel/编译后端能进入真实推理调用链",output:"vLLM 或 PyTorch custom-op 集成 demo",days:["选择 vLLM custom op 或 PyTorch extension 接入点","接入自写 RMSNorm/Softmax/TIR 或 Triton kernel","实现能力检查、fallback 与数值一致性测试","用固定 workload 对比 eager/原生/自定义实现","记录端到端收益与收益被调度开销吞没的案例","精读 vLLM custom op 与模型执行器调用链"]},
  { phase:4,title:"核心项目：Transformer 子图编译器",goal:"整合捕获、Pass、Lowering、Schedule、Runtime 与 benchmark",output:"transformer-compiler v1.0",days:["冻结输入 IR、支持算子与动态 shape 范围","完成 PyTorch/ONNX→Relax 导入和规范化","完成 fusion→TIR lowering→GPU schedule","加入 fallback、错误诊断与 20 个回归测试","对 3 组模型/shape 做端到端性能报告","精读项目关键路径，准备 10 分钟源码讲解"]},
  { phase:4,title:"TVM 开源贡献与项目封版",goal:"用真实 issue/PR 证明源码定位、测试与协作能力",output:"1 个 TVM 上游 PR + 编译器项目 v1.0",days:["筛选 TVM good first issue、测试缺口或文档 bug","复现问题并提交最小复现与根因分析","实现修复并跑目标测试/benchmark","按社区规范整理 commit、PR 描述与证据","封版项目：一键运行、环境锁定、图表与限制","精读贡献模块的维护者反馈与相邻实现"]},
  { phase:5,title:"MLIR 基础与 Toy 1–2",goal:"理解 dialect、operation、region、SSA 与 TableGen",output:"Toy AST→MLIR 运行记录",days:["配置 LLVM/MLIR 或使用预构建工具；跑 mlir-opt","完成 Toy Ch1，追踪源码到 AST dump","完成 Toy Ch2，理解 Op/Type/Attribute","读一段 .mlir：operation/region/block/value","用通用格式改写同一 IR 并 round-trip","画 MLIR 多层 dialect 降低路线"]},
  { phase:5,title:"Pattern Rewrite 与 Pass",goal:"能写局部重写并解释 pass 管理",output:"transpose canonicalization Pass",days:["完成 Toy Ch3，理解 RewritePattern","写 transpose(transpose(x)) 消除模式","添加 fold/canonicalization 思路与测试","完成 Toy Ch4 的 interface 概念","用 FileCheck 风格写正/负测试","对比 MLIR rewrite 与 FX/Relax Pass"]},
  { phase:5,title:"Lowering 与代码生成",goal:"理解从高层 dialect 降到 LLVM 的边界",output:"Toy Ch5–6 降低笔记",days:["完成 Toy Ch5，观察 affine/scf/memref","逐步跑 lowering pipeline 并保存中间 IR","学习 legality、conversion target、type converter","完成 Toy Ch6 到 LLVM IR/可执行文件","跟踪 transpose 在不同层级的表示","写《何时在什么 IR 层做优化》"]},
  { phase:5,title:"双主项目工程质量审计",goal:"让两个简历主项目都能被陌生人复现",output:"2 个 portfolio-ready 主仓库",days:["审计 GPU 算子库：API、测试、benchmark 与接入示例","审计编译器：IR、Pass、fallback、runtime 与版本锁定","检查性能数据的硬件、输入、warmup 与统计口径","统一图表、架构图与环境信息","清理大文件、死代码和硬编码路径","让朋友按 README 复现并修复全部阻塞项"]},
  { phase:5,title:"简历与项目叙事",goal:"用证据和技术取舍表达成果",output:"一页简历 + 项目问答库",days:["每项目写 1 句问题、2 句动作、1 句量化结果","制作简历第一版，删除无证据的“精通”","为每项目准备 2/5/10 分钟版本","列出 30 个追问并写 STAR/技术回答","录屏回答，检查含糊词和跳步","找 2 人评审并合并高价值反馈"]},
  { phase:5,title:"秋招冲刺：算法、GPU 与编译器",goal:"完成针对性投递闭环并恢复手写与系统表达",output:"岗位矩阵 + 2 套模拟面试 + 10 次高质量投递",days:["按 JD 建技能—项目证据矩阵并制作两版简历","完成 C++/LeetCode 90 分钟模拟并订正","白板写 reduction/LayerNorm 与边界处理","讲 torch.compile graph break、Relax/TIR 和 MLIR lowering","投递 3–5 个高匹配岗位并复盘一次模拟/真实面试","精读目标团队技术博客或开源模块，补最后一个证据缺口"]},
];

// 30 周冲刺版：从 2026-08-31 开始，W30 于 2027-03-28 结束。
// W01 与 W02 的前两天保持不变，已有的 Day 9（W02-D02）勾选记录会继续有效。
const weeks: Week[] = [
  { phase:1, resourceWeek:1, title:"MiniTensor I：工程骨架与张量接口", goal:"用一个可运行的 Tensor 工程恢复 C++、CMake、接口与测试基础；不再按语法书从头学。", output:"MiniTensor 骨架 + Tensor 元数据接口 + CTest", files:"CMakeLists.txt · include/minitensor/tensor.hpp · src/tensor.cpp · tests/test_tensor.cpp", knowledge:["CMake 的 library、executable、test target 与链接关系","shape、stride、dtype、numel 的职责边界","头文件声明与 .cpp 定义，以及编译错误和链接错误的区别","CTest 的注册、运行与失败输出"], days:["创建 include/src/tests/benchmarks/examples 目录；用 CMake 构建 library、demo 与 test target","设计 Shape、Stride、DType 与 Tensor 接口；用 vector 与 const reference 表达参数","实现 numel、连续 stride、边界检查和打印；补齐循环、函数、namespace 与异常","实现一维/二维索引和 fill；跟踪一次 index→offset 的调用","补 1 个正常、1 个边界、1 个非法输入测试；让其中一个测试先失败再修复","学习数组、函数、引用和类；各写一个不超过 15 行、能编译的最小实验"] },
  { phase:1, resourceWeek:2, title:"MiniTensor II：Storage、RAII 与性能基线", goal:"把 Tensor 从接口变成有所有权规则的对象，并建立后续 CPU/GPU 对比所需的正确性与性能基线。", output:"Storage/view + naive/tiled CPU matmul + ASan 与基准记录", files:"include/minitensor/storage.hpp · include/minitensor/tensor_view.hpp · src/operators.cpp · tests/test_storage.cpp · benchmarks/matmul_bench.cpp", knowledge:["RAII、析构、深拷贝、移动与 shared ownership 的区别","view 的 offset/shape/stride 与 contiguous 判断","naive 与 tiled matmul 的访存差异","ASan 与 benchmark 的正确使用边界"], days:["画 Storage/Tensor/View 所有权图；实现模板 Storage 的连续分配与 RAII 释放","实现深拷贝、移动构造和移动赋值；打印验证资源转移并解释 std::move","用 shared_ptr<Storage<T>> 让 view 共享底层数据；处理 offset、shape 与 stride","实现 reshape、transpose view 与 contiguous 判断；补别名和悬空引用测试","实现 naive 与 tiled CPU matmul；固定 shape、warmup、重复次数并记录 P50","开启 ASan/UBSan，制造一次越界或 use-after-free 并写下根因、修复与预防方式"] },
  { phase:1, resourceWeek:3, title:"MiniTensor III：模板、并发与工程验收", goal:"把 C++ 复习收束为能解释、能测试、能测量的 CPU Runtime，而不是继续扩展玩具功能。", output:"MiniTensor v0.1：泛型算子 + 简易线程池 + README", files:"include/minitensor/operators.hpp · include/minitensor/thread_pool.hpp · tests/test_operators.cpp · benchmarks/matmul_bench.cpp · README.md", knowledge:["模板实现为何通常在头文件，以及 vector/span 的所有权差异","逐元素算子、二维广播和浮点误差阈值","固定线程池、任务停止协议与 false sharing 风险","性能实验的 warmup、P50、硬件信息与公平 baseline"], days:["将 Tensor 固化为 Tensor<T>；实现 add/mul 与最小二维广播，并写 shape 错误测试","实现 naive matmul 并与手算/Python 参考值对齐；定义绝对/相对误差阈值","实现固定线程池与按输出行分块的并行 matmul；覆盖停止与异常传播","比较 naive/tiled/parallel 三版在三个 shape 下的延迟；不要先追求最快","加入 clang-format、warnings、Debug/Release preset 与从零 CTest","整理 v0.1 README：架构、构建、测试、性能表、已知限制与下一阶段问题"] },
  { phase:1, resourceWeek:6, title:"CPU 性能、Cache 与传统编译器预备", goal:"建立从 C++ 源码、缓存访问到汇编优化的因果链，为后面理解 GPU 与编译器 Pass 打底。", output:"cache/SIMD 微基准 + C++→汇编证据链", files:"benchmarks/cache_bench.cpp · benchmarks/simd_bench.cpp · labs/assembly/ · docs/W04-performance.md", knowledge:["cache line、TLB、工作集与空间局部性","行列访问、blocked transpose 与带宽瓶颈","-O0/-O3、自动向量化、分支与汇编差异","传统编译器中的 IR、CFG 与数据流分析将解决什么问题"], days:["写行优先/列优先遍历微基准；解释为什么同样复杂度会有不同耗时","实现 blocked transpose，扫描 tile size 并记录带宽或延迟","用 Compiler Explorer 对照 -O0/-O3；找到内联或向量化的一处证据","比较分支与 branchless 写法；说明一次加速与一次退化","阅读《Engineering a Compiler》的 IR/CFG 章节；画一个三地址码控制流图","完成 MiniTensor v0.1 从零复现；把 CPU baseline、限制和后续 GPU 对照条件写入日志"] },
  { phase:2, resourceWeek:13, title:"AI Infra 前置：Transformer 与 GPU 微架构", goal:"先理解模型到底在算什么、GPU 为什么这样执行，再写 CUDA；把算子、显存和模型结构联系起来。", output:"Decoder Block 数据流图 + GPU 架构笔记 + tiny-gpu 实验", files:"labs/transformer/decoder_shapes.py · labs/gpu_microarch/ · docs/W05-transformer-gpu.md", knowledge:["RMSNorm、QKV、RoPE、Attention、MLP 与残差的数据流","prefill/decode 的 shape、并行度和 KV Cache 增长","SM、warp、Tensor Core、HBM、L2、寄存器与 shared memory","吞吐导向、延迟隐藏、合并访问与 warp 发散"], days:["用 PyTorch 打印一个 Decoder Block 的输入输出 shape；标出 RMSNorm/QKV/Attention/MLP","手算 prefill 与 decode 的 FLOPs、KV Cache 字节数；比较 batch/sequence 改变后的瓶颈","阅读 tiny-gpu 的线程、寄存器和内存模块；画一次指令从 warp 到内存的路径","学习 NVIDIA GPU 中 SM、warp、Tensor Core、HBM/L2 的职责；用自己的 GPU 参数填表","写一个 Python 脚本估算 LLaMA 类模型的 KV Cache 容量；记录 FP16 与 INT8 的差异","阅读 AIInfraGuide 的 GPU 基础自检项；用 5 个问答复述 CPU/GPU、带宽墙、warp、Tensor Core、显存"] },
  { phase:2, resourceWeek:14, title:"CUDA 基础与存储层次", goal:"写出正确的 CUDA kernel，并用 coalescing/shared memory 解释性能差异。", output:"vector add + 三版 transpose + Nsight 截图", files:"src/vector_add.cu · src/transpose.cu · tests/test_vector_add.cu · benchmarks/transpose_bench.cu", knowledge:["grid/block/thread/warp 的索引映射与边界保护","host/device 拷贝、kernel launch 与 CUDA 错误检查","global/shared/register/constant memory 的访问特征","coalescing、bank conflict 与 padding"], days:["确认驱动、CUDA、GPU compute capability；记录 nvcc、GPU、显存和驱动版本","写 vector add 与 CPU 对照；加入错误检查宏、grid-stride loop 与越界保护","写 naive transpose，验证读写访问模式；保存 Nsight Systems 时间线","写 tiled shared-memory transpose；实现同步并比较正确性","制造 bank conflict，再用 padding 消除；用 Nsight Compute 记录一个相关指标","把三版结果写成表：正确性、耗时、有效带宽、瓶颈和下一步假设"] },
  { phase:2, resourceWeek:17, title:"CUDA Reduce、Softmax 与 LayerNorm", goal:"掌握归约、数值稳定和算子融合——这是 AI Infra 面试与 LLM 算子的共同基础。", output:"reduce + stable softmax + LayerNorm v1", files:"src/reduction.cu · src/softmax.cu · src/layernorm.cu · tests/test_norm_ops.cu", knowledge:["tree reduction、warp shuffle 与 block reduce","softmax 减 max、online softmax 与数值误差","LayerNorm、Welford、epsilon、gamma/beta","融合如何减少 kernel launch 和显存读写"], days:["写多 block sum reduction baseline；用 CPU 结果与随机输入对齐","加入 shared-memory reduction 与 warp shuffle；验证非整 block size 的边界","实现稳定 softmax；测试极大/极小输入并记录误差","实现 online softmax 或解释其访存优势；与两遍版本同口径对比","实现 LayerNorm baseline 与 block-reduce 版本；覆盖 hidden size 128–8192","用 Nsight Compute 分析一个 kernel：访存、occupancy、寄存器或分支中至少一项"] },
  { phase:2, resourceWeek:16, title:"CUDA GEMM、Tensor Core 与 Profiling", goal:"将矩阵乘法从正确实现推进到可解释的优化；理解何时应该调用 cuBLAS/CUTLASS。", output:"tiled GEMM + FP16/BF16 对照 + roofline 报告", files:"src/gemm_naive.cu · src/gemm_tiled.cu · benchmarks/gemm_bench.cu · docs/W08-roofline.md", knowledge:["GEMM 的 M/N/K、tiling、同步和边界","寄存器分块、occupancy、register spilling 的权衡","FP16/BF16 输入、FP32 累加与 Tensor Core 对齐约束","CUDA Event、GFLOPS、roofline 与 cuBLAS baseline"], days:["定义 M/N/K、dtype、误差阈值和 shape 测试矩阵；写 naive GEMM","实现 shared-memory tiled GEMM；处理非 tile 整倍数","加入寄存器分块或向量化 load/store；检查对齐和 fallback","用 CUTLASS 或 WMMA 跑通一条 Tensor Core 对照路径；不要把它当自写 kernel","用 CUDA Events 比较 naive/tiled/cuBLAS；记录 GFLOPS 与输入规模","查看 PTX/SASS 或资源报告，写清当前是计算受限还是带宽受限"] },
  { phase:2, resourceWeek:19, title:"Triton、FlashAttention 与 CUDA 阶段验收", goal:"理解高层 kernel DSL 与手写 CUDA 的边界，并把 Attention/KV Cache/量化纳入 AI Infra 语境。", output:"CUDA/Triton/PyTorch 对照报告 + kernel-lab v1", files:"triton/softmax.py · triton/layernorm.py · docs/attention-io.md · benchmarks/run_all.py", knowledge:["Triton 的 program_id、block、mask、reduction 与 autotune","FlashAttention 的 IO-aware 思路而非公式复述","prefill/decode、连续/Paged KV Cache 的访问差异","量化的精度—显存—带宽取舍与公平性能比较"], days:["完成 Triton vector add 与 softmax；与 PyTorch 数值对齐","实现 Triton LayerNorm；比较 CUDA/Triton/PyTorch 的性能和开发成本","阅读 FlashAttention 的 IO 观点；用读写次数解释它为什么有效","分析 vLLM PagedAttention/KV Cache；画出连续与分页布局的区别","做一个 weight-only INT8 或 KV Cache 量化容量估算实验；记录误差边界","封版 kernel-lab：统一 benchmark、Nsight 证据、失败案例与 8 分钟讲解"] },
  { phase:3, resourceWeek:21, title:"PyTorch Tensor、Autograd、Dispatcher 与 Extension", goal:"知道高层 PyTorch 调用如何抵达 native kernel，避免把框架当黑盒。", output:"mini autograd + custom op + 调用链图", files:"autograd/tensor.py · extensions/custom_op.cpp · tests/test_autograd.py · docs/W10-dispatcher.md", knowledge:["Autograd 拓扑排序、grad_fn、梯度累积与梯度检查","Dispatcher 的 schema、dispatch key、kernel 选择","C++/CUDA extension 从 Python 到 native kernel 的路径","Tensor storage/stride/view 与自定义算子输入约束"], days:["手写标量 autograd 的拓扑排序；打印前向图和反向顺序","实现 add/mul/matmul backward；用数值梯度检查一个结果","阅读 Dispatcher 入口；为一个算子画 Python→dispatcher→kernel 调用链","写最小 C++ 或 CUDA extension；从 PyTorch 调用并通过正确性测试","为 custom op 加 shape/dtype 非法输入检查和清晰错误信息","阅读 AIInfraGuide 的 PyTorch 前置内容；用 5 个问题复述 Tensor、Autograd、dispatcher、extension、fallback"] },
  { phase:3, resourceWeek:22, title:"FX、ONNX 与图变换", goal:"获得捕获、检查、改写、验证计算图的能力，为后续编译器 Pass 做准备。", output:"FX 融合 Pass + ONNX 分析包", files:"passes/conv_bn_relu.py · onnx_tools/export_model.py · onnx_tools/rewrite.py · tests/test_fx_onnx.py", knowledge:["FX Graph/Node/GraphModule 与 symbolic_trace","模式匹配、节点替换、死代码清理与图合法性","ONNX opset、initializer、value_info、shape inference","数值一致性、动态 shape 与 unsupported op 的处理"], days:["用 FX 捕获一个小模型并打印 Graph；标出 node 的输入输出","实现 Conv-BN-ReLU 或等价 pointwise 融合模式匹配；保存前后图","对融合前后跑数值、训练/eval、shape 负例测试；写清支持条件","导出一个模型到 ONNX；运行 checker 与 shape inference","用 ONNX Runtime 对齐 PyTorch 输出；用 Netron/脚本统计算子","实现一次安全常量折叠或图改写；记录一个导出/改写失败案例"] },
  { phase:3, resourceWeek:24, title:"torch.compile、Dynamo 与 Inductor", goal:"理解 PyTorch 2 的图捕获、guards、graph break 与生成 kernel，能诊断性能回归。", output:"torch.compile 调试手册 + 生成代码注释", files:"compile_labs/graph_breaks.py · compile_labs/dynamo_guards.py · generated/ · docs/W12-compile.md", knowledge:["Dynamo、AOTAutograd、Inductor、Triton 的分层","guard、graph break、recompile、dynamic shape","冷启动编译时间与稳态时间的区别","生成代码、fusion、autotune 与 fallback"], days:["跑 torch.compile quickstart；分别记录 eager、首轮、稳态耗时","用 explain/export 保存捕获图与 guards；解释一个 guard","制造 Python side effect 或数据依赖控制流 graph break；用日志定位","观察 dynamic shape 下的重新编译；写支持范围和限制","保存 Inductor 生成的 Triton/C++ 代码；标注一个 pointwise fusion 或 reduction","写一页《torch.compile 性能回归排查》：graph break、guard、编译时间、kernel、fallback"] },
  { phase:3, resourceWeek:5, title:"传统编译器：IR、CFG、SSA 与数据流", goal:"先学通用编译器语言，再进入 TVM/MLIR；能解释 Pass 在什么 IR 上做什么优化。", output:"三地址码→CFG→SSA 小编译实验", files:"compiler_core/ir.py · compiler_core/cfg.py · compiler_core/ssa.md · tests/test_ir.py", knowledge:["三地址码、basic block、CFG、支配关系","SSA、phi 节点、use-def 链与数据流分析","常量折叠、死代码消除、循环优化的前提","寄存器分配与硬件资源约束的关系"], days:["用三地址码表示一个含 if/loop 的小程序；定义操作、值和 basic block","画 CFG、前驱后继与支配关系；为图写 3 个不变量","将一个变量改写为 SSA；手工加入 phi 并解释为什么需要它","实现或伪实现常量折叠与死代码消除；为正例/负例写测试","阅读寄存器分配章节；比较 SSA value 与 GPU register pressure 的联系","用自己的话对比 FX graph、ONNX graph、传统 IR；写出它们各自适合的优化"] },
  { phase:3, resourceWeek:45, title:"MLIR 与 tiny-gpu-compiler", goal:"理解 Dialect、Pattern Rewrite、Lowering 如何把并行语义降到硬件指令；教学项目只用于理解，不作为简历项目。", output:"Toy MLIR + tiny-gpu-compiler Pass/lowering 阅读记录", files:"mlir-toy/ · tiny-gpu-compiler-notes/ · saved_ir/ · docs/W14-mlir.md", knowledge:["operation、value、type、attribute、region、block 与 SSA","Dialect 与 TableGen 如何表达领域语义","RewritePattern、canonicalization、PassManager 与 FileCheck","legality、type conversion、lowering 到 LLVM/目标 ISA"], days:["配置并运行 mlir-opt 或 Toy Chapter 1–2；保存一段可解析的 .mlir","读一个 Dialect 的 operation/type 定义；写出输入、输出和 verifier 约束","实现 transpose(transpose(x)) 消除或完成等价 RewritePattern；写正/负测试","跑 Toy lowering，逐层保存 IR；解释每层语义和内存表示变化","运行 tiny-gpu-compiler 的 vector add；追踪 source→MLIR→指令→模拟执行","比较 tiny-gpu-compiler 与真实 CUDA：列出 5 个刻意简化点和 3 个仍可迁移的概念"] },
  { phase:3, resourceWeek:36, title:"TVM/Relax：模型导入与计算图编译", goal:"把传统编译器概念映射到 AI 编译器：从 PyTorch/ONNX 子图进入 Relax，并保存可诊断 IR。", output:"PyTorch/ONNX→Relax 最小导入链路", files:"tvm_labs/importer.py · tvm_labs/normalize.py · saved_ir/ · tests/test_import.py", knowledge:["IRModule、Relax、TensorIR、Runtime 的分层","模型导入、规范化、shape/dtype 推断","eager、torch.compile、TVM baseline 的可比性","子图支持范围与 unsupported op fallback"], days:["从源码或官方包跑 TVM 最小教程；锁定版本与环境","导入一个 MLP 或 RMSNorm 子图到 Relax；保存导入前后 IR","阅读 normalize/shape inference 输出；标出 shape、dtype 和 dataflow block","构造一个 unsupported op；记录失败信息和 fallback 方案","对 eager、torch.compile、TVM 跑同一输入；分别记录编译、首轮、稳态时间","写 TVM 编译管线图：frontend→Relax→TIR→runtime，并用一个 IR 文件佐证"] },
  { phase:3, resourceWeek:37, title:"TensorIR Schedule、MetaSchedule 与 Triton 编译链", goal:"掌握 GPU codegen 前最关键的调度语言与代价模型；能解释手写 kernel 与自动调优的关系。", output:"Matmul/RMSNorm TIR schedule + tuning 记录", files:"tvm_labs/tir_kernels.py · tvm_labs/schedules.py · tuning_db/ · tests/test_tir.py", knowledge:["PrimFunc、block、buffer、iter var 与 TVMScript","split/reorder/cache_read/cache_write/thread binding","cooperative fetch、向量化、归约与寄存器分块","MetaSchedule design space、runner、database、holdout shape"], days:["用 TVMScript 写 matmul 或 RMSNorm 的正确 baseline；保存 TIR","应用 split/reorder/cache_read/cache_write；解释每一步改变的访存","加入 block/thread binding 与 cooperative fetch；验证非整 shape","对比手写 CUDA/Triton 与 TIR schedule 的代码结构和性能","跑小规模 MetaSchedule；保存 top-k trace 与硬件/shape 条件","用 holdout shape 检验调优结果；写清过拟合、编译成本和适用边界"] },
  { phase:3, resourceWeek:26, title:"分布式训练原理：Collective、DDP、FSDP、ZeRO", goal:"按 AIInfraGuide 补齐训练 Infra 的原理与最小实验，但不虚构千卡级实践。", output:"2 进程通信 trace + DDP/FSDP/ZeRO 对照图", files:"distributed_labs/ddp_trace.py · distributed_labs/fsdp_minimal.py · docs/W17-distributed.md", knowledge:["all-reduce、all-gather、reduce-scatter 与通信拓扑","DDP 的梯度同步、bucket 与通信/计算重叠","FSDP/ZeRO 对参数、梯度、optimizer state 的分片","数据并行、张量并行、流水线并行的选择边界"], days:["用 torchrun + CPU/Gloo 跑 2 进程 all-reduce；打印 rank 前后张量","跑最小 DDP；记录梯度同步发生的位置并解释 bucket","运行 FSDP/ZeRO 最小示例；画参数/梯度/optimizer state 的保存位置","估算一个模型在 DDP/FSDP 下的显存；写出假设和不含的开销","阅读 TP/PP/SP 的分工；给一个 Decoder Block 选择并行策略的理由","完成 DDP/FSDP/ZeRO 对照表；明确写下“这不等于千卡训练经验”"] },
  { phase:3, resourceWeek:41, title:"LLM 推理：KV Cache、PagedAttention、量化与 vLLM", goal:"补齐 AI Infra 指南的推理层，使后面的算子库与编译器项目有真实场景和指标。", output:"mini decoder 推理分析 + vLLM 调用链笔记", files:"inference_labs/kv_cache.py · inference_labs/quantization.py · docs/W18-inference.md", knowledge:["prefill/decode 的吞吐、延迟、batch 与访存瓶颈","KV Cache 容量公式、连续/分页布局与 PagedAttention","weight-only、activation、KV Cache 量化的差别","continuous batching、调度开销、custom op 与端到端收益"], days:["实现或阅读 mini decoder 的 prefill/decode；打印每层 tensor shape","写 KV Cache 容量计算器；扫描 batch、sequence、layers、heads、dtype","阅读 PagedAttention；用图解释 block table 如何避免连续大内存","做 weight-only INT8 对照：记录显存节省、误差和没有加速的情形","追踪 vLLM 或 PyTorch custom op 的一个接入点；画调用链与 fallback","完成推理自检：为什么 decode 常带宽受限、为什么单 kernel 快不一定端到端快"] },
  { phase:4, resourceWeek:30, title:"项目 A 立项：Transformer GPU 算子库", goal:"核心知识完成后再开始主项目；冻结问题、支持范围和验收，不从作业拼凑项目。", output:"gpu-operator-lab RFC + benchmark 协议 + 仓库骨架", files:"gpu-operator-lab/docs/RFC.md · operators/ · tests/ · benchmarks/protocol.md", knowledge:["目标用户、非目标、支持矩阵与验收指标","算子 API、dispatch、fallback 与框架接入边界","正确性矩阵、性能基线、warmup/P50/硬件记录","Softmax/RMSNorm/GEMM/RoPE 的优先级与 LLM 场景"], days:["写 RFC：目标、非目标、支持 GPU/dtype/shape、成功标准","建立 operators/tests/benchmarks/bindings/docs 目录与一键环境脚本","冻结 PyTorch/Triton/CUTLASS/cuBLAS baseline、shape 与精度阈值","迁移 Softmax/RMSNorm baseline；保留 naive 与优化版本","建立 correctness matrix：FP32/FP16、极值、非对齐、非法输入","阅读 FlashInfer/vLLM 的测试与 custom op 结构；写 5 条可借鉴但不复制的设计"] },
  { phase:4, resourceWeek:31, title:"项目 A：Softmax、RMSNorm 与框架接入", goal:"把课堂 kernel 升级为可维护组件：多版本 dispatch、测试、fallback 和 PyTorch 调用。", output:"Softmax/RMSNorm v1 + PyTorch custom op", files:"gpu-operator-lab/operators/softmax/ · operators/rmsnorm/ · bindings/torch_ops.py · tests/test_norm_ops.py", knowledge:["warp/shared/Triton 实现的 dispatch 条件","数值稳定、FP16 误差、尾部 mask 与非对齐 shape","torch.library/schema/fake/meta kernel 与 torch.compile","capability check、fallback 与错误诊断"], days:["重构 Softmax/RMSNorm API；实现版本选择与统一错误检查","补 FP32/FP16、极值、非对齐 shape、非法 dtype 的自动测试","实现或整理 naive/shared/warp/Triton 多版本；记录选择条件","用 torch.library 或 extension 注册算子；从 PyTorch 调用","加入 fake/meta 与不支持输入 fallback；跑 torch.compile 兼容性检查","用 Nsight 比较一个 baseline/优化版本；解释收益来自哪里而非只报倍数"] },
  { phase:4, resourceWeek:32, title:"项目 A：GEMM/MLP、RoPE 与性能证据", goal:"把单算子串成 Transformer 热点，建立可被面试追问的性能故事。", output:"MLP/RoPE benchmark suite + 性能报告", files:"gpu-operator-lab/operators/gemm/ · operators/mlp/ · operators/rope/ · benchmarks/run.py", knowledge:["Transformer MLP 的典型 M/N/K、epilogue fusion","RoPE 布局与 prefill/decode 的输入差异","cuBLAS/CUTLASS/Triton/PyTorch 的公平对照","roofline、occupancy、访存与端到端收益的区别"], days:["定义 Transformer MLP shape 集；实现或接入 GEMM baseline","实现 bias+GELU/SwiGLU epilogue 融合；做数值和边界测试","实现 RoPE reference 与 CUDA/Triton 版本；检查配对维度与尾部","比较 PyTorch/Triton/CUTLASS/cuBLAS；固定输入、warmup、P50 与硬件","分析小矩阵、大矩阵、FP16/BF16 下的退化案例","生成性能图与架构图；写 10 个项目 A 源码/性能追问答案"] },
  { phase:4, resourceWeek:35, title:"项目 A 封版与真实接入", goal:"让陌生人可以复现，并证明至少一个自定义算子进入真实 mini Decoder 或框架调用链。", output:"gpu-operator-lab v1.0 + 接入 demo + 10 分钟讲解", files:"gpu-operator-lab/README.md · integrations/mini_decoder.py · scripts/reproduce.py · results/v1.0/", knowledge:["单 kernel 与端到端收益脱节的原因","环境锁定、结果版本、失败案例与复现脚本","mini Decoder/vLLM custom op 的真实接入点","项目叙事：问题、基线、优化、证据、限制"], days:["接入 mini Decoder 的 RMSNorm/Softmax/RoPE；验证端到端输出","测 eager/原生/custom op 的端到端延迟、显存与 kernel 数","从干净环境运行测试与 benchmark；修复一个复现阻塞点","整理 README、架构图、支持矩阵、已知限制和结果图","录制 10 分钟讲解；逐条回答自己准备的 20 个追问","打 v1.0；仅在结果、测试和脚本完整时勾选项目 A 完成"] },
  { phase:5, resourceWeek:36, title:"项目 B 立项：Transformer 子图导入与 IR", goal:"开始端到端子图编译器，但范围只覆盖 RMSNorm+MLP 或 Attention 子图，拒绝做泛化大框架。", output:"transformer-compiler RFC + PyTorch/ONNX→Relax IR", files:"transformer-compiler/compiler/importer.py · saved_ir/ · tests/test_import.py · docs/RFC.md", knowledge:["子图支持范围、非目标与输入输出契约","PyTorch/ONNX→Relax 导入和规范化","IR dump、shape/dtype/layout 支持矩阵","eager/torch.compile/TVM baseline 的统一口径"], days:["写项目 B RFC：目标子图、输入格式、非目标与成功标准","导入 RMSNorm+MLP 或 Attention 子图到 Relax；保存原始/规范化 IR","建立 dtype/shape/layout 支持矩阵；写 3 个拒绝输入","对同一 workload 建 eager/torch.compile/TVM baseline；分开编译/首轮/稳态","为 importer 写正常、动态 shape、unsupported op 测试","画 frontend→IR→Pass→TIR→runtime 的流水线；标出每层不变量"] },
  { phase:5, resourceWeek:37, title:"项目 B：TensorIR Lowering 与 GPU Schedule", goal:"把高层子图降到可检查、可优化的 PrimFunc，并和项目 A 的手写 kernel 对照。", output:"RMSNorm/MLP/Softmax TIR schedule 库", files:"transformer-compiler/compiler/tir_kernels.py · compiler/schedules.py · tests/test_tir.py", knowledge:["PrimFunc、block、buffer、迭代变量与访存 scope","split/reorder/cache/thread binding 的 schedule 语义","归约、向量化、cooperative fetch 与合法性","TIR、Triton、CUDA kernel 的表达差异"], days:["为一个目标算子写正确 TIR baseline；保存 IR 与数值结果","逐步加入 split/reorder/cache；每一步保存前后 IR","加入 block/thread binding 与 cooperative fetch；验证非整 shape","加入 reduction/vectorize/register blocking；记录一个性能变化","对照项目 A kernel 和 TIR 生成 CUDA；解释结构相同与不同处","为 schedule 写回归测试与一份“合法性/性能/可读性”取舍记录"] },
  { phase:5, resourceWeek:38, title:"项目 B：Fusion Pass、动态 Shape 与 Fallback", goal:"实现真正的编译器 Pass，不只调用 TVM；所有支持条件与失败路径必须可诊断。", output:"fusion pipeline + 动态 shape guard + 20 个图测试", files:"transformer-compiler/compiler/passes/fusion.py · compiler/dynamic_shapes.py · tests/ir/ · tests/test_fusion.py", knowledge:["DPL/模式匹配、rewrite、前后 IR 验证","融合对子图边界、kernel 数、访存与数值的影响","symbolic shape、specialization、guard、recompile","unsupported op、混合子图与 fallback"], days:["描述 RMSNorm+MLP 或 attention 模式；写正例、负例和不匹配原因","实现匹配、重写、前后 IR 保存；对比结构变化","对融合前后做数值、dtype、layout、shape 测试","实现动态 batch/sequence guard；记录 specialization/recompile 行为","实现 unsupported op fallback；制造一次失败并验证诊断信息","统计 kernel 数、访存或端到端延迟变化；写清融合没有收益的一种情况"] },
  { phase:5, resourceWeek:40, title:"项目 B：Runtime、外部 Kernel 与推理接入", goal:"完成 codegen、模块加载、能力检查与真实框架接入，避免项目止步于 IR 截图。", output:"runtime package + 项目 A kernel/PyTorch 接入 demo", files:"transformer-compiler/runtime/ · integrations/torch_backend.py · tests/test_runtime.py · benchmarks/e2e.py", knowledge:["PackedFunc、NDArray、Device API 与执行器","BYOC/external codegen、分区、能力检查","编译/加载/首轮/稳态 latency 与峰值显存","外部 kernel、fallback、版本错配与 OOM 诊断"], days:["追踪 TVM runtime 的一个执行入口；画 module load→PackedFunc→device 调用链","接入项目 A 的一个 kernel 或 PyTorch custom op；做数值一致性测试","加入 capability check、version mismatch、missing op 的诊断与 fallback","测编译、加载、首轮、稳态 latency 与显存；固定 workload","把编译后子图接入 mini Decoder 或 PyTorch backend；记录端到端结果","制造 OOM 或 unsupported shape；确认不会静默错算，并写限制说明"] },
  { phase:5, resourceWeek:43, title:"项目 B 封版：Transformer 子图编译器", goal:"收束为可运行、可测试、可解释的端到端编译器，而不是 TVM 教程合集。", output:"transformer-compiler v1.0 + 三组 workload 性能报告", files:"transformer-compiler/compiler/pipeline.py · tests/test_pipeline.py · benchmarks/e2e.py · README.md", knowledge:["frontend、Pass、lowering、schedule、runtime 的 pipeline 不变量","动态 shape、unsupported op、fallback 的系统设计","端到端 benchmark 的公平性与性能结论边界","10 分钟源码讲解和失败案例表达"], days:["冻结支持子图、shape 范围、dtype 和版本；删除超出范围的半成品","从输入模型完成 import→fusion→TIR→runtime 的全链路","跑 20+ 回归测试；补一个历史 bug 的最小复现","对三组 workload 跑 eager/compile/TVM/custom 对照；生成图表","从干净环境复现；请他人按 README 执行并修复阻塞项","打 v1.0；准备 2/5/10 分钟项目 B 讲解与 20 个追问"] },
  { phase:5, resourceWeek:44, title:"开源协作与深度源码走读", goal:"将源码阅读转化为可验证协作：只尝试小而真实的 issue、文档或测试贡献，不为简历伪造 PR。", output:"一个可追溯 issue/PR 或完整最小复现包", files:"upstream/issue.md · upstream/reproducer.py · upstream/test_plan.md · docs/W28-source-reading.md", knowledge:["good first issue 的筛选、最小复现与根因边界","测试、benchmark、commit、PR 描述与 Code Review","TVM/MLIR/vLLM/FlashInfer 的模块化阅读方法","何种贡献可以诚实写入简历"], days:["选择一个 TVM/MLIR/vLLM/FlashInfer issue；确认范围和本地复现条件","写最小复现、预期/实际结果与环境；先不修改上游","沿调用链定位一个可能根因；记录证据和不确定性","补一个测试、文档或小修复；只运行目标测试与相关 benchmark","按社区格式准备 commit/PR 或 issue 评论；保留链接和反馈","若贡献未合并，整理复现包；简历只写已真实完成、可验证的工作"] },
  { phase:5, resourceWeek:48, title:"作品集复现审计与简历", goal:"把两个主项目变成陌生人可复现、你自己可讲清的秋招材料。", output:"两仓库审计完成 + 一页简历 + 项目问答库", files:"portfolio/checklist.md · portfolio/resume.md · gpu-operator-lab/README.md · transformer-compiler/README.md", knowledge:["环境、数据、命令、测试、性能证据与限制的审计","简历中的问题—动作—量化结果—技术取舍","2/5/10 分钟项目叙事与源码追问","不能写在简历上的夸大表述"], days:["审计项目 A：API、测试、benchmark、接入示例、硬件/shape 口径","审计项目 B：IR、Pass、fallback、runtime、版本锁定与端到端数据","统一图表、README、环境文件和一键复现命令；清理硬编码路径","写一页简历：每项目 1 句问题、2 句动作、1 句真实量化结果","为两个项目各准备 2/5/10 分钟叙事；录音并删除含糊表述","让同学按 README 复现；修复阻塞问题并记录一次改进"] },
  { phase:5, resourceWeek:50, title:"秋招冲刺：Hot100 收尾、GPU/编译器面试与投递", goal:"在 4 月前结束学习内容，把最后两周留给查漏、模拟和有针对性的投递。", output:"Hot100 完成记录 + JD 证据矩阵 + 两次模拟面试", files:"portfolio/jd-matrix.csv · portfolio/project-qa.md · portfolio/mock-interviews/ · portfolio/applications.md", knowledge:["Hot100 的复杂度、边界、模板与错因归纳","reduction/LayerNorm/GEMM 的白板实现与 GPU 边界","torch.compile、TVM/TIR、MLIR lowering 的系统表达","JD 到项目证据的匹配与诚实投递策略"], days:["完成 Hot100 最后题目并复盘最高频的数组/树/链表/DP 模板","白板写 reduction、softmax 或 LayerNorm；说清并行划分、同步和边界","模拟解释 graph break、fusion Pass、TIR schedule、MLIR lowering","针对 3 个 JD 建技能—项目证据矩阵；准备两版简历","进行一次 C++/算法模拟和一次 GPU/编译器模拟；逐题订正","完成最终复现审计与投递清单；4 月开始只按面试反馈定向补缺"] },
];

// Every week is anchored to one concrete AIInfraGuide chapter.  The daily
// card turns the chapter into a small reading question, then asks the learner
// to prove the answer in code.  This is deliberately not a second curriculum.
const aiInfraGuidePlan: GuideReference[] = [
  { title: "第1章：编程语言基础", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%B8%80-%E5%89%8D%E7%BD%AE%E7%9F%A5%E8%AF%86/%E7%AC%AC1%E7%AB%A0-%E7%BC%96%E7%A8%8B%E8%AF%AD%E8%A8%80%E5%9F%BA%E7%A1%80/", readingGoal: "重点阅读 C/C++ 生命周期、编译/链接、CMake 与 Linux 开发基本功。" },
  { title: "第1章：编程语言基础", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%B8%80-%E5%89%8D%E7%BD%AE%E7%9F%A5%E8%AF%86/%E7%AC%AC1%E7%AB%A0-%E7%BC%96%E7%A8%8B%E8%AF%AD%E8%A8%80%E5%9F%BA%E7%A1%80/", readingGoal: "重点阅读 RAII、智能指针、对象生命周期与内存问题定位。" },
  { title: "第1章：编程语言基础", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%B8%80-%E5%89%8D%E7%BD%AE%E7%9F%A5%E8%AF%86/%E7%AC%AC1%E7%AB%A0-%E7%BC%96%E7%A8%8B%E8%AF%AD%E8%A8%80%E5%9F%BA%E7%A1%80/", readingGoal: "重点阅读模板、容器、构建系统与性能定位的工程边界。" },
  { title: "第7章：AI 编译器", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC7%E7%AB%A0-ai%E7%BC%96%E8%AF%91%E5%99%A8/", readingGoal: "先建立“图、IR、优化、代码生成”的全链路直觉，再用 CPU 实验观察源码到机器代码。" },
  { title: "第3章：Transformer 架构详解", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%B8%80-%E5%89%8D%E7%BD%AE%E7%9F%A5%E8%AF%86/%E7%AC%AC3%E7%AB%A0-transformer%E6%9E%B6%E6%9E%84%E8%AF%A6%E8%A7%A3/", readingGoal: "重点跟踪 Decoder Block 的 shape、Attention、MLP、RoPE、残差与 KV Cache。GPU 硬件部分同时查本章导航中的 GPU 基础。" },
  { title: "CUDA 编程快速入门指南", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/cuda%E7%BC%96%E7%A8%8B%E5%85%A5%E9%97%A8%E6%8C%87%E5%8D%97/", readingGoal: "重点阅读环境、线程层级、内存模型和向量加法，再写可验证的 CUDA 最小 kernel。" },
  { title: "第3章：经典算子实现—Reduce", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC3%E7%AB%A0-%E7%BB%8F%E5%85%B8%E7%AE%97%E5%AD%90%E5%AE%9E%E7%8E%B0-reduce/", readingGoal: "重点阅读朴素归约、共享内存树形归约、Warp Shuffle 与数值稳定 Softmax 的联系。" },
  { title: "第4章：经典算子实现—GEMM", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC4%E7%AB%A0-%E7%BB%8F%E5%85%B8%E7%AE%97%E5%AD%90%E5%AE%9E%E7%8E%B0-gemm/", readingGoal: "重点阅读 tiled GEMM、数据复用、Tensor Core 约束及与 cuBLAS 的公平比较。" },
  { title: "第6章：Attention 算子", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC6%E7%AB%A0-attention%E7%AE%97%E5%AD%90/", readingGoal: "重点阅读 FlashAttention 的 IO 视角；再连接 Triton、Paged KV Cache 与量化的取舍。" },
  { title: "第4章：PyTorch 框架", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%B8%80-%E5%89%8D%E7%BD%AE%E7%9F%A5%E8%AF%86/%E7%AC%AC4%E7%AB%A0-pytorch%E6%A1%86%E6%9E%B6/", readingGoal: "重点阅读 Tensor、Autograd、训练/调试流程；把高层调用连接到自定义扩展。" },
  { title: "第7章：AI 编译器", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC7%E7%AB%A0-ai%E7%BC%96%E8%AF%91%E5%99%A8/", readingGoal: "重点阅读计算图、算子融合和编译后端；用 FX/ONNX 图变换验证而不是只看图。" },
  { title: "第7章：AI 编译器", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC7%E7%AB%A0-ai%E7%BC%96%E8%AF%91%E5%99%A8/", readingGoal: "重点阅读 torch.compile/Triton 的位置；用 graph break、guard 和生成 kernel 解释编译收益。" },
  { title: "第7章：AI 编译器", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC7%E7%AB%A0-ai%E7%BC%96%E8%AF%91%E5%99%A8/", readingGoal: "以本章的 AI 编译器分层为参照，补齐传统 IR、CFG、SSA 与 Pass 的通用语言。" },
  { title: "第7章：AI 编译器", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC7%E7%AB%A0-ai%E7%BC%96%E8%AF%91%E5%99%A8/", readingGoal: "以本章的编译流程为参照，学习 MLIR 的 dialect、rewrite 与 lowering；官方 Toy 教程仍是实现材料。" },
  { title: "第7章：AI 编译器", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC7%E7%AB%A0-ai%E7%BC%96%E8%AF%91%E5%99%A8/", readingGoal: "把本章的 AI 编译器总览映射到 TVM：模型导入、Relax、TensorIR、代码生成与运行时。" },
  { title: "第7章：AI 编译器", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC7%E7%AB%A0-ai%E7%BC%96%E8%AF%91%E5%99%A8/", readingGoal: "把算子优化的阅读结论落到 TensorIR schedule、搜索空间和性能证据。" },
  { title: "第2章：集合通信原语", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%B8%89-%E5%88%86%E5%B8%83%E5%BC%8F%E8%AE%AD%E7%BB%83/%E7%AC%AC2%E7%AB%A0-%E9%9B%86%E5%90%88%E9%80%9A%E4%BF%A1%E5%8E%9F%E8%AF%AD/", readingGoal: "先理解 AllReduce/AllGather/ReduceScatter 的数据流与通信量，再做 DDP/FSDP/ZeRO 的最小实验。" },
  { title: "第2章：推理引擎核心技术", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E5%9B%9B-%E6%8E%A8%E7%90%86%E4%BC%98%E5%8C%96/%E7%AC%AC2%E7%AB%A0-%E6%8E%A8%E7%90%86%E5%BC%95%E6%93%8E%E6%A0%B8%E5%BF%83%E6%8A%80%E6%9C%AF/%E7%AC%AC2%E7%AB%A0-%E6%8E%A8%E7%90%86%E5%BC%95%E6%93%8E%E6%A0%B8%E5%BF%83%E6%8A%80%E6%9C%AF/", readingGoal: "重点阅读 prefill/decode、KV Cache、批处理与端到端性能；再用小脚本和调用链验证。" },
  { title: "第5章：Softmax 与算子融合", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC5%E7%AB%A0-%E7%BB%8F%E5%85%B8%E7%AE%97%E5%AD%90%E5%AE%9E%E7%8E%B0-softmax%E4%B8%8E%E7%AE%97%E5%AD%90%E8%9E%8D%E5%90%88/", readingGoal: "以 Softmax/融合的性能模型约束项目 A 的接口、正确性矩阵和 benchmark 协议。" },
  { title: "第5章：Softmax 与算子融合", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC5%E7%AB%A0-%E7%BB%8F%E5%85%B8%E7%AE%97%E5%AD%90%E5%AE%9E%E7%8E%B0-softmax%E4%B8%8E%E7%AE%97%E5%AD%90%E8%9E%8D%E5%90%88/", readingGoal: "用本章的数值稳定、融合和访存观点实现项目 A 的 Softmax/RMSNorm 并接入 PyTorch。" },
  { title: "第4章：经典算子实现—GEMM", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC4%E7%AB%A0-%E7%BB%8F%E5%85%B8%E7%AE%97%E5%AD%90%E5%AE%9E%E7%8E%B0-gemm/", readingGoal: "将 tiled GEMM、Tensor Core 和性能边界用于项目 A 的 MLP/RoPE 及性能报告。" },
  { title: "第8章：性能分析工具链", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC8%E7%AB%A0-%E6%80%A7%E8%83%BD%E5%88%86%E6%9E%90%E5%B7%A5%E5%85%B7%E9%93%BE/", readingGoal: "用 Nsight 与固定 benchmark 口径封版项目 A；避免只报一个没有上下文的加速倍数。" },
  { title: "第7章：AI 编译器", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC7%E7%AB%A0-ai%E7%BC%96%E8%AF%91%E5%99%A8/", readingGoal: "用 AI 编译器端到端流水线约束项目 B 的前端、IR、Pass、schedule 和运行时边界。" },
  { title: "第7章：AI 编译器", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC7%E7%AB%A0-ai%E7%BC%96%E8%AF%91%E5%99%A8/", readingGoal: "将图优化的概念落实为可保存 IR、可回归的 TensorIR lowering 和 schedule。" },
  { title: "第7章：AI 编译器", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC7%E7%AB%A0-ai%E7%BC%96%E8%AF%91%E5%99%A8/", readingGoal: "用算子融合的收益和风险约束项目 B 的 pattern、dynamic shape guard 与 fallback。" },
  { title: "第2章：推理引擎核心技术", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E5%9B%9B-%E6%8E%A8%E7%90%86%E4%BC%98%E5%8C%96/%E7%AC%AC2%E7%AB%A0-%E6%8E%A8%E7%90%86%E5%BC%95%E6%93%8E%E6%A0%B8%E5%BF%83%E6%8A%80%E6%9C%AF/%E7%AC%AC2%E7%AB%A0-%E6%8E%A8%E7%90%86%E5%BC%95%E6%93%8E%E6%A0%B8%E5%BF%83%E6%8A%80%E6%9C%AF/", readingGoal: "把推理引擎的调度、KV Cache 与后端选择接到项目 B runtime，保留失败诊断和 fallback。" },
  { title: "第8章：性能分析工具链", url: "https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/%E7%AC%AC8%E7%AB%A0-%E6%80%A7%E8%83%BD%E5%88%86%E6%9E%90%E5%B7%A5%E5%85%B7%E9%93%BE/", readingGoal: "以端到端 benchmark 而非单个 kernel 的偶然数据，完成项目 B 封版。" },
  { title: "AI Infra 学习路线", url: "https://caomaolufei.github.io/AIInfraGuide/guides/ai-infra%E5%AD%A6%E4%B9%A0%E8%B7%AF%E7%BA%BF/", readingGoal: "从路线中选择一个与项目相关的小 issue/复现点，练习真实开源协作而不是刷贡献数。" },
  { title: "AI Infra 学习路线", url: "https://caomaolufei.github.io/AIInfraGuide/guides/ai-infra%E5%AD%A6%E4%B9%A0%E8%B7%AF%E7%BA%BF/", readingGoal: "按“计算、通信、显存”的取舍审计两个项目与简历证据。" },
  { title: "AI Infra 学习路线", url: "https://caomaolufei.github.io/AIInfraGuide/guides/ai-infra%E5%AD%A6%E4%B9%A0%E8%B7%AF%E7%BA%BF/", readingGoal: "用路线的分层知识树复盘 Hot100、GPU、编译器和项目，补最影响面试的缺口。" },
];

const dayNames = ["一", "二", "三", "四", "五", "六", "日"];
const timePlan = ["理论 45m · 编码 105m · 记录 30m", "复习 20m · 编码 130m · 测试 30m", "理论 30m · 实验 120m · 复盘 30m", "编码 120m · 调试 40m · 记录 20m", "实验 120m · 性能分析 40m · 记录 20m", "视频学习 60m · 复写代码 90m · 验证 30m", "视频补漏 60m · 随堂实验 60m，其余时间休息"];
const acceptancePlan = [
  "验收：写下 5 条核心概念，并附 1 个可运行最小示例。",
  "验收：代码通过编译，覆盖正常路径与至少 2 个边界条件。",
  "验收：保存实验输入、输出和错误记录，能够从零复现。",
  "验收：提交可读代码、单元测试，并解释一次关键调试过程。",
  "验收：记录 baseline、硬件、输入规模、P50 与误差范围。",
  "验收：完成专题视频，复写关键代码，并用最小实验验证 1 个结论。",
  "验收：任选下方 1 个视频章节，整理 3 条摘要并完成 1 个随堂实验。",
];
const phaseResources = [
  [
    { label: "C++｜引用做函数参数（P91）", url: "https://www.bilibili.com/video/BV1et411b73Z/?p=91" },
    { label: "C++｜深拷贝与浅拷贝（P110）", url: "https://www.bilibili.com/video/BV1et411b73Z/?p=110" },
    { label: "视频｜CMake、编译与 Git", url: "https://www.bilibili.com/video/BV1WVtjejE82/" },
    { label: "STL｜vector 容量增长（P43）", url: "https://www.bilibili.com/video/BV1PW411t7Xg/?p=43" },
    { label: "CSAPP｜程序性能优化（P5）", url: "https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=5" },
  ],
  [
    { label: "CUDA｜GPU 架构（P5）", url: "https://www.bilibili.com/video/BV1LE411p7ej/?p=5" },
    { label: "CUDA｜编程模型（P6）", url: "https://www.bilibili.com/video/BV1LE411p7ej/?p=6" },
    { label: "并行计算｜Reduction/Scan（P4）", url: "https://www.bilibili.com/video/BV1yt411w7h8/?p=4" },
    { label: "视频｜CUDA 内存模型与线程束", url: "https://www.bilibili.com/video/BV1jX4y1w7Um/" },
    { label: "视频｜CUDA GEMM 八步优化", url: "https://www.bilibili.com/video/BV1bH4y1w7mm/" },
    { label: "视频｜Nsight 性能分析实战", url: "https://www.bilibili.com/video/BV14RU6BmE5u/" },
    { label: "视频｜FlashAttention CUDA 编程", url: "https://www.bilibili.com/video/BV1wZ421s7y8/" },
  ],
  [
    { label: "PyTorch｜Tensor 基础（P2）", url: "https://www.bilibili.com/video/BV1Vf4y1E7qT/?p=2" },
    { label: "PyTorch｜Autograd（P3）", url: "https://www.bilibili.com/video/BV1Vf4y1E7qT/?p=3" },
    { label: "视频｜PyTorch Autograd 与源码", url: "https://www.bilibili.com/video/BV1vL411u7bL/" },
    { label: "视频｜FX 与 Lazy Tensor", url: "https://www.bilibili.com/video/BV1944y1m7fU/" },
    { label: "视频｜PyTorch 2.0 与 torch.compile", url: "https://www.bilibili.com/video/BV1p84y1675B/" },
    { label: "视频｜PyTorch Dispatcher", url: "https://www.bilibili.com/video/BV1L3411d7SM/" },
    { label: "视频｜ONNX Runtime", url: "https://www.bilibili.com/video/BV1ym421W71r/" },
  ],
  [
    { label: "视频｜AI 编译器基础", url: "https://www.bilibili.com/video/BV1D84y1y73v/" },
    { label: "视频｜AI 编译器前端", url: "https://www.bilibili.com/video/BV1ne411w7n2/" },
    { label: "视频｜AI 编译器后端与 TVM Auto-Tuning", url: "https://www.bilibili.com/video/BV1uA411D7JF/" },
    { label: "视频｜AI 编译器与 TPU-MLIR 系列", url: "https://www.bilibili.com/video/BV1V24y1h7J1/" },
    { label: "视频｜FlashAttention 原理", url: "https://www.bilibili.com/video/BV1UT421k7rA/" },
    { label: "视频｜vLLM 与 PagedAttention", url: "https://www.bilibili.com/video/BV1XfQVYhEJZ/" },
    { label: "视频｜PagedAttention 核心思想", url: "https://www.bilibili.com/video/BV1om421s7Px/" },
  ],
  [
    { label: "视频｜MLIR Toy Tutorial 概述", url: "https://www.bilibili.com/video/BV1s7411K7rR/" },
    { label: "MLIR｜Basics（P8）", url: "https://www.bilibili.com/video/BV1h14y1J7Gm/?p=8" },
    { label: "MLIR｜Pass Infrastructure（P10）", url: "https://www.bilibili.com/video/BV1h14y1J7Gm/?p=10" },
    { label: "MLIR｜Lowering（P11）", url: "https://www.bilibili.com/video/BV1h14y1J7Gm/?p=11" },
    { label: "视频｜LLVM 架构、Clang 与 IR", url: "https://www.bilibili.com/video/BV1CG4y1V7Dn/" },
    { label: "视频｜LLVM 编译器入门", url: "https://www.bilibili.com/video/BV1tN411B71r/" },
    { label: "视频｜LLVM 代码生成与 SSA", url: "https://www.bilibili.com/video/BV1KvoUYYEaK/" },
  ],
];
const phaseReferences = [
  [
    { label:"C++ 语言参考", url:"https://en.cppreference.com/w/cpp/language/" },
    { label:"C++ 内存管理", url:"https://en.cppreference.com/w/cpp/memory" },
    { label:"CMake 官方教程", url:"https://cmake.org/cmake/help/latest/guide/tutorial/" },
    { label:"GoogleTest Primer", url:"https://google.github.io/googletest/primer.html" },
    { label:"CSAPP 课程与 Labs", url:"https://csapp.cs.cmu.edu/3e/labs.html" },
  ],
  [
    { label:"CUDA Programming Guide", url:"https://docs.nvidia.com/cuda/cuda-programming-guide/" },
    { label:"CUDA Best Practices", url:"https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/" },
    { label:"Nsight Compute Profiling Guide", url:"https://docs.nvidia.com/nsight-compute/ProfilingGuide/" },
    { label:"Triton 官方教程", url:"https://triton-lang.org/main/getting-started/tutorials/" },
  ],
  [
    { label:"PyTorch FX 文档", url:"https://docs.pytorch.org/docs/stable/fx.html" },
    { label:"torch.compiler 指南", url:"https://docs.pytorch.org/docs/main/user_guide/torch_compiler/torch.compiler.html" },
    { label:"PyTorch Custom Ops", url:"https://docs.pytorch.org/tutorials/advanced/custom_ops_landing_page.html" },
    { label:"ONNX IR 介绍", url:"https://onnx.ai/onnx/intro/" },
  ],
  [
    { label:"TVM 教程索引", url:"https://tvm.apache.org/docs/tutorial/index.html" },
    { label:"TensorIR 深入", url:"https://tvm.apache.org/docs/deep_dive/tensor_ir/index.html" },
    { label:"Relax 深入", url:"https://tvm.apache.org/docs/deep_dive/relax/index.html" },
    { label:"MetaSchedule 教程", url:"https://tvm.apache.org/docs/deep_dive/tensor_ir/tutorials/meta_schedule.html" },
  ],
  [
    { label:"MLIR Toy Tutorial", url:"https://mlir.llvm.org/docs/Tutorials/Toy/" },
    { label:"MLIR Pass Management", url:"https://mlir.llvm.org/docs/PassManagement/" },
    { label:"MLIR Pattern Rewriter", url:"https://mlir.llvm.org/docs/PatternRewriter/" },
    { label:"LLVM 前端教程", url:"https://llvm.org/docs/tutorial/MyFirstLanguageFrontend/index.html" },
  ],
];
const legacyWeekLearningResources = [
  { week:1, videos:[
    { label:"数组定义（P42）", url:"https://www.bilibili.com/video/BV1et411b73Z/?p=42" },
    { label:"函数定义（P50）", url:"https://www.bilibili.com/video/BV1et411b73Z/?p=50" },
    { label:"引用做参数（P91）", url:"https://www.bilibili.com/video/BV1et411b73Z/?p=91" },
    { label:"类与封装（P99）", url:"https://www.bilibili.com/video/BV1et411b73Z/?p=99" },
    { label:"CMake、编译与 Git", url:"https://www.bilibili.com/video/BV1WVtjejE82/" },
  ], references:[
    { label:"C++ 函数参考", url:"https://en.cppreference.com/w/cpp/language/functions" },
    { label:"C++ 容器参考", url:"https://en.cppreference.com/w/cpp/container" },
    { label:"CMake 官方教程", url:"https://cmake.org/cmake/help/latest/guide/tutorial/" },
    { label:"GoogleTest Primer", url:"https://google.github.io/googletest/primer.html" },
  ]},
  { week:2, videos:[
    { label:"堆区（P87）", url:"https://www.bilibili.com/video/BV1et411b73Z/?p=87" },
    { label:"new 运算符（P88）", url:"https://www.bilibili.com/video/BV1et411b73Z/?p=88" },
    { label:"构造与析构（P106）", url:"https://www.bilibili.com/video/BV1et411b73Z/?p=106" },
    { label:"深拷贝与浅拷贝（P110）", url:"https://www.bilibili.com/video/BV1et411b73Z/?p=110" },
  ], references:[
    { label:"对象生命周期", url:"https://en.cppreference.com/w/cpp/language/lifetime" },
    { label:"RAII", url:"https://en.cppreference.com/w/cpp/language/raii" },
    { label:"智能指针", url:"https://en.cppreference.com/w/cpp/memory" },
    { label:"移动构造", url:"https://en.cppreference.com/w/cpp/language/move_constructor" },
  ]},
  { week:3, videos:[
    { label:"函数模板（P1）", url:"https://www.bilibili.com/video/BV1PW411t7Xg/?p=1" },
    { label:"类模板（P6）", url:"https://www.bilibili.com/video/BV1PW411t7Xg/?p=6" },
    { label:"模板分文件问题（P13）", url:"https://www.bilibili.com/video/BV1PW411t7Xg/?p=13" },
    { label:"vector 容量增长（P43）", url:"https://www.bilibili.com/video/BV1PW411t7Xg/?p=43" },
  ], references:[
    { label:"模板参考", url:"https://en.cppreference.com/w/cpp/language/templates" },
    { label:"std::vector", url:"https://en.cppreference.com/w/cpp/container/vector" },
    { label:"算法库", url:"https://en.cppreference.com/w/cpp/algorithm" },
    { label:"clang-format 文档", url:"https://clang.llvm.org/docs/ClangFormat.html" },
  ]},
  { week:4, videos:[
    { label:"并发基础（CSAPP P12）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=12" },
    { label:"程序性能优化（CSAPP P5）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=5" },
    { label:"CMake、编译与 Git", url:"https://www.bilibili.com/video/BV1WVtjejE82/" },
  ], references:[
    { label:"C++ 并发支持", url:"https://en.cppreference.com/w/cpp/thread" },
    { label:"Google Benchmark 指南", url:"https://google.github.io/benchmark/user_guide.html" },
    { label:"CMake Presets", url:"https://cmake.org/cmake/help/latest/manual/cmake-presets.7.html" },
    { label:"GitHub README 指南", url:"https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes" },
  ]},
  { week:5, videos:[
    { label:"数据表示（CSAPP P2）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=2" },
    { label:"机器级表示（CSAPP P3）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=3" },
    { label:"链接（CSAPP P7）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=7" },
  ], references:[
    { label:"CSAPP 官方站", url:"https://csapp.cs.cmu.edu/" },
    { label:"Compiler Explorer", url:"https://godbolt.org/" },
    { label:"System V AMD64 ABI", url:"https://gitlab.com/x86-psABIs/x86-64-ABI" },
  ]},
  { week:6, videos:[
    { label:"存储层次（CSAPP P6）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=6" },
    { label:"程序性能优化（CSAPP P5）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=5" },
  ], references:[
    { label:"CSAPP Labs", url:"https://csapp.cs.cmu.edu/3e/labs.html" },
    { label:"Google Benchmark 指南", url:"https://google.github.io/benchmark/user_guide.html" },
  ]},
  { week:7, videos:[
    { label:"处理器体系结构（CSAPP P4）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=4" },
    { label:"程序性能优化（CSAPP P5）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=5" },
  ], references:[
    { label:"Intel Intrinsics Guide", url:"https://www.intel.com/content/www/us/en/docs/intrinsics-guide/index.html" },
    { label:"Clang Vectorizers", url:"https://llvm.org/docs/Vectorizers.html" },
  ]},
  { week:8, videos:[
    { label:"并发（CSAPP P12）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=12" },
    { label:"GPU/CPU 并行模型（P1）", url:"https://www.bilibili.com/video/BV1LE411p7ej/?p=1" },
  ], references:[
    { label:"C++ Memory Model", url:"https://en.cppreference.com/w/cpp/language/memory_model" },
    { label:"C++ 原子操作", url:"https://en.cppreference.com/w/cpp/atomic" },
  ]},
  { week:9, videos:[
    { label:"虚拟内存（CSAPP P9）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=9" },
    { label:"系统概览（CSAPP P1）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=1" },
  ], references:[
    { label:"CSAPP Malloc Lab", url:"https://csapp.cs.cmu.edu/3e/malloclab.pdf" },
    { label:"C++ 对齐支持", url:"https://en.cppreference.com/w/cpp/memory" },
  ]},
  { week:10, videos:[
    { label:"虚拟内存（CSAPP P9）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=9" },
    { label:"程序性能优化（CSAPP P5）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=5" },
  ], references:[
    { label:"mimalloc 技术报告", url:"https://www.microsoft.com/en-us/research/publication/mimalloc-free-list-sharding-in-action/" },
    { label:"Google Benchmark 指南", url:"https://google.github.io/benchmark/user_guide.html" },
  ]},
  { week:11, videos:[
    { label:"程序性能优化（CSAPP P5）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=5" },
    { label:"存储层次（CSAPP P6）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=6" },
  ], references:[
    { label:"Google Benchmark 指南", url:"https://google.github.io/benchmark/user_guide.html" },
    { label:"Linux perf Wiki", url:"https://perf.wiki.kernel.org/index.php/Main_Page" },
  ]},
  { week:12, videos:[
    { label:"程序性能优化（CSAPP P5）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=5" },
    { label:"存储层次（CSAPP P6）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=6" },
    { label:"并发（CSAPP P12）", url:"https://www.bilibili.com/video/BV1RK4y1R7Kf/?p=12" },
  ], references:[
    { label:"xtensor 文档", url:"https://xtensor.readthedocs.io/" },
    { label:"Eigen 文档", url:"https://eigen.tuxfamily.org/dox/" },
    { label:"Google Benchmark 指南", url:"https://google.github.io/benchmark/user_guide.html" },
  ]},
];
// 冲刺版只保留与当前周直接相关的入口，避免旧 50 周资源错配到新任务。
const weekLearningResources = [
  { week:5, videos:[{label:"AIInfraGuide｜Transformer 与 AI Infra",url:"https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%B8%80-%E5%89%8D%E7%BD%AE%E7%9F%A5%E8%AF%86/transformer/31-ai-infra%E5%B7%A5%E7%A8%8B%E5%B8%88%E4%B8%BA%E4%BB%80%E4%B9%88%E5%BF%85%E9%A1%BB%E6%87%82transformer/"}], references:[{label:"AIInfraGuide｜GPU 基础",url:"https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%B8%80-%E5%89%8D%E7%BD%AE%E7%9F%A5%E8%AF%86/gpu/gpu-basics/"},{label:"tiny-gpu",url:"https://github.com/adam-maj/tiny-gpu"}] },
  { week:6, videos:[{label:"AIInfraGuide｜CUDA 快速入门",url:"https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/cuda%E7%BC%96%E7%A8%8B%E5%85%A5%E9%97%A8%E6%8C%87%E5%8D%97/"}], references:[{label:"CUDA 编程模型",url:"https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E4%BA%8C-cuda%E7%BC%96%E7%A8%8B%E4%B8%8E%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/12-cuda%E7%BC%96%E7%A8%8B%E6%A8%A1%E5%9E%8B/"},{label:"CUDA Programming Guide",url:"https://docs.nvidia.com/cuda/cuda-programming-guide/"}] },
  { week:13, videos:[{label:"Engineering a Compiler｜官方图书页",url:"https://www.elsevier.com/books/engineering-a-compiler/cooper/978-0-12-815088-4"}], references:[{label:"LLVM IR 参考",url:"https://llvm.org/docs/LangRef.html"},{label:"MLIR 文档",url:"https://mlir.llvm.org/docs/"}] },
  { week:14, videos:[{label:"MLIR Toy Tutorial",url:"https://mlir.llvm.org/docs/Tutorials/Toy/"}], references:[{label:"tiny-gpu-compiler",url:"https://github.com/gautam1858/tiny-gpu-compiler"},{label:"MLIR Pattern Rewrites",url:"https://mlir.llvm.org/docs/PatternRewriter/"}] },
  { week:15, videos:[{label:"TVM 文档｜Get Started",url:"https://tvm.apache.org/docs/get_started/"}], references:[{label:"Apache TVM",url:"https://github.com/apache/tvm"},{label:"TVM Relax 文档",url:"https://tvm.apache.org/docs/deep_dive/relax/"}] },
  { week:17, videos:[{label:"AIInfraGuide｜分布式训练路线",url:"https://caomaolufei.github.io/AIInfraGuide/guides/ai-infra%E5%AD%A6%E4%B9%A0%E8%B7%AF%E7%BA%BF/"}], references:[{label:"PyTorch Distributed Overview",url:"https://docs.pytorch.org/docs/stable/distributed.html"},{label:"FSDP 文档",url:"https://docs.pytorch.org/docs/stable/fsdp.html"}] },
  { week:18, videos:[{label:"AIInfraGuide｜Attention 后端与图优化",url:"https://caomaolufei.github.io/AIInfraGuide/guides/%E6%A8%A1%E5%9D%97%E5%9B%9B-%E6%8E%A8%E7%90%86%E4%BC%98%E5%8C%96/%E7%AC%AC2%E7%AB%A0-%E6%8E%A8%E7%90%86%E5%BC%95%E6%93%8E%E6%A0%B8%E5%BF%83%E6%8A%80%E6%9C%AF/25-attention-%E5%90%8E%E7%AB%AF%E4%B8%8E%E5%9B%BE%E4%BC%98%E5%8C%96/"}], references:[{label:"vLLM",url:"https://github.com/vllm-project/vllm"},{label:"FlashInfer",url:"https://github.com/flashinfer-ai/flashinfer"}] },
  { week:19, videos:[{label:"FlashAttention",url:"https://github.com/Dao-AILab/flash-attention"}], references:[{label:"Triton 教程",url:"https://triton-lang.org/main/getting-started/tutorials/"},{label:"CUTLASS",url:"https://github.com/NVIDIA/cutlass"}] },
  { week:23, videos:[{label:"TVM 端到端编译教程",url:"https://tvm.apache.org/docs/tutorials/compile_models/"}], references:[{label:"MLC-LLM",url:"https://github.com/mlc-ai/mlc-llm"},{label:"TVM Runtime",url:"https://tvm.apache.org/docs/arch/runtime.html"}] },
  { week:28, videos:[{label:"TVM Contribute",url:"https://tvm.apache.org/docs/contribute/"}], references:[{label:"vLLM CustomOp",url:"https://github.com/vllm-project/vllm/blob/main/docs/design/custom_op.md"},{label:"NVIDIA TensorIR",url:"https://github.com/NVIDIA/tensor-ir"}] },
];
const openSourceProjects = [
  { phase:1, label:"xtensor-stack/xtensor", url:"https://github.com/xtensor-stack/xtensor", note:"MiniTensor API、shape 与广播参考" },
  { phase:1, label:"google/googletest", url:"https://github.com/google/googletest", note:"C++ 单元测试工程参考" },
  { phase:1, label:"google/benchmark", url:"https://github.com/google/benchmark", note:"C++ 微基准方法" },
  { phase:1, label:"microsoft/mimalloc", url:"https://github.com/microsoft/mimalloc", note:"高性能分配器实现" },
  { phase:2, label:"NVIDIA/CUTLASS", url:"https://github.com/NVIDIA/cutlass", note:"GEMM 与 GPU 模板库" },
  { phase:2, label:"triton-lang/triton", url:"https://github.com/triton-lang/triton", note:"GPU Kernel DSL" },
  { phase:2, label:"Dao-AILab/flash-attention", url:"https://github.com/Dao-AILab/flash-attention", note:"IO-aware attention" },
  { phase:3, label:"pytorch/pytorch", url:"https://github.com/pytorch/pytorch", note:"Dynamo/Inductor/FX 主仓" },
  { phase:3, label:"microsoft/DeepSpeed", url:"https://github.com/microsoft/DeepSpeed", note:"DDP/FSDP/ZeRO 的概念与最小实验参考，不作为主项目替代品" },
  { phase:3, label:"NVIDIA/Megatron-LM", url:"https://github.com/NVIDIA/Megatron-LM", note:"张量/流水线并行原理参考；没有集群证据不在简历宣称熟练" },
  { phase:3, label:"onnx/onnx", url:"https://github.com/onnx/onnx", note:"模型 IR 与工具链" },
  { phase:4, label:"apache/tvm", url:"https://github.com/apache/tvm", note:"张量编译器与运行时" },
  { phase:4, label:"mlc-ai/mlc-llm", url:"https://github.com/mlc-ai/mlc-llm", note:"TVM 体系的 LLM 编译与部署" },
  { phase:4, label:"vllm-project/vllm", url:"https://github.com/vllm-project/vllm", note:"真实推理框架的 custom op 接入" },
  { phase:5, label:"llvm/llvm-project", url:"https://github.com/llvm/llvm-project", note:"LLVM/MLIR 主仓" },
];

function learningResourcesForWeek(week: number, phase: number) {
  return weekLearningResources.find(item=>item.week===week) ?? {
    videos: phaseResources[phase-1],
    references: phaseReferences[phase-1],
  };
}

const jdSignals = [
  { company:"华为", role:"AI 底层软件 / AI 编译优化", skills:"C++、Linux、MLIR/LLVM、图优化、算子融合、代码生成、CUDA/NPU Kernel、Runtime 与 Profiling", url:"https://career.huawei.com/reccampportal/portal5/social-recruitment-detail.html?dataSource=1&jobId=32189" },
  { company:"Apple", role:"On-Device ML Compiler", skills:"MLIR 编译栈、C++、PyTorch、GPU/CPU/NPU kernel 与运行时性能", url:"https://jobs.apple.com/en-us/details/200631247/on-device-ml-compiler-engineer-model-compilation-graphics-games-and-machine-learning" },
  { company:"NVIDIA", role:"GPU-Accelerated System Software", skills:"CUDA、PyTorch、GPU 架构、端到端优化与工程交付", url:"https://jobs.nvidia.com/careers/job/893396498251?domain=nvidia.com&l=en" },
  { company:"Arm", role:"Compiler Engineer", skills:"C/C++、LLVM/GNU、低层软件、体系结构、benchmark 与开源贡献", url:"https://careers.arm.com/job/cambridge/software-engineer-compilers/33099/96158949392" },
];

function day6Knowledge(week: Week) {
  const focus = ["C++ 语义、工具链或体系结构", "CUDA、Nsight 或高性能 kernel", "PyTorch 编译器与计算图", "TVM、FlashAttention 或推理运行时", "MLIR、LLVM 与 lowering"][week.phase-1];
  return `视频专题：围绕「${week.title}」观看 1 节 ${focus} 视频；暂停复写关键代码，画调用链并完成 1 个最小验证实验`;
}

function weekTasks(week: Week & { index: number }, start: string) {
  const closure = `周验收：在干净环境从零运行「${week.output}」；核对本周测试、代表性输入和一项已知限制，并把复现命令写入日志`;
  const base = [...week.days.slice(0,6), closure];
  return base.map((task, day) => `${task}${algorithmSuffix(week.index, day)}`);
}

function algorithmSuffix(week: number, day: number) {
  // Day 9 是 W02-D02：此前的进度不追溯补题，算法从下一天 W02-D03 启动。
  if (week < 2 || (week === 2 && day < 2)) return "";
  if (day === 6) return "；算法｜复盘本周错题 2 道：口述思路、复杂度与边界，不开新题";
  const startSlot = 8; // W02-D03 在每周 6 个主任务中的位置
  const slot = (week - 1) * 6 + day;
  const number = slot - startSlot + 1;
  if (number <= 70) return `；算法｜代码随想录核心 #${number}/70（${carlTopic(number)}）：独立写出 + 记录复杂度和边界`;
  const hot = number - 70;
  if (hot <= 100) return `；算法｜LeetCode Hot 100 #${hot}/100（${hotTopic(hot)}）：独立写出 + 记录复杂度和边界`;
  return "；算法｜Hot100 错题回炉：限时重做 1 题并口述两种解法";
}

function carlTopic(number: number) {
  if (number <= 10) return "数组与二分";
  if (number <= 18) return "链表";
  if (number <= 26) return "哈希与字符串";
  if (number <= 34) return "栈与队列";
  if (number <= 50) return "二叉树";
  if (number <= 60) return "回溯与贪心";
  return "动态规划";
}

function hotTopic(number: number) {
  const topics = ["哈希与双指针", "滑动窗口与子串", "链表", "二叉树", "栈与单调栈", "二分与矩阵", "回溯", "贪心", "动态规划", "图与综合"];
  return topics[Math.min(9, Math.floor((number - 1) / 10))];
}

const detailSteps = [
  "概念准备：先画数据流/对象关系图，列出输入、输出、约束与 3 个易错点。",
  "最小实现：先完成正确但不优化的 baseline，并为正常路径和边界路径写测试。",
  "实验验证：固定随机种子和输入规模，保存命令、日志、误差与失败案例。",
  "源码/调试：沿调用链跟到关键实现，记录断点、IR、profile 或通信 trace。",
  "性能对照：至少运行 30 次，报告 warmup、P50/P95、吞吐、显存和硬件信息。",
  "专题视频：带着 3 个问题观看，暂停复写关键代码，画出数据流/调用链并验证结论。",
  "视频补强：重看薄弱章节，定位到 1 个实验 API，用最小代码验证结论。",
];

const weekFileHints: Record<number, string> = {
  1:"CMakeLists.txt · include/minitensor/tensor.hpp · src/tensor.cpp · tests/test_tensor.cpp",
  2:"include/minitensor/storage.hpp · include/minitensor/tensor_view.hpp · tests/test_storage.cpp",
  3:"include/minitensor/operators.hpp · src/operators.cpp · tests/test_operators.cpp · .clang-format",
  4:"include/minitensor/thread_pool.hpp · benchmarks/matmul_bench.cpp · README.md",
  5:"labs/assembly/*.cpp · labs/assembly/*.s · docs/W05-build-pipeline.md",
  6:"benchmarks/cache_bench.cpp · benchmarks/transpose_bench.cpp · docs/W06-cache.md",
  7:"benchmarks/simd_bench.cpp · include/minitensor/simd.hpp · docs/W07-vectorization.md",
  8:"include/minitensor/thread_pool.hpp · benchmarks/false_sharing.cpp · tests/test_thread_pool.cpp",
  9:"include/minitensor/allocator.hpp · src/allocator.cpp · tests/allocator_traces/",
  10:"src/segregated_allocator.cpp · tests/allocator_traces/ · docs/W10-fragmentation.md",
  11:"benchmarks/harness.hpp · scripts/report_benchmark.py · docs/benchmark-template.md",
  12:"src/matmul.cpp · benchmarks/matmul_bench.cpp · docs/minitensor-v0.2-report.md",
  13:"src/vector_add.cu · tests/test_vector_add.cu · benchmarks/vector_add_bench.cu",
  14:"src/transpose.cu · tests/test_transpose.cu · benchmarks/transpose_bench.cu",
  15:"src/gemm_naive.cu · src/gemm_tiled.cu · tests/test_gemm.cu",
  16:"src/gemm_register.cu · benchmarks/gemm_bench.cu · docs/W16-roofline.md",
  17:"src/reduction.cu · src/softmax.cu · tests/test_softmax.cu",
  18:"src/layernorm.cu · tests/test_layernorm.cu · benchmarks/layernorm_bench.cu",
  19:"triton/softmax.py · triton/layernorm.py · tests/test_triton_ops.py",
  20:"benchmarks/run_all.py · docs/cuda-kernels-v1.md · results/W20/",
  21:"autograd/tensor.py · extensions/custom_op.cpp · tests/test_autograd.py",
  22:"passes/conv_bn_relu.py · examples/resnet_fx.py · tests/test_fx_fusion.py",
  23:"onnx_tools/export_resnet.py · onnx_tools/rewrite.py · tests/test_onnx.py",
  24:"compile_labs/quickstart.py · compile_labs/graph_breaks.py · docs/W24-stack.md",
  25:"compile_labs/dynamo_guards.py · compile_labs/bytecode.py · docs/W25-debug.md",
  26:"compile_labs/aot_autograd.py · compile_labs/decomposition.py · tests/test_aot.py",
  27:"compile_labs/inductor_codegen.py · generated/ · docs/W27-regression.md",
  28:"backend/backend.py · backend/passes.py · tests/test_backend.py",
  29:"passes/conv_bn_relu.py · benchmarks/fusion_bench.py · docs/fusion-pass-v1.md",
  30:"docs/RFC.md · docs/support-matrix.md · benchmarks/protocol.md · pyproject.toml",
  31:"operators/softmax/ · operators/rmsnorm/ · tests/test_norm_ops.py",
  32:"operators/gemm/ · operators/mlp/ · benchmarks/mlp_bench.py",
  33:"operators/rope/ · operators/attention/ · docs/attention-io.md",
  34:"bindings/torch_ops.py · integrations/vllm_demo.py · tests/test_integration.py",
  35:"README.md · scripts/reproduce.py · results/v1.0/ · docs/interview-qa.md",
  36:"compiler/frontend.py · compiler/importer.py · docs/compiler-rfc.md · tests/test_import.py",
  37:"compiler/tir_kernels.py · compiler/schedules.py · tests/test_tir.py",
  38:"compiler/passes/fusion.py · tests/ir/ · tests/test_fusion.py",
  39:"compiler/dynamic_shapes.py · compiler/tuning.py · tuning_db/ · tests/test_dynamic.py",
  40:"runtime/backend.py · runtime/external_codegen.py · tests/test_runtime.py",
  41:"models/decoder_block.py · compiler/kv_cache.py · docs/attention-memory.md",
  42:"integrations/vllm_backend.py · integrations/torch_backend.py · tests/test_e2e.py",
  43:"compiler/pipeline.py · tests/test_pipeline.py · benchmarks/e2e.py",
  44:"upstream/issue.md · upstream/reproducer.py · README.md · results/v1.0/",
  45:"mlir/test/ · mlir/examples/toy/ · docs/W45-mlir-basics.md",
  46:"mlir/lib/Transforms/Canonicalize.cpp · mlir/test/Transforms/transpose.mlir",
  47:"mlir/test/Lowering/ · docs/W47-lowering.md · saved_ir/",
  48:"gpu-operator-lab/README.md · transformer-compiler/README.md · portfolio/checklist.md",
  49:"portfolio/resume.md · portfolio/project-qa.md · portfolio/demo-scripts/",
  50:"portfolio/jd-matrix.csv · portfolio/mock-interviews/ · portfolio/applications.md",
};

const weekKnowledgePoints: Record<number, string[]> = {
  1:["CMake 中 library、executable、test target 的区别，以及 target_link_libraries 如何连接它们","头文件声明与 .cpp 定义的分工；能区分编译错误、头文件查找错误和链接错误","class 的 public 接口、构造函数、成员函数、namespace 与 const 成员函数","out-of-source build、Debug 构建、CTest 注册和测试发现的完整流程"],
  2:["RAII 如何把资源生命周期绑定到对象生命周期，为什么析构函数必须可靠释放资源","深拷贝、浅拷贝、移动构造、移动赋值和 std::move 的真实语义","shared_ptr 的共享所有权、引用计数成本，以及 Tensor view 为什么需要共享 Storage","shape、stride、offset、contiguous 与 view 之间的关系"],
  3:["函数模板和类模板的实例化时机，以及模板实现为何通常放在头文件","vector、span、algorithm/ranges 的所有权与非拥有视图差异","逐元素算子、标量算子和二维广播的 shape 推导规则","浮点误差阈值、参数化测试、异常安全与 API 约束"],
  4:["互斥锁、条件变量、任务队列和线程停止协议如何组成固定线程池","线程池中的异常传播、空队列等待、析构和竞态条件","矩阵乘法按输出行分块时的任务粒度、负载均衡和扩展性","benchmark 的 warmup、重复次数、P50 与硬件环境记录"],
  5:["补码、整数溢出和 IEEE 754 浮点表示如何影响张量计算","x86-64 寄存器、调用约定、栈帧和函数参数传递","-O0 与 -O3 下内联、循环优化、模板实例化和 move 的汇编差异","预处理、编译、汇编、静态/动态链接各自产生什么文件"],
  6:["L1/L2/L3、cache line、组相联、替换和 TLB 的基本工作方式","shape、stride 和行/列优先遍历如何决定空间局部性","blocked transpose 的 tile size 为什么会改变 cache miss 和带宽","工作集大小、缓存容量、miss rate 与延迟之间的因果链"],
  7:["处理器流水线、数据相关、乱序执行和分支预测的性能影响","branchless 写法何时有效，何时会增加无用计算","编译器自动向量化的前提、vectorization report 和阻碍因素","AVX2/AVX-512 intrinsic、内存对齐和尾部元素处理"],
  8:["C++ memory model、happens-before、data race 和原子操作语义","mutex、condition_variable 与 atomic 的适用边界","false sharing 如何由 cache line 共享引起，以及 padding 的作用","静态分块、动态任务粒度与线程池调度开销"],
  9:["分配器块头、块脚、对齐、prologue 与 epilogue 的布局","first-fit、块分割、相邻块合并和外部碎片","隐式空闲链表的遍历成本与堆不变量","heap checker 如何发现越界、重复块和未合并空闲块"],
  10:["显式双向空闲链表的插入、删除和一致性维护","size class 与 segregated free list 的空间—时间权衡","吞吐、峰值占用、内部/外部碎片的不同含义","真实 Tensor allocation trace 与通用 malloc trace 的差异"],
  11:["延迟、吞吐、带宽、FLOPS、利用率和显存的口径区别","warmup、重复、P50/P95、方差和异常值处理","Roofline 中算术强度、带宽上限和算力上限","可复现实验必须固定的硬件、软件、输入、随机种子和计时边界"],
  12:["Tensor、Storage、Operator、ThreadPool、Allocator 的模块边界","naive、tiled、parallel matmul 的算法与访存差异","tile、线程数、shape 扫描如何形成可信性能曲线","与 Eigen/PyTorch CPU 对照时如何控制变量并诚实描述限制"],
  13:["SIMT、warp、grid、block、thread 的层级和索引映射","host/device 内存分配、拷贝和 kernel launch 生命周期","grid-stride loop、边界保护与统一 CUDA 错误检查","H2D、D2H、kernel 时间和有效带宽的分离测量"],
  14:["global、shared、register、constant memory 的容量和访问特征","coalesced memory access 与矩阵转置读写模式","shared-memory tiling 和 bank conflict 的来源","padding 如何消除 bank conflict，以及 Nsight Compute 如何验证"],
  15:["GEMM 的 M/N/K 索引、数据布局和边界条件","shared-memory tiled GEMM 的加载、同步和计算阶段","非 tile 整倍数 shape 的保护与浮点误差检查","CUDA Events 计时、GFLOPS 计算和 cuBLAS baseline"],
  16:["register blocking、每线程多输出和指令级并行","occupancy、寄存器压力、shared memory 与 block 配置的权衡","FP16/BF16 输入、FP32 累加与 Tensor Core/WMMA/CUTLASS 路径的精度和对齐约束","PTX/SASS、资源报告和 Roofline 对瓶颈的定位"],
  17:["树形归约、shared-memory reduction 和多 block 合并","warp shuffle 与 warp/block reduce 的正确写法","softmax 减 max 的数值稳定性和误差来源","online softmax 如何减少访存遍数并保持稳定"],
  18:["LayerNorm 的均值、方差、epsilon、gamma 和 beta","Welford 算法相对两遍统计的数值与访存特点","统计、归一化、仿射融合对 kernel launch 和显存读写的影响","hidden size、block 配置、dtype 与吞吐之间的关系"],
  19:["Triton 的 program_id、block、mask 和指针算术","Triton reduction、num_warps 与 autotune 配置","CUDA、Triton、PyTorch baseline 的公平比较方式","高层 Kernel DSL 在开发效率、可控性和可移植性上的取舍"],
  20:["统一 correctness/performance benchmark harness 的职责","Nsight Systems 全局时间线与 Nsight Compute 单 kernel 指标的分工","从 baseline、瓶颈、优化到证据的完整性能叙事","版本冻结、环境记录、结果图表和可复现发布"],
  21:["Autograd 拓扑排序、requires_grad、grad_fn 和梯度累积","add/mul/matmul backward 的链式法则与梯度检查","PyTorch Dispatcher 的算子 schema、dispatch key 和 kernel 选择","C++/CUDA extension 从 Python 调用到原生 kernel 的路径","DDP 的 rank、process group、gradient bucket 与 AllReduce 时机；它不等于模型并行或显存分片"],
  22:["FX symbolic_trace、Graph、Node、GraphModule 的职责","模式匹配、节点替换、死代码清理和图合法性","eval 模式 BN folding 的数学推导与适用条件","融合前后的数值一致性、节点数和 latency 验证"],
  23:["ONNX protobuf、opset、initializer、value_info 和 graph","模型导出、checker、shape inference 与动态维度","ONNX Runtime 与 PyTorch 输出对齐和误差容限","Netron 可视化、算子统计与安全图改写"],
  24:["TorchDynamo、AOTAutograd、Inductor、Triton 的分层职责","graph capture、guards、graph break 和 recompilation","冷启动编译时间与稳态执行时间的区别","dynamic shapes、显存和 generated code 的观察方法"],
  25:["Python bytecode、frame evaluation 与 FX graph 捕获","guard 的生成、缓存命中和失败重编译","数据依赖控制流、Python side effect 与 graph break","Dynamo 日志、最小复现和问题定位流程"],
  26:["AOTAutograd 的前向/反向联合捕获与 saved tensor","functionalization 如何处理 mutation 和 view","operator decomposition 如何把复合算子展开为基础算子","训练编译中的重计算、内存占用和融合权衡","DDP 与 FSDP 在参数、梯度和 optimizer state 的复制/分片差异；最小实验不代表千卡训练经验"],
  27:["Inductor 如何把 FX graph 降到生成的 Triton/C++ kernel","pointwise fusion 与 reduction schedule 的代码结构","autotune、缓存目录、shape guard 和代码特化","生成代码变化与性能回归之间的定位方法"],
  28:["torch.compile backend 的输入输出协议和 GraphModule 生命周期","图打印、计时、pass pipeline 与 fallback","常量折叠、冗余算子消除和图正确性","unsupported op、动态 shape 和回归测试设计"],
  29:["融合 Pass 的支持矩阵、正例、负例和回退条件","ResNet 子图模式在 eval/train、dtype、shape 下的差异","kernel launch、访存次数和端到端 latency 的关系","可复现 benchmark dashboard 与性能结论边界"],
  30:["项目 RFC 中问题、目标用户、非目标和验收指标","算子库 API、目录分层、dispatch 和支持矩阵","硬件、shape、dtype、精度阈值与 benchmark 协议","PyTorch、CUTLASS、Triton baseline 的统一结果格式"],
  31:["Softmax/RMSNorm 在 FP32/FP16 与极值输入下的数值风险","naive、shared、warp、Triton 多实现的 dispatch 条件","非对齐 shape、向量化访问和尾部 mask","correctness matrix、误差统计和性能回归"],
  32:["Transformer MLP 的典型 M/N/K shape 和算量","register-blocked GEMM、mainloop 与数据复用","bias+GELU/SwiGLU epilogue fusion 的收益来源","cuBLAS、CUTLASS、Triton 在不同规模下的性能边界"],
  33:["RoPE 的旋转位置编码数学、配对维度和数据布局","prefill 与 decode 的 shape、并行度和瓶颈差异","KV Cache 字节数、连续/分页布局和访问局部性","weight-only INT8/KV Cache 量化的显存—误差—带宽取舍与适用边界","FlashAttention 的 IO-aware 思路与 attention 热点"],
  34:["torch.library/C++ extension 的 schema、注册和 dispatch","fake/meta kernel 与 torch.compile 兼容性","能力判断、fallback、异常诊断和动态 shape","单 kernel 加速如何传递或无法传递到端到端收益"],
  35:["API、支持矩阵、环境锁定和一键复现脚本","correctness/performance regression 与结果版本管理","README 架构图、优化演进、失败案例和限制","源码讲解中问题、基线、优化、证据和取舍的表达"],
  36:["TVM IRModule、Relax、TensorIR、Runtime 的分层","PyTorch/ONNX 到 Relax 的导入和规范化","MLP/RMSNorm 子图的算子、shape 与 dtype 表示","eager、torch.compile、TVM baseline 的可比性"],
  37:["TVMScript PrimFunc、block、buffer 和迭代变量","split、reorder、cache_read、cache_write 等 schedule primitive","block/thread 绑定、cooperative fetch、向量化和寄存器分块","schedule legality 与生成 CUDA 代码的对应关系"],
  38:["DPL 模式描述、dataflow block 和子图边界","模式匹配、IR rewrite、前后 IR 保存和结构验证","dtype、layout、shape 支持条件与混合子图 fallback","融合对 kernel 数、访存和数值结果的影响"],
  39:["ShapeExpr、symbolic variable 与动态 shape 约束","specialization、guard、recompile 的适用边界","MetaSchedule 的 design space、runner、database 和 cost model","训练 shape、top-k trace 与 holdout shape 的泛化验证"],
  40:["PackedFunc、NDArray、Device API 和执行器调用链","BYOC/external codegen 的分区、能力检查和外部 kernel 调用","编译、加载、首轮、稳态 latency 的拆分","版本错配、缺算子、OOM 与 fallback 的错误诊断"],
  41:["decoder block 中 RMSNorm、QKV、RoPE、Attention 的 shape 流","prefill/decode 的算量、访存和并行度","连续与分页 KV Cache 的布局和容量代价","融合、内存规划、kernel 数和端到端 latency"],
  42:["vLLM custom op 或 PyTorch backend 的真实接入点","自定义 RMSNorm/Softmax/TIR/Triton kernel 的调用路径","能力检查、fallback、数值一致性与回归测试","调度、Python、launch 开销如何吞没单 kernel 收益"],
  43:["前端导入、规范化、融合、TIR lowering、schedule、runtime 的完整 pipeline","Pass 之间的输入输出不变量和错误诊断","动态 shape、unsupported op 与 fallback 的系统设计","三组模型/shape 的端到端测试和性能报告"],
  44:["开源 issue 筛选、最小复现和根因定位","目标测试、benchmark 与修复边界","commit、PR 描述、Code Review 和维护者反馈","上游贡献如何反哺本地项目的工程质量"],
  45:["MLIR operation、value、type、attribute、region、block 与 SSA","Dialect 如何定义领域语义，TableGen 如何生成 Op 基础代码","Toy AST 到 MLIR 的前端转换路径","通用格式、自定义格式与 IR round-trip"],
  46:["RewritePattern、matchAndRewrite 和 pattern benefit","canonicalization、fold 与普通 pass 的职责区别","PassManager、analysis preservation 和 pipeline","FileCheck 正例/负例与 transpose(transpose(x)) 消除"],
  47:["affine、scf、memref 与 LLVM dialect 的层次","conversion target、legality 和 type converter","逐层 lowering 时操作、类型和内存表示的变化","为什么不同优化应放在不同 IR 层级"],
  48:["陌生人复现需要的环境、命令、测试、数据和限制","API、测试、benchmark、框架接入和版本锁定审计","性能图表的硬件、输入、warmup 和统计口径","死代码、大文件、硬编码路径和工程整洁度"],
  49:["简历项目描述中的问题、动作、量化结果和技术取舍","2/5/10 分钟项目叙事的不同信息密度","源码、性能、系统设计和失败案例的追问准备","STAR 结构与避免“精通、负责”等无证据表述"],
  50:["JD 技能要求到项目证据的映射","限时 C++/LeetCode 的正确性、复杂度和表达","白板 reduction/LayerNorm 的并行设计与边界","torch.compile、Relax/TIR、MLIR lowering 的系统化讲解与面试复盘"],
};

function executionWorkspace(week: number) {
  if (week <= 4) return "ai-compiler-year-one/projects/minitensor";
  if (week === 5) return "ai-compiler-year-one/labs/transformer-gpu";
  if (week <= 9) return "ai-compiler-year-one/projects/cuda-kernels";
  if (week <= 12) return "ai-compiler-year-one/projects/compiler-playground";
  if (week === 13) return "ai-compiler-year-one/labs/compiler-core";
  if (week === 14) return "ai-compiler-year-one/projects/mlir-toy-lab";
  if (week <= 18) return "ai-compiler-year-one/labs/ai-infra-stack";
  if (week <= 22) return "ai-compiler-year-one/projects/gpu-operator-lab";
  if (week <= 27) return "ai-compiler-year-one/projects/transformer-compiler";
  return "ai-compiler-year-one/portfolio";
}

function validationCommand(week: number) {
  if (week <= 4) return "cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug\ncmake --build build -j\nctest --test-dir build --output-on-failure";
  if (week === 5) return "python labs/transformer/decoder_shapes.py\npython labs/gpu_microarch/kv_cache_bytes.py";
  if (week <= 9) return "cmake -S . -B build -DCMAKE_BUILD_TYPE=Release\ncmake --build build -j\nctest --test-dir build --output-on-failure";
  if (week <= 12) return "python -m pytest -q\npython examples/run_week.py --week CURRENT_WEEK";
  if (week === 13) return "python -m pytest compiler_core -q\npython compiler_core/ir.py --dump-cfg";
  if (week === 14) return "cmake --build build --target check-mlir\nbuild/bin/mlir-opt <当天的 .mlir 文件> --verify-diagnostics";
  if (week <= 18) return "python -m pytest -q\npython examples/run_week.py --week CURRENT_WEEK";
  if (week <= 22) return "python -m pytest -q\npython benchmarks/run.py --quick";
  if (week <= 27) return "python -m pytest tests -q\npython benchmarks/e2e.py --quick";
  return "git status --short\ngit diff --check";
}

function dailyGuide(week: Week & { index: number }, day: number, task: string): DailyGuide {
  const workspace = executionWorkspace(week.index);
  const files = week.files ?? weekFileHints[week.index];
  const note = `docs/learning-log/W${String(week.index).padStart(2,"0")}-D${String(day+1).padStart(2,"0")}.md`;
  const mainTask = task.split("；算法｜")[0];
  const themes = week.knowledge ?? weekKnowledgePoints[week.index];
  const source = aiInfraGuidePlan[week.index - 1];
  const sourceChecks = [
    "用自己的话写出本日概念的定义、输入、输出与一个边界条件",
    "画出它在调用链或数据流中的前后关系，不复制网页原句",
    "说明它牺牲了什么、换来了什么（计算、通信、显存或工程复杂度）",
    "写下代码实验将验证的一个可观察现象",
    "对照实验结果，判断网页中的结论在哪些输入下成立或不成立",
    "把一个公式、伪代码或流程复写成能运行的最小示例",
    "用本周交付物复述这一章的一个结论，并标出仍未解决的问题",
  ];
  const readingStep = `先阅读 AIInfraGuide《${source.title}》（25–35 分钟）：${source.readingGoal}。围绕“${themes[day % themes.length]}”完成：${sourceChecks[day]}；写完再开始编码。`;
  const purposeFrame = [
    "先建立问题边界、接口和术语模型，避免后续实现建立在模糊理解上。",
    "做出正确可运行的 baseline，为后续优化提供不可缺少的正确性参照。",
    "通过实验和边界输入验证你的理解，而不是停留在会复述概念。",
    "沿调用链调试和观察中间状态，训练定位编译器与性能问题的能力。",
    "把结果转成可比较的数据，学习用证据判断优化是否真的有效。",
    "用视频补齐当天实现背后的原理，并通过最小实验把知识重新落回代码。",
    "针对本周最薄弱的知识点做一次主动补强，避免带着概念缺口进入下一周。",
  ][day];
  const methodKnowledge = [
    "能画出当天对象、数据或 IR 的输入→处理→输出关系，并说出 2 个边界条件。",
    "能解释 baseline 为什么正确、复杂度或资源成本是多少，以及它将与哪个版本比较。",
    "能设计正常、边界、失败三类用例，并知道误差或期望输出如何判定。",
    "能使用断点、日志、IR dump、profile 中至少一种证据定位问题所在层级。",
    "能区分延迟、吞吐、带宽、FLOPS、显存等指标，并记录可复现的测量条件。",
    "能合上视频后独立复写最小示例，并通过改变一个变量验证讲解中的结论。",
    "能用自己的话回答 3 个问题，并指出一个仍未解决、需要下周继续追踪的问题。",
  ][day];
  const purpose = `通过“${mainTask}”，完成「${week.title}」的第 ${day+1} 个能力台阶。${purposeFrame}它直接服务于本周交付物“${week.output}”，并会成为后续主项目可以复用的代码、测试或性能证据。`;
  const knowledgePoints = [
    `核心概念：${themes[day % themes.length]}`,
    `关联知识：${themes[(day + 1) % themes.length]}`,
    `动手能力：能够不照抄答案完成“${mainTask}”，并解释关键数据结构、算法或调用链。`,
    `验证能力：${methodKnowledge}`,
    `工程认知：知道 ${files} 各自负责什么，以及它们如何共同产出“${week.output}”。`,
  ];
  const common = [
    `进入 ${workspace}；第一次做到这里时先创建目录，并确认 git status 没有混入无关修改。`,
    `打开或创建：${files}。先在 ${note} 写清今天的输入、预期输出和 2 个边界情况。`,
    `只完成今天这一件事：${mainTask}。先做正确可运行的最小版本，再考虑优化。`,
    "补 1 个正常用例和至少 2 个边界用例；失败时把报错、原因和修复方式写进当天日志。",
    `运行下方验收命令；把关键输出粘贴到 ${note}，再提交一次只包含当天工作的 Git commit。`,
  ];
  const study = [
    `进入 ${workspace}，打开本周代码和 ${note}；先写下看视频前最想解决的 3 个问题。`,
    "从当天列出的直达视频中选 1 节，看到关键代码时暂停，不倍速跳过示例。",
    `在 ${files} 对应模块旁新建 labs/W${String(week.index).padStart(2,"0")}-D${String(day+1).padStart(2,"0")}，复写一个最小示例并亲自运行。`,
    "改变一个输入、shape、线程数或编译参数，记录变化；不能只留下视频笔记。",
    `在 ${note} 回答开头的 3 个问题，附运行命令、输出和一个仍不理解的问题。`,
  ];
  return {
    workspace,
    files,
    purpose,
    knowledgePoints,
    steps: [readingStep, ...(day >= 5 ? study : common)],
    command: validationCommand(week.index).replace("CURRENT_WEEK", String(week.index)),
    doneWhen: [
      `能合上网页回答本日阅读问题，并在 ${note} 留下自己的答案；不能只粘贴原文。`,
      "当天主程序、实验或 IR 可以从零重新运行，不依赖口头说明。",
      "正常路径通过，并且至少验证 2 个边界情况或失败路径。",
      `存在当天日志 ${note}，里面有命令、结果、问题和结论。`,
      task.includes("算法｜") ? "算法题已写复杂度、边界和一次口头复述记录。" : "代码、测试与日志三者保持一致；现在才勾选今天。",
    ],
    source,
  };
}

function dateLabel(start: string, week: number, day: number) {
  const d = new Date(`${start}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + (week - 1) * 7 + day);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function Home() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [subtasks, setSubtasks] = useState<Record<string, boolean>>({});
  const [startDate, setStartDate] = useState("2026-08-31");
  const [activePhase, setActivePhase] = useState(0);
  const [query, setQuery] = useState("");
  const [openWeek, setOpenWeek] = useState(1);
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ai-compiler-plan") || "{}");
      if (saved.completed) setCompleted(saved.completed);
      if (saved.subtasks) setSubtasks(saved.subtasks);
      if (saved.startDate) setStartDate(saved.startDate);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("ai-compiler-plan", JSON.stringify({ completed, subtasks, startDate }));
  }, [completed, subtasks, startDate, ready]);

  const total = weeks.length * 7;
  const done = Object.values(completed).filter(Boolean).length;
  const percent = Math.round((done / total) * 100);
  const filtered = useMemo(() => weeks.map((w, i) => ({ ...w, index: i + 1 })).filter(w => {
    const phaseOk = activePhase === 0 || w.phase === activePhase;
    const text = `${w.title} ${w.goal} ${w.output} ${w.days.join(" ")}`.toLowerCase();
    return phaseOk && text.includes(query.toLowerCase());
  }), [activePhase, query]);

  function toggle(id: string) { setCompleted(c => ({ ...c, [id]: !c[id] })); }
  function toggleSubtask(id: string) { setSubtasks(c => ({ ...c, [id]: !c[id] })); }
  function completeDay(id: string, stepCount: number) {
    setSubtasks(current => {
      const next = { ...current };
      for (let index = 0; index < stepCount; index += 1) next[`${id}-step-${index}`] = true;
      return next;
    });
    setCompleted(current => ({ ...current, [id]: true }));
  }
  function phaseDone(p: number) {
    const ids = weeks.flatMap((w, wi) => w.phase === p ? Array.from({length:7},(_,di)=>`${wi+1}-${di+1}`) : []);
    return Math.round((ids.filter(id => completed[id]).length / ids.length) * 100) || 0;
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="返回顶部"><span className="brandMark">AC</span><span>AI Compiler<br/><b>YEAR ONE</b></span></a>
        <nav><a href="#roadmap">路线</a><a href="#method">执行规则</a><a href="#deliverables">成果</a></nav>
        <div className="headerProgress"><span>{done}/{total}</span><div><i style={{width:`${percent}%`}} /></div><b>{percent}%</b></div>
      </header>

      <section className="hero" id="top">
        <div className="heroCopy">
          <span className="eyebrow">210 天 · 30 周 · 2 个简历主项目</span>
          <h1>AI 编译器<br/><em>学习日志</em></h1>
          <p>从 2026 年 8 月末冲刺到 2027 年 3 月底：核心知识、两个主项目和秋招材料全部收束。每天有主任务、算法题、验收物与完成标准。</p>
          <div className="heroActions"><a className="primary" href="#roadmap">开始本周计划 →</a><a className="secondary" href="#method">先看执行方法</a></div>
        </div>
        <div className="heroPanel">
          <div className="panelTop"><span>年度进度</span><strong>{percent}%</strong></div>
          <div className="bigRing" style={{background:`conic-gradient(#ff795d ${percent * 3.6}deg, #eadfd5 0)`}}><div><b>{done}</b><small>已完成任务</small></div></div>
          <div className="dateField"><label htmlFor="start-date">计划开始日</label><input id="start-date" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} /></div>
          <p className="saveNote">✓ 勾选与日期自动保存在当前浏览器</p>
        </div>
      </section>

      <section className="principles" id="method">
        <div><span>2026.08—11</span><h3>基础与 CUDA</h3><p>MiniTensor、CPU 性能、Transformer/GPU 前置、CUDA/Triton；只保留后续项目真正要用的知识。</p></div>
        <div><span>从 Day 10 起</span><h3>算法双轨</h3><p>先完成代码随想录核心 70 题，再完成 Hot100 100 题；每周日只复盘错题，不开新题。</p></div>
        <div><span>2027.01</span><h3>项目 A</h3><p>完成 Transformer GPU 算子库：框架接入、fallback、测试和性能证据齐全。</p></div>
        <div><span>2027.02—03</span><h3>项目 B 与秋招</h3><p>完成 Transformer 子图编译器，随后做开源协作、复现审计、模拟面试和投递。</p></div>
      </section>

      <section className="jdEvidence">
        <div><span className="eyebrow">JD → LEARNING EVIDENCE</span><h2>路线按大厂岗位的共同要求反推</h2><p>这些岗位反复要求 C++、体系结构、IR/Pass、GPU、MLIR/LLVM、框架与运行时性能。计划把每项要求绑定到代码、测试、IR 截图和 benchmark，而不是只写“了解”。</p></div>
        <div className="jdGrid">{jdSignals.map(item=><a href={item.url} target="_blank" rel="noreferrer" key={`${item.company}-${item.role}`}><small>{item.company}</small><b>{item.role}</b><span>{item.skills}</span><i>查看岗位 ↗</i></a>)}</div>
      </section>

      <section className="roadmap" id="roadmap">
        <aside>
          <div className="asideTitle"><span>YEAR</span><b>路线导航</b></div>
          <button className={activePhase===0?"active":""} onClick={()=>setActivePhase(0)}><span>全部 30 周</span><b>{percent}%</b></button>
          {phases.map((p,i)=><button key={p.name} className={activePhase===i+1?"active":""} onClick={()=>setActivePhase(i+1)}><i style={{background:p.color}}/><span><small>{p.range}</small>{p.name}</span><b>{phaseDone(i+1)}%</b></button>)}
          <div className="weeklyRhythm"><b>推荐节奏</b><span>Day 10 起</span><p>主线 3 小时 + 算法 60 分钟</p><span>W02-D03—W13</span><p>代码随想录核心 70 题</p><span>W14—W30-D04</span><p>Hot100 100 题；随后只复盘与模拟</p></div>
        </aside>

        <div className="planContent">
          <div className="planHead"><div><span className="eyebrow">WEEKLY EXECUTION PLAN</span><h2>{activePhase ? phases[activePhase-1].name : "全年执行清单"}</h2></div><label className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索 CUDA、LayerNorm、Pass…"/></label></div>
          <div className="phaseStrip">
            {phases.map((p,i)=><button key={p.name} className={activePhase===i+1?"selected":""} onClick={()=>setActivePhase(activePhase===i+1?0:i+1)}><span style={{background:p.color}}>{i+1}</span><b>{p.name}</b><small>{p.range}</small></button>)}
          </div>

          <div className="weekList">
            {filtered.map(w => {
              const tasks = weekTasks(w, startDate);
              const learningResources = learningResourcesForWeek(w.index, w.phase);
              const wDone = Array.from({length:7},(_,d)=>completed[`${w.index}-${d+1}`]).filter(Boolean).length;
              const isOpen = openWeek === w.index;
              return <article className={`weekCard ${isOpen?"open":""}`} key={w.index}>
                <button className="weekSummary" onClick={()=>setOpenWeek(isOpen?0:w.index)} aria-expanded={isOpen}>
                  <div className="weekNo"><span>W</span>{String(w.index).padStart(2,"0")}</div>
                  <div className="weekMain"><small style={{color:phases[w.phase-1].color}}>阶段 {w.phase} · {dateLabel(startDate,w.index,0)}—{dateLabel(startDate,w.index,6)}</small><h3>{w.title}</h3><p>{w.goal}</p></div>
                  <div className="weekScore"><span>{wDone}/7</span><div><i style={{width:`${wDone/7*100}%`,background:phases[w.phase-1].color}}/></div></div>
                  <span className="chevron">⌄</span>
                </button>
                {isOpen && <div className="weekBody">
                  <div className="deliverable"><span>{w.index<19?"本周学习验收物 · LAB":"本周简历项目里程碑"}</span><b>{w.output}</b><small>{w.index<19?"用于积累能力与素材，不建议单独占用简历项目栏。":"合并进入主项目仓库；必须可运行、可复现、可量化。"}</small></div>
                  <div className="resourceShelf">
                    <span>本周学习资源</span>
                    <div className="resourceGroups">
                      <div><small>直达视频章节</small>{learningResources.videos.map(resource=><a href={resource.url} target="_blank" rel="noreferrer" key={resource.url}>{resource.label}<b>▶</b></a>)}</div>
                      <div><small>对应参考文献</small>{learningResources.references.map(resource=><a href={resource.url} target="_blank" rel="noreferrer" key={resource.url}>{resource.label}<b>↗</b></a>)}</div>
                    </div>
                  </div>
                  <div className="dayGrid">
                    {tasks.map((task,di)=>{
                      const id=`${w.index}-${di+1}`; const checked=!!completed[id]; const dayOpen=!!openDays[id];
                      const guide=dailyGuide(w,di,task);
                      const videos=learningResources.videos;
                      const references=learningResources.references;
                      const videoLinks=Array.from({length:Math.min(2,videos.length)},(_,offset)=>videos[(di+offset)%videos.length]);
                      const referenceLinks=Array.from({length:Math.min(2,references.length)},(_,offset)=>references[(di+offset)%references.length]);
                      return <div className={`dayWrap ${checked?"checked":""} ${dayOpen?"expanded":""}`} key={id}>
                        <div className="dayTop">
                          <label className="checkLabel" aria-label={`${checked?"取消":"完成"} Day ${di+1}`}><input type="checkbox" checked={checked} onChange={()=>toggle(id)}/><span className="box">{checked?"✓":""}</span></label>
                          <span className="dayDate"><b>DAY {String(di+1).padStart(2,"0")}</b><small>周{dayNames[di]} · {dateLabel(startDate,w.index,di)}</small></span>
                          <span className="task"><b>{task}</b><small>{timePlan[di]}</small></span>
                          <button className="dayExpand" type="button" onClick={()=>setOpenDays(state=>({...state,[id]:!state[id]}))} aria-expanded={dayOpen}>{dayOpen?"收起 −":"展开 +"}</button>
                        </div>
                        {dayOpen&&<div className="dayDetails">
                          <div className="executionGuide">
                            <div className="startHere"><span>今天从这里开始</span><code>{guide.workspace}</code><p>主要会改：{guide.files}</p></div>
                            <a className="guideReadingCard" href={guide.source.url} target="_blank" rel="noreferrer">
                              <span>先读，再写代码 · AIInfraGuide</span>
                              <b>{guide.source.title} ↗</b>
                              <p>{guide.source.readingGoal}</p>
                              <small>先完成第 1 个勾选项里的阅读问题；不要把“看过”当作完成。</small>
                            </a>
                            <div className="purposeCard"><span>今天学习的目的</span><p>{guide.purpose}</p></div>
                            <div className="knowledgeCard"><span>今天必须掌握的知识点</span><ul>{guide.knowledgePoints.map(point=><li key={point}>{point}</li>)}</ul></div>
                            <span>照着做 · 每一步都能单独打勾</span>
                            <ol className="actionList">{guide.steps.map((step,index)=>{const stepId=`${id}-step-${index}`;return <li key={stepId}><label><input type="checkbox" checked={!!subtasks[stepId]} onChange={()=>toggleSubtask(stepId)}/><i>{subtasks[stepId]?"✓":index+1}</i><b>{step}</b></label></li>})}</ol>
                            <button className="completeDay" type="button" onClick={()=>completeDay(id,guide.steps.length)}>全部步骤完成，勾选今天 ✓</button>
                          </div>
                          <div className="dayMeta">
                            <span>最后运行这些命令</span><pre><code>{guide.command}</code></pre>
                            <span>满足这些条件才算完成</span><ul>{guide.doneWhen.map(item=><li key={item}>{item}</li>)}</ul>
                            <p className="methodNote">方法提醒：{detailSteps[di]} {acceptancePlan[di]}</p>
                            <div className="dayLinks"><span>直达视频章节</span>{videoLinks.map(link=><a href={link.url} target="_blank" rel="noreferrer" key={link.url}>{link.label}<b>▶</b></a>)}<span>对应参考文献</span>{referenceLinks.map(link=><a href={link.url} target="_blank" rel="noreferrer" key={link.url}>{link.label}<b>↗</b></a>)}</div>
                          </div>
                        </div>}
                      </div>;
                    })}
                  </div>
                </div>}
              </article>;
            })}
            {!filtered.length && <div className="empty">没有匹配的周计划。换个关键词试试。</div>}
          </div>
        </div>
      </section>

      <section className="deliverables" id="deliverables">
        <div className="sectionIntro"><span className="eyebrow">PORTFOLIO CHECKPOINT</span><h2>简历只主打两个完整项目</h2><p>MiniTensor、CUDA 单 kernel、FX Pass 和 tiny-gpu-compiler 都是学习 Lab。主项目从已完成的核心知识中提炼而来，不把课程型 Demo 堆进简历。</p></div>
        <div className="projectGrid">
          <article><span>01 · 2027.01</span><h3>Transformer GPU Operator Library</h3><p>整合 GEMM、Softmax、RMSNorm、RoPE 和 attention 热点，覆盖多 dtype/shape、PyTorch 接入、fallback、Nsight/Roofline 与性能回归。</p><b>W19 → W22</b></article>
          <article className="featured"><span>02 · 2027.02—03</span><h3>Transformer Subgraph Compiler</h3><p>PyTorch/ONNX→Relax→融合 Pass→TIR schedule→runtime，覆盖动态 shape、fallback、外部 kernel 和端到端 benchmark。</p><b>W23 → W27</b></article>
          <article><span>03 · 持续加分</span><h3>TVM / LLVM 开源贡献</h3><p>以最小复现、源码定位、修复测试和 Code Review 证明真实工程协作；MLIR Lab 作为编译器项目的技术补充，不单列主项目。</p><b>W44 → W50</b></article>
        </div>
        <div className="repoRadar"><span className="eyebrow">OPEN SOURCE RADAR</span><h3>项目实现时对照阅读的开源仓库</h3><div>{openSourceProjects.map(project=><a href={project.url} target="_blank" rel="noreferrer" key={project.url}><b>{project.label}</b><small>{project.note}</small><i>↗</i></a>)}</div></div>
      </section>

      <section className="adjustments">
        <h2>相较原路线，做了 5 个关键修正</h2>
        <div className="adjustGrid"><p><b>01</b><span><strong>nvprof → Nsight</strong>使用 Nsight Systems 看全局时间线，Nsight Compute 深挖单 kernel。</span></p><p><b>02</b><span><strong>JIT → torch.compile</strong>FX 保留，但主线升级为 Dynamo、AOTAutograd、Inductor 与 Triton。</span></p><p><b>03</b><span><strong>Relay → Relax + TIR</strong>Relay 只在读旧资料时识别；新项目走当前 TVM 编译栈。</span></p><p><b>04</b><span><strong>AutoTVM → MetaSchedule</strong>理解历史概念即可，实战采用搜索空间、代价模型和可复用数据库。</span></p><p><b>05</b><span><strong>7B 大项目 → 可验收小系统</strong>先做 mini decoder、KV Cache 与 attention 热点；有余力再扩大模型。</span></p><p><b>+</b><span><strong>硬件不是 GTX 1060 起步</strong>以能运行当前 CUDA 工具链且显存满足实验为准；没卡可先用云 GPU。</span></p></div>
      </section>

      <footer><div className="brand"><span className="brandMark">AC</span><span>AI Compiler<br/><b>YEAR ONE</b></span></div><p>坚持不是每天满负荷，而是每周都有可验收的前进。</p><a href="#top">返回顶部 ↑</a></footer>
    </main>
  );
}
