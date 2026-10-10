# 06-solana/lecture.md — Phase 6：Rust 够用速成 + Solana/Anchor（W17，1 周）

> 阶段定位：**辅线，够用线**——不追求写大型 Rust，达成「能读、能改 Anchor 程序 + 掌握 CEX 接入 Solana 的原理」即可（roadmap 第 2 节技术栈决策）。产出 P4 Solana 小项目（devnet 部署 + EVM/Solana 接入对比文档）。
> 与 EVM 心智对齐：本阶段所有概念都从 Phase 3/5 的 EVM 心智出发做对照——「账户模型差异」「事件差异」「确认语义差异」，对照本身即面试素材。
> 时间结构（对齐 roadmap 第 3 节写法）：course.rs 前 15 章（2 天）→ Anchor 核心 PDA/CPI（2 天）→ 复刻程序（1 天）→ devnet 部署 + 对比文档（1 天）。下文 D1-D4 为四大块，D1/D2 各占 2 个学习日。
> 前置：Phase 0 已装 Phantom、领过 devnet SOL；无 Rust 基础是正常态，本块不要求预学。

---

## 0. 开场：Solana 与 EVM 世界观的三个差异（先直觉，1h）

- **账户模型**：EVM 一个合约一个大账本（storage + mapping），存款靠 `transfer` 改 mapping；Solana 没有「合约内余额」——状态放在**独立账户（account）里，程序（program）只是读写这些账户的授权逻辑**。直觉：EVM 像一个人一个保险柜，Solana 像共享房间里的文件柜，打开每个抽屉都要你出示钥匙（签名）和权限（program 的授权）。
- **执行模型**：EVM 一笔 tx 执行一个合约调用（可再调别的合约）；Solana 一笔 tx 是**指令数组**，一个 tx 可并行驱动多个账户/程序，靠「账户冲突」在调度层面隔离。并行是 Solana 性能叙事的根基。
- **费用与状态租金**：EVM 存储按 gas 计价；Solana 账户需要**租金（rent）**，存入超过 2 年租金的账户即「免租金（rent-exempt）」，多余 SOL 冻结在账户里（可回收）。P4 部署程序要预留这笔 SOL，`solana rent` 可查。

**交易所场景对应**：交易所接入 Solana 充值时，「用户充值地址 = 交易所派生的 PDA/普通账户」这套心智与 Phase 3 的充值地址派生（BIP32/44）同一目的（隔离+可审计），但派生源从「HD 钱包路径」变成「种子 + 程序校验」。面试问题「Solana 充值地址怎么设计」的答案就藏在本周 D4。

## D1：Rust 够用速成（2 天，course.rs 前 15 章筛选清单）

**目标线**：能读懂 Anchor 生成的 Rust、能改结构体与逻辑、能处理编译错误。**明确不学**（省下 2/3 时间）：async/await 全章、智能指针深水（Rc/RefCell/Arc 内部细节）、宏（派生宏会读不会写）、trait 对象复杂组合、生命周期标注的深水（能看懂 `'a` 即可）、所有权借用卡壳别恋战（30 分钟规则）。

**course.rs 前 15 章按此清单推进（不按顺序全读，按需跳读）**：

| 章（course.rs 目录） | 要什么 | 学时 |
|---|---|---|
| 第 3-4 章 Rust 基础/变量 | 变量/遮蔽/常量/标量与复合类型 | 2h |
| 第 5-6 章 所有权、借用 | **最重点**：所有权三规则、借用规则、引用；用编译错（borrow of moved value）反向学会 | 5h（D1 主力） |
| 第 8 章 通用集合 | Vec/HashMap/String | 2h |
| 第 9-10 章 错误处理、泛型与 trait | Result/Option/unwrap-与-?/泛型基础/trait 定义与实现（Anchor 里到处是 `impl` 与 `#[derive]`） | 4h |
| 第 11-13 章 生命周期/模块/常用功能 | 生命周期标注看懂即可；模块组织 | 2h |
| 第 14 章 测试（cargo test） | Anchor 底层就是 cargo test | 1h |
| 第 15 章 智能指针/并发 | 选读：只要「所有权在多个执行上下文怎么传」的概念，不深挖 | 1h（选读） |
| 结构体/枚举/模式匹配（散布在 4/8 章前后） | 能写 `struct` + `enum` + `match` + `if let` | 随上并学 |

