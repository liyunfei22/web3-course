# CLAUDE.md — 课程包写作公约

> 本文件对所有在本目录下工作的写作/维护 agent 生效（A0-A7 及后续维护者）。
> 课程内容基线一律以 `roadmap.md`（冻结基线）为准；本文件规定「怎么写」，roadmap 规定「写什么」。
> 写作前必读：`roadmap.md`、本文件、对应项目的 `projects/SPEC-*.md`。

---

## 1. 术语表（统一措辞，写作用词以此为准）

规则：正文中文为主，技术术语保留英文；首次出现的术语用「中文（英文）」格式，之后全篇统一。代码、文件名、commit 一律英文。

| 中文措辞 | 英文 | 统一说明 / 禁止写法 |
|---|---|---|
| 撮合引擎 | matching engine | 统一「撮合引擎/撮合」；禁止「撮合器」「match engine」 |
| 订单簿 | order book | 统一「订单簿」；禁止「挂单簿」 |
| 买盘/卖盘 | bid / ask | 深度图 depth chart；行情快照 ticker；K线 kline；成交 trade |
| 行情 | market data | 统一「行情」；行情推送=行情 WS；禁止「市场数据推送」混用 |
| 账务 | ledger | 账务系统=ledger service；禁止「记账系统」替代 |
| 三栏账户 | frozen / available / total | 统一「三栏」：冻结/可用/总额；总额 = 冻结 + 可用 |
| 复式记账 | double-entry bookkeeping | 统一「复式记账」 |
| 充提 | deposit / withdraw | 统一「充提」「充值/提现」；禁止「充币提币」 |
| 充值地址 | deposit address | 按用户+币种派生，不与热钱包主地址混用 |
| 确认数 | confirmations | 状态机三态统一：pending / confirmed / finalized |
| 重组 | reorg | 统一「重组」；禁止「链重排」「回滚链」 |
| 冲正 | reversal | 重组/失败导致的入账回退统一「冲正」 |
| 幂等 | idempotency | 幂等键=idempotency key；统一「幂等」，禁止「去重处理」 |
| 交易哈希 | txHash | 统一 txHash；禁止拼写为 tx_hash / txhash（代码中按上下文允许 tx_hash） |
| 事件日志 | event log | 字段统一 logIndex / topics / address；扫块=block scanning / log polling |
| HD 钱包 | HD wallet (BIP32/39/44) | 助记词=seed phrase；派生路径=path，如 m/44'/60'/0'/0/0 |
| 冷热钱包 | cold / hot wallet | 归集=sweeping / collection；统一「归集」 |
| 对账 | reconciliation | 三方对账 = 交易所账本 / 链上记录 / 第三方（银行或托管） |
| 资产储备证明 | proof of reserves (PoR) | P2 简化为 Merkle 证明 CLI |
| 事件溯源 | event sourcing | 账务可选实现路线之一，与现成数据库并行讨论 |
| Outbox 模式 | transactional outbox | 统一「Outbox」；「本地消息表」可用作白话解释 |
| 预写日志 | write-ahead log (WAL) | 统一「WAL」 |
| 快照 | snapshot | WAL+快照回放=重启恢复路线 |
| 价格-时间优先 | price-time priority | 撮合排序规则，唯一指定语义 |
| 种子工程 | seed project | Phase 2 的订单 API 种子工程；「旗舰地基」 |
| 旗舰项目 | flagship project | 仅指 P2 迷你交易所 |
| 可观测性 | observability | 指 metrics / logs / tracing 三件套 |
| 限流 | rate limiting | 令牌桶 token bucket 为默认教学实现 |
| 网关 | API gateway / WS gateway | 行情网关统一「行情 WS 网关」 |
| 重放 | replay | 「重放攻击」与「消息重放消费」两个场景都要讲 |
| 智能合约 | smart contract | 统一「合约」 |
| 内存订单簿 | in-memory order book | 按 symbol 分片、单线程是 P2 的冻结设计 |
| 程序派生地址 | program-derived address (PDA) | Solana；跨程序调用=cross-program invocation (CPI) |
| 检查-影响-交互 | checks-effects-interactions (CEI) | Solidity 安全模式唯一指定写法 |
| fuzz / fork / 不变式测试 | fuzz test / fork test / invariant test | Foundry 测试分类统一此命名 |
| 跑通优先 | run-first | 教学法三原则之一（见 roadmap 第 7 节） |
| 卡壳 30 分钟规则 | 30-minute stuck rule | 教学法三原则之一 |
| 产出型笔记 | artifact notes | 教学法三原则之一；产物=ADR/README/图解/复盘/八股卡 |
| 八股 | — | 课程内指「面试题库/八股卡」，是正式备考材料，非贬义 |
| Mock | mock interview | 模拟面试，四轮评分卡制 |
| 白板 | whiteboard | 系统设计题的限时口述+画图形式 |
| 弹性档 | elasticity tiers | 冲刺 8h/标准 6h/最低 4h 三档 |
| 四件套 | — | 每阶段 4 个文件：lecture / tasks / checklist / resources |

