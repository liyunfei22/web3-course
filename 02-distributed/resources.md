# Phase 2 资源清单（第 5-7 周）

> 规则（`../CLAUDE.md` 3.4）：只引用已核实资源池内的链接；每条标注「必读/选读」+ 一句用途；书籍只写书名；条目 ≤ 12。
> 用法：必读 = 主线，与当日讲义分节配套；选读 = 晚间加餐或弹性档跳过。
> 弹性档：冲刺档跳过全部选读；最低档跳选读且 gRPC/OTel 相关条目只读。

## 必读

| 资源 | 用途 |
|---|---|
| Kafka 官方文档 https://kafka.apache.org/documentation/ | W5 按讲义挑读：设计目标、日志与分区、消费组、配置节；排查时查官方为准 |
| 《Kafka 权威指南》 | W5 全书通读级：架构、投递语义、运维与集群调优，本阶段读前 6 章 + 生产调优章 |
| 《数据密集型应用系统设计》(DDIA) | W6 精选章节第 5/6/7/8/9/11 章，配讲义 2.1 导航与 T7 自测 20 题 |
| Prometheus https://prometheus.io/docs/ | W7 指标模型：counter/gauge/histogram 概念与查询语言入门，配讲义 3.4 |
| k6 文档 https://k6.io/docs/ | W7 用 `../scaffolds/k6-load-test.md` 给种子工程跑冒烟压测；Phase 4 压测主力 |

## 选读

| 资源 | 用途 |
|---|---|
| 《Apache Kafka 实战》(胡夕) | 中文补充与故障排查视角；卡 Kafka 概念时先翻它 |
| gRPC Go quickstart https://grpc.io/docs/languages/go/quickstart/ | W7 配讲义 3.1-3.2 练手；冲刺档/最低档砍 gRPC 实验时仅浏览 |
| OpenTelemetry https://opentelemetry.io/docs/ | W7 tracing 直觉对照；最低档只读不写代码 |
| pprof（net/http/pprof） https://pkg.go.dev/net/http/pprof | W7 了解抓 profile 流程（配 `../scaffolds/k6-load-test.md` 第 4 节）；Phase 4 精用 |
| LMAX 架构 https://martinfowler.com/articles/lmax.html | 选读：撮合单线程-无锁思想的祖师文章，W7 读完为 Phase 4 撮合铺垫 |
| Kraken 性能工程 https://blog.kraken.com/crypto-education/performance-at-kraken | 选读：真实交易所的性能工程直觉，系统设计⑦素材 |

## 本阶段不引入

- 兜底检索用 go.dev Tour / Go By Example / Effective Go（Phase 1 已必读）；本阶段仅当遗忘了用，不再单列。