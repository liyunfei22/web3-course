# scaffolds/foundry-project.md — Foundry 工程骨架（P3 与 Phase 5 通用）

> 用途：Phase 5（W15-W16）与 P3 DEX Clone 的 Foundry 工程基线。本文件属于「脚手架类」，按 `../CLAUDE.md` 3.2 例外可完整复制；其中测试文件只是**装配与示例**，不承载任何 P3 业务逻辑。
> 关联：P3 规格见 `../projects/p3-dex-clone/SPEC.md`；本骨架与 specs 的 foundry.toml 要求一致（fuzz runs、evm 版本、coverage 门禁）。

## 1. 目录布局（标准布局，严禁改名）

```text
p3-dex-clone/
├── foundry.toml                # 配置（本文件第 2 节可复制）
├── .env                       # 本地私有，不入 git（RPC/私钥/API key）
├── .env.example               # 入 git，占位符
├── .gitignore                 # .env, broadcast/, cache/, out/
├── src/
│   ├── Factory.sol            # 业务合约
│   ├── Pair.sol
│   ├── Router.sol
│   └── interfaces/            # IERC20.sol 等自写接口
├── test/
│   ├── unit/                  # 按合约分组的普通测试
│   ├── fork/                  # --fork-url 依赖网络的测试
│   └── invariant/             # invariant 测试 + handler
├── script/
│   └── Deploy.s.sol           # forge script 部署（可复现）
├── lib/                       # forge-std 固定 tag（第 6 节）
└── docs/                      # 部署/安全/复盘/ADR（见 P3 SPEC 证据位）
```

## 2. foundry.toml（完整可复制）

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
test = "test"
script = "script"
solc = "0.8.26"
optimizer = true
optimizer_runs = 200
evm_version = "paris"          # 本课程不依赖 Cancun 特性，锁定 paris 保证 fork 一致性
via_ir = false

[profile.default.fuzz]
runs = 1000                   # 验收①要求 ≥1000 轮
max_test_rejects = 65536

[profile.default.invariant]
runs = 256                    # 每 run 内多步调用序列
depth = 16
fail_on_revert = false        # handler 内预期 revert 不判失败
call_override = false

[profile.ci]
# CI 用：更少轮数，快速门禁；fork 测试不在此 profile 跑（依赖网络）
verbosity = 1
evm_version = "paris"

[fuzz]
# 顶层段对默认 profile 生效
runs = 1000

[fmt]
line_length = 120
tab_width = 4
```

覆盖率的 RPC 与私钥全部走环境变量：

```bash
# .env.example（占位符，真实值只放 .env 且 gitignore）
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/xxxx
ETHERSCAN_API_KEY=xxxx
PRIVATE_KEY=0x0000...           # 仅测试私钥，绝不用于任何有真实资金的钱包
```

## 3. forge-std 引入方式（固定 tag，保证可复现）

```bash
forge install foundry-rs/forge-std@v1.9.0 --no-commit
# 若已装其他版本：编辑 lib/forge-std 的 .git 记录或 rm -rf lib/forge-std && forge install ... 重装
# 提交 note：lib/ 一并提交（小仓库）或写 git submodule；课程采用「lib/ 入 git」以保可复现
```

## 4. 测试基座（Test.sol 常用断言与 helpers，装配级可复制）

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console} from "forge-std/Test.sol";

/// @notice 基座测试合约：P3 所有 test/*.sol 继承本基座，汇总常用 helpers（供复制，非业务）
contract BaseTest is Test {
    // ——— 常用断言（from forge-std/Test.sol，常用清单）———
    // assertEq(a, b, "msg"); assertGt(a, b); assertLt(a, b);
    // assertApproxEqAbs(a, b, maxDelta, "msg");
    // assertTrue(cond, "msg"); assertGt 等对 uint/int/address/bytes32 有重载
    // fail("msg")：显式失败；skip(bool)：条件跳过

    // ——— 常用作弊码（vm，列表见 Foundry Book「Cheatcodes」）———
    // vm.prank(addr)           下次调用伪装 msg.sender
    // vm.startPrank(addr, addr) 连续伪装 sender+origin，vm.stopPrank() 结束
    // vm.expectRevert(bytes4)  断言下个调用以指定 error 回退
    // vm.deal(addr, amt); vm.store(addr, slot, val); vm.warp(ts) / vm.roll(blk)
    // vm.assume(cond)          fuzz 参数过滤（拒绝非零/边界值组合）
    // vm.createSelectFork(urlEnvVarOrUrl, blockNumber)  fork 测试开关
    // vm.label(addr, "name");  vm.recordLogs() / vm.getRecordedLogs() 事件级断言
    // ——— 版权说明：forge-std 是脚手架依赖，本基座只封装 helpers，不含 P3 业务 ———
}
```

