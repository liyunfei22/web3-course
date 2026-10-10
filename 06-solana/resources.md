# 06-solana/resources.md — Phase 6 资源清单（W17）

> 全部链接来自 `../CLAUDE.md` 附录 A 已核实资源池。每条标注必读/选读与用途。条目数 ≤12，必读优先。

| 资源 | 必读/选读 | 用途 |
|---|---|---|
| Rust 语言圣经 https://beatai.org/rust-course | 必读 | D1 主教材，Rust 速成按 lecture D1 的「前 15 章筛选清单」跳读，不顺序全读（原 course.rs 已迁移至此） |
| Rust Book https://doc.rust-lang.org/book | 选读 | 英文权威对照，course.rs 讲不透的概念（借用规则、生命周期）回查 |
| Rust By Example https://doc.rust-lang.org/rust-by-example/ | 选读 | 语法速查：每个语法点配可运行小例，写 3 个小练习时的参考 |
| Anchor Book https://book.anchor-lang.com/ | 必读 | D2 主教材：Accounts / PDA / CPI 三章精读，CLI 与 Troubleshooting 按需查 |
| Solana 官方文档 https://solana.com/docs | 必读 | 账户模型/交易结构/commitment 概念的权威来源，D2/D4 对照查证 |
| Solana 官方程序示例 https://github.com/solana-foundation/program-examples | 选读 | D3 复刻选库（staking/crowdfunding/vesting 候选），只作参照、规则层自写 |
| Solana Devnet Faucet https://faucet.solana.com/ | 必读 | devnet SOL 领取（配合 `solana airdrop`），P4 部署燃料 |
| Solana 官方浏览器 https://explorer.solana.com/ | 必读 | 部署后验证程序与交易，README 链接的证据位（原 Solscan 域名对脚本限流，官方替代见 CLAUDE.md 附录 A） |
| Phantom https://phantom.app/ | 必读 | Solana 钱包，devnet 交互与加分前端共用 |
| Solana 官方 Bootcamp https://solana.com/developers/bootcamp | 选读 | 官方练习课：时间富余时补习题，非主线 |
| Helius 开发者博客 https://www.helius.dev/blog | 选读 | Solana 接入与索引深度文章（token account 轮询/WebSocket 通知），D4 对比文档素材 |
| Superteam https://earn.superteam.fun | 选读 | Solana 生态赏金入口，学完 W17 后可挑入门级赏金练手（简历素材） |

**书籍（只写书名，不写链接）**：本阶段无需整本阅读；Rust 语法深度需要时以 Rust Book 在线版为准。