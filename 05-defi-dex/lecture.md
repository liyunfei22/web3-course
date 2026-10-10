# 05-defi-dex/lecture.md — Phase 5：Solidity + Foundry + Uniswap v2 风格 DEX（W15-W16）

> 阶段定位：**辅线，但到「项目级深度」**——会写、会测、会部署、会自查合约，产出 P3 DEX Clone。主线（Go 后端）与面试冲刺见其他阶段；本阶段不写 Go。
> 前置：Phase 0 环境（Foundry 安装、MetaMask、Sepolia 测试币）+ Phase 3 的 EVM 概念（tx/事件日志/确认数，讲重合概念时快速带过，不重复展开）。
> 每日节奏：算法块 45min 照常（roadmap 第 6 节），不可因链上内容挤掉。周五复盘 + 周日半天规划照常。
> 术语按 `../CLAUDE.md` 术语表：CEI、滑点、fuzz/fork/invariant 测试命名统一。

---

## 0. 开场概念前置：DEX 与 CEX 的本质区别（必读，2h）

先说直觉：你已经在 Phase 4 亲手写了一台中心化交易所（CEX）——撮合引擎 + 三栏账务 + 行情 WS。那台机器有三堵墙：**订单簿在服务端内存里、用户资产在交易所钱包里、成交即成交**。DEX 把这三样全部掀翻到链上：

| 维度 | CEX（你的 P2） | DEX（本阶段 P3） | 后果 |
|---|---|---|---|
| 撮合方式 | 中心化订单簿（matching engine，价格-时间优先） | 链上合约撮合，或**自动做市商（AMM）**按公式定价 | 无订单簿可见性，但有「流动性池」 |
| 资产保管 | 热钱包托管，交易所说了算 | 用户钱包自托管，合约只按规则转移 | 私钥事故归用户，合约漏洞归所有人 |
| 结算 | 数据库事务，毫秒级 | 每笔 swap 是一笔链上交易，秒级确认 | 吞吐量差 3-4 个数量级 |
| 手续费 | 交易所自定义 | 池子抽成（v2 为 0.3%），进池子给 LP | 手续费是流动性提供者（LP）的收益 |

**AMM 的直觉**：没有撮合对手方时，池子自己当对手方。池子里存两种代币（如 ETH/USDC），任何时刻满足 `x * y = k`（恒定乘积）。你往池子塞 Δx 个 X，池子吐给你 Δy 个 Y 且 (x+Δx)(y-Δy) = k。你买的越多，价格越贵——**滑点自 AMM 的曲率而来**。LP 按份额分享 0.3% 手续费，同时也承担无常损失（impermanent loss）。

**交易所场景对应**：你在 P2 里做的「盘口深度→大单吃穿盘口→冲击成本」，在 AMM 里对应「池深 x·y → 大单滑点→ k 值不变约束」。面试被问「DEX 大单和 CEX 大单有什么区别」，回答骨架就是这句：CEX 吃穿订单簿，DEX 推动公式价格，二者都体现流动性深度。另一个对应：**CEX 的三栏账务 vs 合约的余额是「状态变量」**——同一份资金模型，一个在 MySQL 一个在 EVM storage。

---

## 1. W15 学习导航：Cyfrin Updraft 主线（学时标注）

Cyfrin Updraft（https://updraft.cyfrin.io/courses）是免费全课，本阶段主教材。按下面表格推进，**视频 1.5x 倍速、代码必亲手敲**；标注「选学」的节在冲刺/最低档可跳过（roadmap 第 5 节砍项顺序：Phase 5 安全关可砍，Core 主线不砍）。

