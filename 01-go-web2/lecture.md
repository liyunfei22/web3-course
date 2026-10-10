# Lecture 01 — Go 与 Web2 后端补课（Phase 1，第 1-4 周）

> 阶段元信息：Phase 1 / 周次：第 1-4 周 / 前置：Phase 0 完成（环境/账号/协议）/ 产出：**P0 短链服务**（SPEC 见 `../projects/p0-shortlink/SPEC.md`）+ 25 道练习（15 CLI + 10 并发）+ JS→Go 迁移对照表 + 隔离级别实验文档
> 配套：`tasks.md`（任务含练习完整题目）、`checklist.md`、`resources.md`；红线阶段（roadmap 第 4 节：**不可砍**），每天沿用 `../daily-rhythm.md` 五块节奏。

## 0. 阶段总览（四周边界）

- **W1**：能用 Go 写「带测试的命令行程序」；脑中有一张「一次 HTTP 请求全链路」图。
- **W2**：能讲清 goroutine / channel / context，写出 `-race` 全绿的并发代码。
- **W3**：能写 REST API + 建表 + 事务，能解释 ACID 为什么是账务的第一原则。
- **W4**：Redis 缓存、Docker 化、CI 流水线；**P0 短链收尾到 10 条验收 ≥ 8 条**。

项目节奏：P0 从第 3 周开始，嵌入 W3-W4（2 周），M1-M4 见 SPEC 第 7 节。练习全部独立 commit（`feat(cli): xxx`）。每日复盘日志与八股卡不停。

---

## W1 Go 语法与工程化（第 1 周）

### 1.1 心智翻转课：一次 HTTP 请求全链路

**直觉**：你以前的前端代码活在浏览器进程里，事件循环、DOM、fetch 是整个世界；后端世界完全不同——你的代码住在一个永远在运行的进程里，被网络上的陌生人调用。先建立链路，再学零件。

**全链路**：用户点按钮 → `fetch` → **DNS 解析**域名 → **TCP 三次握手** → **TLS 握手**（HTTPS）→ 请求包到服务器网卡 → 内核协议栈 → 你的 Go 进程：① **路由**按 URL 匹配 handler → ② **中间件链**（request-id / 日志 / 鉴权 / 限流，洋葱式从外到内）→ ③ **handler 业务**：校验参数 → 调 service 层 → 调 store 层 → SQL 到 MySQL（命中项先查 Redis 缓存）→ 拼 JSON 响应 → 沿原路返回 → 浏览器渲染。

**关键问题：服务器的「等待」**。浏览器等响应时，服务器进程在等数据库 I/O、等下游服务——这种「我等他，他又等她」就是并发模型、连接池、队列存在的全部理由。前端工程师最常漏掉的心智：**服务器的并发能力由「阻塞点」决定，不是由「请求数」决定**。

**接口签名视角**：`net/http` 的 handler 签名 `func(w http.ResponseWriter, r *http.Request)` —— 服务器本质是「一个函数接一个请求」，框架其余全是模式（中间件、路由、错误处理）。

**交易所场景对应**：下单按钮 → `POST /api/orders` → 网关限流 → 订单服务（校验 + 幂等键）→ MySQL 事务扣冻结 → Kafka 发事件 → 撮合引擎。这张链路图从 W1 一直用到旗舰 P2，每一环都是本课程的章节。

**坑**：把「数据库连接」当请求的一部分每次新建——连接是共享池资源，池内复用。

### 1.2 tour 与 Effective Go 指引

- **go.dev/tour 全通**（1.5-2h 快速扫）：目标不是背语法而是「见过面」；interface、concurrency 两节卡住是正常的，标星，W2 回炉。全通后截图存 `docs/phase1-proof.md`。
- **Effective Go 精读**（每周 2 章，边写边读）：W1 读 formatting / naming / errors / comments；W2 读 **concurrency** / data；W3-4 读 methods / interfaces / initialization。每章产出：3 条「我以前会写错」的规则，进你的八股卡（产出型笔记，禁摘抄）。

