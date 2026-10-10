# Tasks 01 — Phase 1 任务清单（第 1-4 周，14 项）

> 用法：每任务标注「预计时长（标准档参考）/ 前置 / 输出物」。每天投入项目块 2h（标准档），任务按周分布，单次超过 1 天的任务拆到连续天「项目块」执行。
> 主课练习（T-01~T-08、T-10、T-11）与项目任务（T-09、T-12~T-14，对应 `../projects/p0-shortlink/SPEC.md` M1-M4）。
> 练习规则：题目给全、**答案不给**；每题独立 commit；测试期望必须可判（`go test -race ./...`）。卡壳 30 分钟换路（`../daily-rhythm.md` 4.3）。

## 主课练习

### T-01 go.dev/tour 全通 + 环境基线（W1 / 预计 2h / 前置：Phase 0 完成 / 输出：docs/phase1-proof.md「tour」节）

1. 扫完 tour 全部模块（快速过，卡住标星回头）。
2. 建课程代码仓库 `web3-camp/phase1/`，`go mod init` 一个 module（建议名 `camp/phase1`），根目录一切 `go test ./...` 覆盖全部练习。
3. `go env` 记录 GOPATH / GOMODCACHE，`gofmt -l .` 与 `go vet ./...` 各跑一次确认无输出。
4. 输出物：tour 完成截图 + 环境命令输出存档。

**测试期望**：tour 全模块列表截图可见「completed」；`go vet` 与 `gofmt -l` 零输出。
**验收**：checklist #1；P0 依赖本任务（module 底线）。

### T-02 CLI 练习 #1~#5（W1 / 预计 4h / 前置：T-01 / 输出：5 个可运行 CLI + 各自测试）

题目（各写一个 `cmd/` 小程序，均带表驱动测试）：

1. **FizzBuzz**：1..100，3 的倍数输出 Fizz、5 的倍数 Buzz、15 的倍数 FizzBuzz、其余数字。测试期望：`fizzbuzz(15)==FizzBuzz`、`fizzbuzz(7)==7`，边界 0 与负数按「原样输出数字」处理（你在测试里写死这个语义）。
2. **base62 编码器**：`GenerateCode(id int64) (string, error)`，把整数编码为 62 进制字母表（0-9a-zA-Z），支持双向（`Decode`）。测试期望：编解码往返一致（`Decode(GenerateCode(x))==x`）；负数返回错误；每道测试至少 5 个 case。
3. **单词频率 TopK**：读入文本文件，输出频率最高的 K 个词（参数 `-k`，默认 10）。测试期望：对给定样例文件输出确定排序；大小写归一；标点剥离；`k > 词数` 时输出全部词不报错。
4. **JSON 学生表**：定义 `Student{ID, Name, Score}`（score 用 float64 演示精度问题并在 README 注释说明），支持 `-in` 读 JSON、`-out` 写 JSON。测试期望：序列化/反序列化往返一致；缺失字段得到零值而非报错；非法 JSON 返回 error 且错误信息含行号位置。
5. **错误链演练**：写 `ReadScore(path) (float64, error)`：打开文件 → 解析 JSON → 取 Score，每层都用 `fmt.Errorf("...: %w", err)` 包装，主程序用 `errors.Is`/`errors.As` 区分「文件不存在」与「解析失败」并输出不同提示。测试期望：构造三种失败（文件缺失/非法 JSON/缺字段），`errors.Is` 判定与错误链文本逐条断言。

**验收**：checklist #3（表驱动 ≥5 题全阶段合计）。

### T-03 CLI 练习 #6~#10（W1 / 预计 4h / 前置：T-02 / 输出：5 个可运行 CLI + 各自测试）

