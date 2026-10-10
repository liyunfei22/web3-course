# Phase 2 验收清单（第 5-7 周）

> 规则（`../CLAUDE.md` 3.3）：每条主谓宾完整、判定依据外部可验证、答案只有是/否。
> 用法：每周六勾选，全「是」= 阶段完成；「否」的条目列入下周修复清单，修复后重新勾选。
> 弹性档（`../roadmap.md` 第 5 节）：标「弹性可砍」的条目在本档被砍时从计分中移除，不欠债。
> 证据位置建议写在勾选后括号内，截图/输出文件一律存 `02-distributed/README.md` 与项目仓库。

## 第 5 周 · Kafka

- [ ] 1. 执行 `docker compose up -d` 后 `docker compose ps` 输出中 MySQL 8、Redis 7、Kafka（KRaft）三个容器状态均为 healthy，命令输出截图存 README 第 1 节。
- [ ] 2. Go 生产者向 orders topic 发送 5 条 OrderCreated 消息，1 个消费者全部打印且每行含 topic/partition/offset 三字段，运行截图存 README 第 2 节。
- [ ] 3. 向同一 topic 生产 100000 条消息，3 个消费者同 group 并发消费；消费中 kill -9 其中一个消费者进程，重启后同 group 继续消费；最终去重表统计计数 = 100000（命令输出可见最终数字）；再用新 group id + StartOffset=FirstOffset 重放该 topic，抽样 1000 条与首次记录逐一比对一致（比对输出可见「matched = 1000」类数字），两段证据截图存 README 第 3 节。
- [ ] 4. 死信实验：1 条抖动型错误消息重试满 3 次后出现在 orders-dlq topic，1 条坏格式消息未重试即出现在 orders-dlq，`docker exec` 运行 `kafka-topics.sh --list` 输出含 orders-retry 与 orders-dlq 的截图存 README。
- [ ] 5. 文件 `interview/kafka-10.md` 存在且含 10 问（一问一答），覆盖分区/ISR/offset/消费组/重平衡/三种投递语义/幂等生产者/死信，文件可打开。

## 第 6 周 · 分布式基础 + 网关

- [ ] 6. 文件 `docs/ddia-20-answers.md` 存在，含 20 题完整作答，其中 ≥ 3 题各标注一句「与本工作相关的应用场景」（场景为具体表述，如「复制滞后 → 行情延迟容忍」），文件链接进 README。
- [ ] 7. 幂等组件：同一 Idempotency-Key 提交两次，第二次响应体与第一次逐字节一致；同一 Idempotency-Key 10 个 goroutine 并发提交，业务表与去重表行数均为 1（两次 SQL 输出可见「COUNT = 1」「rows = 1」类数字），测试文件含并发用例。
- [ ] 8. 令牌桶限流：桶容量 C 下连续请求第 C+1 个返回 429 且响应头含 Retry-After，测试输出可见状态码与头字段值。
- [ ] 9. 滑动窗口限流：速率 R 下窗口内第 R+1 个请求返回 429，窗口切换后首个请求返回 200，测试输出可见两次状态码。
- [ ] 10. Outbox 实验：worker 消费 outbox 表发 Kafka 后行状态置为已发送；重复启动 worker 一次后发送日志计数仍 = 消息条数（grep 计数可见），outbox 表最终状态列全部为已发送（SQL 输出截图）。
- [ ] 11. JWT 鉴权：无 token / 篡改签名 / 过期 / 合法 四组请求分别返回 401 / 401 / 401 / 200，四行输出截图存 README。

## 第 7 周 · gRPC + 可观测性 + 种子工程

- [ ] 12. 结构化日志与指标：任意一次 POST /orders 的 access 日志为 JSON 且含 request_id / method / path / status / latency_ms 五个字段，同一请求业务日志行 request_id 与 access 日志一致（两行日志截图并排）；`curl http://localhost:8080/metrics` 输出同时含 http_requests_total（counter）、http_request_duration_seconds_bucket（histogram）、in_flight_requests（gauge）三类样本（截图）。
- [ ] 13. 【弹性可砍：最低档以 12 条 /metrics 截图替代本条】Grafana 面板含 QPS、延迟 P50+P99、错误率三个面板且每个面板有点，面板截图存 README。
- [ ] 14. 【弹性可砍：冲刺档/最低档砍 gRPC 实验时移除】gRPC unary 与 server-streaming 两个 demo 各 run 成功，运行输出存 `docs/grpc.md`（含调用成功的响应打印）。
- [ ] 15. 【弹性可砍：最低档只读讲义时移除】OTel 实验输出显式包含一条 trace 树（父 span 下 ≥ 2 个子 span，span 名可见），console exporter 截图存 `docs/tracing.md`。
- [ ] 16. 种子工程闭环：cURL 序列中 POST /api/v1/orders 携带合法 JWT 与 Idempotency-Key 返回 201 且响应含 order_id；随后消费端最小消费者收到同订单的 OrderCreated 事件（cURL 输出与消费日志两个截图存 README）。
- [ ] 17. 种子工程测试：`go test -cover ./...` 输出全仓覆盖率 ≥ 80%（命令原文与输出截图存种子工程 README「测试」节）。
- [ ] 18. 种子工程 CI：GitHub Actions 流水线含 lint（golangci-lint）+ test -race + coverage + build 四步且最近 5 次 push 全绿；日志中出现覆盖率门禁行（如「coverage 83% >= 80%」），绿标截图存 README「CI」节。
- [ ] 19. 种子工程 README 含：Mermaid 架构图（≥ 4 个组件方框，数据流方向标注到 Kafka 事件）、快速开始（编号步骤）、验收勾选表三节，文件可打开。
- [ ] 20. 阶段复盘：`docs/review.md` 含 ≥ 3 个坑且每坑含现象/根因/解法/耗时四要素；`docs/adr/` 含 ≥ 2 篇 ADR 且每篇含背景/备选方案/决定/后果四要素，文件可打开。

## 弹性档留痕（不计入完成判定）

- [ ] 若执行了砍项（gRPC 实验 / OTel / Grafana），在 `02-distributed/README.md` 注明所执行档位与砍掉的条目号。