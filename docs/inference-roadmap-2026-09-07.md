# 推理部署与优化学习路线 · 2026-09-07 核对版

目标：2027-03-28 完成30周核心范围，2027-03-29至03-31为额外截止缓冲。默认起点2026-08-31，保留当前 W02-D05 进度和前两周任务。更改网页开始日会重新计算结束日期并提示超期，不自动压缩任务。

## 时间与硬件

- 每天约4小时含刷题；每周Day7留80–170分钟补课；若实际只有2小时，不能保证原截止日期。
- 后续可用双RTX3090；先按普通24GB×2规划，用户所说64GB待设备快照核实。
- 双卡未到位不阻塞单卡核心项目；GPU实验不能用CPU模拟冒充完成。
- 知识先导实验与项目复用同一代码，项目阶段补契约、工程化和真实模型证据，不从零重复全部实验。
- 普通日阅读35分钟、验证20分钟、日志10分钟、通用缓冲10分钟；两条算法90分钟时实现75分钟，一条60分钟时实现105分钟。Day7仅阅读15、代码30、验证15、日志10，算法原样，余下80–170分钟补课。
- 每周约28小时，30周约840小时；这是预算，不是保证。连续两周欠项超过两个普通日，应先删选修、使用W28–W30缓冲，仍不足就重新商议范围/截止日期，不能勾选未完成任务。
- RTX3090官方容量24GB/卡；双卡通常48GB分离显存。64GB可能是改装显存或系统RAM，需nvidia-smi核实。双卡到货时间不确定，因此单卡项目可独立验收；TP/双副本结果仅在实际运行后记录。

## 每周安排

|周|日期|内容|交付物|
|---|---|---|---|
|W01|2026-08-31—2026-09-06|MiniTensor I：工程骨架与张量接口|library、demo、CTest 与张量元数据|
|W02|2026-09-07—2026-09-13|MiniTensor II：Storage、View 与正确性|RAII、共享视图、正确 matmul 与 Sanitizer|
|W03|2026-09-14—2026-09-20|MiniTensor 收尾：泛型、并发与原生接口|泛型 add、tiled CPU matmul、线程队列与 C ABI|
|W04|2026-09-21—2026-09-27|Python / Linux / PyTorch 实用基础|可配置 MLP、设备/精度实验与 checkpoint|
|W05|2026-09-28—2026-10-04|Transformer 部件：输入、Attention、Norm、FFN|tokenizer 使用、attention/norm/FFN reference|
|W06|2026-10-05—2026-10-11|Transformer 生成与 GPU 性能模型|cached decode 等价测试与设备容量工具|
|W07|2026-10-12—2026-10-18|CUDA：线程、访存与可靠计时|vector add、三版 transpose 与 CUDA Event|
|W08|2026-10-19—2026-10-25|CUDA：规约与稳定 Softmax|两级 reduce、stable/block softmax、online reference|
|W09|2026-10-26—2026-11-01|CUDA GEMM 与 Nsight 分析|naive/tiled GEMM、资源报告与库对照|
|W10|2026-11-02—2026-11-08|Triton 与 Attention 的 IO 思路|Triton add/softmax/RMSNorm 与 SDPA 对照|
|W11|2026-11-09—2026-11-15|PyTorch 接入与 compile 入门|custom op、profiler trace、编译稳态基线|
|W12|2026-11-16—2026-11-22|ONNX / ONNX Runtime 部署|固定/动态 ONNX、ORT CPU/GPU 正确性与对照|
|W13|2026-11-23—2026-11-29|TensorRT 工程部署|TensorRT engine、动态 profile 与部署比较|
|W14|2026-11-30—2026-12-06|量化：原理、校准与真实小模型|量化 reference、ORT PTQ 与模型质量/显存记录|
|W15|2026-12-07—2026-12-13|vLLM：真实单卡离线与服务|单卡服务、SSE 客户端与 KV/队列指标|
|W16|2026-12-14—2026-12-20|KV Cache、调度与并行原理|分页/批处理模拟、APC/chunked 实验、TP 等价示例|
|W17|2026-12-21—2026-12-27|推理编译：FX / Inductor / CUDA Graph|安全 FX pass、动态编译、CUDA Graph 与 custom op 图接入|
|W18|2026-12-28—2027-01-03|推理服务工程与压测基础|可测的 HTTP 代理、token 准入与压测基线|
|W19|2027-01-04—2027-01-10|项目 A：基线、配置与测量协议|项目 RFC、环境快照、模型与 workload manifest|
|W20|2027-01-11—2027-01-17|项目 A：可验证压测器|open/closed-loop 压测器与容量探索报告|
|W21|2027-01-18—2027-01-24|项目 A：准入、背压与故障恢复|token 预算网关、有界队列、取消/指标/故障测试|
|W22|2027-01-25—2027-01-31|项目 A：优化消融与双卡进阶|优化消融、真实双卡可选对照与配置索引|
|W23|2027-02-01—2027-02-07|项目 A：质量、重复实验与 v1.0 候选|100 例质量评估、重复 benchmark、完整服务报告|
|W24|2027-02-08—2027-02-14|项目 B：RMSNorm 与残差融合基线|reference、参数化测试、融合 kernel 与基线|
|W25|2027-02-15—2027-02-21|项目 B：受控优化与 shape dispatch|小规模调参、支持矩阵、dispatch 与性能分析|
|W26|2027-02-22—2027-02-28|项目 B：框架与真实模型接入|custom op、compile、HF 模型正确性与命中 trace|
|W27|2027-03-01—2027-03-07|项目 B：测试、性能与可安装交付|50+ 参数化用例、模型 benchmark、API 与复现报告|
|W28|2027-03-08—2027-03-14|项目缓冲与真实开源贡献|最小复现、根因/回归测试、贡献草稿|
|W29|2027-03-15—2027-03-21|秋招材料与技术演示|两项目简历条目、证据矩阵与源码演示|
|W30|2027-03-22—2027-03-28|最终复现、查漏与投递准备|两项目最终 checklist、部署取舍与可提交材料|

