# 05-defi-dex/tasks.md — Phase 5 任务清单（W15-W16）

> 任务分类：主课练习（P05-xx）/ 项目任务（P3-xx）。每日算法块 45min 照常（roadmap 第 6 节，不列在此表）。
> 节奏：每周 6 个学习日 + 周日半天复盘（复盘即产出型笔记固话点：当日 commit + 三行复盘写入 docs/review.md 草稿）。
> 前置通用：Phase 0 环境齐备（Foundry 已装、Sepolia 测试币已领）；`git commit` 每任务完成后执行。

## W15（D1-D6）：Solidity + Foundry 主线

### P05-01 语言基础 + 最小 demo（D1，主课）
- 预计时长：6h（Cyfrin Solidity Fundamentals ① + 对应 WTF 101 对照）
- 前置：无（本阶段第一项）
- 输出物：个人 Solidity 练习仓库 `solidity-labs/`（git init 于课程目录下），含 1 个带 mapping+struct 的最小合约 + `forge test` 通过

### P05-02 函数与错误处理（D2，主课）
- 预计时长：5h（Cyfrin ② + ① 收尾）
- 前置：P05-01
- 输出物：练习合约以自定义 error 重写课程示例；README 记一段「require vs custom error vs assert」的取舍（gas 与可读性）

### P05-03 事件与 ERC-20 精读（D3，主课）
- 预计时长：5h（Cyfrin ③④ + EIP-20 通读）
- 前置：P05-02
- 输出物：`IERC20.sol` 接口自写（六函数两事件，不看 OpenZeppelin 先默写再对照）；笔记 1 页：event topics 与 Phase 3 讲过的 logIndex 的关系

### P05-04 安全模式（D4，主课）
- 预计时长：5h（Cyfrin ⑤ + Advanced 选讲 2h）
- 前置：P05-03
- 输出物：在课程示例中标注 3 处违反 CEI 的位置（docs/cei-notes.md，含「为什么这里会重入」的自述）

### P05-05 Foundry 上手 + 脚手架（D5，主课）
- 预计时长：5h（Foundry Full Course ① + 读 `../scaffolds/foundry-project.md`）
- 前置：P05-04
- 输出物：新仓库 `foundry-labs/` 按脚手架初始化；foundry.toml 按脚手架构建；hello 测试 `forge test` 全绿

### P05-06 Foundry 测试工具 + P3 三件套开工（D6，主课+项目）
- 预计时长：6h
- 前置：P05-05
- 输出物：至少 3 个用例练手 vm.prank/vm.expectRevert/vm.assume；`p3-dex-clone/`（P3 专属仓库）开工：README、.gitignore、docs/deploy.md 模板（环境变量清单占位）。本任务只搭骨架与接口文件（Factory/Pair/Router 空壳 + 事件声明），不写逻辑

### P03-T01 Pair 契约核心（项目，W15 D6 起跨周）
- 预计时长：项目时间累计 8h（W15 剩余 + W16 D1）
- 前置：P05-06
- 输出物：Pair 的 getReserves/mint/burn 自写实现；单元测试覆盖：首笔 MINIMUM_LIQUIDITY 锁仓、LP 计算、精度边界（见 lecture 2.4 表前三行）

## W16（D1-D6）：测试、安全、部署

### P03-T02 swap 与 k 约束（W16 D1-D2，项目）
- 预计时长：10h
- 前置：P03-T01
- 输出物：swap 自写实现（0.3% 手续费、floor 舍入、双零校验）+ 单元测试滑点保护与余量校验；`git log` 显示逻辑从空白逐步叠加

### P03-T03 Router 与路径交换（W16 D2-D3，项目）
- 预计时长：8h
- 前置：P03-T02
- 输出物：Router 自写实现（addLiquidity/removeLiquidity/swapExactTokensForTokens，deadline 与 amountOutMin 生效）；测试覆盖 A→B→C 两跳路径

### P03-T04 fuzz + invariant（W16 D3-D4，项目）
- 预计时长：8h
- 前置：P03-T03
- 输出物：`testFuzz_swap_keepsK(...)` ≥1000 轮 + `invariant_k_never_decreases`；**若 fuzz 探测到边界 bug（预期会发生舍入相关），修复后把现象/根因/修复写进 docs/review.md 坑条目（验收①的硬证据）**

### P03-T05 fork 测试 + Slither + 威胁模型 + CI（W16 D4-D5，项目）
- 预计时长：9h
- 前置：P03-T04
- 输出物：fork 测试对照真实 Sepolia 池子 swap 结果差异 ≤1 wei（记录差异表）；Slither 报告存 docs/security/slither.txt（medium+ 为 0 或逐条评估）；威胁模型文档 docs/security/threat-model.md（四资产表，按 lecture 第 4 节模板）；`.github/workflows/ci.yml`（forge fmt --check + build + test + coverage 四步，使用 `foundry-rs/foundry-toolchain@v1` 固定版本）；`forge coverage` ≥80% 输出与截图存 README「测试」节

### P03-T07 Sepolia 部署 + 验证 + 录屏（W16 D6，项目）
- 预计时长：6h
- 前置：P03-T06
- 输出物：Factory+Pair+Router 部署（`forge script` 可复现，脚本与 `.env.example` 入 docs/deploy.md）；Etherscan Verified 截图入 README；真实 swap 录屏 3-10 分钟 + demo/script.md 分镜（三幕：部署 → 加池+swap → 浏览器 tx 与余额特写）

### P03-T08 复盘与 ADR（W16 D6 收尾，项目）
- 预计时长：2h
- 前置：P03-T07
- 输出物：docs/review.md ≥3 坑（四要素：现象/根因/解法/耗时）；docs/adr/ ≥3 篇（含 1 篇中途换方案）。checklist.md 全勾选后，把验收结论同步到 `../QA/review-log.md`

### P05-07 选做：Ethernaut 8-10 关（W15-W16 穿插，主课选做）
- 预计时长：每天 20-30min，累计 ≤8h
- 前置：P05-04 之后开始
- 输出物：docs/ethernaut.md 记录通关关数（≥8 关）+ 每关键解法 1 行要点与涉及漏洞类别（对应 SWC 注册表编号）

### P05-08 加分：React 前端交互（弹性，可砍）
- 预计时长：8h
- 前置：P03-T07
- 输出物：React（wagmi 或 viem）连接钱包 → 对 Sepolia 池走一次完整 swap，录屏存 demo/frontend-swap.mp4；验收③外独立体现

> 弹性说明（roadmap 第 5 节）：最低档可砍 P05-07（Ethernaut 选做改选）、P05-08（前端）、Advanced Solidity 选讲；P3 三条验收线（①②③）与三件套完整性不可砍。