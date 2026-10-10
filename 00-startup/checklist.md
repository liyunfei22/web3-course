# Checklist 00 — 第 0 周验收（全「是」= 启动完成）

> 判定规则：每条主谓宾完整、外部可验证、答案只有是/否（`../CLAUDE.md` 3.3）。
> 证据统一存放：`00-startup/docs/startup-proof.md`（含命令原文 + 输出 + 日期）。

- [ ] 本机执行 `go version` 输出 Go 1.22 或更高版本号，且 `go env GOPROXY` 已确认可用的代理地址（证据：startup-proof.md「环境」节）
- [ ] `docker compose ps` 三条服务行（mysql / redis / kafka）全部处于 `healthy` 状态，输出文本与截图存于 startup-proof.md「中间件」节
- [ ] 连通验证三连全部有成功返回：`mysql -e "SELECT 1"` 返回 1、`redis-cli ping` 返回 PONG、`kafka-topics.sh --list` 无错误输出（三组命令原文与输出存档）
- [ ] 用 Alchemy（或 Infura）的 Sepolia RPC URL 执行 `eth_blockNumber` 读取到的区块号（十进制）与 sepolia.etherscan.io 页面的 Latest Block 一致，两个数字均记录在 startup-proof.md
- [ ] MetaMask 已创建账户并切换到 Sepolia 网络，该地址在 sepolia.etherscan.io 上 ETH 余额大于 0（余额页面截图存档）
- [ ] Phantom 已创建 Solana 账户（截取账户创建完成页面存档；devnet SOL 领取可标注「延后」）
- [ ] GitHub 组织已创建，`web3-camp` 仓库包含 README.md、`.github/workflows/ci.yml`（占位版）且首个 commit 已 push，仓库 commit 列表与 Actions 绿标截图存档
- [ ] `journal/startup.md` 包含目标岗位、每日可用小时、截止日三栏，并明确写有选定的弹性档位（冲刺 8h / 标准 6h / 最低 4h 之一）
- [ ] 自评 10 题全部作答，盲区题号清单（按题号列出）与对应补救章节写入 `journal/startup.md`
- [ ] `journal/` 目录下存在每日一篇三行日志（每篇含完成/卡点/明日起点三行），且每日均有对应 commit push 到组织仓库（git log --oneline 输出与日志日期一一对应存档）

**完成标准**：以上 10 条全部勾选 = 第 0 周完成，进入 `../01-go-web2/lecture.md` W1。