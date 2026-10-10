# Phase 3 任务清单（第 8-9 周，共 15 项）

> 时间账：W8 每天主课练习 3h + 项目 2h；W9 主课块让位给项目（每天约 5h，加周日上午 3h）。每日算法 / 英语八股 / 复盘块按 `../daily-rhythm.md` 照常执行（本清单不再重复标注）。
> 规则引用：产出型笔记（roadmap 第 7 节）、卡壳 30 分钟换路、`../standards/code-quality.md`（commit 规范 / 单测 / -race / 覆盖率门禁）。
> 任务类型：T-01..T-06 主课练习；T-07..T-15 项目任务（编号对应 `../projects/p1-deposit-watcher/SPEC.md` 里程碑 M1-M5）。

## W8 原理周

### T-01（W8D1，主课练习，3h；前置 Phase 1 完成）
- 内容：精读 lecture 第 1-2 节（交易生命周期 / 密钥与地址）。
- 动作：①最小 demo：Go 程序用 `crypto` 包生成私钥 → 公钥 → 地址并打印；②八股卡 3 张：交易七站 / 广播 ≠ 成功 / 私钥泄露场景。
- 输出物：`cmd/keygen` 运行输出（含地址）；八股卡 3 张入仓库。

### T-02（W8D2，主课练习，3h；前置 T-01）
- 内容：精读 lecture 第 3-4 节（HD 钱包 / EIP-1559）。
- 动作：①Go 程序用 `accounts/hd` 从一组助记词派生 index 0/1/2 三个地址，与 MetaMask 导入同一助记词后的前三个账户对照一致；②sepolia.etherscan.io 找一笔交易，读 receipt 的 baseFee / priorityFee / gasUsed 三个字段写进笔记。
- 输出物：派生对照结果（地址列表 + 截图）；EIP-1559 字段笔记。

### T-03（W8D3，主课练习，4h；前置 T-01、T-02）—— 本周核心实验
- 内容：**【完整实验】用 RPC 客户端手动解析一笔 Sepolia USDC 转账**（lecture 第 5、7 节的实操合体）。步骤：
  1. sepolia.etherscan.io 搜 USDC 代币页，复制合约地址（讲义引用的 `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` 以浏览器页面核对为准，不要盲信文档）。
  2. 代币页 Transactions 列表选一笔交易，点进 Logs 页签，记下 txHash 与该条 Transfer 的 logIndex。
  3. 从 Phase 0 建的 Alchemy 应用复制 Sepolia HTTPS RPC URL（写入 `.env`，`.env` 进 `.gitignore`）。
  4. `go mod init` 新建临时程序目录，`go get` go-ethereum。
  5. 程序用 `client.Dial(rpcURL)` 连接，`ctx` 带 10s 超时。
  6. `client.TransactionReceipt(ctx, common.HexToHash(txHash))`，遍历 `receipt.Logs`，打印每条 log 的 address / topics / logIndex。
  7. 找到 address 为 USDC 合约、topics[0] == keccak256("Transfer(address,address,uint256)") 的那条，与浏览器 Logs 页签逐字段对照（数量应一致）。
  8. 解析：topics[1] → from，topics[2] → to（去左补零），data → value（`big.Int`，除以 1e6 理解金额）。
  9. 把 (txHash, logIndex, from, to, value) 写入 `docs/parse-transfer.json`。
  10. 浏览器截图存入 `docs/`；JSON、截图、代码三方数值完全一致才算完成。
- 卡壳提示：公共 RPC 限流报错属正常，加 1s 退避重试；30 分钟无进展按「卡壳 30 分钟规则」换路，先查 Geth RPC 文档页。
- 输出物：`docs/parse-transfer.json` + 浏览器截图 + 程序源码（该程序是 M1 解析器的起点）。

### T-04（W8D4，主课练习，2h；前置 T-03）
- 内容：事件日志结构深度（lecture 第 5 节）。
- 动作：①用 keccak256 工具（`crypto.Keccak256Hash` 或在线对照）计算 `Transfer(address,address,uint256)` 的哈希，与 T-03 解析出的 topics[0] 对照一致；②把解析器写成纯函数 `ParseTransferLog(log types.Log) (Transfer, error)`，用表驱动单测覆盖：正常 log / topics 长度不足 / data 长度非法 / value 为 0 四类输入。
- 输出物：topic 对照记录（README 或笔记）；解析器源码 + 单测全绿（`go test -race ./...`）。
- 备注：此函数是 P1 与 P2 复用的公共资产，测试要当作产品代码写。

### T-05（W8D5，主课练习，3h；前置 T-03、T-04）
- 内容：确认数 / reorg / 状态机（lecture 第 6 节）。
- 动作：①画全状态机：pending / confirmed / finalized / reversed 四个状态，标出全部合法迁移（含冲正边）与每条迁移的触发条件，写成 `docs/state-machine.md`（mermaid）；②白板（或白纸+录制）5 分钟内讲清「一笔充值从广播到入账的全流程」，录音存盘。
- 输出物：`docs/state-machine.md`；录音文件（3-6 分钟）`docs/whiteboard-deposit-flow.m4a`（或 .mp3/.mov）。
- 备注：这个录音直接对应系统设计题②的第一问，录完回听一遍。

