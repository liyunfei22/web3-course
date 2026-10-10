# Phase 2 讲义：分布式中间件与高并发架构（第 5-7 周）

> 阶段定位：承接 Phase 1（Go/Gin/MySQL/Redis/Docker/CI 已就绪），为 Phase 4 旗舰项目打地基。
> 本阶段交付：**订单 API 种子工程（seed project）**——REST 下单接口 + JWT 鉴权 + 令牌桶限流 + 幂等组件 + 结构化日志 + 指标埋点 + Kafka 事件写出。
> 基线：`../roadmap.md` 阶段表（Phase 2 = 第 5-7 周）；术语见 `../CLAUDE.md` 第 1 节；弹性档可砍项在文内以「弹性可砍」标注。

## 0. 三周总览与用法

| 周 | 主题 | 主课产出 | 面试对应 |
|---|---|---|---|
| W5 | Kafka 深度 | 生产-消费/崩溃重启/去重/DLQ 实验套件 | 系统设计③订单流拓扑 |
| W6 | 分布式基础 + 网关 | DDIA 20 题自测 + 限流与幂等组件 + Outbox 实验 | 系统设计③⑤、八股 |
| W7 | gRPC + 可观测性 + 种子工程 | 订单 API 种子工程（旗舰地基） | ①②③④⑤⑥ 的实物 |

依赖链：Phase 1（Go/Gin/MySQL/Redis/Docker/CI）→ 本阶段 → Phase 3（链上原理）与 Phase 4（旗舰 P2 迷你交易所）。用法：每天按 `../daily-rhythm.md` 精读当日分节 → 主课练习（最小 demo）→ 项目任务；每节先看最后一行「交易所场景对应」再读原理；笔记按产出型笔记产出（ADR / 八股卡），禁止摘抄讲义。

---

## 1. 第 5 周：Kafka 深度

### 1.1 Kafka 诞生背景：为什么不是 Redis pub/sub

直觉：两个系统都做「发布/订阅」的活，但赌的是不同的东西。Redis pub/sub 的设计目标是「在线的人实时收到」，广播式、即发即弃；Kafka 的设计目标是「消息是持久化的日志，消费进度由消费者自己掌握」。定义：Kafka 是一个**分布式提交日志（distributed commit log）**——每个分区是一条只追加的日志文件，消息按 offset 编号；消费进度（offset）存在消费者一边，而不是 broker 替你记。

| 维度 | Redis Pub/Sub | Kafka |
|---|---|---|
| 持久化 | 无，订阅者断连即错过 | 落盘，按 offset 可重放 replay |
| 消费组织 | 广播，所有订阅者收到 | 消费组 consumer group 内分区负载均衡；组间广播 |
| 顺序 | 无严格保证 | 分区 partition 内严格有序 |
| 回放 | 不支持 | 从任意 offset 重新消费 |
| 适用 | 缓存失效、在线通知等低可靠广播 | 事件流、账务、对账等可靠事件管道 |

### 1.2 核心架构

| 名词 | 一句直觉 |
|---|---|
| broker | 集群中的一台节点，扛分区读写 |
| topic | 逻辑消息流，分区的集合 |
| partition | 物理分片，也是并行与顺序的单位 |
| leader / follower | 每个分区的副本之一当 leader（唯一读写点），其余 follower 同步 |
| ISR | 与 leader 保持同步的副本集合，落后超时（replica.lag.time.max.ms）即被踢出 |
| offset | 消息在分区内的编号 = 消费进度 |
| consumer group | 组内一个分区同时只被一个成员消费；分区分配在 rebalance 时决定 |
| rebalance | 成员增减/分区数变化时的重新分配，期间该组暂停消费 |
| controller | 集群管理角色（KRaft 下为 controller quorum，已无 Zookeeper） |

直觉三句话：1）topic 吞吐 ≈ 分区数 × 单分区吞吐，但顺序粒度也被切到「分区内」；2）ISR 里的副本才允许当 leader，这是「多数派存活」的工程化简化；3）rebalance 是消费端最常见的「卡一下」来源，靠稳定的处理时间与合理会话超时压制它。

### 1.3 Go 客户端 segmentio/kafka-go 关键 API

```go
go get github.com/segmentio/kafka-go
```

