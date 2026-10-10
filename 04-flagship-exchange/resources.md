# Phase 4 旗舰 P2 迷你交易所资源清单（第 10-14 周）

> 全部链接来自课程已核实资源池（`../CLAUDE.md` 附录 A）或任务授权的 EIP 标准页；书籍只写书名。条目 ≤ 12：必读为 W10-W14 主线，选读是学有余力的对照（弹性档直接跳过选读）。
> 依赖关系：Sepolia 水龙头与区块浏览器在 Phase 0/3 已领取与使用，本期直接沿用其测试币与验证习惯，不重复列。

## 必读

| 资源 | 用途 | 使用周 |
|---|---|---|
| LMAX 架构 https://martinfowler.com/articles/lmax.html | 单线程事件循环为何是低延迟解药——W10 撮合并发模型的理论根基，也是系统设计题「低延迟优化」的答卷素材 | W10、W14 复习 |
| Kafka 官方文档 https://kafka.apache.org/documentation/ | Consumer Groups / 偏移提交 / 重平衡章节——W11 账务消费者与压测期间对账水位的前提 | W11 |
| k6 文档 https://k6.io/docs/ | 压测三组数据的脚本语义与指标解读（配合 `../scaffolds/k6/` 脚本使用） | W14 |
| pprof（net/http/pprof） https://pkg.go.dev/net/http/pprof | W14 调优：抓取 profile、定位分配/GC/序列化热点，产出前后对比数字 | W14 |
| EIP-20 标准文档 https://eips.ethereum.org/EIPS/eip-20 | W13 充值/提现的 Transfer 语义与 decimals 精度——账务定点整数方案的链上依据 | W11、W13 |
| 《数据密集型应用系统设计》(DDIA) | W11 对照读第 7 章（事务）与第 3 章（日志/存储，WAL 的教科书出处）；W13 对账与一致性理解 | W11-W13 |

## 选读

| 资源 | 用途 | 使用周 |
|---|---|---|
| Go orderbook https://github.com/i25959341/orderbook | Go 撮合参考：对照其价格档组织、队列与 Add 流程，抄思路不抄代码 | W10 |
| exchange-core（Java 撮合参考） https://github.com/exchange-core/exchange-core | 只读算法组织（L2OrderBook 数据结构与撮合循环），体验生产级单线程撮合长什么样 | W10 |
| CppTrader https://github.com/chronoxor/CppTrader | 性能对照：C++ 撮合引擎看它的内存布局与 ring buffer 思路，C 组吞吐压测后对比参考 | W10、W14 |
| 中文 Go 撮合 trading_engine https://github.com/yzimhao/trading_engine | 中文注释的 Go 撮合实现，W10 卡壳时的对照读物 | W10 |
| EIP-712 标准文档 https://eips.ethereum.org/EIPS/eip-712 | 提现签名扩展场景（typed data 授权）选读；P2 提现为直接链上转账，非必需 | W13 |
| 《Kafka 权威指南》 | W11 消费组/顺序/重试主题的深度补充（第 4-5 章对照文档） | W11 |

## 资源使用纪律

- 必读在前、选读在后；选读只用于「卡壳 30 分钟规则」的换路与周末延伸，不占主线时间。
- 讲义/正文里的其它引用（Phase 0/3 水龙头、SEPOLIA 区块浏览器、MetaMask 等）均为已核实池成员，直接沿用。
- 本清单新增两个 EIP 链接（eips.ethereum.org，非附录 A 池内域名，由本阶段任务授权并已实测 HTTP 200），需在 `../QA/review-log.md` 留痕待终审复核。