### T-06（W8D6，主课练习 3h + 选读 1h；前置 T-01 至 T-05 完成）
- 内容：Solidity 101 前十课导读 + 扫块安全边界（lecture 第 8-9 节）。
- 动作：①WTF Academy Solidity 101 第 1-10 课（精读 1-3，快读 4-10），逐课一行产出型笔记；②读 Geth 文档中 block / transaction / account 相关页面，把 lecture 第 8 节「四死法」扩展成 `docs/scanning-safety.md`：每个死法写「现象 / 约束 / 验收方式」三行。
- 输出物：前十课笔记；`docs/scanning-safety.md`。

## W9 项目周

### T-07（W9D1，约 5h；前置 T-03/T-04 完成；对应 M1）
- 内容：M1a 扫块器骨架。仓库初始化（README 骨架 + docker-compose 起 MySQL/Kafka + git 首次 commit）；RPC 客户端封装（ctx 超时 + 退避重试）；游标表 migration；扫块循环：读游标 → 取下一块 → FilterLogs → 打印解析结果（先不落库）。
- 附加：跑通优先——今天结束时链路必须是「RPC → 扫块循环 → 控制台打印一笔 Transfer 解析结果」可运行。
- 输出物：服务连续运行 10 分钟、日志含 ≥1 个区块扫描记录（`demo/m1-scan.log`）。

### T-08（W9D2，约 5h；前置 T-07；对应 M1）
- 内容：M1b 事件解析与安全边界：解析器接入；按本仓库 deposit address 集合过滤 `Addresses`；tip-lag 配置（默认 1）与单测；半块保护（一个区块全部日志同一事务落库，事务提交后才推游标）；游标 (blockNumber, blockHash) 双字段。
- 输出物：`internal/scanner` 单测全绿；`docs/scanning-safety.md` 与实现逐条对照打勾。

### T-09（W9D3，约 5h；前置 T-08；对应 M2）
- 内容：M2a 入账数据模型与幂等：`deposits` / `deposit_addresses` migration（唯一约束 uk(tx_hash, log_index, to_addr)）；解析结果事务落库（幂等键冲突时 UPDATE 确认数而非报错——想清楚为什么）。
- 输出物：migration 文件；重复投递同一 (txHash, logIndex, to) 两次，`deposits` 表仍只有 1 行（测试或 SQL 查询证据）。

### T-10（W9D4，约 5h；前置 T-09；对应 M2）
- 内容：M2b 状态机与确认数：状态机实现（`Advance(status, event) (status, error)` 纯函数只认合法迁移）；确认数更新循环（每确认一个块更新受影响的 rows 并迁移状态）；并发幂等测试：10 个 goroutine 同时投递同一幂等键 → 恰好 1 行人账，`-race` 通过。
- 输出物：状态机合法迁移各 ≥1 条命名测试；并发幂等测试绿（记录在 README 测试节）。

### T-11（W9D5，约 5h；前置 T-10；对应 M3）
- 内容：M3 reorg 冲正：记录已消费块 hash，扫块时发现「游标块 hash 与链上不符（或确认数回退）」→ 冲正：受影响 rows 迁移到 reversed + 记录冲正事件；写模拟 reorg 演示脚本（`docs/reorg-demo.sh`：可按文档步骤先用脚本改 hash/回退游标触发一次冲正，再恢复）。
- 输出物：`demo/reorg-demo.log` 含 status → reversed 迁移日志；`docs/reorg-demo.md` 步骤说明。

### T-12（W9D6，约 5h；前置 T-11；对应 M4）
- 内容：M4a 通知与查询：入账事件写 Kafka `deposits` 主题（事件：状态变化均发）；独立消费者订阅并打印（留日志证据）；WS 网关接入（按 `../scaffolds/ws-gateway.md`：订阅「deposits」流、快照+增量+seq、断线重连补偿）；REST：`GET /deposits`（按 address / status 过滤）。
- 输出物：消费者日志 `demo/deposits-consumed.log`；WS 重连补偿演示输出（含 seq）；curl 输出入 README。

### T-13（W9D7（周六），约 5h；前置 T-12；对应 M4）
- 内容：M4b React 充值面板：充值列表（address / 金额 / 状态徽章）；订阅 WS 展示实时帧（复用 P0 管理页经验）；数据来自 REST。
- 输出物：面板截图一份；充值 → 面板状态变化的录屏片段（可并入最终录屏）。

### T-14（第二周 W9D8，约 5h；前置 T-13；对应 M5 验收准备）
- 内容：真实闭环验收：从外部钱包（MetaMask）向自己的 deposit address 转 1 USDC（Sepolia 水龙头领的 ETH 付 gas）；录屏全流程（服务日志入账 → WS 帧 → 面板变化，3-10 分钟含讲解，`demo/p1-deposit.mp4`）；CI 四步流水线与覆盖率截图。
- 输出物：`demo/p1-deposit.mp4` + `demo/script.md` 分镜；CI 最近 10 次 push 全绿截图入 README。

### T-15（周日，约 3h；前置 T-14；对应 M5）
- 内容：验收与复盘：README「验收」节内嵌 10 条标准表并逐条勾选（全勾才算过）；`docs/review.md` ≥3 坑（现象/根因/解法/耗时）+ ≥2 取舍（选项对比表/理由/重来）；`QA/review-log.md` 追加 P1 验收记录。
- 输出物：README 勾选表 10/10；`docs/review.md`；验收记录。