```go
type Writer struct {
    Addr        kafka.TCPAddr
    Topic       string
    BatchSize   int               // 攒批：吞吐与延迟的平衡点
    RequiredAcks kafka.RequiredAcks // 建议 kafka.WaitForAll
    Async       bool              // true = 发完即走，等效 at-most-once
    AllowAutoTopicCreation bool
}
func (w *Writer) WriteMessages(ctx context.Context, msgs ...kafka.Message) error
func (w *Writer) Close() error
type Message struct {
    Key, Value []byte      // Key 决定分区：同 key 必进同一分区
    Topic, Partition string
    Headers []Header       // trace 传播的载体（见 3.5）
}
```

```go
type ReaderConfig struct {
    Brokers []string
    GroupID  string          // 不设 GroupID = 裸分区模式，无消费组语义
    Topic    string
    Partition int            // 裸分区模式下指定分区
    MinBytes, MaxBytes int   // 拉取批量大小
    CommitInterval time.Duration // 自动提交间隔（手动提交时无意义）
    StartOffset int64        // kafka.FirstOffset / kafka.LastOffset；仅在无已提交 offset 时生效
    SessionTimeout time.Duration // 心跳超时，教学中请勿调小
}
func (r *Reader) FetchMessage(ctx context.Context) (kafka.Message, error)
func (r *Reader) CommitMessages(ctx context.Context, msgs ...kafka.Message) error
```

要点：FetchMessage + CommitMessages 是手动提交——先处理业务再提交 offset，得到的是 at-least-once；ReadMessage 是自动提交，处理与提交之间存在丢失窗口。消费逻辑永远按「处理 → 提交」顺序写。

### 1.4 三种投递语义

| 语义 | 交互方式 | 崩溃后果 | 成本 | 用在交易所哪 |
|---|---|---|---|---|
| at-most-once | 先提交后处理 | 可能丢，绝不重 | 最低 | 行情快照（丢一帧可接受） |
| at-least-once | 先处理后提交 | 可能重，不丢 | 消费端要幂等 | **账务/入账，CEX 默认** |
| exactly-once | 组合性质 | 不丢不重 | 幂等 + 去重兜底 | 以「at-least-once + 去重表」实现 |

直觉：exactly-once 不是消息系统自带的魔法，而是「至少一次 + 应用层幂等」组合出来的工程性质。Kafka 的幂等生产者只保证单分区单会话内不重，跨分区、跨系统（写库 + 发消息）的恰好一次必须自己设计。交易所铁律：**账务类事件一律按 at-least-once + 幂等消费设计与验证**。

### 1.5 幂等生产者与消费者侧幂等（去重表）

幂等生产者（enable.idempotence，segmentio 中与 ClientID + RequiredAcks=WaitForAll 成组配置）：producer 给消息带序列号，broker 对同一（producerId, 分区序列号）去重——解决的是「网络重试导致 broker 收到两条相同消息」。

消费者侧幂等，两种最实用姿势：

1. **去重表**：处理前以幂等键 idempotency key 的唯一约束做 INSERT，冲突即「已处理」，直接提交 offset。键的粒度必须等于「一次事实」，例如：链上充值 = (txHash, logIndex)（Phase 3 直接复用）、订单事件 = (orderId, eventType, version)。
2. **结果缓存**：把处理结果（响应/状态）缓存，重放时直接返回缓存——「结果幂等」优于「动作幂等」。

参考实现要点（伪代码）：

```
onMessage(msg):
    key = deriveKey(msg)              # 业务唯一事实，如 orderId+eventType
    if !tryInsert(dedupTable, key):   # 唯一约束冲突 = 已处理
        commitOffset(msg); return
    result = process(msg)             # 副作用写业务库，与 dedup 同一数据库事务
    cacheResult(key, result)
    commitOffset(msg)
```

测试期望：同一 key 重放 N 次，业务表只有 1 行；同 key 并发 10 个请求只有 1 个执行体成功；去重表行数 = 1。常见坑：键粒度太粗（一个用户所有充值共用一个键）；去重写入与业务写入不在同一事务（重放时副作用做两遍）；自动提交窗口内的丢消息。

### 1.6 死信队列与重试策略

直觉：消费失败要分「可重试」与「不可重试」。解析错误、数据格式错误——重试一万次还是错，要尽早暴露；下游抖动、唯一约束偶发冲突——值得重试。

