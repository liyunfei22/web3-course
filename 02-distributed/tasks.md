# Phase 2 任务清单（第 5-7 周）

> 配套 `lecture.md` 使用：先精读对应分节，再做任务；任务分「主课练习」（验证当日概念的最小 demo）与「项目任务」（组装进种子工程的产出）。
> 用时口径：标准档 6h/天，主课练习 ≈ 1h、项目 ≈ 2h/天；任务标的总时长为完成该任务的全部投入。
> 弹性档规则（`../roadmap.md` 第 5 节）：标「弹性可砍」的任务在冲刺档/最低档可按档位跳过（gRPC/OTel），跳过时 checklist 对应条目一并移出计分。
> 任务间的依赖关系 = 「前置」列；每周六按 `checklist.md` 勾选并补证据。

## 第 5 周：Kafka 深度（对应 lecture 第 1 章）

### T1 [主课练习] Kafka 环境与生产-消费最小闭环
- **预计时长**：2h
- **前置**：Phase 0 的 Docker 就绪（`docker compose version` 可运行）
- **输出物**：用 `../scaffolds/docker-compose.md` 起 Kafka（KRaft 单节点）；Go 程序 producer 写入 5 条模拟订单消息（OrderCreated），consumer 逐条打印 topic/partition/offset；运行截图存 `02-distributed/README.md`

### T2 [主课练习] 消费组与分区实验
- **预计时长**：3h
- **前置**：T1
- **输出物**：向另一 topic 写入 100000 条消息；启动 3 个同 group 的消费者并发消费；记录分区分配情况（每个消费者分到哪些 partition）与消费速率；手动触发一次 rebalance（增删一个消费者）并截图 rebalance 前后的分配日志

### T3 [主课练习] 崩溃重启与去重实验（本阶段核心实验）
- **预计时长**：3h
- **前置**：T1-T2
- **输出物**：消费中 `kill -9` 其中一个消费者，重启后同 group 继续消费；消费端打印每条消息并写去重表（幂等键 = orderId+eventType）；最终统计「去重后计数 = 100000」的命令输出与日志截图；用新 group id + StartOffset=FirstOffset 重放该 topic，抽样 1000 条与首次记录比对一致（checklist 第 3 条）；记录重放造成的重复消息数（应为 > 0 且全部被去重表拦截），结论写 `docs/kafka-replay.md`

### T4 [主课练习] 投递语义对照实验
- **预计时长**：2h
- **前置**：T1
- **输出物**：分别用 Async=true 与 RequiredAcks=WaitForAll 各发送 10000 条，对比丢失/重复情况；对照记录写 `docs/delivery-semantics.md`，含两种配置的结论

### T5 [主课练习] 死信队列与重试
- **预计时长**：2h
- **前置**：T1
- **输出物**：构造「抖动型错误」与「坏格式错误」消息各 1 条；抖动型重试满 3 次进入 DLQ topic，坏格式型立即进 DLQ；`kafka-topics.sh --list` 可见 `orders-retry` 与 `orders-dlq`，消费 DLQ 的截图存 README

### T6 [八股] Kafka 八股卡 10 条
- **预计时长**：1.5h
- **前置**：T1-T5
- **输出物**：`interview/kafka-10.md`（一问一答，覆盖 分区/ISR/offset/消费组/重平衡/三种投递语义/幂等生产者/死信）；文件放在课程仓库 interview 目录，Phase 7 复习直接引用

## 第 6 周：分布式基础 + 网关（对应 lecture 第 2 章）

### T7 [主课练习] DDIA 精选阅读 + 自测 20 题
- **预计时长**：8h（拆 4 天，每天 2h；与 T8-T11 并行推进）
- **前置**：无
- **输出物**：`docs/ddia-20-answers.md`——按讲义 2.1 导航读第 5/6/8/9 章（第 7/11 章选读），逐题作答以下 20 题（讲义不发答案，答案以原文为依据自写）：
  1. 单主复制中，从库读取数据时，复制滞后 replication lag 会造成哪三种常见异常？分别给出一句话定义。
  2. 什么是读己之写（read-your-writes）一致性？列举两种保证手段。
  3. 什么是单调读（monotonic reads）？只读从库时数据「回退」为什么违反单调读？
  4. 分区 partitioning 的基本思路有哪两种？各自优缺点是什么？
  5. 分区键设计不当会带来什么后果？举例说明「热点」。
  6. 什么是线性一致性（linearizability）？它与顺序一致性的区别？
  7. CAP 三角中 P 为什么不是可选项？AP 与 CP 各代表什么取舍？撮合引擎应选哪类？
  8. FLP 不可能性定理的结论是什么？现实系统（Raft）是如何绕过它的？
  9. 法定人数（quorum）中读、写法定数量需要满足什么关系？它仍可能读到旧值的场景是什么？
  10. 复制滞后（replication lag）有哪些常见来源？
  11. 两阶段提交（2PC）中协调者与参与者的角色？阻塞问题出在哪里？
  12. Outbox 模式解决的核心问题是什么？「事务内不可分割」的是哪两步操作？
  13. 事件溯源（event sourcing）与普通状态表有什么区别？状态如何重建？快照起什么作用？
  14. 流处理中「恰好一次（exactly-once）」的常见实现思路？（以 Kafka 为例）
  15. 单调时钟与墙上时钟的区别？时钟漂移对租约（lease）的影响？
  16. 快照隔离（snapshot isolation）下为什么会出现写偏斜（write skew）？举一例。
  17. 幂等实现中「先查后写」为什么并发不安全？数据库唯一约束如何兜底？
  18. 至少一次 / 至多一次 / 恰好一次三种投递语义，分别对应 Kafka 消费端怎样的处理逻辑？
  19. 为什么「缓存处理结果」比「重放处理动作」更接近天然幂等？
  20. 「下单 → 异步账务」全流程中，哪些环节必须强一致、哪些允许最终一致？逐一说明理由。

