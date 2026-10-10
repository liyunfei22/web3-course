# Phase 4 旗舰 P2 迷你交易所任务清单（第 10-14 周）

> 用法：主课时间读 `lecture.md` 对应节并做最小验证；项目时间执行本清单。每任务含「预计时长/前置/输出物」，按序执行（前置为空即随时可做）。每周 ≤ 3 个编号任务 + 内嵌的实验与对照阅读；标准档每周项目+主课练习合计约 26h，冲刺档提速至 ~30h。项目规格以 `../projects/p2-mini-exchange/SPEC.md` 为准，无法判定的细节以该 SPEC 为准。
> 每周六上午跑一次阶段 `checklist.md` 勾选；每天结束时 `git add -A && git commit` 复盘留痕。

**全局前置**：P2 种子工程（Phase 2 交付，含 REST 订单接口/Kafka/Outbox/限流）；P1 链上充值监控服务（Phase 3 交付，W13 复用其扫块代码）；`../scaffolds/` 的 docker-compose / ci.yml / k6 脚本 / ws-gateway.md。

---

## W10 撮合引擎（M1）

### T1 订单域模型 + 订单簿骨架（价格档→FIFO 队列）

- **预计时长**：8h（项目 3 段×2h + 主课练习 2h）
- **前置**：种子工程可 `docker compose up -d` 跑通；`lecture.md` 10.1-10.2
- **步骤**：
  1. 建 `pkg/matching` 目录：`Order/Side/OrderType/TIF/Trade/MatchResult/CancelResult` 类型与校验（不允许零数量/非法价格）。
  2. 实现 `OrderBook`：`map[Symbol]*Book` 分片；档位层选一条路线（自写 skiplist 推荐 / slice+二分），每层 FIFO 队列；实现 `Add`（含幂等：同一 `ClientOrderID` 重复返回原 OrderID）。
  3. 对照阅读：`i25959341/orderbook` 的 level 组织与 `Add` 流程（选读）；`exchange-core` 的 `L2OrderBook` 与 queue 的关系（只看算法组织）。
  4. 写单测：建薄/删档/同价 FIFO/幂等/非法输入，先让测试红绿灯驱动。
- **输出物**：`pkg/matching` 骨架 + `orderbook_test.go` 全绿；ADR 草稿「订单簿数据结构选型」（skiplist vs slice vs map 的取舍记录草稿）

### T2 撮合循环：price-time priority + 部分成交 + IOC/FOK + 自成交防护

- **预计时长**：10h
- **前置**：T1
- **步骤**：
  1. 实现 `doMatch`（对照 `lecture.md` 10.3 伪代码）：taker 吃 maker 价格；部分成交状态转移；市价单不进簿；IOC/FOK 行为。
  2. 自成交防护：命中同 UserID 对手单 → 跳过并记告警日志（决策写入 ADR）。
  3. 边界用例全部命名测试：空簿市价拒绝 / FOK 不满足整单拒绝且零成交 / IOC 部分成交后撤剩余 / 大单吃透多层 / 吃穿后簿为空。
  4. 对照阅读：CppTrader 的 matching 循环只读思路（性能对照，选读）。
- **输出物**：撮合全套用例绿；`go test -cover ./pkg/matching` ≥ 90%（截图暂存）

### T3 单线程事件循环 + WAL + 快照回放 + fuzz 不变式

- **预计时长**：10h
- **前置**：T2
- **步骤**：
  1. 事件循环：命令 channel + 撮合 goroutine；`Add/Cancel/Depth` 经 channel 派发；循环内零 IO（WAL 写入走独立刷盘 goroutine 的 group commit 批处理，决策入 ADR）。
  2. WAL：每记录含全局 Seq + Kind(NewOrder/Cancel) + payload；支持从快照 + Seq 之后回放；快照每 N 条或 5 分钟落盘。
  3. 重启恢复测试：随机指令 1 万条 → 指纹 `Depth()` → kill -9 → 回放 → 指纹一致，输出存 `docs/recovery.txt`。
  4. `FuzzMatchInvariant`：四个不变式（无交叉/FIFO/量守恒/状态合法），本地 30s 无失败，CI 跑 1000 轮留痕（`docs/test.md` 记轮数）。
- **输出物**：`docs/recovery.txt`、fuzz 记录、事件循环+Dockerfile 可启动的服务形态（配套 `../scaffolds/` docker-compose）

---

## W11 账务域（M2）

### T4 三栏账户 + 复式记账 ledger

- **预计时长**：10h
- **前置**：T3（撮合事件流可用）
- **步骤**：
  1. `pkg/ledger`：科目 `(userID, asset, bucket∈{available,frozen})`；`journal` 流水表 + 余额表同事务更新；实现 `Freeze/Unfreeze/Transfer/Balance`（签名见 `lecture.md` 11.1）。
  2. 事件映射：撮合 trade 事件 → 买卖双方「解冻+到账」分录；撤单 → 解冻；**先冻结后成交**纪律写进单测。
  3. 精度基建：金额/数量统一定点整数 + per-asset scale（USDC=6/ETH=18），成交金额 `floor(price×qty)`，取整方向写测试。
  4. 单测：转账原子性 / 借贷平衡断言 helper / 溢出边界（`math/bits.Mul64` 路径）。