### 1.3 Go 语法核心（tour 讲语法的细节，这里讲原理）

- **变量与零值**：`var` / `:=`，类型静态。**零值语义**：声明即初始化（int→0，string→""，nil 指针）——JS 的 `undefined` 在 Go 是编译错误，这是坑也是福。
- **错误处理哲学（error 而非 exception）**：error 是**普通值**，函数返回 `(T, error)`，调用方必须处理；panic 只留给「程序已损坏」的场景（如启动配置缺失）。传播用包装保留错误链：`fmt.Errorf("load order %d: %w", id, err)`；判定用 `errors.Is` / `errors.As`，禁止字符串比较。**为什么**：异常假定「上层知道怎么处理」，而网络服务里大多数错误要「带着上下文转交」，错误链就是上下文。交易所场景对应：余额不足是 `ErrInsufficientBalance`，handler 层映射 400/403——**这不是 panic**。
- **struct 与方法**：struct 聚合数据，方法挂 receiver（**值 vs 指针 receiver** 是高频面试题：要修改/大结构 → 指针）；无继承，组合 + 嵌入。
- **表驱动测试**：`tests := []struct{name, in, want}` + `t.Run(name, ...)` 逐例跑。为什么：每个 case 是命名文档，面试「测试怎么组织的」直接答它；`code-quality.md` 1.5 规定它为默认形态。
- **工程化三件套**：`gofmt`（格式，无输出=过）、`go vet`（静态检查）、`go test ./...`。依赖走 `go mod`：`go.mod` 记录版本、`go.sum` 锁哈希、`GOPROXY`（国内可用 goproxy.cn）。CI 里三件套就是四步流水线（`../standards/code-quality.md` 1.7）。

**关键接口签名（本阶段每天在写的形状）**：
```go
func Add(a, b int) int
func GenerateCode(id int64) (string, error)          // base62 短码
func (s *Shortener) Create(ctx context.Context, req CreateReq) (*Link, error)
type Store interface { Save(ctx context.Context, l *Link) error }
```

### 1.4 JS → Go 心智迁移对照表（本阶段最重要的一张表）

**一句话总结**：JS 的并发是「模拟」的，Go 的并发是「真实」的；其余差异一周内就习惯。逐行构建自己的个人版（≥12 行，写进 `docs/js-go-map.md`，禁抄表）。

| 前端/JS 概念 | Go 对应 | 关键差异（坑） |
|---|---|---|
| Promise / async-await | goroutine + channel | **channel 不是 Promise**：是数据管道，无 then/catch，用 `<-` 阻塞等待 |
| 事件循环（单线程） | GMP 调度器（M:N） | JS 一个线程模拟并发；Go 多线程真并发，可多核并行 |
| EventEmitter（on/emit） | 自封装 channel fan-out | Go 无内置订阅器；广播 = close channel（W2 并发练习 7） |
| setTimeout / setInterval | time.After / time.Ticker | 语义近似；Ticker 用完要 Stop 释放 |
| 闭包捕获变量 | 闭包（函数值） | 循环变量捕获坑：Go ≤1.21 要 `x := x` 再闭包；参数默认值语义拷贝 |
| Array（动态数组） | slice | slice 共享底层数组，`append` 可能改到「别人」的数据（别名坑） |
| TS interface（结构类型） | Go interface | **鸭子类型**：隐式实现，无需 `implements`；空接口 ≈ any |
| null / undefined | 零值（zero value） | 声明即初始化；JS 的未定义在 Go 是编译错误 |
| throw / try-catch | `(T, error)` + errors.Is/As | error 是值必须处理；传播用 `%w` 包装保留链 |
| class / 继承 | struct + 方法（receiver） | 无继承；组合 + 嵌入 + 接口划分行为 |
| TS 泛型 | Go 泛型（1.18+） | 可用但节制；容器行为已内建 |
| npm / node_modules | go mod / go.sum | 依赖哈希锁死；Go 生态库少而稳 |
| jest / vitest | go test 表驱动 | 无 describe/it 层级；`t.Run` 子用例，用例名即文档 |
| console.log | 结构化日志（zap/slog） | 禁止裸打印；带 request-id 与错误链 |
| dotenv (.env) | 环境变量 + viper | 密钥只走 env；配置启动时校验 |
| JSON.stringify/parse | encoding/json（struct tag） | 字段名/时区/精度显式约定；金额用 string 传输 |

