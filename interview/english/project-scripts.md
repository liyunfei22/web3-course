# project-scripts.md — 1 分钟自我介绍 + 30 分钟英文项目讲述稿（三版）

> 定位：roadmap W20 硬性交付「1 分钟自我介绍 + 30 分钟项目讲述稿（旗舰/P1/DEX 三版）录音回听」。
> 前置：P2 旗舰项目已满足 10 条验收（`standards/project-acceptance-10.md`）、P1/P3 已完成；`english/glossary.md` 过完。
> 用法：每版讲稿都要做到「脱稿 30 分钟讲完」——先按本模板写逐字稿，再压缩成 5 分钟、1 分钟两个版本；录音回听 ≥ 2 遍，把「卡壳/含糊」处标时间戳重写。所有数字必须来自项目 README / k6 报告 / 验收记录，禁止凭印象编。
> 语言：每版给中英双语结构（面试时英文讲主体，中文版用于理解与应急切换）。

---

## 一、1 分钟自我介绍模板（中英双语，各 100-120 词）

### 1.1 结构公式（4 句：身份 → 主线 → 亮点 → 连接）

| 句 | 内容 | 范文（英文） |
|---|---|---|
| 1 身份 | 名字 + 转岗前背景（JS/TS 前端/全栈） | I'm Li Feng, previously a front-end / full-stack developer working with JavaScript, TypeScript and React for about X years. |
| 2 主线 | 5 个月全职转 Go 后端 + 加密货币基础设施 | For the past 5 months I've been learning as a full-time student: Go, distributed systems (MySQL, Redis, Kafka), and blockchain engineering — my goal is to become a backend engineer in crypto infrastructure. |
| 3 亮点 | 1-2 个可量化项目结果（挑最大的） | I've built a mini crypto exchange in Go with an in-memory matching engine (price-time priority), double-entry ledger, WebSocket market data, and a deposit monitoring service — all covered by tests at over 85%, benchmarked with k6 at ~X QPS / Xms P99. |
| 4 连接 | 为什么来这家 + 一句谦逊收尾 | I'm excited about [company] because [reason, e.g. its Go stack and derivatives business]. I'm happy to walk through any details of the projects. |

### 1.2 常见坑（对照自检）

- 超时：超过 110 秒 = 没练熟，砍第 2 句。
- 念简历：出现「responsible for …」式的堆词 → 改成「I built / I chose / I measured」。
- 数字不熟：QPS/P99/覆盖率/确认数必须脱口而出（做进「记忆锚」：比如把数字写成 Post-it 贴显示器）。
- 语气平静：语速 120 词/分钟上下，结尾一句练习 3 遍带微笑（录音回听验证）。

## 二、30 分钟英文讲述稿模板（通用 7 段结构，每版适用）

| 段 | 时长 | 内容 | 关键词（英文口播） |
|---|---|---|---|
| 1 一句话项目 | 1 min | 用一句话说清「这是个什么系统」 | "It's a … that …" |
| 2 动机 | 3 min | 为什么做/这个项目在真实交易所里对应什么 | motivation: production problem → trade-off |
| 3 架构 | 8 min | 画架构图（Mermaid 或白板）讲组件与数据流 | gateway → order service → Kafka → matching → ledger → WS |
| 4 我做的关键决策 | 8 min | 3 个决策：每个 = 选项 → 选择 → 代价（对应 ADR） | decision, alternative, trade-off, ADR |
| 5 数据指标 | 5 min | 压测/覆盖率/延迟数字 + 瓶颈与调优对比 | k6: concurrency, QPS, P50, P99, error rate; pprof |
| 6 踩坑与成长 | 3 min | 2 个坑：现象 → 根因 → 解法 → 耗时 | bug, root cause, fix |
| 7 总结 + 抛接球 | 2 min | 三句话复盘 + 「可以深挖任何部分」 | summary, happy to dive deeper |

**30 分钟稿写作铁律**：每段时间对应「真实发生过、有记录」的东西（ADR/README/压测报告/复盘文档）；写不出来细节 = 该部分没做透，回到项目补证据，而不是糊过去。

