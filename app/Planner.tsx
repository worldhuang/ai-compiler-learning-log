"use client";

import { useEffect, useMemo, useState } from "react";

type Week = {
  phase: number;
  title: string;
  goal: string;
  output: string;
  days: string[];
};

const phases = [
  { name: "基础与性能直觉", range: "W01–W12", color: "#ef6a4c" },
  { name: "CUDA Kernel 工程", range: "W13–W20", color: "#e6a83e" },
  { name: "PyTorch 编译栈", range: "W21–W30", color: "#3c86c6" },
  { name: "TVM 主线攻坚", range: "W31–W44", color: "#7e62c7" },
  { name: "MLIR · 项目 · 求职", range: "W45–W52", color: "#249577" },
];

const weeks: Week[] = [
  { phase:1,title:"C++ 现代语法与工具链",goal:"建立可重复的 CMake、测试与性能测量环境",output:"带 CI、单测和 benchmark 的 cpp-lab 仓库",days:["配置 C++20、CMake、clang-format；写最小项目并记录编译链路","复习引用、const、作用域与对象生命周期；完成 2 道数组题","实现 RAII 文件句柄；用断点观察构造/析构顺序","学习 GoogleTest/CTest 思路；为 RAII 类写 6 个边界测试","接入 chrono 基准框架；比较 -O0/-O2 的循环耗时","整理本周 README、错误日志与 10 张知识卡"]},
  { phase:1,title:"内存、指针与所有权",goal:"把裸指针、智能指针和所有权模型讲清楚",output:"unique_ptr 简化实现 + 生命周期实验",days:["精读动态内存与 new/delete；画栈、堆、对象关系图","手写 scoped_ptr：禁拷贝、可移动、自动释放","实现 move 构造/赋值；用 sanitizer 检查 double free","练链表反转/环检测各 1 题，口述指针变化","比较 unique_ptr/shared_ptr/weak_ptr 的成本与适用场景","补测试并写《所有权的 8 个常见坑》"]},
  { phase:1,title:"shared_ptr 与拷贝控制",goal:"理解引用计数、控制块和五法则",output:"线程不安全版 mini_shared_ptr",days:["复习拷贝构造、赋值、析构与 Rule of Five","设计控制块与引用计数；写 shared_ptr 构造/析构","补拷贝、移动、reset、use_count、operator*","实现 weak_ptr 的最小概念模型并测试循环引用","用 ASan/Valgrind 替代方案制造并定位泄漏","代码复盘：异常安全、自赋值、空指针边界"]},
  { phase:1,title:"模板、容器与数据布局",goal:"理解泛型代码及 AoS/SoA 对缓存的影响",output:"小型 Vector<T> + AoS/SoA benchmark",days:["学习函数/类模板、类型推导和 concepts 基础","实现 Vector<T> 的容量增长、迭代与异常安全","为非平凡类型补拷贝/移动测试","完成二叉树遍历 2 题；比较递归与显式栈","构造百万粒子 AoS/SoA 测试并测吞吐","阶段检查：C++ 口述题 20 题 + 重构仓库"]},
  { phase:1,title:"机器表示与汇编阅读",goal:"能从 C++ 追到汇编并识别访存和分支",output:"5 个 C++/汇编对照案例",days:["CSAPP 数据表示：整数溢出、浮点误差实验","学习 x86-64 寄存器、调用约定与栈帧","用 Compiler Explorer 比较 -O0/-O3 汇编","观察 move、内联、虚函数的汇编成本","完成位运算题 2 道并写边界测试","输出《我能读懂的 20 条汇编指令》"]},
  { phase:1,title:"CPU Cache 与局部性",goal:"建立 cache line、命中率和工作集直觉",output:"cache-lab：步长/矩阵遍历实验",days:["学习 L1/L2/L3、cache line、组相联与替换","写数组 stride benchmark，画延迟曲线","比较矩阵行优先/列优先遍历并解释差距","手算 3 组地址的 tag/index/offset 与命中情况","做 blocked matrix transpose，搜索合适 tile","汇总图表与性能解释，禁止只报加速比"]},
  { phase:1,title:"流水线、分支与 SIMD",goal:"理解 ILP、分支预测和向量化",output:"分支/SIMD 微基准报告",days:["学习流水线、数据冒险、分支预测与吞吐/延迟","测 sorted/unsorted 数据分支差异","阅读编译器 vectorization report","写可自动向量化的 sum/dot，验证汇编","尝试 intrinsics 实现向量加法并校验误差","完成 roofline 入门笔记与本周复盘"]},
  { phase:1,title:"并发与内存模型",goal:"掌握线程、锁、原子与 false sharing",output:"线程池雏形 + false-sharing 实验",days:["学习 thread/mutex/condition_variable 与竞态","实现阻塞任务队列，覆盖停止和空队列边界","实现固定线程池 submit + future","学习 happens-before 与 atomic 基础","构造 false sharing，padding 后对比吞吐","TSan 检查、代码审查并记录并发不变量"]},
  { phase:1,title:"内存分配器 I",goal:"理解隐式空闲链表、对齐与碎片",output:"可运行的 implicit free-list allocator",days:["读 Malloc Lab 规范；定义块头、脚与对齐规则","实现 heap 初始化、extend_heap、first-fit","实现 malloc 放置与块分割","实现 free 与相邻块合并","写 trace：空块、反复分配、极小/极大块","计算吞吐/利用率并画 heap 快照"]},
  { phase:1,title:"内存分配器 II",goal:"用显式/分离空闲链表提升性能",output:"segregated free-list allocator + 报告",days:["实现显式双向空闲链表插入/删除","迁移 malloc/free，修复链表不变量","设计 size class 并实现分离链表","写 heap checker：对齐、重复块、未合并检查","跑 trace，定位性能与碎片热点","对比两版设计并准备 5 分钟项目讲解"]},
  { phase:1,title:"性能方法论",goal:"学会正确 warmup、重复、统计和归因",output:"统一 benchmark 模板",days:["学习方差、P50/P95、warmup 与同步陷阱","封装 CPU timer、随机种子与结果 CSV","用 perf/Windows 分析器观察热点和 cache miss","为 allocator 建 baseline 与回归阈值","复现一次“错误 benchmark”并修正","写性能报告模板：环境/输入/方法/结论"]},
  { phase:1,title:"阶段项目：CPU 张量库",goal:"把 C++、内存与缓存知识合成最小张量库",output:"Tensor + matmul + benchmark v1",days:["设计 Tensor shape/stride/storage 与测试清单","实现连续 Tensor、索引、reshape/view","实现 naive matmul 并与参考结果校验","实现 tiled matmul，扫描 tile size","接入线程池做并行版本并测扩展性","发布 v0.1：图表、限制、下一阶段接口"]},
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
  { phase:3,title:"阶段缓冲与综合考核",goal:"补齐短板并完成一次闭卷实现",output:"90 分钟 mock + 缺口清单",days:["闭卷画 PyTorch 编译栈与关键 IR","90 分钟实现 FX pattern rewrite","90 分钟 CUDA reduction 手写/伪码","修复前三周遗留 issue，不开新坑","重跑所有公开 benchmark","阶段复盘：保留/停止/调整下一阶段任务"]},
  { phase:4,title:"TVM 架构与 IRModule",goal:"建立 Relax/TIR/Runtime 的全局模型",output:"TVM 端到端最小程序",days:["从源码构建或安装 TVM，记录 commit 与环境","学习 IRModule、结构化 IR 与 TVMScript","手写一个 Relax 函数并打印/检查结构","观察 LegalizeOps 后的 TIR PrimFunc","编译到 LLVM/CUDA 并运行校验","画 Relax→TIR→runtime 的编译管线"]},
  { phase:4,title:"TensorIR 表达",goal:"能读写 block、buffer、axis 和 reduction",output:"4 个 TensorIR 算子",days:["用 TVMScript 写 elementwise add","写 matmul PrimFunc：spatial/reduction axis","写 reduction 与 softmax 分解版","学习 buffer region、block reads/writes","用结构相等测试和随机输入校验","为 4 个算子画 loop/block 结构图"]},
  { phase:4,title:"TIR Schedule 基础",goal:"掌握 split/reorder/fuse/vectorize/parallel",output:"CPU matmul schedule trace",days:["对 matmul 做 split/reorder 并观察 IR","添加 parallel/vectorize/unroll","做 cache_read/cache_write 与块化","搜索 CPU tile 参数并测性能","保存 schedule trace 并可重放","对比原始/优化 IR，解释每个变换合法性"]},
  { phase:4,title:"GPU Schedule",goal:"把循环映射到 block/thread/shared/local",output:"TVM CUDA matmul schedule",days:["学习 bind blockIdx/threadIdx 与执行映射","把 naive matmul 映射到 GPU","加入 shared memory cache 与 cooperative fetch","加入 local cache/寄存器分块","用 Nsight 检查访存、占用率与瓶颈","与手写 CUDA/cublas 做公平比较"]},
  { phase:4,title:"Relax 图级优化",goal:"理解融合、合法化、布局与 pass pipeline",output:"自定义 Relax Pass",days:["学习 DataflowBlock、call_tir 与 shape 表达","跑 FuseOps/FuseTIR，观察前后 IR","写 PatternCheckContext/DPL 模式实验","实现 Matmul+Bias+ReLU 匹配/重写","加正确性、结构和 fallback 测试","在小 MLP 上统计节点、kernel 和延迟"]},
  { phase:4,title:"模型导入与端到端编译",goal:"跑通小模型从前端到 GPU runtime",output:"ResNet18/小 MLP TVM 推理",days:["选择稳定前端导入路径并冻结版本","导入模型，修复 shape/dtype/opset 问题","跑 Relax pipeline 并检查算子覆盖","编译 GPU runtime，完成数值校验","测编译时间/冷启动/稳态 latency","整理 unsupported op 与版本锁定文档"]},
  { phase:4,title:"LayerNorm in TIR",goal:"用 TensorIR 表达多阶段 reduction 与融合",output:"TVM LayerNorm baseline",days:["推导 LayerNorm 的 TIR block 划分","实现 mean/variance/normalize PrimFunc","处理 gamma/beta 与多 shape","写 CPU schedule 并验证","写基础 GPU schedule","与 NumPy/PyTorch 做误差和性能基线"]},
  { phase:4,title:"LayerNorm 手工调度",goal:"围绕访存、归约与线程映射优化",output:"TVM LayerNorm optimized",days:["分析 arithmetic intensity 与访存字节","设计 thread/block/warp 归约方案","应用 cache、vectorize 与 cooperative fetch","扫描 hidden size 与线程数参数","用 profiler 解释最优点与退化点","对比 CUDA/Triton/TVM 三种实现"]},
  { phase:4,title:"MetaSchedule 原理",goal:"理解搜索空间、runner、cost model 与数据库",output:"可复现的 tune_tir 实验",days:["阅读 MetaSchedule 架构并画组件关系","对小 matmul 生成/检查 design space","运行本地 builder/runner 小预算搜索","检查 database workload/record 与 trace","应用最优记录并做 holdout shape 测试","总结搜索成本、稳定性和泛化限制"]},
  { phase:4,title:"MetaSchedule 实战",goal:"对热点算子做选择性调优并可信比较",output:"LayerNorm/Matmul 调优报告",days:["固定环境、shape、trial budget 和 baseline","抽取 tunable tasks 并核对权重","运行分阶段预算 32/128/512 trials","分析 cost model 与最优 trace 演进","重跑最佳 schedule，报告分布而非单点","写自动调优失败案例与人工先验价值"]},
  { phase:4,title:"Transformer 算子分解",goal:"理解 attention、KV cache 与算子图热点",output:"mini-attention Relax/TIR 图",days:["推导 MHA/GQA、mask、softmax 的 shape/算量","实现小型 PyTorch attention 参考","导出/构造 Relax attention 图","观察 fusion/legalization 后的热点 TIR","用 profiler 分离 prefill/decode","画 KV cache 布局和每 token 数据流"]},
  { phase:4,title:"KV Cache 与 Decode",goal:"实现可验证的小模型 decode 路径",output:"mini decoder + paged/cache 对照实验",days:["定义 batch/head/seq/head_dim 测试矩阵","实现连续 KV cache append/read baseline","研究分页思想并做最小索引模拟","用 TIR 写 cache append/transpose 小算子","测 seq length 增长下带宽与延迟","总结为何 7B 全量部署不是本阶段验收目标"]},
  { phase:4,title:"Attention 优化实验",goal:"理解 FlashAttention 的 IO-aware 核心而非盲写全套",output:"tiled online attention prototype",days:["复习 online softmax 与 attention IO 复杂度","实现小尺寸分块 attention 正确性版","融合 block max/sum 更新并校验","处理 causal mask 与边界 tile","剖析不同 seq/head_dim 的性能","与 PyTorch SDPA 比较并明确适用范围"]},
  { phase:4,title:"TVM 核心项目封版",goal:"形成端到端、可复现、不过度承诺的成果",output:"tvm-transformer-lab v1",days:["冻结依赖、脚本、随机种子和测试机器","一键跑 correctness/compile/benchmark","重跑 LayerNorm、attention、mini decoder 图表","补失败路径、回退与已知限制","写 8 分钟技术汇报和架构图","发布 release，邀请同学做一次冷启动复现"]},
  { phase:5,title:"MLIR 基础与 Toy 1–2",goal:"理解 dialect、operation、region、SSA 与 TableGen",output:"Toy AST→MLIR 运行记录",days:["配置 LLVM/MLIR 或使用预构建工具；跑 mlir-opt","完成 Toy Ch1，追踪源码到 AST dump","完成 Toy Ch2，理解 Op/Type/Attribute","读一段 .mlir：operation/region/block/value","用通用格式改写同一 IR 并 round-trip","画 MLIR 多层 dialect 降低路线"]},
  { phase:5,title:"Pattern Rewrite 与 Pass",goal:"能写局部重写并解释 pass 管理",output:"transpose canonicalization Pass",days:["完成 Toy Ch3，理解 RewritePattern","写 transpose(transpose(x)) 消除模式","添加 fold/canonicalization 思路与测试","完成 Toy Ch4 的 interface 概念","用 FileCheck 风格写正/负测试","对比 MLIR rewrite 与 FX/Relax Pass"]},
  { phase:5,title:"Lowering 与代码生成",goal:"理解从高层 dialect 降到 LLVM 的边界",output:"Toy Ch5–6 降低笔记",days:["完成 Toy Ch5，观察 affine/scf/memref","逐步跑 lowering pipeline 并保存中间 IR","学习 legality、conversion target、type converter","完成 Toy Ch6 到 LLVM IR/可执行文件","跟踪 transpose 在不同层级的表示","写《何时在什么 IR 层做优化》"]},
  { phase:5,title:"项目整合与工程质量",goal:"让三个项目都能被陌生人复现",output:"3 个 portfolio-ready 仓库",days:["审计 CUDA 项目：README、测试、benchmark","审计 PyTorch Pass：支持矩阵、fallback、图示","审计 TVM 项目：版本、脚本、结果可信度","统一图表样式与环境信息","清理大文件/死代码/硬编码路径","让朋友按 README 复现并修复全部阻塞项"]},
  { phase:5,title:"简历与项目叙事",goal:"用证据和技术取舍表达成果",output:"一页简历 + 项目问答库",days:["每项目写 1 句问题、2 句动作、1 句量化结果","制作简历第一版，删除无证据的“精通”","为每项目准备 2/5/10 分钟版本","列出 30 个追问并写 STAR/技术回答","录屏回答，检查含糊词和跳步","找 2 人评审并合并高价值反馈"]},
  { phase:5,title:"面试专项：C++/体系结构",goal:"恢复手写速度与底层表达",output:"两套模拟面试记录",days:["C++ 对象模型/生命周期/模板 30 题","手写 shared_ptr 核心与异常安全讲解","Cache/虚拟内存/allocator 30 题","手算 cache + 分析一段访存代码","完成 90 分钟 C++/算法模拟","订正并把错题转为复习卡"]},
  { phase:5,title:"面试专项：GPU/编译器",goal:"串联性能、IR、Pass 与运行时",output:"两套系统设计模拟",days:["GPU 层次/warp/分支/occupancy 30 题","白板写 reduction/LayerNorm 伪码","讲 torch.compile graph break 与调试路径","讲 Relax/TIR/MetaSchedule 与一个优化案例","完成 90 分钟编译器方向模拟","按“不会/不准/太慢”三类订正"]},
  { phase:5,title:"投递冲刺与机动周",goal:"完成有针对性的投递闭环并保留恢复空间",output:"岗位矩阵 + 10 次高质量投递",days:["建立岗位矩阵：JD 技能、证据项目、缺口","为 3 类岗位各生成一版简历","投递 3–5 个高匹配岗位并记录状态","做一次真实/模拟面试，复盘每个追问","修最影响转化的项目或表达缺口","年度复盘：成果清单、下一季度计划、休息"]},
];

