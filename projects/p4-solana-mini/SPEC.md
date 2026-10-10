# SPEC-P4：Solana 小项目（Anchor 复刻 + devnet 部署 + EVM/Solana 接入对比文档）

| 元信息 | 值 |
|---|---|
| 项目编号 | P4 |
| 所属阶段 | Phase 6（第 17 周） |
| 状态 | Draft → **Review** → Frozen（终审后冻结） |
| 版本 / 日期 | v1.0 / 2026-10-09 |
| 作者 | A5 |

## 1. 业务范围

一句话定位：用 Anchor 在 1 周内复刻一个 Solana 链上程序（候选：staking / crowdfunding / token vesting 三选一，按源码可读性选型，README 写明理由），部署到 devnet 并完成一笔真实交互，同时产出「EVM vs Solana 充值接入对比」文档——目标是达成 Rust/Solana「够用线」（能读能改 Anchor 程序 + 掌握 CEX 接入原理），并给面试提供 Solana 专项八股素材。

核心业务流程（以默认推荐项 staking 为例，选型后在 README 固化）：
1. 质押：用户调用 `stake(amount)` → 程序校验（账户归属 / 时间窗）→ SPL Token 经 CPI 转入 PDA 托管账户 → 更新质押状态账户
2. 重复质押：再次 `stake(amount)` → 余额账户叠加，状态一致
3. 解押：用户调用 `unstake(amount)` → 校验余额充足与时间条件 → CPI 转回 → 状态扣减；不足则 revert
4. 链下观察（CEX 视角）：通过 getSignaturesForAddress / getTokenAccountsByOwner 轮询该账户余额与流水，映射为充值入账（对比文档核心内容）

## 2. 目标与边界

**Goals（本项目要做到的）**：
- G1：`anchor test` 全绿，覆盖 ≥3 条业务规则（每条规则一个命名 TS 用例）
- G2：devnet 部署成功，README 提供程序地址 + 一笔真实交互交易的 Solana 官方浏览器（explorer.solana.com）链接
- G3：docs/evm-vs-solana.md 五维差异表（确认语义/事件/幂等键/索引方式/常见坑），每维与 P1 真实场景对照
- G4：docs/review.md ≥2 坑 + docs/adr/ ≥1 篇（选型 ADR 必含备选对比）
- G5：（加分，弹性）React wallet-adapter 前端连接 Phantom 完成一次交互并录屏

**Non-Goals（明确不做，防止范围蔓延）**：
- NG1：不写 Solana 原生（non-Anchor）程序；不学 Rust 深水（async/宏/智能指针深挖）
- NG2：不做跨程序特权放大、不做治理、不做代币经济设计——复刻即可，业务参数可按需加 `const` 常量
- NG3：不做主网（mainnet）部署与真实资金测试——devnet 测试币截止
- NG4：不做极速全量索引器——对比文档只到「接入方案」层面，不做实现
- NG5：不做审计/威胁建模全流程（P4 不要求 Slither 类扫描；Anchor 的声明式校验是默认防线，防御面讨论写进复盘即可）

## 3. NFR（非功能需求）

| 类别 | 指标 | 目标值 | 测量方式 |
|---|---|---|---|
| 正确性 | 规则覆盖 | 每业务规则 1 个命名测试，断言金额/状态精确相等 | anchor test（TS） |
| 正确性 | 失败路径 | 余额不足/未到时间/重复初始化 3 类 revert 有测试 | anchor test 断言 |
| 安全 | 种子校验 | PDA 派生种子全量参与账户校验（改种子即错地址） | 1 个负向测试（篡改种子 expect 失败） |
| 可复现 | 环境 | rustc/cargo/solana/anchor 版本记录 + airdrop 余额截图 | docs/env.md |
| 可验证 | 链上 | 程序地址 + 交互 tx 在 Solana 官方浏览器可打开 | README 链接 |

## 4. 技术栈（版本锁定）

| 组件 | 选型 | 版本 | 用途 | 备注 |
|---|---|---|---|---|
| 语言 | Rust | 与本地 rustc 一致（记录入 docs/env.md） | 程序逻辑 | 只到 lecture D1 的「够用线」 |
| 框架 | Anchor | 与本地 anchor 一致（锚定版本记录） | 程序开发/测试/部署 | book.anchor-lang.com 为准 |
| 链 | Solana devnet | CLI 指向 api.devnet.solana.com | 部署与交互 | airdrop + faucet |
| 参考库 | program-examples | 固定 commit（README 记录） | 复刻参照 | 规则层自写，不复制源码文件 |
| 前端（弹性） | React + @solana/wallet-adapter-react | 固定版本 | 加分交互 | 非必交付 |

## 5. 架构图（Mermaid）