## 2. 黑名单

| 词 | 规则 |
|---|---|
| Speedrun Ethereum | 课程包任何文件中不得出现（含资源、正文、示例）；仅允许出现在本文件与 QA 扫描脚本中 |
| Buildspace | 同上 |
| Peatio / OpenDAX | 仅可出现在「背景参考」段落（如 P2 SPEC 的背景节，说明「为什么这类老牌开源 CEX 不适合作为主线学习参考」）；不得作为教程、讲义主线或资源链接 |

QA 阶段会对全部文件做黑名单 grep 扫描，命中即终审不通过。

## 3. 格式规范

### 3.1 Markdown 规范

- 标题层级不超过 4 级（`####` 最深）；文件用 `#` 一级标题开头。
- 代码块必须标注语言（`go` / `solidity` / `yaml` / `bash` / `toml` / `mermaid` / `json`）。
- 表格仅在多列对比时使用，禁止单列表格。
- 课程包内文件互指用相对路径（如 `00-startup/tasks.md` 引用 `../roadmap.md`）；外部链接必须来自已核实资源池（见附录 A）。
- 正文中文为主，技术术语按第 1 节术语表保留英文。
- 禁止 emoji；强调用 **加粗**，不用表情符号。

### 3.2 讲义禁源码规则（重要）

**讲义（lecture.md）绝不给出完整源码或完整答案实现。** 只能给：

1. 概念讲解：讲透原理与直觉，先直觉后定义（学员无后端经验）。
2. 关键接口签名：Go 的 `func` 签名 / Solidity 的函数接口（含参数、返回值、注解）。
3. 参考实现要点：伪代码级别的思路步骤（文字或伪代码，非可运行源码）。
4. 测试期望：输入 → 预期行为/输出/不变式。
5. 常见坑与排查方法。

**每讲一个原理，至少一处「交易所场景对应」**：例如 MySQL 事务 ACID → 转账冻结/解冻三栏账务的一致性；Redis 分布式锁 → 充值幂等；Kafka 事件 → 下单→撮合→账务的拓扑。

**唯一例外——脚手架类文件可以给完整可复制版本**：docker-compose、CI yaml、k6 脚本、Foundry 配置（foundry.toml）、服务骨架（main 引导/中间件装配/目录骨架）等 infra 模板。判断标准：它是「环境与装配」，不是「业务逻辑」。

### 3.3 checklist 布尔可判规则（每阶段 checklist.md 与项目验收共用）

每条必须同时满足：

1. **主谓宾完整**：能独立读懂的完整句子，含主体、动作、对象。
2. **判定依据外部可验证**：可观测的产物（文件路径/命令输出/截图/地址/录屏/日志），任何人可复核。
3. **答案只有是/否**：不含程度、频率、主观形容词。

**禁止词**：较好、较全、基本、大概、尽量、应该、理解、熟练、了解、掌握（单独出现时）。

合格范例：
- `[ ] go test -cover 输出覆盖率 ≥ 80%，截图存入项目 README`
- `[ ] 在 Sepolia 用测试币完成一笔真实充值，录屏入账与 WS 通知帧`
- `[ ] docker compose up -d 后全新环境按 README 步骤 ≤ 30 分钟跑通`

不合格范例：
- `[ ] 代码质量较好`（程度词 + 不可验证）
- `[ ] 理解 reconciliation 原理`（心理状态不可外部验证）
- `[ ] 熟练使用 Kafka`（程度词）
- `[ ] 尽量保证测试覆盖`（不是是/否答案）

建议每条附「证据位置」：`- [ ] …（证据：README 第 2 节截图 / docs/review.md 坑#3 / Sepolia 0x…）`。

### 3.4 资源池规则（resources.md 与正文链接）

- 只允许引用**已核实资源池**（附录 A）中的链接；禁止引入池外未核实的新域名。
- 若确需新增资源：先核实内容与可访问性，再在 `QA/review-log.md` 记录「URL + 核实日期 + 用途」，终审统一 HTTP 200 实测。
- 每条资源必须标注「必读/选读」+ 一句用途说明。
- 书籍只写书名（如《The Go Programming Language》），不写链接。
- 每阶段 resources.md 条目数 ≤ 12，必读优先。

### 3.5 tasks / lecture / checklist / resources 结构约束