三层结构：① 重试 topic：失败消息带 attempt 计数打回 retry topic（按 key 进同一分区保序），退避 = 2^attempt 分钟，达上限进 DLQ；② 死信队列（DLQ）：独立 topic 收集「判死刑」消息，人工/工具复查；③ 告警：DLQ 积压量与重试率进指标面板（见 3.4）。

参考要点：处理器按「异常分类 → 可重试？→ 重试 topic / 直接 DLQ」分支；消息 header 带 attempt 与初始时间。测试期望：抖动型错误重试满 N 次进 DLQ，坏格式错误立即进 DLQ，同一坏消息不重复计数。

### 1.7 必做实验设计（对应 tasks T1-T4）

目标：用 `../scaffolds/docker-compose.md` 起的本地 Kafka 证明三件事——**不丢**（崩溃后重放到同一条消息）、**可查**（offset 可回溯）、**不重**（去重表挡住重放）。

- 实验 1 最小闭环：producer 5 条 → consumer 逐条打印，记录 partition/offset。
- 实验 2 at-least-once 验证：写入 10 万条，3 并发消费者同组消费，期间 kill -9 其中一个 → 观察 rebalance → 重启补位 → 去重后最终计数 = 100000。
- 实验 3 重放罪证链：用新 group + StartOffset=FirstOffset 从零重放同一 topic，抽样对比两次收到的消息集一致。
- 实验 4 三种语义对照：Async=true 与 WaitForAll 各跑一遍，对比收到的重复/丢失情况。
- 实验 5 死信：构造抖动型与坏格式型各 1 条，验证 1.6 的分支（重试满 N 次进 DLQ / 立即进 DLQ）。

交易语义对照：所有实验消息建议模拟订单事件（OrderCreated / OrderMatched / AccountFrozen），Phase 4 直接复用这条心智。

### 1.8 W5 常见坑与排查

| 现象 | 根因 | 排查 |
|---|---|---|
| 消费者无输出 | 该 group 已提交过 offset | 换 group id 或调整 StartOffset 再看 |
| 反复 rebalance、消费停顿 | SessionTimeout 过小或处理阻塞超时 | 拉大 SessionTimeout；先查处理逻辑里的阻塞调用 |
| 消费慢但 CPU 低 | 分区数锁死单分区吞吐 | 增加分区数（重建 topic）或让 key 更分散 |
| 计数 < 入数 | Async=true / RequiredAcks 不够 / 自动提交窗口 | 关 Async，WaitForAll；消费改手动提交 + 去重表 |
| LEADER_NOT_AVAILABLE | topic 刚建元数据未刷新 | 客户端重试即可；先确认 broker healthy |

### 1.9 交易所场景对应：下单→撮合→账务的拓扑

**为什么撮合入口用同步调用、账务用异步事件**：

- 下单请求：用户要即时反馈「成交了吗、成交多少」，预算只有数百毫秒。撮合读写最小（内存订单簿单线程撮合），所以 网关 → 订单服务 → 撮合引擎 → 响应 走同步。
- 账务：一次成交联动 4+ 账户（买方可用、买方冻结、卖方可用、手续费），有审计对账要求；磨在同步路径会把下单延迟拖垮。所以撮合结果发 Kafka（OrderCreated / OrderMatched / TradeExecuted），账务服务异步幂等消费，守住「总额 = 冻结 + 可用」三栏账户不变式。
- 拓扑（文字版）：API 网关 → 订单服务 → 撮合引擎 → Kafka（topic: orders / trades）→ 账务服务（去重表幂等消费）→ 账户库 → 行情服务 → 行情 WS 网关。
- 顺序：同一订单的事件必须同分区（Key = orderId）；幂等键 = (orderId, eventType, version)。
- 这个拓扑就是 Phase 4 旗舰项目的总骨架，也是系统设计题①③④⑤的实物。

---

## 2. 第 6 周：分布式基础 + 网关

### 2.1 DDIA 精选阅读导航（阅读 → 自测 20 题见 tasks T7）