### 1.5 15 道 CLI 练习清单（题目全量描述在 tasks.md T-02~T-04，不给答案）

1. FizzBuzz（强制表驱动测试）　2. base62 编码器（短码核心算法）　3. 单词频率 TopK（读文件 + sort）　4. JSON 学生表（struct tag 教学）　5. 错误链演练（读文件→解析→业务错误包装）　6. 猜数字（rand + 循环）　7. 简易 HTTP 静态服务器（并发处理）　8. 并发求和（goroutine/channel/WaitGroup 三写法对比）　9. 倒计时器（time.After + select）　10. 请求计时中间件（方法/路径/耗时）　11. LRU 缓存（map + 链表）　12. hex/base64 手工 vs 标准库对比　13. 带超时的 HTTP 抓取（context）　14. CSV 导出工具（encoding/csv + flag）　15. 完整 CLI 工具（flag/子命令/帮助文本，仿照一个你常用的 CLI）。

**合格线**：15 题全有 `go test`，其中 ≥5 题表驱动；每题一个 commit（`feat(cli): ...`）。**交易所场景对应**：练习 2 的 base62 就是 P0 短码与「充值地址派生」（Phase 3）共同的味道——「把一个数编码成对外安全字符串」。

### 1.6 W1 自检

tour 全通截图、15 题全绿、个人版迁移表 ≥12 行（`docs/js-go-map.md`）、Effective Go 第 1-2 章笔记。对照 `checklist.md` #1-#4。

---

## W2 Go 并发与调度（第 2 周）

### 2.1 模型先于语法：goroutine vs Promise

**直觉**：Promise 把「未来的值」挂到回调上，线程数没变；**goroutine 是轻量线程**（栈 2KB 起、可增长），一个进程内成千上万毫无压力。**channel 是 goroutine 之间的数据管道**：`ch <- v` 发送、`v := <-ch` 接收；无缓冲 channel 收发同步（发=等到有人收），有缓冲 channel 是队列。**channel 不是 Promise**：没有 then/catch、没有「完成回调」，它就是数据流。`select`：同时等多个 channel，先到先处理（加 `default` 变非阻塞轮询）。**context**：给 I/O 传超时与取消的通行证——每个请求开头 `context.WithTimeout(ctx, ...)`，父取消子自动取消，DB/Redis/HTTP 调用全部带 ctx（`code-quality.md` 1.3 强制）。

### 2.2 sync 包与并发模式

- **Mutex / RWMutex**：写互斥 / 读写分离（读多写少用 RWMutex）；**WaitGroup**：等待一组 goroutine 收摊（`Add`/`Done`/`Wait` 三角色）；**atomic**：只适合计数类（`AddInt64`），不是通用同步。
- **worker pool**：N 个 worker goroutine 从 jobs channel 取活，干完把结果发 results channel —— 限流与批量处理的通用骨架。
- **fan-out / fan-in**：任务拆给多个 goroutine，结果汇入一个 channel；收摊用 WaitGroup + 由发送方 close。
- **broadcast**：关闭 channel = 通知所有接收者「结束了」——Go 没有内置 EventEmitter，这就是订阅器的实现方式。
- **并发安全 Map 场景**：原生 `map` **不是并发安全的**；单实例内读多写少用 RWMutex 包一层，写一次读多次的高频缓存用 `sync.Map`。**交易所映射**：内存 Map 只在单实例内安全，跨实例的状态必须进 MySQL/Redis——这是后面 Phase 2 分布式章节的伏笔；同用户并发下单的正确性靠数据库行锁/唯一约束兜底，不是内存锁。

### 2.3 go test -race 与 Go 内存模型