- **输出物**：ledger 包全绿；`Σdebit == Σcredit` 校验脚本 `docs/recon-journal.txt`

### T5 Kafka 拓扑：Outbox relay + 账务消费者 + 幂等

- **预计时长**：10h
- **前置**：T4；Phase 2 的 Outbox 模式已学
- **步骤**：
  1. 订单服务写「订单 + Outbox」同事务；relay 进程发 `topic:orders`；撮合消费后产 `topic:trades` 与 `topic:order-events`（拓扑见 `lecture.md` 11.4）。
  2. 账务消费者订阅 `topic:trades`：幂等键 `(tradeID, userID, side)` + 唯一索引；重复投递测试。
  3. 分区策略：按 userID 分区保单用户有序；消费者并发 = 分区数。
  4. 联调：种子工程下单接口 → 撮合 → 账务入账全链路日志串行可见。对照阅读：Kafka 文档「Consumer Groups」节（必读）、《Kafka 权威指南》第 4 章（选读）。
- **输出物**：全链路事件日志样例（存 `docs/topology-run.txt`）；幂等重复投递测试用例绿

### T6 三栏守恒实验 + 内部对账任务 + 日切

- **预计时长**：8h
- **前置**：T5
- **步骤**：
  1. 守恒实验：goroutine 并发指令流（下单/撤单/成交混入充提）→ 逐账户断言 `total==frozen+available` → 全局变更只来自充提；输出 `docs/recon-balance.txt`。
  2. 对账任务（独立可执行 `cmd/recon`）：撮合 trades 区间 vs ledger 流水逐笔核对（tradeID 存在、金额方向一致、无孤儿），输出 mismatch 计数与明细；比对窗口带消费水位容差。
  3. 日切：期末快照 == 期初 + 当日流水，结果入 README。
  4. 对照阅读：《DDIA》第 7 章（事务）与第 12 章（一致性理解，选读）。
- **输出物**：`docs/recon-balance.txt`、`docs/recon-ledger.txt`（mismatch=0）、日切输出

---

## W12 行情域（M3）

### T7 行情聚合服务：镜像簿 + ticker + delta 生成

- **预计时长**：9h
- **前置**：T5（trades/order-events 就绪）
- **步骤**：
  1. `pkg/marketdata`：消费两个 topic → 维护每 symbol 镜像 order book + 24h ticker。
  2. delta 生成：只推变化的档位（add/remove/update 语义），每通道递增 seq（注意 per-channel seq，不是撮合全局 seq）。
  3. 测试：任意操作序列后镜像簿 == 撮合 `Depth()`。
- **输出物**：marketdata 包单测绿；镜像一致性测试用例

### T8 WS 网关：订阅 / 快照 / 增量 / seq 补偿 / 背压

- **预计时长**：10h
- **前置**：T7；`../scaffolds/ws-gateway.md` 已接入
- **步骤**：
  1. 协议实现（`lecture.md` 12.2）：subscribe 帧、depth/trade/ticker 帧、快照 REST 端点。
  2. per-channel 环形缓冲（10 万条）+ 重连 `lastSeq` 补发 + gap 响应。
  3. hub fan-out：每连接 goroutine + 有界缓冲；慢消费者断开策略 + 心跳（Ping/Pong timeout）。
  4. 写并发订阅测试：100 连接订阅同 symbol，广播延迟与内存有界（pprof 抽查）。
- **输出物**：ws-gateway 集成完毕 + 协议测试全绿

### T9 抖动重连实验 + 三端一致性（必做测试）

- **预计时长**：8h
- **前置**：T8
- **步骤**：
  1. 一致性脚本：重启全栈（含撮合 WAL 回放）后，断言 WS 重建薄 == 撮合 `Depth()`、账务余额 == 成交推演，输出 `docs/consistency.txt`。
  2. 抖动注入：tc netem 或自写代理注入丢包/延迟 10-30s；客户端带 lastSeq 重连，帧序号断言无缺口；慢连接断开不影响他人（截图）。
  3. 最小 demo 客户端（node/Go）逐帧打印 depth/trade/ticker，下单可见 delta 与 trade 帧。
- **输出物**：`docs/consistency.txt`、抖动重连截图、demo 客户端日志

---

## W13 钱包域（M4）

### T10 真实 Sepolia 充值入账（复用 P1）

- **预计时长**：8h
- **前置**：P1 代码可复用（`internal/chain/deposit`）；Sepolia ETH/USDC 测试币已领取（Phase 0 水龙头）
- **步骤**：
  1. 把 P1 扫块器/确认数/重组冲正以内部包引入充电宝模块（不大改，只做接口适配）。
  2. 用户派生充值地址（BIP44 m/44'/60'/0'/0/N）→ `/deposit/address` API。
  3. 真实 Sepolia USDC 充值：走 pending → confirmed（6 确认）→ finalized（32）→ `(txHash, logIndex)` 幂等入账 → ledger 事件 → WS 通知帧。
  4. 录屏：转账 → 入账 → 通知帧（验收 ② 与成片素材）。