## 三、版本 A：P2 旗舰迷你交易所（重点项目，优先磨这版）

### A1. 一句话

> "It's a mini centralized exchange I built from scratch in Go — an in-memory matching engine with price-time priority, a double-entry ledger with frozen / available / total balances, a WebSocket market-data gateway, and a deposit & withdraw pipeline with cold / hot wallet separation. All wrapped with CI, load testing, and observability."

### A2. 动机（3 min，讲稿要点）

- 目标动机：练成「面试谈资」+「真实交易所后端的地基」：撮合、账务、行情、钱包四大件全链路。
- 生产问题动机（可讲 2 条）：①撮合单线程内存 vs 数据库撮合的取舍；②账务与事件流的一致性（Outbox）；③行情 WS 断线恢复。
- 一句话升华："I wanted to understand every layer of an exchange, not just one component."

### A3. 架构（8 min）

画图与口播顺序：React 管理页 → API 网关（限流）→ 订单服务（REST）→ Kafka（订单事件）→ 撮合引擎（每 symbol 单线程 + 内存订单簿 + WAL/快照）→ 账务服务（复式记账 + Outbox）→ 行情 WS 网关（快照+增量+seq）→ 钱包模块（扫块/确认数/sign/广播/回执）→ 对账与 PoR（Merkle CLI）。

关键口播句（背熟）：
- "The matching engine is sharded by symbol; each symbol runs in a single goroutine, so we never need locks there — correctness comes from serialization plus a write-ahead log."
- "Order events flow: HTTP → Kafka → matching → ledger, and only the ledger touches user balances."

### A4. 关键决策（8 min，3 个 ADR 的面试版）

| 决策 | 选项 | 选择与理由 | 代价 |
|---|---|---|---|
| 撮合数据结构 | 数据库锁表撮合 vs 内存订单簿 | 内存堆 + 时间序队列，10 万 TPS 是内存的活；WAL+快照回放兜持久化 | 崩溃恢复实现复杂度、单机上限 |
| 账务一致性 | 双写数据库+发消息 vs Outbox | Outbox 同事务写业务+事件，relay 发布；绝不出现「入账了但事件没发」 | 多一跳延迟、outbox 表膨胀需归档 |
| 行情推送 | 全量每推 vs 快照+增量 | 快照一次 + 增量带 seq，断线重连「重拉快照→补增量」；带宽降一个量级 | 客户端协议更复杂、seq 必须可靠 |

### A5. 数据指标（5 min）

要求从 k6 报告与 `go test -cover` 输出拿真实数字填入，格式统一：
- 压测：`k6 以 C=2000 并发压 /order，吞吐 X QPS，P50=Xms，P99=Xms，错误率 0%`；`同上压 WS：X 并发订阅，增量帧 P99=Xms`。
- 调优对比：`pprof 发现 CPU 热点在 X，改为 Y 之后延迟 P99 从 Xms → Ym（附图对比）`。
- 质量：`go test -cover ./... = X%（撮合包 X%，账务包 X%），1 个 fuzz 函数跑 X 轮 0 失败，CI 最近 10 次全绿`。

### A6. 踩坑与成长（3 min）

从 `docs/review.md` 选 2 个真坑（模板：「现象 30s → 根因 30s → 解法 45s → 耗时与教训 30s」）。示例骨架：
- 坑 1 重复入账：消费组重平衡导致 offset 未提交、消息重投 → 幂等键 (txHash, logIndex) + 唯一索引兜底 → 1 天。教训："exactly-once 不存在，至少一次 + 幂等都是工程事实"。
- 坑 2 压测翻车：k6 压测发现 P99 断崖 → pprof 定位到锁竞争/GC → 改成按 symbol 分片单线程 → 数字翻倍。教训："先量瓶颈再优化，不要凭感觉"。

### A7. 面试官追问 10 问（自答一页，英文/中文各一份）