| DDIA 章节 | 要带走的点 | 阅读量 |
|---|---|---|
| 第 5 章 复制 | 单主/多主/无主三模式；复制滞后三种异常：读己之写 read-your-writes、单调读 monotonic reads、前缀一致 | 必读 |
| 第 6 章 分区 | 键范围 vs 哈希分区；分区键=热点放大器；二级索引跨分区是难点 | 必读 |
| 第 7 章 事务 | 读已提交 / 快照隔离 / 写偏斜 write skew；为什么「先查后写」并发下会坏 | 选读 |
| 第 8 章 分布式麻烦 | 单调时钟 vs 墙上时钟；FLP 结论的直觉 | 必读 8.1-8.3 |
| 第 9 章 一致性与共识 | CAP 直觉；线性一致性；Raft = 半同步假设下的工程妥协 | 必读 |
| 第 11 章 流处理 | 事件时间 vs 处理时间；窗口；流式 exactly-once =「处理结果可重放」 | 选读 |

**CAP 直觉一句话**：网络分区（P）不是你关得掉的选项，它是常态；你选的是分区期间「继续服务但可能读到旧账」（AP），还是「宁可拒绝也不给不一致的账」（CP）。撮合/账务是 CP（资金不能错），行情是 AP（深度图旧一帧无所谓）。
**FLP 直觉**：在「等多久都行」的纯异步系统里，只要一个节点可能崩溃，就不存在保证终止且全体一致的共识算法——所以现实共识（Raft/PAXOS）都偷偷加了假设：超时、多数派存活、消息最终会到。

**分布式事务全景对比**：

| 方案 | 思路 | 代价/坑 | 交易所使用 |
|---|---|---|---|
| 2PC | 协调者问全部参与者「准备好没」→ 全 YES 才 commit | 协调者阻塞、参与者持锁、难 debug | 几乎不用 |
| TCC | Try-Confirm-Cancel 业务补偿 | 补偿逻辑要自己写全 | 部分风控/支付预扣场景 |
| 本地消息表 local message table | 业务写库 + 消息表同一事务，发送器扫表发 MQ | 表膨胀需清理；语义=outbox 的前身 | 教学过渡概念 |
| **Outbox 模式 transactional outbox** | 同一事务写业务 + outbox 表（含 payload），发布器逐行发 Kafka 后标记已发 | 发布器必须幂等且按序 | **账务事件的标准姿势** |

重点组合：Outbox + 事件溯源 event sourcing——outbox 表本身就是「已发生事实」的日志；事件溯源以事实日志为唯一真相源，状态可从日志重放重建，对账 reconciliation 时两者互为对照。这是 Phase 4 账务模块的实现路线。

### 2.2 幂等设计三要素（请求 ID / 状态机 / 结果缓存）

定义：幂等 idempotency = 同一请求执行多次与执行一次效果相同。

1. **请求 ID**：客户端生成唯一 idempotency key（UUID 等），服务端以它为键存储执行结果；
2. **状态机**：资源迁移是幂等状态机——同一事件从任何状态触发，结果状态唯一（订单 CREATED→FILLED；重复的 FILLED 不再迁移）；
3. **结果缓存**：首次执行结果（含 4xx）缓存，重复请求直接返回缓存——「缓存结果」优于「重跑动作」。

实现要点（Go）：中间件形态，读 header `Idempotency-Key`；键 → 去重表唯一约束兜底并发；缓存 TTL 与结果生命周期一致。测试期望：同键两次提交第二次返回缓存结果；同键并发 N 请求仅 1 次副作用；无键请求直通不缓存。常见坑：同键不同体（键没结合请求摘要）；缓存不设 TTL 无限膨胀；状态机允许非法迁移（已成交订单被撤单）。

### 2.3 JWT 与 OAuth2 基础

JWT = `header.payload.signature` 三段：签名防篡改，claims 放声明（sub/exp/iat）。服务端不存会话，验签即放行——无状态，适合网关下多服务共享身份。直觉：一张盖了公章的表单——谁都能读，只有盖章机构能签。实现要点：HS256（对称，单服务）或 RS256（非对称，多服务共享公钥验签）；密钥不进代码不进日志；exp 必设。测试期望：无 token 401；篡改 payload 401；过期 401；合法 200。

OAuth2 是授权框架（令牌发放/刷新），交易所主要用「认证 + 个人访问令牌」。记四个角色：resource owner / client / authorization server / resource server，以及 refresh token 轮换。本阶段只要求 JWT 落地，OAuth2 到八股层级。

### 2.4 限流算法与实现要点

