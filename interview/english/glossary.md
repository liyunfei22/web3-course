# glossary.md — 技术术语中英对照表 100 词（含音标与一句话解释）

> 定位：roadmap 第 8 节「中英双语硬性要求」的每日材料（W20 背诵 + 全期每日英语块 30 分钟的前 5 分钟）。
> 用法：①每天 10 个，遮住中文自测（抽背方向是「英文说中文」与「中文说英文」双向）；②Mock 英文轮前过一遍撮合/工程组；③做项目时把当日词汇写进 README（产出型笔记）。
> 音标为美式 IPA；解释均为交易所/后端视角的一句话，术语措辞与 CLAUDE.md 一致（撮合引擎/账务/三栏/充提/重组/冲正/幂等/Outbox/WAL）。
> 总数 119 词：撮合与交易所 36 + 区块链与链上 53 + 工程与并发 30。

---

## 一、撮合与交易所领域（36）

| 英文 | 音标 | 中文释义（一句话） |
|---|---|---|
| matching engine | /ˈmætʃɪŋ ˈendʒɪn/ | 撮合引擎：把买单卖单按规则配对的系统，交易所后端的心脏，通常按 symbol 分片单线程跑 |
| order book | /ˈɔːrdər bʊk/ | 订单簿：当前未成交买卖单的集合，撮合按它的盘口定价 |
| bid | /bɪd/ | 买单/买盘：愿意出的买价，深度图左侧 |
| ask | /æsk/ | 卖单/卖盘：愿意卖的卖价，深度图右侧 |
| spread | /spred/ | 价差：最低卖价与最高买价之差，流动性差的交易对价差大 |
| depth chart | /depθ tʃɑːrt/ | 深度图：订单簿累计量的可视化，衡量市场能吃掉多大量而不剧烈滑价 |
| ticker | /ˈtɪkər/ | 行情快照：最新价、涨跌幅、成交量等一揽子行情字段的统称 |
| kline | /ˈkeɪlaɪn/ | K 线：按周期（1m/1h/1d）聚合的开高低收与成交量 |
| trade | /treɪd/ | 成交：一笔买单与卖单撮合成功的记录，含价格数量与成交时间 |
| taker | /ˈteɪkər/ | 吃单方：主动吃掉订单簿现成深度的订单（立即成交，付 taker 费） |
| maker | /ˈmeɪkər/ | 挂单方：在订单簿上增加深度的订单（给市场提供流动性，费率低） |
| price-time priority | /praɪs taɪm praɪˈɔːrəti/ | 价格-时间优先：先比价格后比到达时间的撮合排位规则，P2 唯一指定语义 |
| liquidity | /lɪˈkwɪdəti/ | 流动性：市场能承载交易量而不大幅变价的能力，深池子=高流动性 |
| slippage | /ˈslɪpɪdʒ/ | 滑点：下单时预期成交价与真实成交价之差，大单和市场波动推高它 |
| funding rate | /ˈfʌndɪŋ reɪt/ | 资金费率：永续合约多空头相互支付的周期性费率，把合约价拉回现货价 |
| position | /pəˈzɪʃn/ | 仓位：持有的合约/资产数量与方向（多头/空头） |
| margin | /ˈmɑːrdʒɪn/ | 保证金：开杠杆仓位前冻结的资金，亏损先抵保证金 |
| leverage | /ˈlevərɪdʒ/ | 杠杆：用保证金放大名义仓位倍率的机制 |
| liquidation | /ˌlɪkwɪˈdeɪʃn/ | 强平/清算：保证金不足时系统强制平仓止损的流程 |
| settlement | /ˈsetlmənt/ | 结算：交易后资金/仓位所有权的最终交割确认过程 |
| confirmation | /ˌkɑːnfərˈmeɪʃn/ | 确认数：链上交易所在块之后的累计块数，充值入账的安全门槛（状态机三态之一） |
| frozen balance | /ˈfroʊzn ˈbæləns/ | 冻结余额：下单/提现占用中的资金，三栏（冻结/可用/总额）的中间态 |
| available balance | /əˈveɪləbl ˈbæləns/ | 可用余额：未占用可立即下单/提现的资金 |
| total balance | /ˈtoʊtl ˈbæləns/ | 总额余额：冻结与可用之和，恒等式 frozen + available = total |
| deposit address | /dɪˈpɑːzɪt əˈdres/ | 充值地址：按用户+币种派生的独立收款地址（BIP44 派生路径） |
| withdraw | /wɪðˈdrɔː/ | 提现：把交易所资产发回链上地址的出账流程 |
| broadcast | /ˈbrɔːdkæst/ | 广播：将签好的交易发送到网络中等待打包的过程 |
| sweep / collection | /swiːp/ /kəˈlekʃn/ | 归集：把热钱包散落小额汇总转出的资金整理操作 |
| reconciliation | /ˌrekənsɪliˈeɪʃn/ | 对账：账本、链上、第三方三张表逐笔对齐找差的工作 |
| proof of reserves | /pruːf əv rɪˈzɜːrvz/ | 资产储备证明：用 Merkle proof 让用户自证其资产被足额持有的机制 |
| hot wallet | /hɑːt ˈwɑːlɪt/ | 热钱包：私钥连线的出账钱包，额度受限以控制损失面 |
| cold wallet | /koʊld ˈwɑːlɪt/ | 冷钱包：大额私钥离线保存，用于储备资产 |
| snapshot | /ˈsnæpʃɑːt/ | 快照：某时刻状态的完整拷贝（订单簿/账务），与 WAL 配合做重启恢复 |
| sequence number (seq) | /ˈsiːkwəns ˈnʌmbər/ | 序号：事件流中单调递增的编号，行情 WS 靠它做增量补偿 |
| ID / order id | /aɪ ˈdiː/ /ˈɔːrdər/ | 订单号/业务单号：幂等键的基础字段 |
| cancel | /ˈkænsl/ | 撤单：把未成交订单从订单簿移除并解冻资金 | 