6. **猜数字**：`math/rand` 生成 1..100 目标，循环读输入，提示「大了/小了」，记录猜的次数，`q` 退出。测试期望：把「判定逻辑」抽成纯函数 `Judge(secret, guess) int`（-1/0/1）并表驱动测它；主循环不测。
7. **简易 HTTP 静态服务器**：`net/http` 服务当前目录文件，支持并发访问，404 时返回自定义 JSON `{"error":"not found"}`。测试期望：`httptest.NewServer` 下并发 20 个 goroutine 同时 GET 均 200；不存在路径返回 404 且 body 是 JSON。
8. **并发求和**：1 到 N 分 4 段并行求和，三种实现各写一个函数：goroutine+channel、goroutine+WaitGroup、串行。测试期望：三函数结果相等且等于 `N*(N+1)/2`；`go test -race ./...` 绿。
9. **倒计时器**：参数 `-s 5`（秒），每秒打印剩余秒数，结束后打印「done」。测试期望：抽出 `Countdown(total, tick, done)` 用假时钟表达（`time.After` 闭包注入），断言每次 tick 减 1；真时钟版本只做冒烟目测。
10. **请求计时中间件**：写一个 `func Timing(next http.Handler) http.Handler`，记录 method/path/耗时到日志（`log.Printf`），再包到练习 7 的服务器上。测试期望：对请求返回 200 且日志行含 `POST /... took=...`（用 `bytes.Buffer` 捕获日志断言）。

**验收**：checklist #2（15 题全绿）。

### T-04 CLI 练习 #11~#15（W1 / 预计 4h / 前置：T-03 / 输出：5 个可运行 CLI + 各自测试）

11. **LRU 缓存**：`NewLRU(cap int)`，`Get(key)` / `Put(key, value)`，容量满时淘汰最久未使用。测试期望：命中/未命中边界；容量满后淘汰顺序正确（访问刷新顺序）；并发安全版本用 RWMutex 并加并发用例（-race 绿）。
12. **hex/base64 手工 vs 标准库**：手写 hex 编码/解码与 encoding/hex 对比输出一致。测试期望：随机字节串往返一致（至少 100 组，可用 fuzz：`FuzzHexRoundtrip`）。
13. **带超时的 HTTP 抓取**：`client := &http.Client{}` 配合 `context.WithTimeout(ctx, 2*time.Second)` 抓取 URL，超时返回明确错误。测试期望：用 `httptest` 的 slow handler（sleep 3s）断言 2s 超时触发且错误类型用 `errors.Is(ctx.Err())` 可判定。
14. **CSV 导出工具**：`flag` 解析 `-in/-out/-delim`，把 JSON 数组转 CSV 写出。测试期望：正确表头；特殊字符（含逗号/引号/换行的字段）被正确引号转义；往返（CSV→JSON→CSV）一致。
15. **完整 CLI 工具**：仿照一个你常用的 CLI，实现 `-h` 帮助、子命令（如 `convert to-base62` / `convert from-base62`）、错误时 stdout 输出用法。测试期望：帮助文本非空且包含全部子命令名；非法参数退出码非 0；子命令主路径结果正确。

**验收**：checklist #3、#4。

### T-05 并发练习 #1~#5（W2 / 预计 4h / 前置：T-04 / 输出：5 个程序的测试 + race 记录）

题目（全部要求 `go test -race ./...` 绿；测试期望=语义 + 不变式，实现自选）：

1. **生产者-消费者**：1 个生产者发 100 条消息，3 个消费者轮询消费；生产者 close channel 后消费者自然退出。测试期望：每条消息恰好被消费一次（计数断言 = 100）；不出现死锁（测试带 3s 超时防挂死）。
2. **交替打印**：两个 goroutine 交替打印 A/B 共 10 轮，输出严格 `ABAB...`。测试期望：把输出收集进 buffer，断言长度为 20 且奇偶位字符符合 `A/B` 交替（**测试里不要 sleep 碰运气**——正确实现不依赖时序）。
3. **worker pool**：N=4 个 worker 处理 M=100 个任务（任务=模拟耗时函数），产出结果与串行一致。测试期望：结果集合与输入一一对应；完成后所有 worker 退出（WaitGroup 计数为 0 断言）；`pool` 不泄漏 goroutine（可选：用 `runtime.NumGoroutine` 前后对比 ≤ 容差）。
4. **fan-in 有序汇总**：1000 个数分 10 路并发平方，结果必须**按原序号**有序。测试期望：输出单调递增且与串行平方一致；-race 绿（hint：有序性要求每路带索引或按路收集，不要在结果里抢顺序）。
5. **信号量**：有界 channel（容量 3）控制同时运行任务 ≤3 个。测试期望：用 atomic 记录「同时在跑数」的峰值 ≤3；全部任务完成后计数 = 任务总数。

**验收**：checklist #5 部分、#6（race 记录至少覆盖 T-06 的 #8/#10）。

### T-06 并发练习 #6~#10（W2 / 预计 4h / 前置：T-05 / 输出：5 个程序的测试 + docs/race-notes.md）

