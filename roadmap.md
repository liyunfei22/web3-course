# roadmap.md — 课程冻结基线（v1.0, Frozen）

> **本文件是课程包的冻结基线。** 所有阶段讲义、tasks、SPEC、scaffolds、interview 文档必须与本文一致：阶段编号、周次、项目命名、技术栈决策、依赖关系、弹性档数字、面试权重数字。
> **变更规则**：任何作者不得单方面修改。确需修改时，在 `QA/review-log.md` 记录「改了什么/为什么/影响哪些下游文件」，由终审（A7）确认后在此更新版本号。
> 术语与写作规则见 `CLAUDE.md`；每日作息细节见 `daily-rhythm.md`；验收标准见 `standards/project-acceptance-10.md`。

---

## 1. 课程一句话

用 20 周（弹性 15-22 周）把「Web2 前端/全栈、无后端经验」的学员送到「可投递大型 Web3 交易所 Go 后端岗」的状态：**Go 分布式后端为主线（70%+ 时间），以太坊项目级深度 + Solana 够用线为辅线**，全程以 5 个完整项目（P0-P4）+ 面试冲刺为产出。

## 2. 技术栈决策（冻结，不再讨论）

| 决策点 | 结论 | 依据 |
|---|---|---|
| 后端主线语言 | **Go（100% 主线）** | JD 硬要求（Bybit 连 Principal C++ 岗都要求 3+ 年 Go）；交易所以外 70%+ 后端主流；GC 对无后端经验者友好；旗舰项目可直接对读开源 Go 实现（blockbook/erigon/orderbook） |
| 不选 Java | 无基础 + 新项目 Go 化 | 换道成本高于收益 |
| 不选 Rust 为主线 | 曲线不适合 5 个月转岗；只在 Backpack/Kraken 等少数所有加分 | Rust 定位「够用线」 |
| 以太坊链上 | **项目级深度**（会写会测会部署 DEX，不到审计师） | 为「何时读事件日志/幂等键为什么带 logIndex」提供底层语义 + DeFi 八股 |
| Solana | **够用线**（能读能改 Anchor 程序 + 掌握 CEX 接入原理） | JD 覆盖面窄，一周期限内到此为止 |
| 前端 | React 保留，P2 的 Web UI 是一等交付物（lightweight-charts 深度图） | 学员既有优势 |

## 3. 阶段表（Phase 0-7）

| 阶段 | 主题 | 周次 | 核心交付 | 简历力 |
|---|---|---|---|---|
| Phase 0 | 启动与装备 | 第 0 周 (0.5) | 环境/账号/GitHub 组织/课程协议 | 路基 |
| Phase 1 | Go + Web2 后端补课（前端→后端拼图，含 JS→Go 心智迁移表） | 第 1-4 周 | **P0 短链服务**（Go+Gin+MySQL+Redis+Docker+CI+React 管理页） | 可写简历的 Web2 后端项目 |
| Phase 2 | 分布式中间件：Kafka 深度/DDIA 精选/幂等与 Outbox/网关限流/gRPC/可观测 | 第 5-7 周 | 订单 API 种子工程（旗舰地基） | Kafka/网关/幂等认知 |
| Phase 3 | 区块链原理（交易生命周期/HD 钱包/确认数/reorg/EVM 事件与日志/RPC 扫块）+ 开发 | 第 8-9 周 | **P1 链上充值监控服务** | 系统设计题②直取 |
| Phase 4 | **旗舰 P2 迷你交易所**：撮合(W10)→账务(W11)→行情 WS(W12)→钱包+对账(W13)→前端+压测(W14) | 第 10-14 周 | **P2 迷你交易所**（撮合+账务+钱包充提+行情+React+CI+压测报告） | 系统设计①③④⑤⑥ |
| Phase 5 | Solidity+Foundry（Cyfrin 主线）+ Uniswap v2 风格 DEX | 第 15-16 周 | **P3 DEX Clone**（Foundry 全测试+Sepolia 部署+源码验证+Slither） | DeFi 八股真实经验 |
| Phase 6 | Rust 够用速成 + Anchor | 第 17 周 | **P4 Solana 小项目**（devnet 部署+EVM/Solana 接入对比文档） | Solana 专项八股 |
| Phase 7 | 面试冲刺 | 第 18-20 周 | 系统设计 8 题+Go 深挖 60 题+算法 180 题+英文+简历+Mock | 可投递状态 |