1. Why can't the matching engine be a database transaction?
2. What happens if the engine process dies mid-order? Walk me through recovery.
3. How do you guarantee frozen + available = total under concurrency?
4. What exactly is your idempotency key for a deposit? Why logIndex?
5. How does the WS gateway recover a disconnected client?
6. What did pprof show and what did you change?
7. If QPS ×10, which component dies first? What do you scale?
8. How does reorg affect your books? What's the reversal flow?
9. Where does the withdraw private key live? What if the hot wallet is compromised?
10. If you redid the project, what's the one design you'd change, and why?

## 四、版本 B：P1 链上充值监控服务（30 分钟版）

### B1. 一句话

> "A deposit monitoring service that watches Sepolia USDC Transfer events — picking them up by both polling and WebSocket, crediting accounts idempotently with a (txHash, logIndex) unique key, tracking pending → confirmed → finalized, handling reorg reversals, and pushing every state change through Kafka to a WebSocket channel and a React dashboard."

### B2. 动机

- 为什么链上监控难：rpc 扫块有延迟与限流、reorg 会改写已入账事实、一个 tx 里可能有多个 Transfer（logIndex 必须进幂等键）。
- 为什么先做他：它是「充值到账」在真实交易所的第一公里，P2 钱包模块直接复用它。

### B3. 架构（画图）

节点 RPC（轮询 eth_getLogs + WS eth_subscribe 双轨）→ 扫描器（安全高度回退、块范围批量）→ 事件解析（status=1 过滤）→ 幂等入账（DB 唯一键）→ 状态机（pending/confirmed/finalized 依据确认数阈值）→ Kafka → 入账消费者 → WS 推送 + REST + React 面板。

关键口播句："Polling and WebSocket are fallbacks for each other — WS gives low latency, polling guarantees we never miss a block even if the subscription drops."

### B4. 关键决策

| 决策 | 选项 | 选择与理由 | 代价 |
|---|---|---|---|
| 扫块方式 | 纯轮询 vs 轮询+WS 双轨 | 双轨：低延迟 + 不漏块（ADR-003 记录） | 双份实现、消费端需按 txHash 去重幂等 |
| 入账一致性 | 先入账后发事件 vs Outbox | Outbox：业务提交与事件发布原子 | 见版本 A |
| 确认数策略 | 固定 12 vs 分金额档位 | 按金额分级确认数 + 大额冻结复核 | 小钱包用户有延迟 |

### B5. 数据指标

- 延迟：`WS 从 Transfer 上链到面板可见 ≤ X 秒（录屏帧计时）`；轮询兜底间隔 X 秒。
- 幂等正确性：`重复投递同一 (txHash, logIndex) 200 次，入账恰好 1 次（SQL 计数验证）`。
- 覆盖率：go test -cover ≥ 80%（状态机 + 幂等 + 冲正包 ≥ 90%）。
- 真实链条：`Sepolia 真实充值录屏：入账 + WS 帧 + reorg 演示（可构造分叉测试）`。

### B6. 踩坑与成长

- 坑 1：WS 订阅断线后静默丢块 → 教训：订阅必须配轮询兜底 + 心跳探测 + 断线重连重扫。
- 坑 2：一次拿到某 tx 的 3 个 Transfer（转入/转出/手续费场景）→ logIndex 决定唯一性 → 教训：幂等键字段设计要按「事件粒度」而非「交易粒度」。

### B7. 面试官追问 10 问

1. Why does the idempotency key need logIndex? Give me an example tx.
2. How do you detect a reorg? How deep can it go? What do you do?
3. What confirmation threshold did you choose and why?
4. What if the node RPC is slow or throttled? How does the system degrade?
5. How is a failed (status=0) transaction handled?
6. How does WS subscription guarantee you don't miss blocks?
7. What columns are in your deposit ledger table? Why the unique index?
8. How would this scale to mainnet-level event volume?
9. How do you test a reorg locally? (fork / manual chain manipulation)
10. How is the deposit linked to a user's account? (deposit address derivation)

## 五、版本 C：P3 DEX Clone（30 分钟版）

### C1. 一句话

> "A Uniswap v2-style DEX I wrote from scratch in Solidity with Foundry — factory, pair, router; the constant-product math, mint/burn/swap and the fee logic are all hand-written, verified by unit, fork and fuzz/invariant tests, deployed on Sepolia with source verification, and scanned by Slither."

