"use client";

import { useEffect, useMemo, useState } from "react";

type Week = {
  phase: number;
  title: string;
  goal: string;
  output: string;
  days: string[];
};

type DailyGuide = {
  workspace: string;
  files: string;
  steps: string[];
  command: string;
  doneWhen: string[];
};

const phases = [
  { name: "MiniTensor 与性能基础", range: "W01–W12", color: "#ef6a4c" },
  { name: "CUDA Kernel 工程", range: "W13–W20", color: "#e6a83e" },
  { name: "PyTorch 编译栈 · 刷题启动", range: "W21–W30", color: "#3c86c6" },
  { name: "简历项目双主线", range: "W31–W44", color: "#7e62c7" },
  { name: "MLIR · 开源 · 秋招", range: "W45–W50", color: "#249577" },
];

const weeks: Week[] = [
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
  { phase:2,title:"矩阵乘法 II",goal:"理解寄存器分块、占用率与指令级并行",output:"GEMM v2 + roofline 定位",days:["学习 occupancy、寄存器压力与 launch 配置","实现每线程多输出的寄存器分块","尝试向量化 load/store 并检查对齐","查看 SASS/PTX 和编译器资源报告","扫描 block/tile 参数，记录性能曲面","写 roofline 判断：算力受限还是带宽受限"]},
  { phase:2,title:"归约与 Softmax",goal:"掌握 warp primitive 与数值稳定性",output:"reduce + online softmax kernels",days:["写多 block sum reduction 基线","用 shared memory 优化归约","用 warp shuffle 完成 warp/block reduce","实现稳定 softmax（减 max）并测误差","实现 online softmax 思路并比较访存","与 PyTorch baseline 比较多种行宽"]},
  { phase:2,title:"LayerNorm Kernel",goal:"融合统计、归一化和仿射操作",output:"手写 CUDA LayerNorm v1",days:["推导 LayerNorm、Welford 与误差来源","写标量/naive CUDA baseline","用 block reduce 合并均值与方差计算","融合 gamma/beta，优化读写次数","覆盖 128–8192 hidden size 并剖析","发布独立 benchmark 和性能折线图"]},
  { phase:2,title:"Triton 对照实验",goal:"理解高层 kernel DSL 与 CUDA 的权衡",output:"Triton LayerNorm/Softmax 对照",days:["完成 Triton vector add 教程并看生成结构","写 Triton softmax，校验数值","写 Triton LayerNorm 或复现官方实现","做 CUDA/Triton/PyTorch 三方基准","比较开发成本、可移植性与性能","整理 10 个 CUDA 高频面试问题"]},
  { phase:2,title:"CUDA 阶段项目",goal:"形成可展示的 kernel 优化故事",output:"cuda-kernels v1 + 8 分钟讲解",days:["统一 benchmark harness 与设备信息输出","补齐 GEMM/Softmax/LayerNorm 测试矩阵","做 Nsight Systems 全局定位","做 Nsight Compute 单 kernel 深挖","重跑稳定数据并生成图表/结论","录制讲解：问题→基线→优化→证据→限制"]},
  { phase:3,title:"PyTorch Autograd 与 Dispatcher",goal:"理解 Tensor、算子注册、反向图和调度",output:"mini autograd + dispatcher 调研图",days:["复习 Tensor storage/stride/view 与广播","手写标量/小张量 autograd 拓扑排序","实现 add/mul/matmul backward 并梯度检查","阅读 PyTorch dispatcher 官方说明/代码入口","写 C++/CUDA extension 最小算子","画一次算子从 Python 到 kernel 的调用链"]},
  { phase:3,title:"FX 与图变换",goal:"能捕获、检查、改写并验证计算图",output:"FX Conv-BN-ReLU 融合原型",days:["学习 FX symbolic_trace、Graph、GraphModule","打印 ResNet 子图并理解 node 元数据","写模式匹配：Conv→BN→ReLU","实现 eval 模式 BN folding 或安全替换","做数值一致性与多输入 shape 测试","统计节点数和 latency，写 Pass 设计说明"]},
  { phase:3,title:"ONNX 与模型可移植性",goal:"理解 IR、shape inference 和模型检查",output:"ResNet50 ONNX 分析包",days:["学习 ONNX protobuf、opset、initializer/value_info","导出 ResNet50，运行 checker/shape inference","用 ONNX Runtime 对齐 PyTorch 输出","用 Netron 观察结构并统计 op 分布","写脚本做一次安全图改写/常量折叠","输出导出失败与动态 shape 排错清单"]},
  { phase:3,title:"torch.compile 总览",goal:"理解 Dynamo→AOTAutograd→Inductor 的分层",output:"编译栈一页图 + 10 个实验",days:["跑 torch.compile quickstart，区分冷启动/稳态","用 explain/export 观察捕获图与 guards","制造 graph break 并定位原因","测试 dynamic shapes 与 recompilation","比较 eager/compile 的时间和显存","画全栈数据流并解释每层职责"]},
  { phase:3,title:"TorchDynamo 深入",goal:"理解 Python bytecode 捕获、guards 与 graph breaks",output:"Dynamo 调试手册",days:["阅读 Dynamo 架构与 frame evaluation 概念","观察简单函数 bytecode 与 FX graph 对应","实验数据依赖控制流和 Python side effect","实验 guard 失败与缓存重编译","用日志定位 5 类 graph break 并修复","整理可复制的最小复现模板"]},
  { phase:3,title:"AOTAutograd 与分解",goal:"理解前后向联合捕获和 operator decomposition",output:"前/后向图解剖报告",days:["复习 autograd tape 与 saved tensor","导出训练函数并观察 forward/backward graph","比较 functionalization 前后 mutation/view","追踪一个复合算子的 decomposition","写一个自定义 decomposition 小实验","总结训练编译的内存/算力权衡"]},
  { phase:3,title:"Inductor 与 Triton Codegen",goal:"从 FX graph 追到生成 kernel",output:"generated-code 注释样例",days:["保存 Inductor 生成代码与缓存目录","选 pointwise fusion 案例逐行标注","选 reduction 案例观察调度与 autotune","修改输入 shape 看代码和 guard 如何变化","对照 Triton 手写版本做性能/代码比较","写《一次 torch.compile 性能回归怎么查》"]},
  { phase:3,title:"自定义后端与 Pass",goal:"实现可插拔 backend 和图级优化",output:"mini torch.compile backend",days:["实现接收 FX GraphModule 的 eager backend","加入图打印、计时和 fallback","在 backend 前执行常量/冗余算子简化","处理 unsupported op 与动态 shape 边界","构造 8 个正确性/回归测试","发布 PyTorch compiler-playground"]},
  { phase:3,title:"融合项目升级",goal:"把 FX 原型变成可复现项目",output:"fusion-pass v1 + benchmark dashboard",days:["明确支持条件：eval/train、dtype、shape","补图模式匹配的负例与回退策略","覆盖 ResNet18/50 的子图测试","用 profiler 证明 kernel launch/访存变化","在不同 batch 测 eager/compile/custom pass","写项目文档与 12 个面试追问答案"]},
  { phase:3,title:"简历项目 A 立项：GPU 算子库",goal:"从 3 月开始把前期 CUDA Lab 合并为完整工程，而不是新增小 Demo",output:"项目 RFC、支持矩阵、仓库骨架与 benchmark 协议",days:["确定项目问题、目标用户、非目标和验收指标","设计 operators/backend/tests/benchmarks/docs 目录","冻结硬件、软件版本、输入 shape 与精度阈值","迁移前期 Softmax/LayerNorm/GEMM 并保留演进历史","建立 PyTorch/CUTLASS/Triton baseline 与结果格式","精读成熟算子库的测试、benchmark 与发布结构"]},
  { phase:4,title:"项目 A：Softmax 与 RMSNorm 工程化",goal:"将课堂 kernel 升级为支持多 shape/dtype 的可维护组件",output:"Softmax/RMSNorm v1 + correctness matrix",days:["重构 API、dispatch 和错误检查","覆盖 FP32/FP16、非对齐 shape 与极值输入","实现 naive/shared/warp/Triton 多版本","加入自动正确性、数值误差与回归测试","用 Nsight 解释访存、occupancy 和瓶颈迁移","精读 FlashAttention/Triton 中的归约实现"]},
  { phase:4,title:"项目 A：GEMM 与 Transformer MLP",goal:"将 GEMM、bias、activation 组合成真实 Transformer 热点",output:"GEMM/MLP benchmark suite",days:["定义 M/N/K 与 Transformer 典型 shape 集","整理 tiled/register-blocked GEMM 实现","实现 bias+GELU/SwiGLU epilogue fusion","对比 cuBLAS/CUTLASS/Triton 并控制变量","分析小矩阵、大矩阵和不同 dtype 的性能差异","精读 CUTLASS mainloop 与 epilogue 设计"]},
  { phase:4,title:"项目 A：RoPE 与 Attention 热点",goal:"覆盖 LLM 推理中的布局、融合和 IO 问题",output:"RoPE/attention hotspot kernels + IO 分析",days:["实现 RoPE reference 与 CUDA/Triton kernel","推导 prefill/decode shape 和 KV cache 字节数","实现小型 fused attention 或关键子算子","比较连续与分页 KV 布局的访问代价","用 Roofline/Nsight 解释热点而非只报加速比","精读 FlashAttention 与 PagedAttention 论文/源码入口"]},
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
const weekLearningResources = [
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
const openSourceProjects = [
  { phase:1, label:"xtensor-stack/xtensor", url:"https://github.com/xtensor-stack/xtensor", note:"MiniTensor API、shape 与广播参考" },
  { phase:1, label:"google/googletest", url:"https://github.com/google/googletest", note:"C++ 单元测试工程参考" },
  { phase:1, label:"google/benchmark", url:"https://github.com/google/benchmark", note:"C++ 微基准方法" },
  { phase:1, label:"microsoft/mimalloc", url:"https://github.com/microsoft/mimalloc", note:"高性能分配器实现" },
  { phase:2, label:"NVIDIA/CUTLASS", url:"https://github.com/NVIDIA/cutlass", note:"GEMM 与 GPU 模板库" },
  { phase:2, label:"triton-lang/triton", url:"https://github.com/triton-lang/triton", note:"GPU Kernel DSL" },
  { phase:2, label:"Dao-AILab/flash-attention", url:"https://github.com/Dao-AILab/flash-attention", note:"IO-aware attention" },
  { phase:3, label:"pytorch/pytorch", url:"https://github.com/pytorch/pytorch", note:"Dynamo/Inductor/FX 主仓" },
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
  { company:"Apple", role:"On-Device ML Compiler", skills:"MLIR 编译栈、C++、PyTorch、GPU/CPU/NPU kernel 与运行时性能", url:"https://jobs.apple.com/en-us/details/200631247/on-device-ml-compiler-engineer-model-compilation-graphics-games-and-machine-learning" },
  { company:"Apple", role:"GPU Compiler Engineer", skills:"IR、前端/中端优化、体系结构、GPU 并行语言与性能分析", url:"https://jobs.apple.com/en-ie/details/200649008/gpu-compiler-engineer-graphics-game-and-ml" },
  { company:"NVIDIA", role:"High-Performance AI", skills:"CUDA、框架/编译器/运行时、GPU 架构、端到端性能归因", url:"https://jobs.nvidia.com/careers/job/893394948871" },
  { company:"Arm", role:"Compiler Engineer", skills:"C/C++、LLVM/GNU、低层软件、体系结构、benchmark 与开源贡献", url:"https://careers.arm.com/job/cambridge/software-engineer-compilers/33099/96158949392" },
];

function day6Knowledge(week: Week) {
  const focus = ["C++ 语义、工具链或体系结构", "CUDA、Nsight 或高性能 kernel", "PyTorch 编译器与计算图", "TVM、FlashAttention 或推理运行时", "MLIR、LLVM 与 lowering"][week.phase-1];
  return `视频专题：围绕「${week.title}」观看 1 节 ${focus} 视频；暂停复写关键代码，画调用链并完成 1 个最小验证实验`;
}

function leetcodeActive(start: string, week: number) {
  const d = new Date(`${start}T00:00:00`);
  d.setDate(d.getDate() + (week - 1) * 7);
  return d >= new Date("2027-02-01T00:00:00");
}

function weekTasks(week: Week & { index: number }, start: string) {
  const base = [...week.days.slice(0,5), day6Knowledge(week), "视频补漏：从本周视频中选择最薄弱的一节，整理 5 条笔记、1 个疑问和 1 个验证实验。"];
  if (!leetcodeActive(start, week.index)) return base;
  const algorithm = ["；加练 LeetCode 1 题，写复杂度和边界", "", "；加练 LeetCode 1 题并复述思路", "", "；加练 LeetCode 1 题并补第二解法", "", "；完成 LeetCode 2 题并整理错题"];
  return base.map((task, index) => `${task}${algorithm[index]}`);
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

function executionWorkspace(week: number) {
  if (week <= 12) return "ai-compiler-year-one/projects/minitensor";
  if (week <= 20) return "ai-compiler-year-one/projects/cuda-kernels";
  if (week <= 29) return "ai-compiler-year-one/projects/compiler-playground";
  if (week <= 35) return "ai-compiler-year-one/projects/gpu-operator-lab";
  if (week <= 44) return "ai-compiler-year-one/projects/transformer-compiler";
  if (week <= 47) return "ai-compiler-year-one/projects/mlir-toy-lab";
  return "ai-compiler-year-one/portfolio";
}

function validationCommand(week: number) {
  if (week <= 12) return "cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug\ncmake --build build -j\nctest --test-dir build --output-on-failure";
  if (week <= 20) return "cmake -S . -B build -DCMAKE_BUILD_TYPE=Release\ncmake --build build -j\nctest --test-dir build --output-on-failure";
  if (week <= 29) return "python -m pytest -q\npython examples/run_week.py --week CURRENT_WEEK";
  if (week <= 35) return "python -m pytest -q\npython benchmarks/run.py --quick";
  if (week <= 44) return "python -m pytest tests -q\npython benchmarks/e2e.py --quick";
  if (week <= 47) return "cmake --build build --target check-mlir\nbuild/bin/mlir-opt <当天的 .mlir 文件> --verify-diagnostics";
  return "git status --short\ngit diff --check";
}

function dailyGuide(week: Week & { index: number }, day: number, task: string): DailyGuide {
  const workspace = executionWorkspace(week.index);
  const files = weekFileHints[week.index];
  const note = `docs/learning-log/W${String(week.index).padStart(2,"0")}-D${String(day+1).padStart(2,"0")}.md`;
  const mainTask = task.split("；加练 LeetCode")[0];
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
    steps: day >= 5 ? study : common,
    command: validationCommand(week.index).replace("CURRENT_WEEK", String(week.index)),
    doneWhen: [
      "当天主程序、实验或 IR 可以从零重新运行，不依赖口头说明。",
      "正常路径通过，并且至少验证 2 个边界情况或失败路径。",
      `存在当天日志 ${note}，里面有命令、结果、问题和结论。`,
      task.includes("LeetCode") ? "额外算法题已写复杂度、边界和一次口头复述记录。" : "代码、测试与日志三者保持一致；现在才勾选今天。",
    ],
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
  const [startDate, setStartDate] = useState("2026-08-10");
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
          <span className="eyebrow">350 天 · 50 周 · 2 个简历主项目</span>
          <h1>AI 编译器<br/><em>学习日志</em></h1>
          <p>把一年的学习、实验与性能证据沉淀成可追踪的工程日志。每周有验收物，每天有主任务、时间预算和完成标准；空档日也提供官方资料入口。</p>
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
        <div><span>2026.08—2027.01</span><h3>项目驱动积累期</h3><p>前 4 周用同一个 MiniTensor Runtime 按需恢复 C++，第 5 周立即进入体系结构、CUDA 与 PyTorch 编译栈；阶段产出统一标为 Lab。</p></div>
        <div><span>2027.02</span><h3>算法启动</h3><p>每周约 5 题，安排在周一、三、五、日；与编译器学习并行。</p></div>
        <div><span>2027.03</span><h3>简历项目 A</h3><p>把前期 CUDA Lab 合并为 Transformer GPU 算子库，强调框架接入与性能证据。</p></div>
        <div><span>2027.04—06</span><h3>简历项目 B</h3><p>完成 PyTorch/ONNX→Relax→TIR→CUDA 的 Transformer 子图编译器。</p></div>
      </section>

      <section className="jdEvidence">
        <div><span className="eyebrow">JD → LEARNING EVIDENCE</span><h2>路线按大厂岗位的共同要求反推</h2><p>这些岗位反复要求 C++、体系结构、IR/Pass、GPU、MLIR/LLVM、框架与运行时性能。计划把每项要求绑定到代码、测试、IR 截图和 benchmark，而不是只写“了解”。</p></div>
        <div className="jdGrid">{jdSignals.map(item=><a href={item.url} target="_blank" rel="noreferrer" key={`${item.company}-${item.role}`}><small>{item.company}</small><b>{item.role}</b><span>{item.skills}</span><i>查看岗位 ↗</i></a>)}</div>
      </section>

      <section className="roadmap" id="roadmap">
        <aside>
          <div className="asideTitle"><span>YEAR</span><b>路线导航</b></div>
          <button className={activePhase===0?"active":""} onClick={()=>setActivePhase(0)}><span>全部 50 周</span><b>{percent}%</b></button>
          {phases.map((p,i)=><button key={p.name} className={activePhase===i+1?"active":""} onClick={()=>setActivePhase(i+1)}><i style={{background:p.color}}/><span><small>{p.range}</small>{p.name}</span><b>{phaseDone(i+1)}%</b></button>)}
          <div className="weeklyRhythm"><b>推荐节奏</b><span>2027 年 2 月前</span><p>每天约 3 小时，不刷 LeetCode</p><span>2027 年 2 月起</span><p>每周约 5 题</p><span>2027 年 3 月起</span><p>进入简历主项目</p></div>
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
                  <div className="deliverable"><span>{w.index<30?"本周学习验收物 · LAB":"本周简历项目里程碑"}</span><b>{w.output}</b><small>{w.index<30?"用于积累能力与素材，不建议单独占用简历项目栏。":"合并进入主项目仓库；必须可运行、可复现、可量化。"}</small></div>
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
        <div className="sectionIntro"><span className="eyebrow">PORTFOLIO CHECKPOINT</span><h2>简历只主打两个完整项目</h2><p>前期 MiniTensor、分配器、单 kernel 和 FX Pass 都是学习 Lab。到 2027 年 3–4 月再把它们合并成完整工程，避免简历堆课程型 Demo。</p></div>
        <div className="projectGrid">
          <article><span>01 · 2027.03</span><h3>Transformer GPU Operator Library</h3><p>整合 GEMM、Softmax、RMSNorm、RoPE 和 attention 热点，覆盖多 dtype/shape、PyTorch/vLLM 接入、Nsight/Roofline 与性能回归。</p><b>W30 → W35</b></article>
          <article className="featured"><span>02 · 2027.04—06</span><h3>Transformer Subgraph Compiler</h3><p>PyTorch/ONNX→Relax→融合 Pass→TIR schedule→CUDA runtime，覆盖动态 shape、fallback、外部 kernel 和端到端 benchmark。</p><b>W36 → W44</b></article>
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