规则：测试命名统一 `test<函数>_<分支>`（如 `test_swap_RevertsWhen_ExceedReserve`）；状态变化断言优先用事件级断言（recordLogs）而非肉眼检查。

## 5. fuzz 与 fork 配置示例（含分叉 URL 环境变量）

```solidity
// test/fork/PairForkTest.sol —— 装配骨架（示例：对真实池子做数值对照）
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseTest} from "../BaseTest.sol";

contract PairForkTest is BaseTest {
    // 环境变量化 RPC：本地 .env 提供，CI 不跑本文件（见第 6 节 workflow）
    string SEPOLIA_RPC = vm.envString("SEPOLIA_RPC_URL");
    uint256 FORK_BLOCK = 6_500_000; // 固定高度，保证结果可对比

    function setUp() public {
        vm.createSelectFork(SEPOLIA_RPC, FORK_BLOCK);
        // …… 读取真实已部署 Pair 的 reserves，与本地实现输出对照 ≤1 wei
    }

    function testFuzz_ReserveComparison(uint256 amountIn) public {
        vm.assume(amountIn > 0 && amountIn < 1e24);
        // ……（业务断言由学员写，本文件只示装配）
    }
}
```

```bash
# 本地跑 fork（CI 不跑）：
# forge test --match-contract PairForkTest --fork-url $SEPOLIA_RPC_URL -vvv
```

```solidity
// test/invariant/KInvariant.t.sol —— invariant 装配骨架
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import {BaseTest} from "../BaseTest.sol";

contract KInvariant is BaseTest {
    // 目标函数（如 unchecked_swap(amountAtoB, amountBtoA)）对 handler 合约随机调用，
    // 之后断言 invariant_k_never_decreases()。handler 与断言由学员按 P3 自写。
}
```

## 6. CI 中跑 forge 的 workflow 片段（.github/workflows/ci.yml 可复制）

```yaml
name: forge-ci
on: [push, pull_request]

env:
  FOUNDRY_PROFILE: ci

jobs:
  forge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Foundry (pinned)
        uses: foundry-rs/foundry-toolchain@v1
        with:
          version: "nightly-2026-09-01"   # 固定日期版本，与本地一致；stable tag 亦可
      - name: Install deps
        run: forge install --no-commit && forge update
      - name: Format
        run: forge fmt --check
      - name: Build
        run: forge build
      - name: Test + coverage gate
        run: |
          forge coverage --report summary > coverage.txt
          cat coverage.txt
          # 门禁：全仓 ≥80%（数字与 README 验收②一致）
          grep -E "Total\s+\|" coverage.txt | awk -F'|' '{gsub(/ /,"",$4); if ($4 < 80) {print "coverage below 80: "$4; exit 1}}'
```

要点：`FOUNDRY_PROFILE=ci` 用第 2 节 ci profile；fork 测试（依赖 `SEPOLIA_RPC_URL`）放 `test/fork/`，默认 `forge test` 用 `--no-match-contract ForkTest` 白名单排除或由 `[profile.ci]` 环境差异跳过，fork 只本地跑并在 README 注明。

## 7. 部署脚本骨架（forge script 可复现部署）

```solidity
// script/Deploy.s.sol —— 骨架（部署顺序与参数由学员补全）
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import {Script, console} from "forge-std/Script.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY"); // 只读 .env，绝不硬编码
        vm.startBroadcast(pk);
        // …… 部署 Factory → 经 createPair 得到 Pair；地址 console 打印留档
        vm.stopBroadcast();
    }
}
```

```bash
# 部署 + 验证一条链（占位示例，RPC/API key 一律环境变量）
# forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL --broadcast
# forge verify-contract <addr> src/Pair.sol:Pair --chain 11155111 \
#   --verifier etherscan --etherscan-api-key $ETHERSCAN_API_KEY
```

## 8. 自检清单（用本骨架前扫一遍）

- `forge test`、`forge fmt --check`、`forge build`、`forge coverage` 四条命令本地全绿
- `.gitignore` 含 `.env`、`broadcast/`、`cache/`、`out/`；`.env.example` 入 git
- forge-std 与 CI 使用的 Foundry 版本均为固定 tag（可重复）；fork 测试不随 CI 默认跑
- 部署脚本可用 `docs/deploy.md` 步骤从零恢复（日志 + 的地址可复现）