- **-race**：编译期插桩检测数据竞争。**所有测试必须以 `go test -race ./...` 为默认命令**（code-quality 1.5）；线上永不跑 race（性能开销）。规则一句话：不要不加同步地跨 goroutine 读写同一变量。
- **Go 内存模型**（`resources.md` 链接 go.dev/ref/mem）：核心是 **happens-before**——channel 收发、Mutex 加解锁、WaitGroup Done/Wait 各自构成 happens-before 边；有同步才保证「看到别处的最新值」，否则是未定义行为。只需读第 1-3 节 + 同步机制列表，W2 后回补。
- **GMP 概览（面试必考，必建八股卡）**：G = goroutine，M = 操作系统线程，P = 处理器（执行上下文，数量 = GOMAXPROCS）。M 绑定 P，可运行的 G 排队在 P 上；某个 G 遇到**阻塞式系统调用**时，对应的 M 让出 P、调度器换一个 M 接续执行——「一个 goroutine 阻塞，其他照跑」的机制就是这一句。一句话版：**Go 用 M:N 调度把成千上万的协程映射到少量内核线程**。

### 2.4 10 道并发练习题清单（题目全量描述在 tasks.md T-05~T-06，不给答案）

1. 生产者-消费者（无缓冲 channel，验证关闭与接收语义）　2. 交替打印 A/B 十轮（两 goroutine 用 channel 互相喊话）　3. worker pool（N=4 处理 M=100 任务，统计耗时）　4. fan-in 有序汇总（1000 个数并发平方后按序归并）　5. 信号量（有界 channel 控制同时运行 ≤3 个任务）　6. 超时竞速（ctx + select：任务 vs 超时谁先到）　7. 广播退出（close channel 通知 N 个 worker 收摊）　8. 并发计数器（atomic vs Mutex 两种实现对比，-race 验证）　9. 顺序打印 1-2-3（N 个 goroutine 接力 + N-1 个 channel）　10. 复现竞态并修复（多 goroutine 并发写 map → race 报错 → 修复 → 再跑绿）。

**测试期望通例**：全部 `go test -race ./...` 绿色；#8、#10 要求先看到 race 报错再修复，把「现象→根因→解法」写进 `docs/race-notes.md`（产出型笔记 + 面试故事素材）。

---

## W3 HTTP/REST + MySQL（第 3 周，P0 开跑）

### 3.1 net/http 与中间件链

**直觉**：中间件 = 处理请求的洋葱。请求从外到内穿过每一层，响应从内到外穿回来；每层只做一件事。典型中间件：request-id 注入、访问日志、panic 恢复、鉴权、限流。
**关键接口**：`func(next http.Handler) http.Handler` —— 中间件就是「包一层」；Gin 是课程选型（路由/参数绑定/JSON 更顺手），脚手架见 `../scaffolds/go-module.md`。路径参数：`/api/v1/links/:code`。
**交易所场景对应**：网关限流（令牌桶，Phase 2 正式讲）就是中间件链里的一层——「不作为」比「功能」更考验工程判断。

### 3.2 REST 设计

- **资源 = 名词复数**：`/api/v1/links`；动作别进路径（`POST /links` 创建，不是 `/create-link`）。
- **状态码语义**：200/201/400/401/404/409/422/429/500——先写死你自己的「业务错误 → 状态码」映射表（脚手架 `internal/errs` 包给了模板）。
- **分页**：`?cursor&limit`（游标）或 `?page&size`（页码），二选一写进 README。
- **错误模型**：统一错误 JSON `{code, message, request_id}` —— 前端接入时最省事的形状。
- **幂等动词**：POST 非幂等（重发双写）、PUT 幂等（整个替换）、DELETE 幂等（删不存在的也成功）。创建类接口的防重靠**业务幂等键 + 唯一约束**（P0 的 `client_token` 就是它）。**交易所映射**：下单接口按 `clientOrderId` 幂等、充值入账按 `(txHash, logIndex)` 幂等——同一个模式从 P0 练到 P2（术语见 `../CLAUDE.md` 第 1 节）。

