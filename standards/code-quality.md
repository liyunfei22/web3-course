# standards/code-quality.md — 代码规范（Go 与 Solidity/Foundry）

> 适用范围：P0-P2（Go 服务）、P3（Solidity/Foundry）、P4（Anchor，简则见第 3 节）。
> 验收联动：`standards/project-acceptance-10.md` 的 ①③⑦⑧ 条据此执行。
> 总原则：代码是给面试官看的产品，不是给自己看的草稿——但对「跑通优先」的课程学员，质量门槛只保证「可运行 + 可测试 + 可读」，不要求提前搞工程化炫技。

---

## 1. Go 服务规范（P0-P2 适用）

### 1.1 命名

- 包名：小写、单数、无下划线（`order`、`ledger`，不用 `order_service`）。
- 导出标识符：驼峰，首字母大写；未导出：小写驼峰。
- 缩写保持全大写：`ID`、`URL`、`HTTP`、`API`（禁止 `Id`、`Url`、`Api`）；缩写出现在词首时例外按惯例（`idempotencyKey` 不缩写）。
- 接口名：以 `-er` 结尾（`Matcher`、`Store`），接口小而专（1-2 个方法）。
- 常量与配置：可导出用全大写蛇形（`MaxOrderSizeBytes`）或按组定义；时间类单位写进名字（`timeout` 必须带单位注释或后缀）。
- 文件命名：`snake_case.go`；测试文件 `xxx_test.go` 与被测文件同目录。
- 注释：代码注释与 commit 用英文；导出符号必须有一行 Go doc 注释（以符号名开头）。

### 1.2 错误处理

- **所有 error 必须被处理或显式忽略**（`_ = f()` 加注释说明为什么忽略）；禁止吞错误。
- 向上传播时包装，保留错误链：`fmt.Errorf("load order %d: %w", id, err)`。禁止裸 `return err`（会丢上下文）。
- 判断错误类型用 `errors.Is` / `errors.As`，禁止字符串比较 error 内容。
- 业务错误定义为一个包内的错误变量或错误类型：`var ErrInsufficientBalance = errors.New("insufficient balance")`；HTTP 层统一映射状态码（400/403/409/500），映射表写在网关函数里。
- 不用 panic 处理常规错误；panic 只留给「启动期配置缺失」这类不可恢复场景。
- 日志里记录错误必须包含错误链（`%+v` 风格），并带 request-id 关联。

### 1.3 并发

- 同步原语：优先 channel + goroutine，其次 sync.Mutex；禁止裸 sync/atomic 面滥用（除非写性能敏感路径，如撮合）。
- channel 所有权单一方向：创建并关闭 channel 的 goroutine 是唯一发送方；接收方永不关闭。
- context.Context 贯穿所有 I/O 与请求处理，设置超时（`context.WithTimeout`）；HTTP/DB/Redis/Kafka 调用全部带 ctx。
- 全局可变状态只允许在启动期初始化（如配置、连接池）；业务状态写入明确（如撮合按 symbol 分片单线程——P2 冻结设计）。
- 所有测试在 `-race` 下必须通过。

### 1.4 结构与组织

- 标准目录骨架（脚手架给定）：`cmd/`（入口）、`internal/`（业务）、`internal/{handler,service,store,matcher,ledger}`；包依赖方向：handler → service → store，禁止反向与环。
- 配置：环境变量 + 启动时校验，不读散落配置文件；密钥只经环境变量注入，不进代码与 git。
- 每个服务一条启动路径：`cmd/server/main.go` 只做装配（读配置、建依赖、注册路由、优雅退出），业务逻辑不进 main。
- 接口隔离：store 层定义接口（便于单测 mock）；service 层依赖接口不依赖实现。

### 1.5 测试要求