| 节 | 内容要点 | 学时 | 必读/选读 | 完成标志 |
|---|---|---|---|---|
| Solidity Fundamentals ①语言基础 | 变量/值类型与引用类型/数组/映射/结构体/枚举 | 6h（W15 D1-D2） | 必读 | 最小 demo：一个带映射与结构体的合约编译通过 |
| Solidity Fundamentals ②函数 | 可见性/状态可变性/修饰符/自定义错误/require-revert | 4h（W15 D2-D3） | 必读 | 用自定义 error 重写一遍课程示例 |
| Solidity Fundamentals ③事件 | event 定义/emit/索引参数与 topics（呼应 Phase 3 logIndex） | 2h（W15 D3） | 必读 | 写一个 emit 事件并在测试里断言 |
| Solidity Fundamentals ④继承与接口 | is/override/interface/ERC-20 阅读 | 4h（W15 D3-D4） | 必读 | 对照 EIP-20 读明白 IERC20 六函数两事件 |
| Solidity Fundamentals ⑤安全模式 | CEI 模式/reentrancy guard/数学溢出与 SafeMath 时代 | 4h（W15 D4） | 必读 | 能指出课程示例违反 CEI 的位置 |
| Advanced Solidity 选讲 | assembly/transient storage/代理合约（只看不写） | 2h（W15 D5，选读） | 选读 | 无硬性输出 |
| Foundry Full Course ① | forge init/test/fmt/coverage、基础断言 | 4h（W15 D5-D6） | 必读 | 用 `scaffolds/foundry-project.md` 跑通 hello 测试 |
| Foundry Full Course ② | vm 作弊码（prank/expectRevert/assume/fork 选择器） | 4h（W15 D6 + W16 D1） | 必读 | 会在测试里伪造 msg.sender 与时间 |

- 中文对照：概念卡壳时翻 WTF Academy 101/102（必读资源），以 Cyfrin 为准、WTF 为解释器。
- Ethernaut（https://ethernaut.openzeppelin.com/）**选做 8-10 关**，W15 起每天通关记录 1 行（见 tasks T14）。
- 明确**不学**（消耗高收益低，本阶段非审计师）：assembly（Advanced 课只看）、yul 优化、代理升级完整实现、形式化验证。

## 2. P3 目标：自写 Uniswap v2 风格三件套（核心数学不得 fork）

本阶段全部产出收敛到 P3 DEX Clone（规格见 `../projects/p3-dex-clone/SPEC.md`）。

**铁律**：Factory/Pair/Router 的数学与逻辑**自己实现**，允许对照 `Uniswap/v2-core` 读（必读资源），但禁止粘贴其源码；`git log` 必须能证明你的实现是从空白叠加的。对照只做三件事：确认接口语义、确认舍入方向、确认边界常数（MINIMUM_LIQUIDITY）。

### 2.1 接口签名（自写版，参照 v2-core 语义，非复制）

```solidity
// Factory —— 负责部署唯一 Pair，防重复
function createPair(address tokenA, address tokenB) external returns (address pair);
function getPair(address tokenA, address tokenB) external view returns (address);
function allPairsLength() external view returns (uint256);
// 事件：PairCreated(address indexed token0, address indexed token1, address pair, uint256)

// Pair —— 池子本体，仅 Factory 可建
function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
function mint(address to) external returns (uint256 liquidity);       // 存入双币，铸造 LP
function burn(address to) external returns (uint256 amount0, uint256 amount1); // 销毁 LP，取回双币
function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external;
// 事件：Mint / Burn / Swap / Sync

// Router（参照 v2-periphery 语义自写）—— 用户入口，聚合并计算
function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired,
    uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external
    returns (uint256 amountA, uint256 amountB, uint256 liquidity);
function removeLiquidity(address tokenA, address tokenB, uint256 liquidity,
    uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external
    returns (uint256 amountA, uint256 amountB);
function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin,
    address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts);
```

### 2.2 每个函数的语义与参考实现要点（伪代码，非源码）

**恒定乘积与舍入**：`x * y = k` 全部用整数实现。卖出场景：先按 0.3% 扣手续费得 `amountInAfterFee = amountIn * 997 / 1000`，再算 `amountOut = (amountInAfterFee * reserveOut) / (reserveIn + amountInAfterFee)`。**方向性铁律：给用户的 amountOut 一律向下取整（floor），收用户的 amountIn 只多不少**——1 wei 的舍入差归池子（LP），不归交易者。这是本阶段最重要的「为什么」：舍入方向错了，就是套利者的免费提款机。