### 3.3 MySQL 从零（本阶段最大的一块）

- **建表 CRUD**：DDL（CREATE/ALTER）与 DML（INSERT/UPDATE/DELETE/SELECT）。表设计三问：主键（自增 vs 业务主键）、唯一约束（**幂等的最底层保障**）、类型（**金额用 DECIMAL 绝不用 float**——二进制浮点无法精确表示 0.1，账务不许近似；这是面试送命题）。
- **ACID**：原子性（全成或全不成）/ 一致性（约束不被破坏）/ 隔离性（并发事务互不干扰）/ 持久性（提交即不丢）。直觉：**「转账 = 冻结 + 扣减 + 记账」必须在一个事务里**，中途崩溃才不会出现「扣了没记」或「记了没扣」。交易所映射：这就是三栏账户（冻结/可用/总额）一致性的地基——P0 的「创建短链 + 计数」是最小号版本，P2 的账务系统是完整版。
- **隔离级别与三现象**：脏读（读到未提交）、不可重复读（同事务两次读不同，别人 update 提交了）、幻读（同条件两次查行数不同，别人 insert 了）。MySQL InnoDB 默认 REPEATABLE READ；READ COMMITTED + 行锁也是常见生产组合——**不要死记，用实验说话**（必做实验见 tasks.md T-08：两个客户端实测脏读在两种级别下的表现，四组观察记录）。
- **B+ 树索引**：为什么快——磁盘按页读且随机读贵，B+ 树扇出大、树高 3-4 层，十亿行表也只要几次页访问；为什么不能全建——每个索引一份副本 + 写放大（写一次要维护多棵树）。
- **EXPLAIN 与慢查询**：看 `type`（ALL=全表扫，红灯；ref/range=走索引）、`rows` 估算、`Extra` 里的 `Using filesort`（红灯）。慢查询日志：`long_query_time=1` 开启，观察学习。

**短链 Schema 设计要点（P0-M1 素材，完整建表在 SPEC 第 6 节）**：`links(code UNIQUE, url, expires_at NULL, client_token UNIQUE NULL, created_at)` + `visits(link_id 索引)`；超长 URL 用 TEXT；「永不过期」用 `expires_at IS NULL` 表达，不要用 2038 极限值。

### 3.4 W3 自检

隔离实验四组观察存档（`docs/isolation-lab.md`）、中间件小服务 `/healthz` 200、EXPLAIN 两份存档、**P0-M1 退出条件全勾**（SPEC 第 7 节）。

---

## W4 Redis + Docker + CI，P0 收尾（第 4 周）

### 4.1 Redis 五大数据类型

String（值 / `INCR` 计数）、Hash（对象字段）、List（队列）、Set（去重）、ZSet（排行榜 + 延迟队列）。**直觉价位**：内存 KV，单线程执行命令（无锁所以快），读 10 万 QPS 无压力；**但一切数据终决于磁盘数据库**——Redis 是加速器，不是存储。

### 4.2 缓存策略与三大坑

- **旁路缓存（cache-aside）**：读：查缓存 → miss → 查库 → 回填；写：**先写库，再删缓存**（不是先改缓存——缓存永远只放「可重建」的数据）。本课程指定策略。
- **穿透**：查不存在的数据打到库 → 缓存空值（短 TTL）或布隆过滤器。
- **击穿**：热点 key 过期瞬间并发打库 → 互斥重建或「永不过期 + 后台刷新」。
- **雪崩**：大量 key 同时过期 → TTL 加随机抖动。
- **一致性**：缓存天然可能脏，方案 = TTL + 删除失效，接受「毫秒级不一致」——面试被问「缓存与 DB 不一致」的标准开场就是这句话。

**交易所场景对应（重点，面试必答句）**：**Redis 分布式锁只解决「多实例互斥」，不解决「重复消息」**——后者的正解是幂等键 + 唯一约束；锁是性能优化，不是正确性保障。例：充值时两实例同时处理同一笔入账，锁抢到也挡不住消息重投，唯一约束才是兜底。订单防重同理。