**关键接口签名（够用即可）**：

```rust
// 所有权：一份数据同时只有一个所有者；借用分可变（&mut T）与不可变（&T）
fn takes_string(s: String) -> String { s }          // 所有权转移
fn borrow(s: &str) -> usize { s.len() }             // 不可变借用
// 错误处理：Result 是本周出现频率最高的类型
fn parse(input: &str) -> Result<u64, String> { input.parse::<u64>().map_err(|e| e.to_string()) }
// trait：Anchor 的 Accounts 派生背后就是 trait 实现
trait Withdraw { fn take(&mut self, amount: u64) -> Result<(), String>; }
```

**测试期望**：`cargo test` 能跑通你自己写的 3 个小程序（结构体 + 枚举 match + 错误处理组合的记账 toy）；编译错误能独立读出 "cannot borrow as mutable" 并修复。

## D2：Anchor 核心（2 天，book.anchor-lang.com 导航）

**Anchor 是什么**：Solana 原生 SDK 需要手工做反序列化、权限校验、签名检查，样板代码极多；Anchor 用宏把样板压缩成 **#[program]（逻辑） + #[derive(Accounts)]（账户校验声明）+ `Context<T>`（把声明与逻辑接起来）** 三段式。Anchor 不是语言，是 Solana 的框架（类比：React 之于 JS）。

**账户模型与租金**：每个账户有 `{ lamports, data, owner, executable, rent_epoch }`。程序能读写 owner 是自己的账户；普通用户账户 owner 是 System Program。锚点默认要求目标账户 rent-exempt（内存换交易费，测试网无感知）。

**PDA 与种子派生**：program-derived address（PDA）是「没有对应私钥的地址」——由 `程序地址 + 种子列表 + bump` 通过 findProgramAddress 确定性派生。用途：托管账户的「归属」——只有该程序能签名托管账户（signer 由程序在 CPI 内伪签）。**关键是理解 bump**：curve25519 上大概率派生出的点恰好落在椭圆曲线上（= 有私钥，非法），bump 是散列里循环自增直到落不到曲线上为止的号码，存进账户 data 以便重建。

```rust
// 派生 PDA 的 Anchor 写法（要点，非完整源码）
// seeds 形如 [b"stake:vault", user.key().as_ref(), mint.as_ref()] + bump
// 伪代码：find_program_address(seeds) -> (address, bump) 循环 bump 直到地址非法则取用
pub struct Vault { pub user: Pubkey, pub authority: Pubkey /* PDA 本身 */, ... }
```

**CPI（cross-program invocation）**：一个程序调用另一个程序（如 staking 程序把 SPL Token 程序的人转出托管账户）——程序 A 必须拿到「能由 PDA 或调用者签名的指令」再 `invoke`；Anchor 包成 `cpi::token::transfer(ctx, amount)`。**漏洞高发区**：CPI 的目标程序地址与种子没校验，会把钱转给伪造程序（P4 测试的重点之一是「种子必须全部参与校验」）。

**Anchor 三段式模式**：

```rust
#[program]
pub mod stake_program {
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> { /* 业务：改状态 + CPI 转账 */ }
}
#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut, has_one = authority)]   // 声明式校验：mut = 会写，has_one = 归属检查
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
    // ...
}
```

**Book 导航（book.anchor-lang.com 必读章节）**：Introduction → Projects 的组织 → Accounts/PDA/CPI（三章核心必读）→ Testing（anchor test）→ 其余（CLI/部署/Troubleshooting）按需查；program-examples（https://github.com/solana-foundation/program-examples）选读源码库——**D3 的选型就从这里挑**（见下）。

**测试期望**：`anchor init p4-test && anchor test` 空模板全绿；能说出 `anchor test` 与 `cargo test` 的关系（anchor test = 起 localnet + 部署 + 跑 TS 测试）。

## D3：复刻一个 program（1 天，三选一）

从 `program-examples` 选库挑**源码可读性**最高的三个候选（均有官方文档页，devnet 可跑）：

| 候选 | 业务 | 可读性 | 学到的核心 |
|---|---|---|---|
| staking（推荐） | 押 SPL token 换积分/利息，可解押 | 中等：二账户 + CPI + 时间窗 | PDA 托管、CPI、时间计算 |
| crowdfunding | 众筹目标金额、超时退款 | 简单：金额校验 + 状态机 | 状态机、账户校验 |
| token vesting | 线性解锁 | 简单：时间函数 + 提款 | 整数时间数学（无浮点） |