**mint/burn（流动性）**：首笔流动性时注销 MINIMUM_LIQUIDITY（如 1000 wei）锁进零地址，防止「一击得手、余币套利」的精准攻击（首笔 LP 份额漂移问题）；后续 LP = min(按 reserve 比例)。`getReserves` 返回的 reserve 永远用内部快照，外部转账要先 `sync()` 才生效。

**swap（重入防线）**：伪代码顺序 = 读快照 → 校验 `amount0Out`/`amount1Out` 不能双零、不能超 reserve → **先转账后更新状态** → 更新 reserve → 检查 `x*y' >= k`（装完货的 k 不得小于装货前）→ 收尾事件。注意这是**反直觉**的：转账在状态更新之前，所以必须配合 CEI（校验-影响-交互）理解——这里的「影响」是 reserve 更新，「交互」是 ERC20 transfer 与可选 data 回调。**本阶段实现可以不支持 data 回调（闪电贷），在文档里声明即可（Non-Goal）**；若实现，必须正确修 reserve 再回调，否则就是经典重入漏洞。

**Router**：用户入口，承担「计算 + 撮合路径」：path 逐个 hop 转发（如 A→B→C 两次 swap）；`amountOutMin`/`amountAMin` 滑点保护（deadline 防过时交易）；token 直接拒绝、不碰 fee-on-transfer 代币（文档声明）。

**sweep 机制**：Pair 没有「取回误转资产」的函数（这是特性不是 bug——用户把代币直接转进 Pair 即沉淀，Donation 影响被 `sync()` 吸收，但也能被用来做闪电贷式 k 操纵，见常见坑）。Router 层的「清扫」思路：swap/移除流动性后若有找零残余（dust），sweep 回发起者，防止资金沉淀在 Router。**CEX 场景对应**：这个词在 Phase 4 的用法是冷热钱包归集（sweeping/collection，roadmap 术语表），同一个英语词，中心化场景是「地址清扫」，链上场景是「残余代币的返回与防沉淀」——面试被问 sweep，两处都能讲。

### 2.3 十进制精度处理

ERC-20 各自有 `decimals()`（18/6/8 不等）。恒定乘积公式在 Pair 内**不看 decimals**（纯比例），精度问题集中在 Router 与前端报价层：必须用 `WAD = 1e18` 定点数做报价换算（amountIn 归一化 → 报价 → 反归一化），禁止浮点运算（浮点比较不可靠 + gas 更贵）。Pair 内 reserve 用 `uint112` 上限（防溢出，溢出即漏洞）。

### 2.4 测试期望（W16 全覆盖）

| 输入/场景 | 预期行为 | 测试形态 |
|---|---|---|
| 首笔 addLiquidity | 铸造 `sqrt(a*b) - 1000`，1000 锁零地址 | 单元测试断言 LP 数与锁仓 |
| swap 精度 | amountOut 向下取整，且手续费 ≈ 入金 0.3% | 单元 + 边界 |
| 滑点保护 | 差价超 amountOutMin → revert "INSUFFICIENT_OUTPUT_AMOUNT" | 单元 + expectRevert |
| 双零输出 swap | revert INTERNAL/INVALID | 单元 |
| k 不变式 | 任意 swap 序列后 `x*y >= k_初始`（含手续费）/ 无手续费路径 `>=` | **invariant 测试**（W16 主菜） |
| 重入 | 恶意 token 回调时 reserve 已更新，二次 swap k 校验拒绝 | fork 测试用真实 meme token 或自写恶意 token |
| 大额/极端价格 | 1:1e18 价格、接近 uint112 上限的额度，无溢出 | fuzz：`testFuzz_swap_keepsK(uint112 a, uint112 b, uint256 in)` |
| 最小流动性 | 移除全部 LP 后池子仍剩余 MINIMUM_LIQUIDITY | 边界单元 |

## 3. W16 测试组织：单元 + fork + fuzz