- **表驱动（table-driven）测试**是默认形态：`tests := []struct{name, in, want}{...}` + `t.Run(name, ...)`。
- 每个包至少一个 `_test.go`；核心包（撮合/账务/状态机）必须有覆盖正常、边界、错误的用例。
- 单测必须隔离外部依赖：DB/Redis/Kafka 用接口 mock 或 stub；需要真中间件的集成测试用 `docker compose` 起的服务（见 scaffolds），网络依赖的测试打 `//go:build integration` 标签。
- 全部测试在 `go test -race ./...` 下运行。
- 覆盖率目标：全仓 ≥ 80%，关键包 ≥ 90%（`go test -cover ./...` 与 CI 门禁一致）。
- 纯逻辑（撮合匹配、状态机迁移、幂等键生成）必须有 `FuzzXxx` 函数，含不变式断言（如撮合后买卖量守恒、余额守恒）。
- 并发相关（重入、幂等、WAL 回放）必须写并发用例（多个 goroutine 同时命中），且 `-race` 通过。

### 1.6 Commit 消息规范（Go 与全项目通用）

- 格式：Conventional Commits：`<type>(<scope>): <subject>`，subject 英文、动词开头、≤ 72 字符；必要时正文写 why。
- type 限定：`feat` / `fix` / `docs` / `refactor` / `test` / `chore` / `ci`；scope 例：`matcher`、`ledger`、`ws-gateway`。
- 示例：`feat(ledger): add double-entry booking for freeze/unfreeze`；`fix(ws): resend snapshot when seq gap detected`。
- 一个 commit 一个逻辑变更；WIP 提交必须标注 `[wip]` 并在当日收尾前合并清理。
- 每阶段结束时的验收提交用 `chore: mark phase N checklist complete` 收尾，便于评审定位。

### 1.7 CI 流水线规范（Go 项目）

`.github/workflows/ci.yml` 固定四步（模板见 scaffolds/ci）：

1. lint：`gofmt -l .` 零输出 + `go vet ./...` + golangci-lint（若脚手架启用）。
2. test：`go test -race ./...`。
3. coverage：`go test -cover ./...`，用阈值脚本强制 ≥ 80%，低于即红。
4. build：`go build ./...`。

约束：`actions/setup-go` 的 go-version 与 go.mod 一致；依赖缓存开启；push 即触发；失败即红，不允许 allow-failure。

## 2. Solidity / Foundry 规范（P3 适用）

### 2.1 命名

- 合约/接口/库：PascalCase（`Pair`、`Factory`、`IERC20`）；文件 `Pair.sol` 与主合约同名。
- 函数/局部变量：camelCase；`private`/`internal` 函数下划线前缀（`_swap`）。
- 常量与 immutable：SCREAMING_SNAKE_CASE（`MINIMUM_LIQUIDITY`、`IMMUTABLE_FEE`）；immutable 变量名 `UPPER_CASE` 同时标注。
- 事件：过去式（`Deposited`、`Swap`）；事件参数命名与映射类型对应。
- 自定义错误：名字带 `Error` 后缀（`error InsufficientBalance();`），不用 require 长字符串（省 gas 且可读）。
- 状态变量：语义化名字配 NatSpec 注释。

### 2.2 安全模式（CEI 与相关）

- **CEI（checks-effects-interactions）是唯一指定顺序**：先校验，再改状态，最后做外部调用；对外部调用（转账、回调）保持「先记后动」。
- 重入防护：CEI 优先；若交互不可避免（如闪电贷场景），加 reentrancy guard；P3 范围内 CEI 足够，guard 写注释说明取舍。
- 数学：Solidity 0.8 内建溢出检查，不显式用 unchecked（除非在 gas 敏感且证明安全的上下文并注释）；整数除法向下取整要有意识地在注释写明（`amount * rate / 1e18` 的取整方向）。
- 权限：不用 `tx.origin`；所有权用 Ownable 或自定义 role；管理员操作必须带事件。
- 资金进出：外部调用返回布尔必须检查（`require(transfer(...))` 或 safeTransfer 风格），不能用裸转账忽略返回值。
- 错误处理用自定义 error/revert 而非只靠 require 字符串。

### 2.3 Foundry 测试组织