```mermaid
flowchart LR
    subgraph CEX 视角接入
        RPC[Solana RPC<br/>devnet]<-->|getSignaturesForAddress<br/>分页拉签名| POLL[链下轮询服务<br/>概念模型]
        POLL<-->|getTransaction 解析| RPC
        POLL<-->|getTokenAccountsByOwner<br/>余额快照| RPC
    end
    subgraph 链上
        USER[用户账户] -- stake/unstake 指令 --> PROG[Anchor 程序<br/>#[program]+Accounts]
        VLT[PDA 托管账户] --- PROG
        SPL[SPL Token Program] <-.CPI.-> PROG
        STAKE[质押状态账户] --- PROG
    end
    USER -.-> RPC
```

**组件职责表**：
- Anchor 程序：业务规则 + 声明式账户校验（Accounts 派生宏）+ 通过 CPI 驱动 SPL Token 转账
- PDA 托管账户：质押代币实际存放地，只能由本程序经 bump 伪签动用
- 链下轮询（本项目的「文档化」组件，不实现）：按 commitment 轮询签名与余额，映射为入账
- Solana 官方浏览器（explorer.solana.com）：验证台与证据浏览器

**关键数据流**：
- D1：stake：指令（用户签名）→ Anchor 校验账户集 → CPI 转账 → 状态更新 → 收尾校验
- D2：unstake：校验余额与时间 → CPI 转回 → 扣减（顺序 = Solana 版 CEI，对照 lecture D2）
- D3：链下：getSignaturesForAddress 分页 → 逐 tx 解析 → 余额快照兜底（对比文档 D4 表）

## 6. 数据模型要点

- 状态账户（示例 staking，选型后以实际为准）：
  - `StakeState { authority: Pubkey, amount: u64, last_update_ts: i64, reward_per_second: u64（常量） }`
  - 每个用户一个质押状态账户，地址由 PDA `[b"stake:state", user]` 派生
  - 托管账户 PDA `[b"stake:vault", user, mint]`，存放 SPL Token
- 幂等/无事件特性：无 event log；链下以 (signature,instructionIndex) 与余额快照兜底（写进对比文档）
- 必查坑清单（进 docs/review.md 候选）：bump 失配、种子少一个导致账户碰撞、CPI 目标程序地址未校验、u64 溢出（时间×利率）、anchor test 与 devnet 双网切换

## 7. 里程碑 M1-Mx

### M1：Rust 速成（W17 第 1-2 学习日）
- 目标：Rust 够用速成（course.rs 筛选清单），为 Anchor 打底
- 关键任务：P06-01/02/03（tasks 编号见 `../../06-solana/tasks.md`）
- 退出条件：
  - [ ] docs/rust-notes.md 覆盖 lecture D1 清单 ≥7 主题

### M2：Anchor 核心 + 复刻 program + 测试（W17 第 3-5 学习日）
- 目标：Anchor 环境与核心概念（账户模型/PDA/CPI/声明式校验/anchor test 机制）就绪；三选一复刻完成，规则层自写，测试覆盖业务规则
- 关键任务：P06-04/05（Anchor 环境与核心，`../../06-solana/tasks.md`）→ P4-T01
- 退出条件：
  - [ ] docs/env.md 记录 rustc/cargo/solana/anchor 版本与 devnet 余额截图，`anchor init p4-mini` 模板 `anchor test` 输出 0 failed；docs/anchor-notes.md 覆盖五部分
  - [ ] README「选型」节注明三选一理由与官方示例 commit 路径；`anchor test` 0 failed 且 ≥3 个规则用例 + ≥1 个负向（种子篡改/余额不足）用例
  - [ ] 程序源码与官方示例的差异点清单 ≥3 项写入 docs/source-diff.md

### M3：devnet 部署 + 对比文档（W17 第 6 学习日）
- 目标：上链 + 真实交互 + 对比文档齐备
- 关键任务：P4-T02/03/04
- 退出条件：
  - [ ] README「部署」节含程序地址与交互 tx 的 explorer.solana.com 链接，验收当天可打开
  - [ ] docs/evm-vs-solana.md 五维表完整，docs/review.md ≥2 坑，checklist 同步 `../../QA/review-log.md`

（里程碑数 = 项目周数适配：P4 为 1 周，M1-M3 分别对应 2+3+1 个学习日——M1=Rust 速成（D1 第 1-2 日）、M2=Anchor 核心 + 复刻（D2+D3，第 3-5 日）、M3=部署 + 对比文档（D4 第 6 日），合计 6 个学习日，与 tasks.md 的 D1-D4 对齐，见 roadmap 第 3 节。）

## 8. 验收勾选表（引用 10 条标准明细）

> 判定细则见 `../../standards/project-acceptance-10.md`。**P4 达标线 = 6 条：①②④⑤⑥⑨**（roadmap 第 9 节），其余 4 条标记「弹性」不阻塞通过。