## 二、区块链与链上领域（53）

| 英文 | 音标 | 中文释义（一句话） |
|---|---|---|
| blockchain | /ˈblɑːktʃeɪn/ | 区块链：由哈希链接的追加式账本，出块节点依靠共识保证全节点一致 |
| block header | /blɑːk ˈhedər/ | 区块头：区块的元数据（父哈希/根/时间戳），轻节点的验证入口 |
| block time | /blɑːk taɪm/ | 出块间隔：以太坊约 12 秒，Solana 约 400 毫秒 |
| transaction (tx) | /ˌtrænzˈækʃn/ | 交易：链上状态变更的最小原子单位 |
| txHash | /ˌtiː eks ˈhæʃ/ | 交易哈希：交易的唯一指纹，充值入账幂等键的一部分 |
| nonce | /nɑːns/ | 交易序号（账户级）：交易必须递增携带，防重放双花 |
| gas | /ɡæs/ | 燃料：EVM 执行的计价单位，复杂度和存储读写按量收费 |
| gas limit | /ɡæs ˈlɪmɪt/ | 燃料上限：一笔交易愿意消耗的 gas 总量，不足则整笔回滚 |
| gas price | /ɡæs praɪs/ | 燃料单价：EIP-1559 下由 base fee 与小费组成 |
| mempool | /ˈmempuːl/ | 交易池：未打包交易的待处理区，全节点可见（抢跑/夹击的源头） |
| pending | /ˈpendɪŋ/ | 待确认：交易已进池/已打包但未达确认门槛（P1 状态机第一态） |
| finalized | /ˈfaɪnəlaɪzd/ | 已定案：链级最终性达成，不可能被重组（P1 状态机第三态） |
| finality | /faɪˈnæləti/ | 最终性：交易不可被推翻的程度，PoW 概率性、PoS/PBFT 确定性 |
| orphaned block | /ˈɔːrfənd blɑːk/ | 孤块：出块时落败被主链抛弃的块（与先驱孤块 uncled 有别） |
| reorg | /ˈriːɔːrɡənəˌzeɪʃn/ | 重组：主链切换导致旧块/交易被丢弃，触发充值冲正 |
| consensus | /kənˈsensəs/ | 共识：全网对账本状态达成一致的机制 |
| validator | /ˈvælɪdeɪtər/ | 验证者：PoS 下打包与投票保护链的节点，作恶会被罚没 |
| staking | /ˈsteɪkɪŋ/ | 质押：锁币换取出块与投票资格，质押率是链安全度指标 |
| hard fork | /hɑːrd fɔːrk/ | 硬分叉：规则不兼容的升级导致链分裂成两条 |
| genesis block | /ˈdʒenəsɪs blɑːk/ | 创世块：链的第一个块，参数（供给/时间戳）写死其中 |
| Merkle tree | /ˈmɜːrkl triː/ | 默克尔树：两两哈希到根的验证结构，轻节点用它做存在性证明 |
| Merkle proof | /ˈmɜːrkl pruːf/ | 默克尔证明：根+兄弟哈希，验证某元素存在（PoR 与 SPV 的数学基础） |
| hash | /hæʃ/ | 哈希：任意长输入到定长指纹的单向映射 |
| private key | /ˈpraɪvət kiː/ | 私钥：账户的签名凭证，32 字节，泄露即资产失控 |
| public key | /ˈpʌblɪk kiː/ | 公钥：从私钥推导、可公开的验签钥匙 |
| address | /əˈdres/ | 地址：公钥哈希（或合约地址）的可读账户标识 |
| seed phrase | /siːd freɪz/ | 助记词：12/24 个词备份 HD 钱包种子（BIP39） |
| derivation path | /ˌderɪˈveɪʃn pæθ/ | 派生路径：从种子到具体地址的路径规范（BIP44），如 m/44'/60'/0'/0/0 |
| smart contract | /smɑːrt ˈkɑːntrækt/ | 智能合约：链上部署的自动执行程序，资金与逻辑上链 |
| bytecode | /ˈbaɪtkoʊd/ | 字节码：Solidity 编译出的 EVM 指令序列 |
| ABI | /ˌeɪ biː ˈaɪ/ | 应用二进制接口：合约函数的编码规范（选择器+参数布局） |
| EVM | /ˌiː viː ˈem/ | 以太坊虚拟机：执行合约字节码的栈式沙箱状态机 |
| EOA | /ˌiː oʊ ˈeɪ/ | 外部拥有账户：有私钥能主动发交易的账户 |
| event log | /ɪˈvent lɔːɡ/ | 事件日志：交易的附加记录（topics + data），链外事件的索引源 |
| topic | /ˈtɑːpɪk/ | 主题：事件索引字段（最多三个 indexed），扫块的过滤项 |
| logIndex | /lɔːɡ ˈɪndeks/ | 日志序号：交易内事件的固定编号，充值幂等键的组成部分 |
| block explorer | /blɑːk ɪkˈsplɔːrər/ | 区块浏览器：把链上数据索引成可查网页的站点（如 Sepolia Etherscan） |
| JSON-RPC | /ˈdʒeɪsən ɑːr piː ˈsiː/ | 节点远程调用协议：链交互的统一 API 层 |
| mainnet | /ˈmeɪnnet/ | 主网：真实资产运行的网络 |
| testnet | /ˈtestnet/ | 测试网：用测试币验证流程的网络（如 Sepolia、Solana devnet） |
| faucet | /ˈfɔːsɪt/ | 水龙头：免费领测试币的网页工具 |
| MPC | /ˌem piː ˈsiː/ | 多方计算：私钥分片分布式签名的密码学方案 |
| HSM | /ˌeɪtʃ es ˈem/ | 硬件安全模块：私钥不出芯片的签名硬件 |
| EIP-1559 | /ˌiː aɪ piː/ | 以太坊改进提案 1559：base fee 销毁+小费模型的燃气市场改革 |
| EIP-712 | /ˌiː aɪ piː/ | 结构化签名：可读字段哈希签名，防钓鱼 |
| rollup | /ˈroʊlʌp/ | 卷叠：把批量 L2 交易压缩提交到 L1 的扩容方案 |
| oracle | /ˈɔːrəkl/ | 预言机：把链外价格等数据可信地送进链的设施 |
| AMM | /ˌeɪ em ˈem/ | 自动做市商：用公式定价的无订单簿交易所（如 Uniswap） |
| flash loan | /flæʃ loʊn/ | 闪电贷：同一交易内借还的免抵押贷款 |
| MEV | /ˌem iː ˈviː/ | 最大可提取价值：验证者重排交易赚取的额外收益 |
| sandwich attack | /ˈsænwɪtʃ əˈtæk/ | 三明治攻击：把受害者夹在两次交易中间吃掉滑点差 |
| audit | /ˈɔːdɪt/ | 审计：第三方对合约/代码做的安全审查 |
| Sepolia | /sɪˈpoʊliə/ | 以太坊官方测试网名，P1/P3 的部署环境 |