### 阶段要点（作者写作时必须引用的内容锚点）

- **Phase 0**：Go/MySQL/Redis/Kafka/Docker 本地环境一次装齐、GitHub 组织建号、MetaMask + Phantom + Sepolia/Solana 水龙头领测试币、k6/Foundry 安装、确定弹性档位并签署课程协议（每日作息承诺）。
- **Phase 1**：JS→Go 心智迁移表（切片 vs 数组、错误 vs 异常、goroutine vs Promise、接口 vs 鸭子类型）；HTTP/JSON/中间件心智；MySQL 表设计与事务；Redis 缓存；Docker Compose；GitHub Actions 首条流水线。**P0 短链服务**：短码生成/过期/点击统计。前端优势：每周 1-2h 演进 React 管理页。
- **Phase 2**：Kafka 深度（分区/消费组/ack/重平衡/顺序）、DDIA 精选章节（复制/分区/事务/一致性）、幂等与 Outbox 模式、网关限流（令牌桶）、gRPC 入门、可观测（日志/指标/链路）。交付**订单 API 种子工程**：REST 下单接口 + Kafka 事件流 + 幂等消费 + 限流中间件，作为 P2 的地基。
- **Phase 3**：交易生命周期（mempool→pending→confirmed→finalized）、HD 钱包（BIP32/39/44）与充值地址派生、确认数与 reorg、EVM 事件与日志（topics/logIndex）、RPC 扫块策略。**P1 链上充值监控服务**：轮询+WS 监听 Sepolia USDC Transfer → (txHash, logIndex, 接收地址) 幂等入账 → pending/confirmed/finalized 状态机 → reorg 冲正 → Kafka → WS 通知 → REST → React 面板。
- **Phase 4**：5 个里程碑对应 5 周：M1 撮合（注册登录→三栏账户→限价/市价下单撤单→内存订单簿，价格-时间优先、按 symbol 分片单线程、WAL+快照回放、fuzz 不变式）→ M2 账务（复式记账 + Outbox 事件流）→ M3 行情 WS（快照+增量+seq 补偿）→ M4 钱包+对账（复用 P1 扫块逻辑 + 风控 + 提现签名 + 广播 + 回执 + 冷热分层归集 + 三方对账 + PoR 简化 Merkle CLI）→ M5 前端+压测（React + lightweight-charts 深度图 + k6 压测 3 组数据 + pprof 调优对比 + CI）。
- **Phase 5**：Cyfrin Updraft 主线（Solidity→Foundry→安全）；**P3 Uniswap v2 风格 DEX Clone**：自写 Factory/Pair/Router（核心数学自己实现，不 fork）、CEI/guard/sweep、Foundry 单测+fork+fuzz、Slither 自查、Sepolia 部署+Etherscan 源码验证、真实 swap 录屏；（可选）React 前端。
- **Phase 6**：course.rs 前 15 章（2 天）→ Anchor 核心 PDA/CPI（2 天）→ 复刻 staking/crowdfunding 模板（1 天）→ devnet 部署 + anchor test +「EVM vs Solana 充值接入对比」文档（1 天）。
- **Phase 7**：W18 系统设计 8 题（每天 1 题限时白板，每题产 1 页英文答案，与旗舰项目对照讲）；W19 算法分类题单约 180 题（Medium 为主）+ **Go 并发专项 15 题必做**（交替打印/限流器/worker pool/生产者消费者/select 陷阱等）；W20 英文 100 词中英术语库 + 1 分钟自我介绍 + 30 分钟项目讲述稿（旗舰/P1/DEX 三版录音回听）+ 简历 2 页数字驱动 + 投递表 + 2-3 场完整 Mock（四轮评分卡）。

系统设计 8 题清单（W18，面试题与项目的对应关系）：①撮合引擎 ②充值确认与安全 ③订单流/Kafka 拓扑/WS 网关 ④三栏账务/事件溯源/精度 ⑤三方对账 ⑥冷热钱包 ⑦低延迟优化 ⑧高可用主备。

## 4. 阶段依赖关系

**硬依赖（顺序不可调）**：

```
P0 ──打底──→ P1 ──→ P2 ──→ P4（旗舰）
                ↑P0 提供 Go 肌肉记忆与环境
P3 ──→ P4：P2 钱包模块直接复用 P1 的扫块/确认数/reorg 冲正逻辑
```