| # | 10 条标准 | 本项目判据（写完必须可勾选） | 证据位置 | 达标线 | 完成 |
|---|---|---|---|---|---|
| ① | 测试完备（≥80% + fuzz/边界） | `anchor test` 输出 0 failed；≥3 个业务规则用例 + ≥1 个负向用例（篡改种子/余额不足），用例按规则命名 | README「测试」节 | 是 | [ ] |
| ② | 真实部署（testnet + 源码验证） | 程序地址在 Solana 官方浏览器可见（Program 页），README「部署」节含地址 + 一笔真实交互 tx 链接（explorer.solana.com） | README「部署」节 | 是 | [ ] |
| ③ | 安全自查（Slither/威胁模型） | Anchor 属声明式防线，P4 不要求静态扫描；防御面（PDA 种子/bump/CPI 目标）讨论 ≥2 段写入 docs/review.md | docs/review.md | 否（弹性） | [ ] |
| ④ | 文档齐备（Mermaid + ADR） | README 含本 SPEC 第 5 节同源 Mermaid 图；ADR ≥1 篇（选型 ADR：三候选对比表 + 理由 + 后果） | README + docs/adr/ | 是 | [ ] |
| ⑤ | 可演示（3-10 分钟录屏） | demo/ 录屏 3-10 分钟（部署 → CLI 交互 → Solana 官方浏览器特写 → 对比文档翻页讲解）+ demo/script.md 分镜 | demo/ | 是 | [ ] |
| ⑥ | 完整闭环（UI 或 CLI 走通全业务流） | CLI 或测试脚本输出可见完整链路：初始化 → 质押 → 重复质押 → 解押 → 失败 revert；输出存 demo/closed-loop.txt | demo/ | 是 | [ ] |
| ⑦ | 可复现（依赖锁死一键重跑） | docs/env.md 列版本：rustc/cargo/solana/anchor + `cargo build`/`anchor build` 一条命令可重建本地环境；devnet 部署命令重跑成功 1 次记录 | docs/env.md | 否（弹性） | [ ] |
| ⑧ | CI 自动化 | P4 不强制 CI（1 周量级）；若配置，`anchor fmt --check + build + test` 绿标截图存 README | （可选） | 否（弹性） | [ ] |
| ⑨ | 复盘文档（踩坑 + 取舍） | docs/review.md ≥2 坑（现象/根因/解法/耗时）+ 选型取舍 ≥1（对比表）；每坑可改写 2 分钟面试陈述 | docs/review.md | 是 | [ ] |
| ⑩ | 结果留痕（报告/地址/CI 截图） | README「成果清单」节：程序地址、交互 tx 链接、anchor test 输出截图、对比文档链接，验收当天全可打开 | README「成果清单」 | 否（弹性） | [ ] |

## 9. 周期估算与弹性

- 计划投入：1 周 × 6h/天；项目总人日估算 6 天（主课与项目并行，见 `../../06-solana/tasks.md`）。
- 里程碑时间线：M1 截止 W17 第 2 学习日；M2 截止第 5 学习日；M3 截止第 6 学习日。
- 可砍条目（低档位适用，标「弹性」）：P06-06 React 前端（弹性）、P06-03 10 题自测（最低档可砍）；最低档 P4 降为「模板复刻 + 对比文档」（P4-T01 只改业务参数不重写逻辑）。红线：P4-T02（部署链接）与 P4-T03（对比文档）任何档位必交付；Phase 6 整段是最低档第一砍项（roadmap 第 5 节），砍时保留对比文档作为独立产出。

## 10. 演示脚本页（录屏步骤，最终成片 3-10 分钟）

| 幕 | 时长 | 操作 | 预期画面/数据 | 讲解要点 |
|---|---|---|---|---|
| 第 1 幕 部署 | ~2min | `anchor build && anchor deploy`（devnet） | 终端输出程序地址 → Solana 官方浏览器打开程序页 | Anchor 构建/部署链路 + 租金的钱从哪来 |
| 第 2 幕 主流程 | ~3min | CLI 或 TS 脚本初始化 → 质押 → 重复质押 → 解押 | 每步 console 输出金额变化；Solscan 对应 tx 逐个打开 | 账户模型/PDA 托管/CPI 转币 |
| 第 3 幕 特写 | ~2min | 触发失败路径：余额不足解押 | revert 错误输出特写 | Anchor 校验器如何工作（声明式防线） |
| 第 4 幕 收尾 | ~1min | 翻页 docs/evm-vs-solana.md 五维表 | 差异表特写 | 接入视角的 Solana 本质 |

约束：录屏含讲解或字幕；总时长 3-10 分钟；与 README「演示」节链接同一文件。

## 11. 变更记录

| 版本 | 日期 | 变更 | 作者 |
|---|---|---|---|
| v1.0 | 2026-10-09 | 初稿 | A5 |