- **单元测试**：三件套每函数每分支一条命名测试（`test_swap_RevertsWhen_ExceedReserve` 命名风格），用 vm.prank 伪造调用者、vm.expectRevert 断言。
- **fork 测试**：`forge test --fork-url $SEPOLIA_RPC_URL` 对真实 ETH/USDC 池子跑 swap 数学对照（验证你的公式在真实 reserve 下的结果与链上一致 ±1 wei）；CI 里不跑 fork（依赖网络），本地跑。
- **fuzz 测试**：`testFuzz_` 函数 + 参数约束 `vm.assume`，目标 ≥1000 轮（foundry.toml `fuzz.runs = 1000`，见脚手架）。**fuzz 的目标是「探测到边界 bug」而不是「跑绿」**：阴性结果（fuzz 找到 bug → 修复 → 回归）是验收 ① 的硬证据，记录进 docs/review.md。
- **invariant 测试**：`invariant_k_never_decreases()` 配合 handler 合约；foundry.toml `invariant` 段给定轮数与深度。

## 4. 安全关：Slither + 威胁模型文档

- Slither（https://github.com/crytic/slither）：`slither . --exclude-dependencies`，输出存 docs/security/。medium 及以上必须 0 条，或每条有「已修复」/「已评估 + 理由」。
- **威胁模型文档模板**（docs/security/threat-model.md，验收 ③）：攻击面表四行起步——

| 资产 | 攻击面 | 攻击路径 | 缓解（对应测试） |
|---|---|---|---|
| 池内资金 | 重入 | 恶意 token 回调二次换出 | k 校验 + CEI + 测试 |
| 报价 | 价格操纵 | 闪电贷式一次性拉高价格（donation 冲击） | 本阶段 Non-Goal（反馈给面试：ORACLE_NOT_AMM 理由） |
| 用户资产 | 精度损失 | 舍入方向错误 + 首笔流动性漂移 | floor 方向 + MINIMUM_LIQUIDITY + 测试 |
| 用户授权 | approve 钓鱼 | 恶意合约持 approve 额度转走 | Router/前端只请求最小授权 + 前端文档警示 |

- 常见坑排查：swap 后余额对不上 → 先查舍入方向与手续费公式；test 里 `assertEq` 差 1 wei → 用 `assertApproxEqAbs` 对照但理解误差来源；fork 测试时序不稳 → 固定 blockNumber；部署后调用 revert 无原因 → 用 `cast call` + `cast abi-decode` 定位自定义 error；`--fork-url` 泄漏密钥 → RPC URL 走环境变量。

## 5. 部署与验证流程（Sepolia，验收 ② 与 ⑤）

1. 环境：`SEPOLIA_RPC_URL`、`PRIVATE_KEY`（仅测试私钥）、`ETHERSCAN_API_KEY` 写 `.env`，**测试私钥绝不进 git（README 加 .gitignore 校验）**。
2. 部署：`forge script`（推荐，脚本输出可复现）或 `forge create` + `cast send`；记录所得 Factory/Pair 地址。
3. 源码验证：`forge verify-contract <addr> src/Pair.sol:Pair --chain 11155111 --verifier etherscan --etherscan-api-key $KEY`，Sepolia 浏览器出现 Verified 标志并截图。
4. 真实 swap：MetaMask 连接 Sepolia + 测试币 → 对池子 addLiquidity → swap 一笔，录屏三幕（部署 → 操作 → 浏览器余额/tx 变化），配套 demo/script.md 分镜。
5. **（可选加分）React 前端**：ethers/viem（或 wagmi）连接钱包走一次 swap，录屏；非必交付，时间不足先砍（关卡顺序：验收全绿 → 前端）。

## 6. 面试要点回扣（本阶段讲完后应能口述）

- DEX vs CEX 三差异表（本文第 0 节）30 秒版。
- 为什么恒定乘积、为什么 997/1000、为什么 floor 归池子。
- 为什么闪电贷能操纵 AMM 价格、交易所为什么不做链上预言机（与 P1 扫块中「确认数防重组」同源思想：可信源问题）。
- CEI 模式一句话：先检查（校验）→ 改自己的状态 → 再碰外部世界，顺序颠倒就是重入。