- `lecture.md`：可执行讲义 = 本阶段学员逐段可跟的「课本」，一节一段；每节含「交易所场景对应」；篇幅 ≤ 300 行/阶段。
- `tasks.md`：每个任务必须标注 **预计时长 / 前置 / 输出物**；任务总数 ≤ 15/阶段；任务可按「主课练习 / 项目任务」两类。
- `checklist.md`：按 3.3 规则；全「是」= 阶段完成。
- `resources.md`：按 3.4 规则。

## 4. 基线一致性规则与变更流程

- 阶段编号（Phase 0-7）、周次、项目命名（P0-P4）、术语、技术栈决策、依赖关系、弹性档数字、面试权重数字：**全部以 roadmap.md v1.0 为准**；讲义/SPEC/脚手架与基线冲突时，以 roadmap.md 为准并报告冲突。
- 冻结基线文件（README.md / roadmap.md / CLAUDE.md / daily-rhythm.md / standards/ 两个文件 / projects/SPEC-template.md）不得被后续作者改写；确需修改走 `QA/review-log.md` 记录 + 终审确认。
- 一处改动牵涉多处时（如周次调整），必须同步 roadmap.md 的阶段表、README 的路径图、受影响 SPEC 的周期估算。

## 5. 给后续写作 agent 的工作指令

1. **写作顺序**：A0（先行，已完成本基线 7 文件）→ A1-A6 并行写各阶段四件套 + SPEC + scaffolds → A7 终审。
2. **开工前必读**：`roadmap.md`（基线）+ 本文件 + 自己的任务描述 + 对应 `projects/SPEC-*.md`（先于讲义存在时）。
3. **讲义写作骨架**（每节）：目标 → 概念（直觉→定义）→ 关键接口签名 → 参考实现要点（伪代码）→ 测试期望 → 常见坑与排查 → 交易所场景对应。全程不给完整实现源码（见 3.2）。
4. **分工锚点**：A1=Phase 0+1 四件套 + scaffolds/go 骨架；A2=Phase 2 四件套 + scaffolds/docker-compose/ci/k6；A3=Phase 3 四件套 + P1 SPEC + scaffolds/ws-gateway；A4=Phase 4 四件套 + P2 SPEC（可切撮合账务/行情钱包两块写）；A5=Phase 5+6 四件套 + P3/P4 SPEC + scaffolds/foundry；A6=Phase 7 四件套 + interview/ 全部；A7=终审四类硬指标（见 roadmap 第 10 节）。
5. **不得**：粘贴完整业务源码；引入池外资源；使用黑名单词；自创阶段编号/周次/术语；改写冻结基线。
6. **收尾**：每阶段写完自检一遍 checklist 布尔规则（3.3）与黑名单；改动或新增在 `QA/review-log.md` 留痕。

## 附录 A：已核实资源池（唯一可用链接集合，标注必读/选读）

**Go 入门与语言**
- go.dev Tour https://go.dev/tour/ （必读：第 1 周扫完）
- Effective Go https://go.dev/doc/effective_go （必读：Phase 1 精读）
- Go By Example https://gobyexample.com/ （选读：速查）
- Go 内存模型 https://go.dev/ref/mem （选读：并发深入）

**Web2 后端 / 中间件**
- Kafka 官方文档 https://kafka.apache.org/documentation/ （必读：Phase 2 按章节挑读）
- gRPC Go quickstart https://grpc.io/docs/languages/go/quickstart/ （选读：Phase 2）
- OpenTelemetry https://opentelemetry.io/docs/ （选读：Phase 2 可观测）
- Prometheus https://prometheus.io/docs/ （必读：Phase 2 指标部分）
- Docker 文档 https://docs.docker.com/ （必读：Phase 1 挑读）
- GitHub Actions 文档 https://docs.github.com/en/actions （必读：Phase 1 挑读）
- k6 文档 https://k6.io/docs/ （必读：Phase 4 压测）
- pprof（net/http/pprof） https://pkg.go.dev/net/http/pprof （必读：Phase 4 调优）

