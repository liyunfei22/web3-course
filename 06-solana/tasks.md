# 06-solana/tasks.md — Phase 6 任务清单（W17，1 周）

> 任务分类：主课练习（P06-xx）/ 项目任务（P4-xx）。每日算法块 45min 照常；周日半天复盘：commit + 三行复盘入 docs/review.md 草稿。
> 时间结构对应 roadmap 第 3 节：D1 占 2 个学习日、D2 占 2 个学习日、D3/D4 各 1 日。
> 环境前置：Phase 0 已装 Phantom、devnet SOL 已领（`solana airdrop` 记录在 docs/env.md）。

## D1：Rust 够用速成（第 1-2 学习日）

### P06-01 course.rs 筛选清单推进（D1 第 1 日，主课）
- 预计时长：6h
- 前置：无
- 输出物：docs/rust-notes.md 覆盖清单前 5 项（变量/所有权/借用/集合/错误处理），每项含 1 段自述 + 1 段自写可运行代码；`cargo build` 通过

### P06-02 Rust 小练习三件（D1 第 2 日，主课）
- 预计时长：5h
- 前置：P06-01
- 输出物：3 个自写小程序（结构体 + 枚举 + match、Result 组合错误处理、trait 定义与实现各一个），`cargo test` 输出 0 failed，输出截图存 docs/rust-notes.md；编译错误自救 ≥3 条记录（含错误信息与修复）

### P06-03 Rust 自测 10 题（D1 第 2 日晚间 30min，主课）
- 预计时长：1h
- 前置：P06-02
- 输出物：docs/rust-quiz.md 自答 10 题（题目清单来自 lecture D1 各节末尾的测试期望，每题答案 1-3 行），≥8 题答案附「跑过验证」标记

## D2：Anchor 核心（第 3-4 学习日）

### P06-04 Anchor 环境 + 空模板全绿（D2 第 1 日，主课）
- 预计时长：4h
- 前置：P06-02
- 输出物：`anchor init p4-mini` 成功，`anchor test` 空模板 0 failed；docs/env.md 记录 `rustc/cargo/solana/anchor --version`、devnet 地址与余额截图

### P06-05 Anchor 核心三章精读（D2 第 1-2 日，主课）
- 预计时长：8h（book.anchor-lang.com：Accounts / PDA / CPI 三章必读）
- 前置：P06-04
- 输出物：docs/anchor-notes.md 覆盖五部分：账户模型与租金 / PDA 与种子/bump / CPI / #[program]+Context+Accounts 模式 / anchor test 机制，每部分含 1 段自述 + 1 个指向 program-examples 的对照示例链接

## D3：复刻一个 program（第 5 学习日）

### P4-T01 选型 + 复刻（D3，项目）
- 预计时长：6h
- 前置：P06-05
- 输出物：从 staking / crowdfunding / token vesting 三选一在 README 写明选型理由与官方示例路径；程序自写（规则逻辑不复制源码文件）；`anchor test` 全绿且覆盖 ≥3 条业务规则（如 staking：重复押入叠加 / 解押不足 revert / 时间窗限制），每条规则对应一个 TS 测试名

## D4：接入原理与 devnet 部署（第 6 学习日）

### P4-T02 devnet 部署 + 真实交互（D4上午，项目）
- 预计时长：3h
- 前置：P4-T01
- 输出物：`anchor deploy` 成功，README「部署」节记录程序地址；一笔真实交互 tx（通过 anchor test 指向 devnet 或 CLI 客户端调用），记录 tx signature；Solana 官方浏览器（https://explorer.solana.com/）页面两个链接（程序页 + tx 页）可打开

### P4-T03 EVM vs Solana 对比文档（D4下午，项目）
- 预计时长：3h
- 前置：P4-T02、Phase 3 的 P1 经验
- 输出物：docs/evm-vs-solana.md 差异表（五维：确认语义/事件/幂等键/索引方式/常见坑，按 lecture D4 模板），每维含 1 个 P1 真实场景对照描述；配套自答 10 题八股卡 docs/solana-8gu.md（录音可后补）

### P4-T04 复盘 + 验收留痕（D4 晚，项目）
- 预计时长：2h
- 前置：P4-T03
- 输出物：docs/review.md ≥2 个坑（现象/根因/解法/耗时四要素）；checklist.md 全勾选后同步到 `../QA/review-log.md`

### P06-06 加分：React wallet-adapter 前端（弹性，可砍）
- 预计时长：6h
- 前置：P4-T01
- 输出物：React（@solana/wallet-adapter-react）连接 Phantom → 调用已部署程序完成一次交互，录屏 3-10 分钟存 demo/frontend-solana.mp4，README「演示」节链接可打开

> 弹性说明（roadmap 第 5 节）：最低档 P4 降为「模板复刻 + 对比文档」（P4-T01 可只改业务参数不重写逻辑 + P4-T03 必交付）；P06-06 与 P06-03 在最低档砍掉。锚点：P4-T02（部署链接）与 P4-T03（对比文档）任何档位都交付。