6. **超时竞速**：任务 A（耗时 1s）与超时 200ms 用 `select` 竞速，超时先到即返回超时错误。测试期望：`deadline exceeded` 分支命中且任务 goroutine 仍在跑（不泄漏，可等它完成再退出）；不命中时正常返回结果。
7. **广播退出**：1 个控制 goroutine 通过 close 通知 10 个 worker 收摊。测试期望：close 后全部 worker 在 1s 内退出（WaitGroup 计数为 0）；close 前 worker 正常工作。
8. **并发计数器**：100 个 goroutine 各 +1000 次：① 裸 `count++`（先跑，**必须**先看到 -race 报错）② atomic ③ Mutex。测试期望：atomic 与 Mutex 版本恰为 100000；race 报错输出（原始失败证据）与修复后三版对照记录进 docs/race-notes.md。
9. **顺序打印 1-2-3**：N 个 goroutine 接力打印各自编号 N 轮（输出如 `1,2,3,1,2,3,…`）。测试期望：输出序列与轮次断言正确；无 sleep 实现。
10. **并发写 map 竞态复现**：多个 goroutine 并发写同一 `map[string]int` → -race 必须报错 → 修复（RWMutex 或 sync.Map）→ 再跑绿。测试期望：三条记录（原始报错文本/修复方式/修复后输出）入 docs/race-notes.md。

**验收**：checklist #5、#6。

### T-07 中间件小服务（W3 / 预计 3h / 前置：T-03 / 输出：可运行的小服务 + 测试）

用 `../scaffolds/go-module.md` 骨架写一个最小服务（业务随意，如「时间服务」）：request-id 中间件、zap 访问日志（含 request-id）、panic 恢复中间件（返回 500 JSON）、`/healthz`。测试期望：`httptest` 下 3 个用例——正常请求日志含 request-id；handler 内 panic 返回 500 且进程不退出；`/healthz` 200。`handler → service → store` 包依赖方向正确（`code-quality.md` 1.4）。

**验收**：checklist #9。

### T-08 隔离级别实测实验 + EXPLAIN（W3 / 预计 3h / 前置：Phase 0 D2 + T-07 / 输出：docs/isolation-lab.md）

面向「转账=冻结+扣减+记账」的最小实验：

1. 建表 `acct(id, balance DECIMAL(10,2))`，插 A=1000 / B=0。
2. **实验 1 脏读**：客户端 S1 `START TRANSACTION; UPDATE acct SET balance=900 WHERE id=1;`（不提交）；客户端 S2 在同一会话级别下 `SELECT balance`。分别在 `SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED` 与 `READ COMMITTED` 下各做一次，记录 S2 读到什么（900 vs 1000？）。
3. **实验 2 不可重复读 vs 可重复读**：S2 先 SELECT（=1000），S1 提交 `UPDATE id=1 SET balance=700`，S2 再 SELECT——分别在 READ COMMITTED / REPEATABLE READ 下记录第二次读到什么。
4. **实验 3 转账原子性**：模拟「A 扣 100 后进程被杀」：事务内只执行扣减不提交直接 ROLLBACK，观察 A 余额回滚为 1000——写进文档「如果没有事务会发生什么」。
5. EXPLAIN 练习：对短链的 `SELECT ... WHERE code=?` 建索引前后各跑一次 `EXPLAIN`，记录 type 从 ALL → ref 的变化；慢查询日志开启并制造一条慢查询（`SELECT * FROM acct` 大表无索引演练可不做，用 `long_query_time=0.5` 记录一条真实查询）。
测试期望：四组观察（实验 1 两种级别 × 实验 2 两种级别）结果明确记录，文档含每组的「读到/未读到」结论；EXPLAIN 两份输出存档（`docs/sql-plan.md`）。

**验收**：checklist #7、#10。

### T-10 Redis 三连 demo（W4 / 预计 3h / 前置：Phase 0 D2 + T-08 / 输出：3 个可运行 demo）