## 三、工程与并发领域（30）

| 英文 | 音标 | 中文释义（一句话） |
|---|---|---|
| idempotency | /ˌaɪdempˈtɑːnəsi/ | 幂等：同一操作执行多次结果一致，消费端防重入账的关键 |
| idempotency key | /ˌaɪdempˈtɑːnəsi kiː/ | 幂等键：业务事件的唯一标识（如 txHash+logIndex），重复时跳过 |
| event sourcing | /ɪˈvent ˈsɔːrsɪŋ/ | 事件溯源：只存事实事件、状态由重放推导的账务模式 |
| transactional outbox | /trænzˈækʃnəl ˈaʊtbɑːks/ | 事务发件箱：业务与事件同事务写入，再异步发布保证不丢事件 |
| write-ahead log (WAL) | /raɪt əˈhed lɔːɡ/ | 预写日志：先写日志后改状态，崩溃后按日志重放的恢复机制 |
| ACID | /ˈeɪsɪd/ | 事务四性：原子性/一致性/隔离性/持久性 |
| replication | /ˌreplɪˈkeɪʃn/ | 复制：数据多副本同步，主备切换的基础 |
| partition | /pɑːrˈtɪʃn/ | 分区（partitioning）：数据按 key 拆分到多机 |
| sharding | /ˈʃɑːrdɪŋ/ | 分片：将数据/计算拆到多个实例并行（Kafka 分区、Solana Sealevel 都讲它） |
| backpressure | /ˈbækˌpreʃər/ | 背压：下游慢时上游限速防堆积的机制 |
| race condition | /reɪs kənˈdɪʃn/ | 竞态：并发读写同一资源的时序不定导致结果错误 |
| data race | /ˈdeɪtə reɪs/ | 数据竞争：无同步的并发读写同一变量，go test -race 可检出 |
| deadlock | /ˈdedlɑːk/ | 死锁：互相等待对方持有的资源，谁也动不了 |
| mutex | /ˈmjuːteks/ | 互斥锁：同一时刻只允许一个 goroutine 进入临界区 |
| semaphore | /ˈseməfɔːr/ | 信号量：限制并发数量的计数工具，channel 可模拟 |
| goroutine | /ˈɡoʊruːtiːn/ | Go 协程：极轻量的并发执行单元，开销约 2KB 栈 |
| channel | /ˈtʃænl/ | 通道：Go 的并发通信原语，「不要用共享内存通信」 |
| context | /ˈkɑːntekst/ | 上下文：携带取消信号与截止时间的传递对象（超时/优雅退出） |
| graceful shutdown | /ˈɡreɪsfl ˈʃʌtdaʊn/ | 优雅停机：先停止接收、处理完在途请求再退出的关停流程 |
| circuit breaker | /ˈsɜːrkɪt ˈbreɪkər/ | 熔断器：下游故障时快速失败保护上游的开关模式 |
| rate limiting | /reɪt ˈlɪmɪtɪŋ/ | 限流：控制请求频率防滥用，令牌桶是默认教学实现 |
| token bucket | /ˈtoʊkən ˈbʌkɪt/ | 令牌桶：按速率补充令牌、按令牌放行的限流算法 |
| load balancing | /loʊd ˈbælənsɪŋ/ | 负载均衡：把请求分发到多实例保证容量与可用性 |
| observability | /əbˌzɜːrvəˈbɪləti/ | 可观测性：指标（metrics）、日志（logs）、链路（tracing）三件套 |
| latency | /ˈleɪtənsi/ | 延迟：请求从发出到响应的耗时，P50/P99 是常用分位 |
| throughput | /ˈθruːpʊt/ | 吞吐：单位时间处理的请求量，与延迟互为取舍 |
| QPS | /ˌkjuː piː ˈes/ | 每秒请求数：最常用的容量单位，简历与压测报告都写它 |
| p99 | /ˌpiː naɪntiˈnaɪn/ | 第 99 分位：99% 请求慢于它，交易所行情网关看重的尾延迟指标 |
| SLA | /ˌes el ˈeɪ/ | 服务等级协议：对外承诺的可用性/延迟目标 |
| single point of failure (SPOF) | /ˈsɪŋɡl pɔɪnt əv ˈfeɪljər/ | 单点故障：挂了整个系统不可用的组件，架构评审第一时间找它 |

---

## 抽查建议（每日 10 词自检）

- 随机抽 10 个，双向测：看到英文 3 秒内说出中文与一句话解释；看到中文 3 秒内说出英文拼写与音标。
- 连续两天错同一个词 = 进「卡词清单」，每周日重测清单里的词。
- 面试真实场景附录：英文轮必说句式——「This is the order book depth」「We use idempotency key to prevent double credit」「The WS gateway pushes delta plus sequence number」。