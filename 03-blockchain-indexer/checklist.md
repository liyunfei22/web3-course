# Phase 3 验收清单（第 8-9 周，全「是」= 阶段完成）

> 规则见 `../CLAUDE.md` 第 3.3 节：每条布尔可判、判定依据外部可验证、答案只有是/否。证据位置写在括号内；验收结论写入 `QA/review-log.md`。

## W8 原理周

- [ ] `docs/parse-transfer.json` 存在，含 (txHash, logIndex, from, to, value) 五字段；keccak256("Transfer(address,address,uint256)") 计算结果与该日志 topics[0] 完全相等；from/to/value 与 sepolia.etherscan.io 该交易 Logs 页签逐字段一致（证据：JSON + 浏览器截图 + 哈希对照记录）
- [ ] `ParseTransferLog` 的表驱动单测覆盖 4 类输入（正常 / topics 长度不足 / data 长度非法 / value 为 0），空事件输入返回明确的 error，`go test -race ./...` 全绿（证据：测试文件 + 运行输出截图）
- [ ] 由一组助记词派生的 index 0/1/2 三个地址与 MetaMask 导入同一助记词后的前三个账户完全一致（证据：地址列表 + MetaMask 截图）
- [ ] 白板录音「一笔充值从广播到入账的全流程」时长 3-6 分钟，文件存在于 `docs/whiteboard-deposit-flow.m4a`（或 .mp3/.mov）；`docs/state-machine.md` 用 mermaid 画全 pending/confirmed/finalized/reversed 四状态与全部合法迁移、每条标注触发条件（证据：文件 + 时长元数据）
- [ ] `docs/scanning-safety.md` 对扫块「四死法」（头块/半块/游标漂移/从 0 重建）各写「现象 / 约束 / 验收方式」三行；WTF Academy Solidity 101 前十课笔记逐课一行（该课讲什么 + 用途）（证据：两个文件内容）

## W9 项目周（对应 `../projects/p1-deposit-watcher/SPEC.md` 里程碑）

- [ ] 扫块服务连续运行 10 分钟无错误退出，`demo/m1-scan.log` 含 ≥1 个区块扫描解析记录（证据：日志文件；M1）
- [ ] 扫块安全边界均生效：tip-lag 配置默认 ≥1 且单测断言「目标块 = 头块 - tip-lag 时停止」；杀掉进程重启后从游标续扫，两次运行日志比对无重复无跳块；游标表存有 (blockNumber, blockHash)（证据：测试文件 + 两次运行日志；M1）
- [ ] 并发幂等测试：10 个 goroutine 同时投递同一 (txHash, logIndex, to_addr)，`deposits` 表恰好 1 行，`go test -race` 通过（证据：测试文件 + 断言输出；M2）
- [ ] 状态机每条合法迁移（pending→confirmed、confirmed→finalized、pending→reversed、confirmed→reversed）各有 ≥1 条命名测试，非法迁移返回 error 且有测试（证据：测试文件清单；M2）
- [ ] `go test -cover ./...` 全仓覆盖率 ≥ 80%，关键包（scanner / processor / 状态机）≥ 90%，命令输出与截图存入 README 测试节；存在 ≥1 个 Fuzz 函数（如 `FuzzParseTransferLog`），本地或 CI 运行 ≥ 1000 轮无 panic/failure，轮数数字记录在案（证据：README 截图 + 运行输出；M2）
- [ ] Sepolia 真实充值录屏：MetaMask（或同等外部钱包）向自己的 deposit address 转 1 USDC，录屏含浏览器交易页、服务入账日志、WS 通知帧、面板变化四画面，时长 3-10 分钟（证据：`demo/p1-deposit.mp4`；M5 重点项）
- [ ] reorg 冲正演示：`docs/reorg-demo.sh` 按 `docs/reorg-demo.md` 步骤可重复执行，输出日志含 status 迁移至 reversed 与冲正事件（证据：`demo/reorg-demo.log`；M3 重点项）
- [ ] M4 通知链路：独立 Kafka 消费者消费 `deposits` 主题输出合法 JSON 事件且与入库一致；WS 客户端断线重连带 lastSeq 重新订阅，服务端补发增量不重复不丢，输出含订阅前后 seq 序列（证据：`demo/deposits-consumed.log` + 重连输出；M4）
- [ ] `.github/workflows/ci.yml` 含 lint + test + coverage + build 四步且 push 即触发，覆盖率低于 80% 流水线为红，最近 10 次 push 全绿，截图存 README「CI」节（证据：CI 绿标截图；M5）
- [ ] M5 收尾三件套齐备：README「验收」节内嵌 `../standards/project-acceptance-10.md` 10 条勾选表且 10/10 为「是」每条附证据路径；`docs/review.md` 含 ≥3 个坑（现象/根因/解法/耗时）与 ≥2 个取舍（选项对比表/理由/重来）；`QA/review-log.md` 含 P1 验收记录（证据：README 勾选版 + review.md + review-log 条目；M5）