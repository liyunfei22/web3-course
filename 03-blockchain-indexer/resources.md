# Phase 3 资源清单（第 8-9 周）

> 仅收录 `../CLAUDE.md` 附录 A 已核实资源池中的链接；新增域名的核对在未来 `../QA/review-log.md` 留痕。书籍只写书名。标注：必读 = 本周主线；选读 = 弹性时间再看。

| 资源 | 标注 | 用途 |
|---|---|---|
| WTF Academy https://www.wtf.academy/ | 必读 | Solidity 101 第 1-10 课：本阶段只求「读懂合约与事件」，逐课一行产出笔记（T-06） |
| Geth 文档 https://geth.ethereum.org/docs | 必读 | 区块/交易/账户/日志概念的官方解释；扫块边界（lecture 第 8 节）配套阅读 |
| Geth RPC 方法页 https://geth.ethereum.org/docs/interacting-with-geth/rpc | 必读 | eth_getLogs / eth_getBlockByNumber / eth_subscribe 的参数与 limit 限制（2026-10-09 实测 HTTP 200） |
| evm.codes https://www.evm.codes/ | 选读 | opcode 速查：看 topics[0] 的 keccak 与日志机制底层，理解「为什么事件长这样」 |
| 登链社区 https://learnblockchain.cn/ | 选读 | 卡壳 30 分钟后的中文检索：扫块 / 索引器 / 事件解析的社区资料 |
| Sepolia 水龙头 https://www.alchemy.com/faucets/ethereum-sepolia | 必读 | 领 Sepolia ETH 用于充值交易的 gas；同时提供你 Phase 0 建的 RPC 端点 |
| Chainlink Faucets https://faucets.chain.link/sepolia | 选读 | 备用水龙头（Alchemy 限流时用） |
| SEPOLIA 区块浏览器 https://sepolia.etherscan.io/ | 必读 | Logs 页签手工对照解析结果（T-03 第 10 步）；核对合约地址与交易字段 |
| trezor/blockbook https://github.com/trezor/blockbook | 选读 | 生产级 Go 扫块索引器：对照「你的扫块器」与「工业版」的差距，面试素材来源 |
| dYdX v4 chain https://github.com/dydxprotocol/v4-chain | 选读 | Go 链上索引器工程对照：读 internal/indexer 相关目录，体会真实交易所分支扫块结构 |
| 书籍《The Go Programming Language》 | 选读 | 阅读 go-ethereum 源码时的语言参考（第 8-9 周按需查，不从头读） |

## 使用建议

- 主课时间是「必读」资源的时间，选读只放进每日可选的晚间加餐块（`../daily-rhythm.md` 第 1 节）。
- 卡壳顺序固定：官方文档（Geth/并与之配套的 go doc）→ 社区检索（登链）→ 开源参照（blockbook/dYdX v4）→ 记录跳过。这是「卡壳 30 分钟规则」的资源版本。
- 开源参照只读不抄：blockbook 的复杂在生产必要，P1 抄它 = 淹没自己；你的目标是能讲清「我的简化做了什么取舍」。