- P0 打底：环境、git 习惯、四件套用法，一切的前置。
- P1→P2：P2（Phase 3）建立在 P1 的 Go 服务能力之上（P2 种子工程是 P4 的骨架）。
- P3→P4：P4（Phase 4）的钱包充提模块复用 P1 的扫块逻辑，**P1 不是可选项目**。
- P2→P4：P4 的 Kafka/Outbox/限流直接复用 P2 种子工程。

**软依赖（无代码依赖，可弹性前后挪）**：

- P3（Phase 5 的 P3 DEX）与主线无代码依赖；EVM 事件与日志概念与 Phase 3 呼应，先学更顺，但不阻塞主线程。
- Phase 6（P4 Solana）与主线完全独立。

**红线（不可砍）**：Phase 1、4、7。
理由：Phase 1 = 无后端学员的全部地基（语言/数据库/HTTP/部署）；Phase 4 = 旗舰项目（超 50% 面试素材来源）；Phase 7 = 简历关与面试关的直接产物。砍任何一个等于白学前序。

**可砍顺序（何时砍见第 5 节）**：Phase 6（Rust/Solana）→ Phase 5 安全关（Slither 深度扫描/Ethernaut）→ Phase 2 可观测性（gRPC/OpenTelemetry 降选读）。

## 5. 弹性压缩三档砍项指南

| 档位 | 总时长 | 日投入 | 砍项操作（按优先级） |
|---|---|---|---|
| 冲刺档 | 15-16 周 | 8h/天 | 1. 提速优先：算法 45min→1h、项目 2h→3h，内容不减；2. 仍超期才砍：W19 算法 180→100 高频题；3. Phase 2 gRPC 降选读（Kafka/幂等/Outbox 不动）；4. 选读资源全部跳过 |
| **标准档** | **20 周** | **6h/天** | **不砍，全量执行** |
| 最低档 | 22 周 | 4h/天 | 1. Phase 6 缩至 0.5 周（只保 Anchor 核心 PDA/CPI，P4 交付物从完整项目降为「模板复刻 + 对比文档」）；2. Phase 5 安全关降级：Ethernaut 选做、Slither 跑必测但输出简版报告；3. Phase 2 可观测性降选读（gRPC/OTel 只读讲义不写代码）；4. P2 压测降为单次记录（k6 跑一组数据存报告，不做调优对比）；5. 算法 180→120 题；6. 每日复盘压缩为三行日志（时间上每天本来就 4h） |

通用顺序：**先按档位提速（把多出的能力投到算法/项目），再按「Phase 6 → Phase 5 安全关 → Phase 2 可观测性」砍内容**；红线 Phase 1/4/7 永不砍，只能压缩单日深度（比如 Phase 1 不细抠 Go 反射这种边角）。任何档位不得砍：P1（P2 的前置）、10 条验收标准（P4 至少满足 8 条，强制 ①②④⑤⑥⑧⑨⑩；③⑦ 可降级）。

## 6. 每日节奏三档模板

块结构（时段表见 `daily-rhythm.md`）：

| 块 | 标准档 6h | 冲刺档 8h | 最低档 4h |
|---|---|---|---|
| 算法 | 45 min | 60 min | 30 min |
| 主课（lecture 精读 + 最小 demo） | 3 h | 3 h | 2 h |
| 项目（tasks 执行） | 2 h | 3 h | 1 h |
| 英语/八股 | 30 min | 30 min | 20 min |
| 复盘 + 每日 commit | 30 min | 30 min | 20 min |

原则：算法放一天头脑最清醒的开头；主课紧跟其后（认知负荷最重）；项目在下午（动手）；复盘必做不可省——它是「产出型笔记」的固化点。每周 6 天学习 + 周日半天复盘规划（周六照常）。

## 7. 教学法三原则

1. **跑通优先（run-first）**：先打通最小全链路（从用户入口到用户可见的结果），再回头重构、补正确性、做优化。判断标准只有一个：「链路通了吗？」没通就先修链路。反例：花 3 天打磨一个子函数而全链路还跑不起来。
2. **产出型笔记（artifact notes）**：笔记必须是可提交、可复述、可被面试官查看的产物——ADR（决策记录）、项目 README、架构图、复盘文档、八股卡（一问一答可背诵）。禁止纯摘抄讲义。
3. **卡壳 30 分钟规则**：单个点（编译错/工具错/概念卡）30 分钟无进展 → 换路（查官方文档 → 换实现路径 → 记录问题后跳过，次日再回）。换路不换目标。卡壳记录是面试故事的素材库。