### C2. 动机

- 为什么自写不 fork：Core math 自己写才能真正讲清 —— 储备比与滑点、sqrt 的由来、LP 份额计算。
- 为什么需要它：DeFi 八股的「实物证据」（AMM/滑点/无常损失/CEI），又是「链上事件模型」的第二次实操（第一次在 P1）。

### C3. 架构

Factory（创建/查 pair 地址，CREATE2 推导）→ Pair（储备、mint/burn/swap、CEI 模式）→ Router（组装 swap 路径、slippage 与 deadline 兜底）→ 测试矩阵：unit + fork（Sepolia/univ2 池）+ fuzz + invariant（x·y=k、总流动性守恒）→ Slither 报告 → Sepolia 部署与验证。

关键口播句："The swap function checks effects before interactions — we update reserves before making the external transfer, so a reentrant call can never get stale prices."

### C4. 关键决策

| 决策 | 选项 | 选择与理由 | 代价 |
|---|---|---|---|
| 实现路线 | OpenZeppelin + fork vs 全部自写 | 自写核心数学（含最小可用的 Mock ERC20），逼自己懂每个公式 | 代码量、风险高 → 测试矩阵必须厚 |
| 安全模式 | CEI vs 全加锁 | CEI + 显式 guard（防回调），事件驱动 | 少一层重锁，测试补 |
| 部署链 | Sepolia vs fork 测试 | Sepolia 真实部署 + Etherscan 源码验证（验收②），配合 fork 测试做极限场景 | 测试币/网络抖动开销 |

### C5. 数据指标

- 正确性：`forge coverage ≥ 80%；swap 前后断言 x·y ≥ k（水位）与 x·y == k（无费场景）的 fuzz 跑了 X 万轮 0 反例`。
- 安全：`Slither 输出：0 high / 0 medium；N 条 low/informational 逐条评估记录在 docs/security/`。
- 真实链路：`Sepolia 真实 swap 录屏（approve → swap → 余额变化→区块浏览器可见），tx: 0x…`。

### C6. 踩坑与成长

- 坑 1：精度处理——`amountOut` 与 `k` 比较时的取整方向（向对自身有利还是不利），差 1 wei 就是「免费铸币」边界 → 教训：金融合约的每个取整都要说清楚方向并用 fuzz 验证。
- 坑 2：Slither 误报与真问题的区分（重入告警在 CEI 模式下的评估流程）→ 教训：工具给出线索，判断靠理解。

### C7. 面试官追问 10 问

1. Derive the swap formula. Why x·y = k and what does "k only increases" mean for fees?
2. Why does the code use sqrt of k? Where does that appear?
3. What exactly is the reentrancy protection — is CEI enough here, and why?
4. How does the router protect the user from sandwich attacks? (slippage/deadline — and their limits)
5. What's in your invariant test suite? Which invariant would catch a free-mint bug?
6. How do LP shares work — what's the formula on mint and why?
7. What did Slither report and what did you do about each finding?
8. How would an attacker drain a pair that reads its own reserves as an oracle? (→ AMM oracle manipulation)
9. What's different in Uniswap v3's concentrated liquidity conceptually?
10. What is the factory's CREATE2 address derivation, and why not CREATE?

## 六、录音回听与打磨清单（每版必做）

1. 录音 ≥ 30 分钟（用手机/电脑自录），回听记录时间戳标记：卡壳 > 3 秒、说错术语（用 `english/glossary.md` 对表）、含糊数字。
2. 修 2 轮：第一轮修结构（超段/缺段），第二轮修语言（术语、数字、衔接句）。
3. 每版最后过「压缩链」：30 分钟 → 5 分钟 → 1 分钟，三层全部能讲（真实面试 30 分钟版 + 初步轮 1 分钟版都用得上）。
4. 中英文都回听 1 遍（英文版用于 OKX/Bybit 类全英文面）。
5. 与项目验收证据对齐：讲到的每个数字/地址/录屏在项目 README 里找得到——面试官会抽查。