### 4.3 分布式锁 SETNX 与局限

`SET key val NX EX ttl` 抢锁；释放必须「先校验持有者再 DEL」（Lua 脚本原子做），防止误删别人的锁。局限三连：锁过期时任务没跑完（要续租：后台 goroutine 延长 TTL）、主从切换丢锁、时钟跳跃——**Redlock 一句话**：「它存在争议（分布式系统各派混战），我们生产上用单点哨兵 + 短 TTL + 续租，且正确性永远不押在锁上」。P0-M2 里先实现最朴素的版本，局限分析写进 ADR。

### 4.4 持久化 RDB/AOF 选型

RDB = 周期快照（恢复快，可能丢最近几分钟）；AOF = 写操作日志（`everysec` 策略最多丢 1s，有重写压缩）。选型一句话：**「丢多少数据算事故」决定一切**——缓存可丢 RDB，类账务 AOF。Redis 定位缓存的课程惯例是 RDB 或不开，P2 讲清楚。

### 4.5 Dockerfile 与 compose 网络模型

- **Dockerfile 多阶段构建**：阶段 1 编译（golang 镜像）→ 阶段 2 运行（alpine，只放二进制 + CA 证书 + 非 root 用户）。
- **compose 网络**：容器间用**服务名**互访（同一默认网络），端口映射 `"3306:3306"` 只面向宿主机；`volumes` 持久化数据；`depends_on` 只控启动顺序，**healthcheck 才是「真的就绪」**（你在 Phase 0 已验证过）。正式模板已交付：`../scaffolds/docker-compose.md`（mysql:8.0 + redis:7.4-alpine + Kafka KRaft，密码/库名走 .env）、`../scaffolds/ci-github-actions.md`（四步流水线完整版）。
- 坑：容器时区（compose `TZ`/MySQL `--default-time-zone`，正式模板已内置 Asia/Shanghai）、MySQL 8 认证插件（`caching_sha2_password` 老驱动连不上）——这些都进你的坑库（docs/review.md 候选素材）。

### 4.6 GitHub Actions 三要素

workflow（触发条件：push/PR/tag）→ **job**（运行环境：os + 步骤串）→ **step**（用现成 `actions/*` 或裸命令）。你的 P0 CI = **四步流水线**（`code-quality.md` 1.7 冻结，完整模板直接复制 `../scaffolds/ci-github-actions.md`，只改仓库名）：① lint（gofmt + go vet + golangci-lint）② test（`go test -race ./...`）③ coverage（阈值脚本强制 ≥80%，低于即红）④ build（`go build ./...`）。约束：`actions/setup-go` 版本与 go.mod 一致、开依赖缓存、push 即触发、失败即红。

### 4.7 P0 收尾流程（第 4 周后半，对齐 tasks.md T-14 与 SPEC M4）

① `go test -cover` ≥80% 截图入 README　② k6 冒烟（记录 P50/P99，`resources.md` 有 k6 文档）　③ `docs/`：ADR ≥3（≥1 篇中途换方案）、`review.md` ≥3 坑 ≥2 取舍、`security.md` 威胁模型　④ README 四节（快速开始/架构 Mermaid/验收勾选/演示链接）　⑤ 3-10 分钟录屏三幕 + `demo/script.md`　⑥ 本阶段 `checklist.md` 全勾。

**坑预告**：录屏别放最后一天——先写分镜脚本逐幕录，最后一天只补尾；README「快速开始」要当成工程品写：禁止「然后手动改配置」类缺步（对应验收⑦）。

## 阶段收尾

- P0 10 条验收 ≥8 条达标（SPEC 第 8 节），勾选版内嵌 README，结论写入 `QA/review-log.md`。
- 产出清单：P0 完整项目（可讲「做过 / 取舍 / 数据」）+ 25 道练习 + 迁移表 + 隔离实验 + race 记录。下一个阶段：Phase 2 分布式中间件（`../02-*/lecture.md`）。