| 算法 | 直觉 | 行为 | 适合 |
|---|---|---|---|
| 令牌桶 token bucket | 每秒补 R 个令牌，请求取一个；桶内存量可支撑瞬时突发 | 允许短突发，长期平均 = R | **教学默认，CEX 网关标配** |
| 漏桶 leaky bucket | 请求进队列，固定速率流出 | 完全平滑，拒绝突发 | 下游是脆弱单机的场景 |
| 滑动窗口 sliding window | 时间切小格，窗口内计数 | 比固定窗口均匀 | 多实例共享限流（Redis） |

实现要点（Go 中间件）：令牌桶 = 互斥锁 + 原子计数，参数 = 桶容量 + 补充速率；超限返回 429 + Retry-After 头；多实例场景把计数挪进 Redis（Lua 保证原子）。测试期望：桶容量 C 满后第 C+1 个请求立即 429；补充速率 R 下每秒恢复可放行 R 个；429 响应含 Retry-After；并发 1000 请求计数误差 = 0（单实例）。常见坑：只做内存限流导致多实例各自限流（漂移）；429 之外的过载（下游慢调用排队）没防护；限流放在业务之后导致白忙。

### 2.5 网关职责清单

网关 = 全部外部流量的单一入口，职责按重要度：

1. 认证鉴权：验 JWT，未认证流量在网关被拒（业务侧零感知）；
2. 限流与过载保护：全局 + 按 key（用户/IP/API）限流，429 无体直接回；
3. 路由与协议转换：按路径分发下游服务；REST 与 WebSocket 分流；
4. 幂等辅助：请求 ID 生成/透传，幂等键校验；
5. 可观测性：统一 access log（结构化）、指标埋点、trace 注入（见 3.3-3.5）；
6. 安全：CORS、请求体大小上限、敏感字段脱敏；
7. 进阶：熔断、重试、灰度。

注意：行情的 WebSocket 走独立的「行情 WS 网关」线路（Phase 4），不要混进 REST 网关职责。测试期望：未认证请求在网关 401 且下游业务日志无该请求；单 IP 超限 429；access log 每条含 request_id 且与业务日志可关联。

### 2.6 第 6 周必做

限流中间件 + 幂等组件（独立包，W7 装进种子工程），用例覆盖：正常 / 边界（桶容量 + 1）/ 并发同键 / 429 头字段 / 无键直通。

交易所映射小结：**撮合强一致 vs 行情最终一致**——资金路径选 CP + 幂等，行情路径选 AP + 最终一致；两条路径的锁、重试、缓存完全不同。这是系统设计题最容易掉分的二分法。

---

## 3. 第 7 周：gRPC + 可观测性 + 订单种子工程

### 3.1 Protocol Buffers 语法速成

proto3：message 字段 = 名字 + 类型 + 编号；编号 1-15 用 1 字节（高频字段优先小号）；scalar（int64/string/bool/double）与 repeated/enum/optional；`service X { rpc Foo (Req) returns (Resp); }`。

铁律：**字段编号一经发布永不修改**（线上兼容靠编号，不是靠名字）；新增字段用 optional + 语义化名字。直觉：.proto 是接口契约文件，双向代码生成保证客户端与服务端结构一致，比手写 JSON 字段安全一个数量级。

### 3.2 gRPC 四种模式与 REST 对比

| 模式 | 场景例 |
|---|---|
| unary 一元 | 查订单 |
| server-streaming 服务端流 | 实时行情推送 |
| client-streaming 客户端流 | 批量成交上报 |
| bidirectional 双向流 | 行情订阅、撮合通知 |

与 REST 对比：HTTP/2 多路复用；二进制 + schema vs JSON 无 schema；强类型跨语言；但调试要 grpcurl、浏览器不便——所以对外面保持 REST/JSON，gRPC 主打服务间内网通信。种子工程对外用 REST，gRPC 练手即可。**弹性可砍**（冲刺档/最低档：只跑官方 quickstart，不深入）。

### 3.3 结构化日志 slog/zap 规范

直觉：日志的价值 = 能否被机器检索与关联。「一行一个 JSON 对象」让日志从人肉 grep 变成机器可查。规范：字段固定为 time / level / request_id / user_id / method / path / status / latency_ms / error；同一请求所有日志行带同一 request_id（中间件生成、响应头回传）；禁止打印密码/私钥/助记词/完整 token；Go 标准库 `log/slog` 的 JSONHandler 够用，选 zap 配生产级配置。测试期望：一行 JSON 日志含全部字段；同 request_id 可以被 grep 串起写库/发消息各环节；敏感字段在日志出现 0 次。