- **输出物**：Sepolia 充值入账录屏；`docs/deposit-run.txt`（含 txHash）

### T11 提现链路（校验→风控→签名→广播→回执→状态机）

- **预计时长**：9h
- **前置**：T10；HD 派生与交易签名（Phase 3 已学）
- **步骤**：
  1. 状态机 `Submitted→Frozen→Signed→Broadcast→Confirmed/Failed(冲正解冻)`，每步持久化。
  2. 风控：白名单表 + 单笔/24h 限额，命中返回风控码；签名：BIP44 派生 + 普通转账 tx 签名；私钥只入环境变量，日志禁打（验收 ③）。
  3. 广播/回执：`eth_sendRawTransaction` → txHash → 确认监控 → Confirmed 扣减；超时/失败 → Failed 解冻；热钱包 nonce 单 goroutine 串行管（防空洞）。
  4. 录屏：提现广播 → 区块浏览器回执 → 状态机更新 → 余额变化 + 1 条风控拒绝记录（验收 ⑥ 异常路径）。
- **输出物**：提现链路录屏两段；`docs/withdraw-run.txt`

### T12 冷热分层归集 + 三方对账 + PoR CLI

- **预计时长**：10h
- **前置**：T11
- **步骤**：
  1. 归集 job：热钱包余额 > 阈值 → 每 6h 转冷地址；日志 `docs/sweep.log`；README 写明教学简化（真实生产冷钱包离线签名机）。
  2. 三方对账脚本：内部账 vs 扫块结果 vs 钱包地址余额；逐用户 `余额 == 入账 − 出账`；全局 `Σ用户 == Σ热+Σ冷+在途`；输出 `docs/recon-3way.txt`。
  3. PoR CLI `cmd/por`：`build/prove/verify` 三命令；篡改叶子 → verify false 的测试用例。
  4. 对照阅读：`ERC-20 标准（eips.ethereum.org/EIPS/eip-20）` decimals 与 Transfer 语义（必读）；EIP-712（选读：提现授权扩展场景）。
- **输出物**：`docs/sweep.log`、`docs/recon-3way.txt`（mismatch=0）、PoR CLI 与验证输出

---

## W14 收尾（M5）

### T13 React 前端（登录 / 三栏余额 / 下单 / 成交 tape / 深度图）

- **预计时长**：10h
- **前置**：T9 + T11 的 REST/WS 接口冻结
- **步骤**：
  1. Vite + React + lightweight-charts：登录（种子工程 JWT）→ 三栏余额面板（WS 实时刷新）→ 下单面板（限价/市价 + clientOrderId 防双击）→ 最新成交 tape → order book 深度图。
  2. 异常路径 UI：资金不足/风控拒绝的错误提示与恢复。
- **输出物**：前端仓库 + 本地全链路可操作

### T14 压测三组数据 + pprof 调优对比（k6 脚手架）

- **预计时长**：8h
- **前置**：T13 前后端就绪；`../scaffolds/k6/` 脚本
- **步骤**：
  1. 组 A 下单 REST RPS（并发梯度 500/1000/2000，P50/P99/error rate）；组 B WS 推送延迟分布（帧时间戳差 P50/P99）；组 C 单 symbol 撮合峰值吞吐（orders/s、trades/s）。三组输出文件入 `docs/bench/`。
  2. pprof：开启 `net/http/pprof` → 压测中抓 profile → 定位热点 → 改一处（如序列化/分配/GC）→ 复测同场景 → 前后数字表格。
  3. 压测期间同步跑 T6 对账任务，保持 mismatch=0（checklist 强制项，输出附时间窗）。
- **输出物**：`docs/bench/`（k6 原始输出 ×3 + pprof 前后截图）+ README「压测」节表格

### T15 E2E + 文档（README/架构图/ADR×3/复盘/录屏）

- **预计时长**：8h
- **前置**：T13、T14
- **步骤**：
  1. E2E：docker-compose 一键起全栈，脚本走「注册→充值→下单→成交→提现→回执」逐段断言；浏览器录屏三幕（启动/业务链/数据特写）+ `demo/script.md` 分镜。
  2. README 四节：快速开始 / Mermaid 架构图（≥4 组件+数据流）/ 验收勾选（10 条表）/ 成果清单；CI 绿标截图（`../scaffolds/ci.yml` 接续）。
  3. `docs/adr/` ≥ 3 篇（撮合单线程 / 复式记账 / 快照+增量，至少 1 篇中途换方案）；`docs/review.md`：3 坑（现象/根因/解法/耗时）+ 3 决策（选项对比表+理由+重来），每个可改写成 2 分钟面试故事。
- **输出物**：完整 README + demo/ 录屏 + ADR×3 + 复盘文档（验收 ④⑤⑨⑩ 的证据链）