const dayNames = ["一", "二", "三", "四", "五", "六", "日"];
const timePlan = ["理论 45m · 编码 105m · 记录 30m", "复习 20m · 编码 130m · 测试 30m", "理论 30m · 实验 120m · 复盘 30m", "编码 120m · 调试 40m · 记录 20m", "实验 120m · 性能分析 40m · 记录 20m", "验收 90m · 文档 60m · 周复盘 30m", "休息；仅补漏 ≤ 90m，不开新内容"];
const acceptancePlan = [
  "验收：写下 5 条核心概念，并附 1 个可运行最小示例。",
  "验收：代码通过编译，覆盖正常路径与至少 2 个边界条件。",
  "验收：保存实验输入、输出和错误记录，能够从零复现。",
  "验收：提交可读代码、单元测试，并解释一次关键调试过程。",
  "验收：记录 baseline、硬件、输入规模、P50 与误差范围。",
  "验收：更新 README、周报和知识卡，形成可展示的提交。",
  "验收：无补漏任务时，任选下方 1 篇资料，整理 3 条摘要。",
];
const phaseResources = [
  [
    { label: "C++ 核心语言参考", url: "https://en.cppreference.com/w/cpp/language/" },
    { label: "C++ 内存与智能指针", url: "https://en.cppreference.com/w/cpp/memory" },
    { label: "CSAPP 官方课程站", url: "https://csapp.cs.cmu.edu/" },
  ],
  [
    { label: "CUDA Programming Guide", url: "https://docs.nvidia.com/cuda/cuda-programming-guide/" },
    { label: "Nsight Compute Profiling Guide", url: "https://docs.nvidia.com/nsight-compute/ProfilingGuide/" },
    { label: "Triton 官方教程", url: "https://triton-lang.org/main/getting-started/tutorials/" },
  ],
  [
    { label: "PyTorch FX 文档", url: "https://docs.pytorch.org/docs/stable/fx.html" },
    { label: "torch.compiler 指南", url: "https://docs.pytorch.org/docs/main/user_guide/torch_compiler/torch.compiler.html" },
    { label: "ONNX 官方介绍", url: "https://onnx.ai/onnx/intro/" },
  ],
  [
    { label: "TVM TensorIR", url: "https://tvm.apache.org/docs/deep_dive/tensor_ir/index.html" },
    { label: "TVM Relax", url: "https://tvm.apache.org/docs/deep_dive/relax/index.html" },
    { label: "MetaSchedule 教程", url: "https://tvm.apache.org/docs/deep_dive/tensor_ir/tutorials/meta_schedule.html" },
  ],
  [
    { label: "MLIR Toy Tutorial", url: "https://mlir.llvm.org/docs/Tutorials/Toy/" },
    { label: "MLIR Pass 基础设施", url: "https://mlir.llvm.org/docs/PassManagement/" },
    { label: "MLIR Pattern Rewrite", url: "https://mlir.llvm.org/docs/PatternRewriter/" },
  ],
];