1. **旁路缓存**：读路径「查 Redis → miss → 查 MySQL → 回填」，写路径「先写库 → 删缓存」；用两个 curl 观测 cache hit（Redis `GET` 有值）。测试期望：第二次同 key 访问命中（demo 里打印 hit/miss 标记）；删 key 后回源重建。
2. **SETNX 分布式锁**：两个「进程」（两个 goroutine 模拟 N 个实例）抢同 key 临界区，`SET key val NX EX 10`，释放时 Lua 校验持有者。测试期望：临界区并发保护生效（counter 正确）；「锁过期仍持有」的失效案例写成注释 + ADR 素材。
3. **持久化选型**：分别以 `--appendonly yes`（AOF everysec）与 RDB 默认跑一遍：写入数据、`docker compose restart redis`、确认重启后数据存在与否，记录两种模式恢复差异于 README。
测试期望：三 demo 各有可运行产物与一分钟口头解释（面试可复述）。

**验收**：checklist #11、#12。

### T-11 Dockerfile + compose + CI（W4 / 预计 3h / 前置：T-10 / 输出：P0 的 Dockerfile + compose + 首条四步流水线）

1. 给 P0 写多阶段 Dockerfile（build → runtime），启动用户非 root，`docker build` 成功且镜像 < 100MB（记录实际大小）。测试期望：`docker run` 容器内 `/healthz` 200；P0 项目根复制 `../scaffolds/docker-compose.md` 正式版 compose（.env 里设库名/密码，注意与 Makefile 一致），`docker compose up` 起全栈（API + MySQL + Redis），服务间用服务名连通。
2. CI 直接复用 `../scaffolds/ci-github-actions.md` 模板（四步流水线：lint / test -race / coverage ≥80% 阈值脚本 / build，只改仓库名与 Go 版本），Makefile 目标与其一致（见 `../scaffolds/go-module.md` 第 11 节）。测试期望：push 后流水线全绿；故意把一个测试改红再改绿，记录一次「失败→修复→绿」过程（允许计入最近 10 次）。
3. `.env.example` 提交（占位符）、`.env` 进 `.gitignore`。
测试期望：README「快速开始」与 CI 步骤一一对应。

**验收**：checklist #13、#14、#15。

## 项目任务（P0，详见 `../projects/p0-shortlink/SPEC.md`）

### T-09 P0-M1 模型与 API（W3 中后段 / 预计 2-3 天项目块 / 前置：T-08 / 输出：可创建/可跳转的短链 + 退出条件证据）

按 SPEC M1 执行：迁移建表（`links`/`visits`，含唯一约束与索引）、`POST /api/v1/links`（校验 + 幂等 client_token + base62 短码，直接复用 T-02 的产物）、`GET /api/v1/links/:code` 302 跳转、统一错误模型。退出条件见 SPEC 第 7 节 M1（5 条）。

### T-12 P0-M2 Redis 缓存与计数（W4 前段 / 预计 2 天项目块 / 前置：T-09 + T-10 / 输出：缓存命中 + 计数落库 + 过期 410）

按 SPEC M2 执行：旁路缓存改造跳转链路、`INCR` 计数 + 定时批量落库（≤60s 一致）、过期码 410、删除短链后缓存失效。SQL 注入与 XSS 顺手在 M3 前修完（威胁模型条目）。

### T-13 P0-M3 管理页与 CI（W4 中段 / 预计 2 天项目块 / 前置：T-12 + T-11 / 输出：React 管理页 + 四步流水线绿标）

React 管理页：创建表单、列表（含点击数与过期时间）、删除；后端管理接口用 `ADMIN_TOKEN` header 保护（不进 git）。CI 四步与覆盖率门禁生效。README 补 API 文档（或 docs/api.md）。

### T-14 P0-M4 验收与复盘（W4 后段 / 预计 2 天项目块 / 前置：T-13 / 输出：验收表 + 录屏 + 文档四件 + QA 留痕）

按 SPEC M4 执行：10 条验收自测 → 补证据 → k6 冒烟（记录 P50/P99/错误率）→ 录屏三幕 + script.md → docs/review.md（≥3 坑 ≥2 取舍，与 journal 交叉验证）→ README 四节 + Mermaid → SPEC 第 8 节勾选版内嵌 README → `QA/review-log.md` 记录 → 阶段收尾 commit：`chore: mark phase 1 checklist complete`。

**验收**：checklist #16、#17、#18；P0 达标线（SPEC 第 8 节）≥8 条。

## 每周收尾（不算任务数，写入复盘块）

- 每周六：本周 checklist 证据补齐（截图/输出）；每周日：周复盘 + 下周讲义开头。
- 每日：三行日志 + commit（`../daily-rhythm.md` 第 5 节），英语/八股 30min 不停。