- 测试目录：合约根下 `test/`；文件名 `Xxx.t.sol`（如 `Pair.t.sol`），每个被测合约一个或多个测试文件。
- 测试合约继承 forge-std `Test`；`setUp()` 里部署上下文（部署 Factory/Pair/mock token）；辅助逻辑用 `internal` 函数。
- 前缀约定（foundry 按前缀匹配）：
  - `test_` 普通单测：`test_Swap_Succeeds`、`test_Swap_RevertsWhen_InsufficientBalance`
  - `testFuzz_` fuzz 测试：`testFuzz_Swap_Invariant`
  - `testFork_` fork 测试：`testFork_Sepolia_UniswapPair`（需 `--fork-url`）
- 写法要求：状态变更断言用 `assertEq/assertGt/assertLt`（forge-std）而非肉眼；事件断言 `vm.expectEmit`；时间控制 `vm.warp`/`vm.roll`；身份模拟 `vm.prank`；应得回退 `vm.expectRevert(MyError.selector)`（优先于字符串匹配）。
- 每笔外部余额变化都断言在谁头上（合约/调用者），资金守恒用 balance 前后对比。
- fuzz 用例测性质而非路径：P3 至少 2 个 fuzz（如 swap 后 `x*y ≥ k` 不变量、addLiquidity 后份额守恒）与 1 个不变量测试（`invariant_` 函数 + `foundry.toml` 的 invariant 配置）。

### 2.4 foundry.toml 配置（模板可完整复制）

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.24"
optimizer = true
optimizer_runs = 200

[fuzz]
runs = 1000          # CI 可提到 5000；本地至少 1000
seed = "0x1234..."   # 固定 seed 保证失败可复现（本地生成后写死）

[invariant]
runs = 256
depth = 128
```

- fork 测试：RPC URL 从 `.env` 读（`FORK_URL`），`.env` 进 `.gitignore`；`--fork-url $FORK_URL --fork-block-number <N>` 固定区块保证可复现。
- 依赖锁死：foundry 版本在 CI 中 `foundryup --version <X.Y.Z>` 固定；forge-std 用 git submodule 或固定 commit。

### 2.5 部署与验证

- 部署脚本放 `script/`：`Deploy.s.sol`（`DeployXxx` contract + `run()`）；私钥只从 `.env` 读（`--private-key $PRIVATE_KEY`），不入库、不进日志。
- 部署成功即验证：`forge verify-contract <address> <contract> --chain sepolia --etherscan-api-key $ETHERSCAN_KEY`，未验证不得收工（对应 10 条验收②）。
- 构造函数参数、验证输出（tx hash/地址）记录进 SPEC 与项目 README。

### 2.6 CI 流水线规范（Foundry 项目）

`.github/workflows/ci.yml` 步骤顺序：

1. `forge fmt --check`（格式门禁）。
2. `forge build`（编译，固定 solc 版本）。
3. `forge test`（含 fuzz/invariant，runs 用 foundry.toml 配置）。
4. `forge coverage` 或 lcov 模式，阈值 ≥ 85%（合约项目达标线高于 Go 服务；核心合约分支覆盖 100% 需在 README 说明）。

## 3. Solana / Anchor 简则（P4 适用）

- 命名：Rust snake_case；Anchor 使用 `#[program]` 模块、账户结构 PascalCase。
- 安全：所有 `signer` 约束显式；PDA 校验 `seeds` 与 `bump`；CPI 用 `invoke`/`invoke_signed` 并检查返回；金额运算用 `u64` 并防溢出（checked 运算）。
- 测试：`anchor test` 必须过；至少覆盖 happy path 与 1 条失败路径（错误约束）。
- 其余规范（commit / CI / README）沿用第 1.6、1.7 与验收标准。

## 4. 通用要求

- README 四节：快速开始（编号步骤）/ 架构（Mermaid）/ 验收勾选 / 演示链接（见 10 条验收④）。
- 密钥与助记词：任何环境下的 `.env`、日志、commit 都不允许出现真实密钥（警示：secrets 泄露=资金风险，P2/P4 关联真实测试币）。
- 禁用词检查：代码与文档不得出现黑名单词（CLAUDE.md 第 2 节）；术语按 CLAUDE.md 第 1 节。
- 所有规范命令可本地一键执行：`make lint` / `make test` / `make coverage`（Makefile 见 scaffolds），CI 与其保持一致。