### 3.4 Prometheus 指标与 Grafana 面板

| 类型 | 语义 | 例 |
|---|---|---|
| counter | 只增不减，看速率（rate/delta） | http_requests_total、http_errors_total |
| gauge | 可增可减，看快照 | 处理中请求数、Kafka 积压 |
| histogram | 分布桶，算分位数 | http_request_duration_seconds（bucket 边界先设计） |

埋点清单（种子工程）：`http_requests_total`、`http_errors_total`、`http_request_duration_seconds`、`in_flight_requests`。Grafana 面板三件套（必做）：QPS = rate(...[1m]) / 延迟 P50/P99 = histogram_quantile / 错误率 = errors / requests。模型：Prometheus 拉取服务的 /metrics。常见坑：label cardinality 爆炸（把 orderId 放进 label）；histogram bucket 跨度太大使 P99 挤在一个桶；counter 忘记取 rate 直接看总数。

### 3.5 OpenTelemetry tracing 直觉

三件套闭环：日志管「发生了什么」，指标管「服务整体怎么样」，tracing 管「一次请求到底经历了什么」——三者齐备才叫可观测性 observability。概念：trace = 一棵树（一次业务的完整旅程）；span = 树上的一个节点（一次操作：HTTP 调用/DB 查询/Kafka 写出）；父子 span 用 traceID/spanID 连接；context propagation 靠 HTTP 头（W3C traceparent）与 Kafka Headers 跨服务传递。直觉：没有 tracing 时「延迟高」只能逐行猜日志；有 tracing 一眼看出时间花在哪个下游调用上（比如 OrderMatched 事件在 Kafka 里排队多久才被账务消费）。种子工程只需「中间件注入 traceID + 透传 + console exporter 看树」。**弹性可砍**（最低档只读讲义不写代码）。

### 3.6 配置管理

原则：配置与代码分离；本地/测试/生产按环境差异化；默认值放配置文件，可变项走环境变量（12-factor）；密钥走环境变量与 .env（不入库），生产用密钥管理服务（KMS/Vault）。种子工程提供 .env.example（占位符）。常见坑：密钥提交进 git 历史；魔法值散落代码；同一 key 在不同环境含义不同（如 DB 连接串）。

### 3.7 第 7 周收尾：订单 API 种子工程

规格（本阶段验收物，Phase 4 在其中长成旗舰项目）：

- 装配：路由 + 中间件链 recover → request_id → access log → JWT 验签 → 限流 → 幂等 → 业务；
- order Schema：orders 表（symbol / side / type / price / qty / client_order_id / status / created_at / updated_at），唯一约束 (user_id, client_order_id)；
- REST：POST /api/v1/orders、GET /api/v1/orders/`{id}`；
- Kafka 写出：下单成功 → orders topic，Key = orderId；附最小消费者 + 去重表验证「幂等消费」（roadmap 阶段要点原话）；
- 测试：各中间件单测 + handler 全链路测试 + `go test -cover` ≥ 80%；
- 装配件：`../scaffolds/docker-compose.md`、`../scaffolds/ci-github-actions.md`、`../scaffolds/k6-load-test.md`；README 含架构图（Mermaid）/ 快速开始 / 验收勾选表。

面试用法：这就是系统设计题③「订单流/Kafka 拓扑/WS 网关」的实物——把「为什么同步撮合、为什么异步账务、为什么幂等、为什么分区键选 orderId」讲成自己做过的取舍。

---

## 4. 阶段收尾

- 每周六：按 `checklist.md` 逐条勾选，缺证据补齐（截图/命令输出/文件路径）。
- 周日：复盘文档（≥3 个坑，四要素：现象/根因/解法/耗时）+ ADR ≥ 2 篇（背景/备选/决定/后果），这是面试「项目深挖」的台词库（验收标准⑨）。
- 弹性档判据：被砍条目（3.2 gRPC 实验、3.5 OTel 实验、Grafana 面板）在 checklist 中标注「弹性可砍」，砍时从计分中移除，不欠债。