## 8. 面试权重 → 课程时间分配映射表

依据：Binance/OKX/Bybit/Coinbase 官方 JD 调研。课程时间按此权重分配，面试冲刺反向复习同一组材料。

| 面试模块 | 权重 | 课程时间落在哪里 |
|---|---|---|
| 算法 | 20-30%（Medium 为主） | 每日算法块（全期积累）+ W19 冲刺 180 题 + 并发专项 15 题必做 |
| 系统设计 | 30-40%（撮合/钱包/行情推送） | Phase 2 中间件原理（W5-7）+ Phase 3 区块链原理（W8-9）+ **Phase 4 P2 实战**（W10-14）+ W18 每题限时白板、与旗舰项目对照讲 |
| 八股（区块链+后端） | 15-25% | 每日英语/八股块 30min（全期）+ Phase 5/6 链上实物（W15-17）+ W19 题库 |
| 项目深挖 | 10-20% | P0/P1/P2 全程项目时间；「跑通优先」保证每个项目能讲「做过、有取舍、有数据」 |
| Go 深挖 | 技术面内隐含重点 | 每日主课 Go + W19 Go 并发专项 15 题 + `interview/go-deep-60.md` |
| 中英双语 | 硬性要求（OKX/Bybit） | 每日英语块 30min（全期）+ W20 术语库 100 词/自我介绍/30 分钟讲述稿三版录音回听 |

分配逻辑：系统设计权重最高，对应的是 Phase 2/3/4 的全部主课与项目；算法靠「每天 45 分钟 + 冲刺期集中刷」的持续节奏而非大块时间；项目深挖权重不高但要「每个细节都经得起追问」，这正是跑通优先 + 产出型笔记的产出。

## 9. 项目路线图汇总（完整项目，非 demo）

| 项目 | 阶段 | 周期 | 一句话 | 10 条验收 |
|---|---|---|---|---|
| P0 短链服务 | Phase 1 内嵌 | 2 周 | Go+Gin+MySQL+Redis+Docker Compose+GitHub Actions+React 管理页；短码生成/过期/点击统计 | 全量 |
| P1 链上充值监控服务 | Phase 3 | 2 周 | 轮询+WS 监听 Sepolia USDC Transfer → 幂等入账 → 状态机 → reorg 冲正 → Kafka → WS → REST → React 面板 | 全量 |
| P2 迷你交易所（旗舰） | Phase 4 | 5 周 | 撮合/账务/充提/行情/前端/压测，M1-M5 每里程碑当周验收 | 全量（k6 压测 3 组数据 + pprof 调优对比） |
| P3 DEX Clone | Phase 5 | 2 周 | Uniswap v2 风格 Factory/Pair/Router 自写 + Foundry 全测试 + Sepolia 部署验证 + Slither | 全量（前端可选） |
| P4 Solana 小项目 | Phase 6 | 1 周 | Anchor 复刻 staking/crowdfunding + devnet 部署 + EVM/Solana 接入对比文档 | 满足 6 条（①②④⑤⑥⑨），见 P4 SPEC |

每个项目的详细规格书见 `projects/SPEC-{p0..p4}.md`（统一模板 `projects/SPEC-template.md`）；验收标准细则见 `standards/project-acceptance-10.md`。

## 10. 阶段四件套与 QA 流程

- 每阶段目录 `0X-xxx/` 含四件套：`lecture.md`（讲义，不给完整实现代码）、`tasks.md`（任务，每项标时长/前置/输出物）、`checklist.md`（布尔可判验收）、`resources.md`（仅已核实资源池）。
- 终审（A7）四类硬指标：①与 roadmap 基线一致性（周次/依赖/术语/技术栈）②全部资源链接 HTTP 200 实测 + 黑名单扫描 ③每条验收布尔可判、外部可验证 ④与调研事实零冲突（Go 硬要求/区块链 nice-to-have/8 题清单/开源参考）。
- 验收记录与修订记录统一写 `QA/review-log.md`。

## 变更记录

| 版本 | 日期 | 变更 | 作者 |
|---|---|---|---|
| v1.0 | 2026-10-09 | 冻结基线初版 | A0 |