## 岗位依据与证据等级

核对日期不等于发布日期。这里只是岗位/方向样本，不代表全部在招校招、不保证学历资格或录用。

- [思朗科技 · 2027 校招：推理框架工程师](https://www.nowcoder.com/jobs/detail/463017?urlSource=sitemap)：企业 HR 发布：2026-08-26 招聘起始；CUDA、vLLM/ORT/TensorRT、缓存/量化/并行。对应 W07–W27；分布式/通信深度另有缺口。 企业招聘账号的岗位正文；不是保证录用或永久有效岗位。
- [字节跳动 Seed · 官方校招方向：机器学习系统 · 推理与编译](https://seed.bytedance.com/zh/seedearlycareer)：2027 招聘方向：推理计算/存储瓶颈、调度与编译算子。对应 W07–W27；这是官方方向说明，不是单岗完整 JD。 官方校招方向；无单岗发布时间。
- [阿里巴巴 · 官方团队招聘：大模型推理系统工程师/专家](https://alibaba.github.io/ROCK/zh-Hans/careers/)：推理架构、算子到调度、性能/精度/成本。当前路线覆盖通用推理基础；多模态/专家资历不等于已满足。 官方团队职位简介；完整单岗条件与发布日期未核实，不当校招硬门槛。
- [算苗科技 · 2027 校招补充样本：AI 编译器 / AI 框架研发](https://job.hust.edu.cn/zpinfo1/2407497.htm)：2026-08-26 高校就业网招聘：Triton/MLIR、算子优化、vLLM/SGLang。对应 W10–W27；纯编译器还需深补 LLVM/MLIR。 高校发布企业招聘正文；新兴芯片企业补充对照，不冒称大厂。

腾讯具体推理岗位官方正文未能完整访问，所以未把镜像JD当已核实硬条件。主线由可访问的官方/企业发布信息与技术文档交叉确定。

## 对照旧版的实质调整

- W01–W02保持原任务与勾选键；算法210天逐条与旧版快照对比，不重排或删题。
- C++阶段收敛到MiniTensor的3周小项目，增加W04 Python/Linux/PyTorch前置；Transformer拆成两周，不在一天里要求全部模型结构。
- 取消强制DDP/FSDP/ZeRO实作周；推理中的TP原理与可选双卡实验保留。
- 原来传统IR/MLIR/TVM连续深入的时间，转给ONNX/ORT、TensorRT、量化、vLLM、缓存调度和服务工程；FX/torch.compile/CUDA Graph保留。并非宣称已完整掌握纯编译器后端。
- 项目A从算子集合改为真实LLM服务优化工程；项目B升级为受限但完整的 FX 子图融合链：固定 Post-Norm residual→RMSNorm 模式的捕获、语义 guard、Pattern Pass、custom op、手写 Triton kernel、fallback 与模型证据；它不是通用图编译器。
- 双卡并不等于千卡训练实践，不能在简历写没有做过的集群经验。

## 阅读映射规则

每一天至少一条AIInfraGuide实际标题。46个关联网页返回200，当前代码按页面真正的h标签取得小节anchor；另外保留固定Git commit原文行号，便于未来网站更新后追溯。引用只读所列标题到下一同级标题；不要求整章通读。

“量化”“生产部署”“Benchmark”“AI编译器”部分页面现在只是简介/提纲，所以明确标记，没有制造不存在的4.3/10.4详细章节。官方工具文档是补充实现材料；MiniTensor、服务网关、融合算子是学习计划设计的配套练习，不是AIInfraGuide原文现成作业。Storage/View设计对应所有权/布局概念，不冒称第1章有同名小节。

## 项目验收

### A · 可复现 LLM 推理服务与性能优化

W19–W23。自研可交叉校验的压测器、token 预算准入/有界队列、故障恢复与指标；对真实模型做质量约束下的消融。

边界：vLLM 提供模型执行和内部调度；不宣称自研完整引擎、线上大规模部署或千卡训练。

开源参照：[vLLM](https://github.com/vllm-project/vllm)、[SGLang（比较阅读，不强制双实现）](https://github.com/sgl-project/sglang)。

### B · 基于 PyTorch FX 与 Triton 的推理子图融合与运行时调度系统

W24–W27。针对固定、可验证的 Residual→RMSNorm 子图：FX 捕获、shape/dtype/layout guard、语义保持 Pattern Pass、custom op 替换、手写 Triton 融合 kernel、fallback、torch.compile 与模型级证据。

边界：FX Pass 只覆盖自有、可追踪的 Post-Norm tiny Decoder 固定模式；真实 HF 模型先只替换 RMSNorm。不是任意模型的通用图编译器、代码生成器或完整推理引擎。

开源参照：[Triton](https://github.com/triton-lang/triton)、[FlashAttention（源码与测试参照）](https://github.com/Dao-AILab/flash-attention)、[PyTorch](https://github.com/pytorch/pytorch)。

项目A：100条固定质量样本；3类workload、每配置3次重复；官方工具交叉检查；明确拒绝率/成功延迟/goodput和SSE chunk语义；故障/取消/容量归还测试；干净复现。探索50请求不冒充高置信P99。

项目B：50+参数化用例；正例/反例图、FP32/FP16/非对齐/fallback；torch.library/fake/compile；原/优化 FX 图、独立算子、tiny Decoder 残差融合、真实 HF 模型 norm 替换四层分别报告；所有数字可定位到原始日志。不保证固定加速比例。

## 工程检测与版本入口

- 完整算法快照：tests/algorithm-baseline.json。前两周主任务未更改。
- 自动测试：210稳定ID、阅读标题/anchor、240分钟预算、Day7缓冲、先修关系、双卡边界、渲染每日内容、勾选/展开状态、所有HTML入口载荷一致、服务重定向。
- 发现远端HTML入口混用50周、39周、30周旧版；最新根目录worldhaung_ai.html的算法与本地核对版一致。本次统一根index、docs/index、根/ docs/ public下worldhaung_ai.html到同一数据，防止不同网址看到不同计划。
- 勾选仍为浏览器本地存储，跨设备不自动同步。口令不是安全身份认证；公开仓库内容本来即可阅读。