**复刻验收要点（自写，对照官方源码但逐行改写）**：业务规则 ≥3 条可测（如 staking：押入后 balance 增加、重复押入叠加、解押不足时 revert、超时后不可再押）；`anchor test` 用 TS 断言每条规则；不得直接复制源码文件——规则层逻辑自己重写，宏声明可参照。

**P4 选型一旦定了在 README 里写明「选型理由 + 对照的官方示例路径」**（验收留痕，防「我抄的但说不清」）。

## D4：接入原理与 devnet 部署（1 天）——CEX 视角的 Solana

**连接性三档 commitment**（CEX 接入第一决策）：`processed`（节点已接收，未确认）/ `confirmed`（已入块，quorum 确认，**交易所默认档**）/ `finalized`（已入块并确认到不可回退深度，充值大额时用）。**与 EVM 的对应**：EVM 用确认数（Phase 3 概念）表达渐进安全，EVM 一条链一个视图；Solana 把「确认程度」做成 RPC 参数，交易所按金额选档 —— `processed` 等同「已广播」，`finalized` 等同「足够多确认数」。

**事件过滤的差异（本阶段最重要的一页）**：EVM 有 event log + topics 可按签名过滤扫块（P1 的做法：扫块 → 按 logIndex 幂等入账）；**Solana 无「事件日志」**——程序里 emit 的东西只是「程序日志」，索引需靠 RPC 的 `getSignaturesForAddress(programId or tokenAccount, {limit})` 拉签名分页，再逐签名查 `getTransaction` 解析指令。

```text
EVM 扫块:      block N → logs[].topics → 过滤 Transfer(from,to) → 幂等键 (txHash, logIndex)
Solana 轮询:   getSignaturesForAddress(depositAccount, before=上页头) → 逐 tx getTransaction
               → 解析 instruction/accountKeys 取转账金额 → 幂等键 (signature) 或 (signature, instructionIndex)
```

**幂等键差异**：EVM 一 tx 可含多笔同币 Transfer（幂等键必须带 logIndex）；Solana 充值地址是**专属账户**，一 tx 对该账户的转账通常一笔（幂等键 = signature 即可，但 SPL Token 的转账在指令内部，解析要用 `getTokenAccountsByOwner` + token 程序指令解码）。**常见坑**：Solana 的「充值地址余额变化」不看签名而看「该地址名下的 token account balance 无事件」——所以主流做法是轮询 `getTokenAccountsByOwner(owner, mint, commitment)` 拿余额快照做增量，签名列表只做流水引导（Helius 博客有专门文章讲这个）。

**devnet 部署流程**：`solana config set --url https://api.devnet.solana.com` → `solana airdrop 2`（不够再领，水龙头 https://faucet.solana.com/）→ `anchor build` → `anchor deploy`（记录程序地址）→ `anchor test --provider.cluster devnet` 或自助一笔交互 tx → 在 Solana 官方浏览器（https://explorer.solana.com/）上确认程序与 tx。

**「EVM vs Solana 充值接入对比」文档模板（P4 验收⑥的交付物，差异表五维）**：

| 维度 | EVM（P1 经验） | Solana（本周） | 对应面试题 |
|---|---|---|---|
| 确认语义 | 确认数 0/1/N，reorg 冲正 | commitment 三档，finalized 才不可回退 | 充值确认与安全 |
| 事件/索引 | event log + topics + logIndex | 无事件，signature 分页 + token account 轮询 | 扫块策略 |
| 幂等键 | (txHash, logIndex) | (signature) 或 (signature, instructionIndex)；token account 余额快照兜底 | 幂等设计 |
| 索引方式 | 扫块+缓存区块头 | getSignaturesForAddress 分页 + getTransaction | 索引器架构 |
| 常见坑 | logIndex 遗漏、reorg 双花 | 一签名多指令、token account 不存在时先创建、bump 失配 | 系统设计② |

**交易所场景对应**：这篇文档就是「充提模块面试题」的 Solana 变种答案库；面试答「Solana 充值怎么接」，按表五维展开就是完整白板结构。