**区块链原理 / EVM**
- WTF Academy https://www.wtf.academy/ （必读：Solidity 101/102 中文主线）
- Cyfrin Updraft https://updraft.cyfrin.io/courses （必读：Solidity/Foundry/审计免费全课）
- Foundry Full Course 仓库 https://github.com/Cyfrin/foundry-full-course-cu （选读：配套代码）
- Cyfrin 安全审计全课仓库 https://github.com/Cyfrin/security-and-auditing-full-course-s23 （选读：Phase 5 安全关）
- Foundry Book https://book.getfoundry.sh/ （必读：Phase 5 工具书）
- Ethernaut https://ethernaut.openzeppelin.com/ （选读：Phase 5 安全练习）
- Damn Vulnerable DeFi https://github.com/OpenZeppelin/damn-vulnerable-defi （选读：Phase 5 进阶）
- RareSkills 博客 https://www.rareskills.io/blog （选读：AMM 数学/闪电贷/MEV/EVM 深度）
- evm.codes https://www.evm.codes/ （选读：opcode 查询）
- EIP-20 标准 https://eips.ethereum.org/EIPS/eip-20 （选读：P3 自写 ERC-20 的接口标准，P05-03 精读；2026-10-09 A7 实测 200 入池）
- 登链社区 https://learnblockchain.cn/ （选读：中文社区资料）
- Geth 文档 https://geth.ethereum.org/docs （必读：Phase 3 RPC/扫块）
- Uniswap v2 core https://github.com/Uniswap/v2-core （必读：P3 参照，核心数学自写不 fork）
- Slither https://github.com/crytic/slither （必读：P3 安全自查）
- SWC 注册表 https://swcregistry.io/ （选读：漏洞模式查询）

**Solana / Rust**
- Solana 官方文档 https://solana.com/docs （必读：Phase 6）
- Solana 官方 Bootcamp https://solana.com/developers/bootcamp （选读：练习）
- Anchor Book https://book.anchor-lang.com/ （必读：Phase 6）
- Solana 官方程序示例 https://github.com/solana-foundation/program-examples （选读：模板参照）
- Helius 开发者博客 https://www.helius.dev/blog （选读：Solana 深度文章）
- Superteam https://superteam.fun / https://earn.superteam.fun （选读：赏金与生态）
- Rust Book https://doc.rust-lang.org/book （必读：Phase 6 前 15 章）
- Rust 语言圣经 https://beatai.org/rust-course （选读：中文替代；原 course.rs 域名已迁移，浏览器访问 course.rs 亦跳转至此）
- Rust By Example https://doc.rust-lang.org/rust-by-example/ （选读：速查）

**交易所工程参考（开源对照）**
- LMAX 架构 https://martinfowler.com/articles/lmax.html （必读：系统设计⑦低延迟）
- exchange-core（Java 撮合参考） https://github.com/exchange-core/exchange-core （选读：P2 撮合对照）
- Go orderbook https://github.com/i25959341/orderbook （选读：P2 撮合对照）
- 中文 Go 撮合 trading_engine https://github.com/yzimhao/trading_engine （选读：中文对照）
- CppTrader https://github.com/chronoxor/CppTrader （选读：进阶方向）
- trezor/blockbook（Go 链上索引器） https://github.com/trezor/blockbook （选读：P1 对照）
- erigontech/erigon（Go EVM 客户端） https://github.com/erigontech/erigon （选读：进阶方向）
- TrueBlocks https://github.com/TrueBlocks/trueblocks-core （选读：扫块工具参照）
- dYdX v4 chain（Go 索引器参考） https://github.com/dydxprotocol/v4-chain （选读：Go 链上工程对照）
- Kraken 工程博客：Rust 架构 https://blog.kraken.com/product/engineering/rust-part-2-from-bet-to-backbone （选读）；性能 https://blog.kraken.com/crypto-education/performance-at-kraken （必读：系统设计⑦素材）

**钱包/网络/浏览器与水龙头**
- MetaMask https://metamask.io/ （必读：Phase 0 安装）；Phantom https://phantom.app/ （必读：Phase 0 安装）
- Sepolia 水龙头 https://www.alchemy.com/faucets/ethereum-sepolia （必读：领测试币）
- Chainlink Faucets https://faucets.chain.link/sepolia （选读：备用水龙头）
- Solana Devnet Faucet https://faucet.solana.com/ （必读：领 devnet SOL）
- SEPOLIA 区块浏览器 https://sepolia.etherscan.io/ （必读：部署验证）
- Solana 官方浏览器 https://explorer.solana.com/ （必读：Solana 浏览器；官方替代 Solscan，脚本连接受限流 429/403，真人浏览器可开）

**书籍（只写书名，不写链接）**
- 《The Go Programming Language》(Go 圣经)、《数据密集型应用系统设计》(DDIA)、《MySQL 实战 45 讲》(极客时间)、《高性能 MySQL》、《Kafka 权威指南》、《Apache Kafka 实战》(胡夕)

## 附录 B：本文件自身范围

- 冻结基线 7 文件：README.md、roadmap.md、CLAUDE.md（本文件）、daily-rhythm.md、standards/project-acceptance-10.md、standards/code-quality.md、projects/SPEC-template.md。
- 后续每阶段目录 `00-startup/` ~ `07-interview-sprint/` 均为四件套形态，目录命名与阶段编号由 roadmap.md 第 3 节决定。