### T8 [项目任务] 幂等组件开发（独立包）
- **预计时长**：3h
- **前置**：无
- **输出物**：`pkg/idempotency`（中间件：读 Idempotency-Key → 去重表唯一约束 + 结果缓存 → 重复请求返回缓存响应）；单测覆盖：重复键返回首次响应、同键 10 并发仅 1 次副作用、无键直通、键过期后可重新提交

### T9 [项目任务] 限流中间件开发
- **预计时长**：3h
- **前置**：无（可与 T8 并行）
- **输出物**：`pkg/ratelimit`（令牌桶 token bucket + 滑动窗口 sliding window 两种实现）；单测覆盖：桶容量 C 满后第 C+1 个请求 429、429 响应含 Retry-After 头、滑动窗口窗口内第 R+1 个请求 429 且下个窗口恢复 200

### T10 [项目任务] Outbox 迷你实验
- **预计时长**：3h
- **前置**：T1（Kafka 环境）
- **输出物**：demo：同一 MySQL 事务写入业务表与 outbox 表 → 独立 worker 扫描 outbox 发 Kafka 并标记已发送；重复启动 worker 验证不重复发送（发送日志计数 = 消息条数）；`docs/outbox.md` 记录「为什么不能先发消息再写库」的推理链

### T11 [主课练习] JWT 签发与校验 demo
- **预计时长**：2h
- **前置**：无
- **输出物**：签发/校验小工具（HS256）：合法 token 200、无 token 401、篡改签名 401、过期 401 四组请求输出截图存 `docs/jwt.md`；密钥来自环境变量

## 第 7 周：gRPC + 可观测性 + 种子工程（对应 lecture 第 3 章）

### T12 [主课练习] gRPC unary + server-streaming demo【弹性可砍：冲刺档/最低档只跑 unary；砍项见 roadmap 第 5 节】
- **预计时长**：2h
- **前置**：无
- **输出物**：定义 order.proto（OrderService.GetOrder unary + SubscribeTrades server-streaming），两端代码生成 + 跑通，运行输出存 `docs/grpc.md`

### T13 [主课练习] 结构化日志 + 指标埋点
- **预计时长**：3h
- **前置**：无
- **输出物**：slog JSON 中间件（每行含 request_id/method/path/status/latency_ms 五字段，同一请求业务日志与 access log 的 request_id 一致）；Prometheus 埋点 http_requests_total / http_errors_total / http_request_duration_seconds / in_flight_requests；`curl /metrics` 可见三类样本截图存 README；Grafana 面板 QPS / 延迟 P50+P99 / 错误率 三面板截图存 README【最低档：面板条可改交 /metrics 截图】

### T14 [主课练习] OpenTelemetry 手动 span【弹性可砍：最低档只读讲义不写代码】
- **预计时长**：2h
- **前置**：T13
- **输出物**：一次下单请求产生 trace 树（父 span + 子 span ≥ 2：DB 查询、Kafka 写出），console exporter 输出的 span 树截图存 `docs/tracing.md`

### T15 [项目任务] 订单 API 种子工程（本阶段验收物，拆 3 天完成）
- **预计时长**：10h
- **前置**：T8、T9、T11、T13（T10 的 Outbox 思路在消费侧复用）
- **输出物**：仓库 `seed-exchange-api/`：
  1. 装配顺序：router → recover → request_id → access log → JWT 验签（HS256）→ 令牌桶限流 → 幂等中间件 → handler；
  2. order Schema：orders 表（symbol/side/type/price/qty/client_order_id/status/created_at/updated_at），唯一约束 (user_id, client_order_id)；
  3. REST：POST /api/v1/orders（201 + orderId）、GET /api/v1/orders/`{id}`；
  4. Kafka 写出：下单成功 → orders topic（Key = orderId），附最小消费者 + 去重表验证幂等消费；
  5. 测试：中间件单测 + handler 全链路测试 + `go test -cover ./...` ≥ 80%（截图存 README）；
  6. 装配：`../scaffolds/docker-compose.md` 起环境、`../scaffolds/ci-github-actions.md` 建 CI（全绿截图）、`../scaffolds/k6-load-test.md` 跑一次冒烟压测（报告表填入数字）；
  7. README：Mermaid 架构图（≥4 组件，含 Kafka 事件流向）+ 快速开始（编号步骤）+ 验收勾选表。

## 周排布建议

| 周 | 每日任务分配 | 周六 |
|---|---|---|
| W5 | T1(第一天) → T2-T3(第二至四天) → T4-T5(第五天) → T6(第六天) | checklist 第 1-5 条补证据 |
| W6 | T7 每天 2h 贯穿 + T8/T11(第一天) → T9(第二天) → T10(第三天) 交错 | checklist 第 6-11 条补证据 |
| W7 | T12-T14 各半天 → T15 拆三天（装配→业务→测试与 CI） | checklist 全量勾选 + 阶段复盘（`docs/review.md` ≥ 3 坑四要素 + `docs/adr/` ≥ 2 篇，即 checklist 第 20 条） |