function dateLabel(start: string, week: number, day: number) {
  const d = new Date(`${start}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + (week - 1) * 7 + day);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function Home() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [startDate, setStartDate] = useState("2026-08-10");
  const [activePhase, setActivePhase] = useState(0);
  const [query, setQuery] = useState("");
  const [openWeek, setOpenWeek] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ai-compiler-plan") || "{}");
      if (saved.completed) setCompleted(saved.completed);
      if (saved.startDate) setStartDate(saved.startDate);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("ai-compiler-plan", JSON.stringify({ completed, startDate }));
  }, [completed, startDate, ready]);

  const total = weeks.length * 7;
  const done = Object.values(completed).filter(Boolean).length;
  const percent = Math.round((done / total) * 100);
  const filtered = useMemo(() => weeks.map((w, i) => ({ ...w, index: i + 1 })).filter(w => {
    const phaseOk = activePhase === 0 || w.phase === activePhase;
    const text = `${w.title} ${w.goal} ${w.output} ${w.days.join(" ")}`.toLowerCase();
    return phaseOk && text.includes(query.toLowerCase());
  }), [activePhase, query]);

  function toggle(id: string) { setCompleted(c => ({ ...c, [id]: !c[id] })); }
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
          <span className="eyebrow">365 天 · 52 周 · 3 条硬核项目线</span>
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
        <div><span>01</span><h3>70% 动手</h3><p>每天至少 2 小时写代码、测数据或调试，课程只是输入。</p></div>
        <div><span>02</span><h3>周周有产出</h3><p>周六只做验收、文档与复盘，不用“看完了”冒充完成。</p></div>
        <div><span>03</span><h3>证据优先</h3><p>所有加速比都附硬件、输入、warmup、误差与 P50 数据。</p></div>
        <div><span>04</span><h3>留出余量</h3><p>周日默认恢复或补漏；连续两周拖延就主动砍任务。</p></div>
      </section>

      <section className="roadmap" id="roadmap">
        <aside>
          <div className="asideTitle"><span>YEAR</span><b>路线导航</b></div>
          <button className={activePhase===0?"active":""} onClick={()=>setActivePhase(0)}><span>全部 52 周</span><b>{percent}%</b></button>
          {phases.map((p,i)=><button key={p.name} className={activePhase===i+1?"active":""} onClick={()=>setActivePhase(i+1)}><i style={{background:p.color}}/><span><small>{p.range}</small>{p.name}</span><b>{phaseDone(i+1)}%</b></button>)}
          <div className="weeklyRhythm"><b>推荐节奏</b><span>周一–周五</span><p>每天 3 小时</p><span>周六</span><p>验收 + 输出</p><span>周日</span><p>恢复 / 补漏</p></div>
        </aside>

        <div className="planContent">
          <div className="planHead"><div><span className="eyebrow">WEEKLY EXECUTION PLAN</span><h2>{activePhase ? phases[activePhase-1].name : "全年执行清单"}</h2></div><label className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索 CUDA、LayerNorm、Pass…"/></label></div>
          <div className="phaseStrip">
            {phases.map((p,i)=><button key={p.name} className={activePhase===i+1?"selected":""} onClick={()=>setActivePhase(activePhase===i+1?0:i+1)}><span style={{background:p.color}}>{i+1}</span><b>{p.name}</b><small>{p.range}</small></button>)}
          </div>

          <div className="weekList">
            {filtered.map(w => {
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
                  <div className="deliverable"><span>本周验收物</span><b>{w.output}</b><small>周六结束前提交到 Git 仓库；必须可运行、可复现。</small></div>
                  <div className="resourceShelf"><span>本周知识链接</span><div>{phaseResources[w.phase-1].map(resource=><a href={resource.url} target="_blank" rel="noreferrer" key={resource.url}>{resource.label}<b>↗</b></a>)}</div></div>
                  <div className="dayGrid">
                    {[...w.days,"恢复或补漏；如果没有遗留任务，从本周知识链接中任选 1 篇精读，并写 3 条摘要和 1 个问题。"].map((task,di)=>{
                      const id=`${w.index}-${di+1}`; const checked=!!completed[id];
                      return <label className={`day ${checked?"checked":""}`} key={id}>
                        <input type="checkbox" checked={checked} onChange={()=>toggle(id)}/><span className="box">{checked?"✓":""}</span>
                        <span className="dayDate"><b>DAY {String(di+1).padStart(2,"0")}</b><small>周{dayNames[di]} · {dateLabel(startDate,w.index,di)}</small></span>
                        <span className="task"><b>{task}</b><small>{timePlan[di]}</small><small className="acceptance">{acceptancePlan[di]}</small></span>
                      </label>;
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
        <div className="sectionIntro"><span className="eyebrow">PORTFOLIO CHECKPOINT</span><h2>一年后，你交付的不是课程笔记</h2><p>主线只保留三个能深入追问的项目。MLIR 是体系补全，不与 TVM 抢主线时间。</p></div>
        <div className="projectGrid">
          <article><span>01 · CUDA</span><h3>Kernel Optimization Lab</h3><p>GEMM、Softmax、LayerNorm 的逐步优化，含正确性测试、Nsight 证据和跨 shape 性能曲线。</p><b>W13 → W20</b></article>
          <article className="featured"><span>02 · COMPILER</span><h3>PyTorch Fusion Backend</h3><p>FX/torch.compile 图捕获、模式重写、fallback 与 profiler 结果，能解释 guards 和 graph break。</p><b>W21 → W30</b></article>
          <article><span>03 · TVM</span><h3>Transformer Compile Lab</h3><p>Relax + TIR + MetaSchedule，聚焦 LayerNorm、mini attention 与 KV Cache，不虚报“超越官方库”。</p><b>W31 → W44</b></article>
        </div>
      </section>

      <section className="adjustments">
        <h2>相较原路线，做了 5 个关键修正</h2>
        <div className="adjustGrid"><p><b>01</b><span><strong>nvprof → Nsight</strong>使用 Nsight Systems 看全局时间线，Nsight Compute 深挖单 kernel。</span></p><p><b>02</b><span><strong>JIT → torch.compile</strong>FX 保留，但主线升级为 Dynamo、AOTAutograd、Inductor 与 Triton。</span></p><p><b>03</b><span><strong>Relay → Relax + TIR</strong>Relay 只在读旧资料时识别；新项目走当前 TVM 编译栈。</span></p><p><b>04</b><span><strong>AutoTVM → MetaSchedule</strong>理解历史概念即可，实战采用搜索空间、代价模型和可复用数据库。</span></p><p><b>05</b><span><strong>7B 大项目 → 可验收小系统</strong>先做 mini decoder、KV Cache 与 attention 热点；有余力再扩大模型。</span></p><p><b>+</b><span><strong>硬件不是 GTX 1060 起步</strong>以能运行当前 CUDA 工具链且显存满足实验为准；没卡可先用云 GPU。</span></p></div>
      </section>

      <footer><div className="brand"><span className="brandMark">AC</span><span>AI Compiler<br/><b>YEAR ONE</b></span></div><p>坚持不是每天满负荷，而是每周都有可验收的前进。</p><a href="#top">返回顶部 ↑</a></footer>
    </main>
  );
}
