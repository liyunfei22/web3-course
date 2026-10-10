# 06-solana/checklist.md — Phase 6 验收清单（W17，全「是」= 阶段完成）

> 规则见 `../CLAUDE.md` 3.3：每条布尔可判、外部可验证、答案只有是/否。P4 = `p4-solana-mini/` 项目仓库。

## 主课与练习（D1-D2）

- [ ] docs/rust-notes.md 存在，覆盖 ≥7 个指定主题（变量/所有权/借用/集合/错误处理/结构体与枚举/模式匹配/trait 基础），每主题含 1 段自述与 1 段自写可运行代码
- [ ] 3 个 Rust 练习均执行 `cargo test` 输出 0 failed，命令输出截图存 docs/rust-notes.md
- [ ] docs/rust-quiz.md 存在，自答 10 题每题 1-3 行答案，≥8 题答案附「已运行验证」标记
- [ ] docs/anchor-notes.md 存在，覆盖五部分（账户模型与租金/PDA 与种子、bump/CPI/#[program]+Context+Accounts/anchor test 机制），每部分附 1 个 program-examples 对照示例链接
- [ ] `anchor init p4-mini` 模板执行 `anchor test` 输出 0 failed，且 docs/env.md 含 `rustc --version`、`solana --version`、`anchor --version`、devnet 余额截图

## P4 项目验收（对应《project-acceptance-10》达标 6 条：①②④⑤⑥⑨）

- [ ] 选型留痕：README「选型」节写明 staking/crowdfunding/vesting 三选一的理由与官方示例仓库路径
- [ ] 程序逻辑自写：业务规则层未直接复制官方源码文件（README 声明自写规则清单 ≥3 条），`anchor test` 输出 0 failed 且每个业务规则对应 1 个 TS 测试用例（测试名含规则语义）
- [ ] `anchor deploy` 成功，README「部署」节记录程序地址；一笔真实交互交易存在，README 含该交易的 Solana 官方浏览器链接（https://explorer.solana.com/）并可在验收当天打开
- [ ] docs/evm-vs-solana.md 存在，五维差异表齐备（确认语义/事件/幂等键/索引方式/常见坑），每维含 1 个与 P1 真实场景的对照描述
- [ ] docs/review.md 含 ≥2 个坑（现象/根因/解法/耗时四要素），且每个坑可改写为 2 分钟面试陈述
- [ ] 本 checklist 全勾选结果与证据路径已同步写入 `../QA/review-log.md`

## 加分项（不勾选不影响阶段完成）

- [ ] （加分）React（@solana/wallet-adapter-react）连接 Phantom 完成一次真实交互，录屏 3-10 分钟存 demo/frontend-solana.mp4，验收当天可打开