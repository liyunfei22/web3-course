# Go 深挖 60 题（Phase 7 面试八股题库）

> 与 ../roadmap.md 一致：Go 深挖是技术面隐含重点；本库 60 题分 7 类（GMP 10 / GC 8 / 内存模型与并发 8 / channel 10 / 并发模式 10 / 标准库与工程 8 / 综合场景 6）。
> 用法：W19 前逐题自测（先口述再核对答案），错题记录到自测表；W19 并发专项 15 题做完后对照本题库相应条目的「面试官追问」二次自测。
> 答案要点是「说给面试官听的三句话」，不是背诵稿——每个要点后面都要能展开讲一个例子。

## A. GMP 调度与运行时（10 题）

### A1. G/M/P 各是什么？为什么调度的中间层是 P 而不是直接用 M？

- 答案要点：G 是 goroutine 的执行体（含栈、PC/SP、状态）；M 是 OS 线程，负责实际执行；P 是「处理器」，是 M 执行 G 时必需的调度上下文（含本地 runqueue）。P 的引入把「线程数」与「并行度」解耦：GOMAXPROCS 决定 P 个数，M 数量可以比 P 多（阻塞时可再拉线程），从而在「内核线程频繁调度」与「业务并发」之间加一层用户态调度。
- 面试官追问：GOMAXPROCS=1 时程序还能提示并发吗？——能：单 P 下 goroutine 靠调度器时间片/阻塞切换交错执行，但与 IO 仍可并发（netpoll 在 syscall 时解耦），只是多核并行能力归零。

### A2. 一个 goroutine 从创建到首次执行要经过哪些队列？

- 答案要点：新 G 优先进当前 P 的 runnext（LIFO，倾向刚创建的 G）；否则进本地 runqueue；本地满则一半压入全局 runqueue。调度循环：优先 runnext → 本地队列弹头 → 全局队列取任务（按比例逃逸）→ 其他 P 偷（work stealing）→ netpoll 批量接活。
- 面试官追问：为什么 runnext 是 LIFO？——近邻性：刚创建的 G 大概率马上就要用刚用过的数据（栈/缓存热）。

### A3. work stealing 怎么偷？偷多少？

- 答案要点：P 本地队列空时：先看全局队列；再从其他 P 的本地队列「尾巴」偷一半（约 len/2），减少锁竞争与对偷取方刚入队任务的干扰；都不行则从 netpoll 拉待处理 IO 任务；再空则 M 自旋转片刻后睡眠。偷取方向保证在「任务偏斜 + 无互斥」下负载均衡。
- 面试官追问：所有 P 都空、也没有外部事件时，M 会怎样？——自旋限时后 park（sleep），避免空转烧 CPU；有任务时被唤醒。

### A4. Go 的抢占式调度怎么实现的？协作式抢占还剩下什么？

- 答案要点：Go 1.14 起是信号抢占：sysmon 发现某 G 运行超时（约 10ms+）发 SIGURG，把栈上的 preempt 标志置位/设置 asyncPreempt，被抢占的 M 在返回用户代码时安全挂起 G。残留的协作点：函数序言检查栈增长标志（stackPreempt）、GC 栈扫描的辅助点。无让出点的纯 CPU 死循环现在也能被抢走。
- 面试官追问：抢占对「持有大锁的循环」有影响吗？——有：被抢占的点可能正好在临界区里，调度器会先切走再在其后恢复，锁的持有时间变成不确定，这是生产上「偶发抖动」的来源之一。

### A5. GOMAXPROCS 场景题：服务部署在 4 核容器的物理 64 核机器上，什么都不设会怎样？

- 答案要点：runtime 默认按宿主机核数取 GOMAXPROCS（64），4 核配额下 64 个 P 会导致线程池膨胀、上下文切换与锁竞争放大，吞吐反而下降且 GC 的 mark termination 要等更多 P 停摆（STW 变长）。对策：GOMAXPROCS=4（或运行时读取 cgroup 配额的 automaxprocs 类库）；GC/池化收益同理。
- 面试官追问：GOMAXPROCS 大就一定更差吗？——不：若任务是 CPU 密集且核数真的多，P 多并行度高；关键是「P 数 = 可并行执行单元数」，要与你实际拿到的 CPU 配额对齐。

### A6. goroutine 为什么轻量？栈怎么长？

- 答案要点：初始栈约 2KB（线程默认栈 MB 级），按需增长（翻倍，上限 1GB/64 位）；切换是用户态（不直接进内核），创建成本约微秒级（远低于线程的数十微秒到毫秒级）。栈增长触发点是函数入口的栈检查：不足则在堆上复制旧栈到新栈并改写指针。
- 面试官追问：栈复制时正在运行的指针怎么办？——调度器会在安全点（函数序言/栈检查）做栈拷贝，配合写屏障修正栈上指针（这是 GC 与栈增长协作的经典机制）。

### A7. 一个 goroutine 因 channel 阻塞了，M 会怎样？还会执行别的 goroutine 吗？

- 答案要点：阻塞的 G 会 park（挂到 channel 的 sudog 等待队列），M 不阻塞：调度器从本地队列取下一个可运行的 G 继续跑；若本地队列空则走 work stealing/netpoll，再无事则 M 进入自旋→睡眠，此时 P 与 M 解耦（P 可以被其他自旋的 M 抢活——手忙脚乱时 P 不会闲置）。
- 面试官追问：如果这个 G 阻塞在系统调用（如 DB 查询）呢？——syscall 阻塞时 G 与 M 绑定让出给内核，该 M 在 syscall 返回前不再执行其他 G；P 被释放，调度器可唤醒/新建 M 接管 P 继续跑（这是 sysmon 协调的机制）。

### A8. 为什么说 Go 不适合 hard real-time？不确定性从哪来？

- 答案要点：GC 暂停（STW 虽短但存在）、调度抢占点不确定、锁与 channel 竞争、缩放倍数不确定（goroutine 切换时机无保证）。结论句式：Go 是「软实时、低延迟友好」——用池化、预分配、单线程免锁热路径把抖动压到可接受（呼应交易所低延迟题⑦）。
- 面试官追问：撮合引擎里为什么「避免在热路径用 channel 通信」？——channel 是同步原语，热路径用 channel 等于把调度器卷进每笔成交，延迟分配量级大；热路径改为单线程直接函数调用 + 事件循环。

### A9. goroutine 泄漏怎么发现、怎么定位？

- 答案要点：现象 = goroutine 数只增不减、内存与句柄上涨。发现：runtime.NumGoroutine 连续采样、pprof 的 goroutine profile（/debug/pprof/goroutine + go tool pprof 看栈）、死锁检测（-race 与 go vet 辅助）。常见泄漏源：channel 永不关闭的接收方、未收到 done 的 select、锁未释放、timer 未 Stop。
- 面试官追问：泄漏的 goroutine 在 pprof 里长什么样？——会在等待 channel（chan receive）或 select 栈帧无限期的栈样本，看占用量最多的栈两点一线即可锁定。

### A10. 场景题：10 万个 goroutine 各 sleep 2 秒，服务会怎样？

- 答案要点：协程量级可以承载（10 万 × ~2-8KB 栈 ≈ 数百 MB 虚拟内存，注意千万别在 goroutine 里再开大 slice）；sleep 走 timer 机制（timer heap/四叉堆），睡眠的 G 不占 M——M 数量不会暴涨到 10 万，活跃 M 仍约等于 P 数 + 少量阻塞 M。风险是「每秒大量 goroutine 创建 + timer 分配」的 GC 压力。
- 面试官追问：把 sleep 换成「等 channel 10 秒」行为一样吗？——本质上相似：一段时间被 park 的 G 都不占 M；区别在唤醒机制（timer vs sudog 队列），两者都走调度器唤醒。

## B. GC（8 题）

### B1. 三色标记算法讲一遍（白/灰/黑的推进过程）

- 答案要点：根集（全局变量、goroutine 栈、寄存器、被引用的堆对象）先置灰；循环：取灰对象 → 扫描其指针字段 → 指向白的变灰 → 自己变黑；灰队列空 → 标记完，白 = 垃圾，进入并发清除（sweep 内存复用）。黑色不变式：黑对象不得再指向白对象。
- 面试官追问：三色标记与「引用计数」比，为什么 Go 选它？——可并发标记、无需循环引用处理；代价是 STW 小窗口 + 写屏障开销。

### B2. 为什么并发标记必须有写屏障？混合写屏障是什么？

- 答案要点：标记与赋值并发时，可能「黑对象新指向白对象」且白对象永远不被扫描 → 被误判为垃圾回收。写屏障拦截这类写：Go 1.8 起的混合写屏障 = 插入屏障（Dijkstra，写时把新指向对象标灰）+ 删除屏障（Yuasa，写时把被覆盖的旧引用标灰），保证「标记期间黑对象不指向白对象」，并允许标记结束时快速收尾。
- 面试官追问：混合写屏障对比旧「STW 启动标记」的收益？——把之前「全程 STW 标记」降为「短促的 mark start / mark termination」两次小暂停，绝大部分标记在并发中进行。

### B3. GC 什么时候触发？GOGC 的目标堆公式？

- 答案要点：Go 1.5+ 是「分配速率驱动的抢占式触发」：目标堆 = 上次 GC 后存活量（heap_live）× (1 + GOGC/100)，默认 GOGC=100 → 堆翻倍才再 GC；实际触发靠分配速率估计（pacemaker）提前标定，避免分配给突发后立即 GC。还有强制触发（内存压力、显式 runtime.GC、GOMEMLIMIT 逼近）。
- 面试官追问：GOGC 调大（如 300）的代价？——GC 频率下降、CPU 占用低，但峰值堆内存大、单次 GC 周期内暂停/扫描范围变大；反之相反。数字游戏：Go 圣经级别问题，讲出「频率 vs 峰值内存」这对交换即可。

### B4. GOMEMLIMIT 与 GOGC 的关系？容器防 OOM 怎么配？

- 答案要点：GOMEMLIMIT 是软内存上限（Go 1.19+）：分配接近 limit 时迫使 GC 更频繁（即使 GOGC 说不该触发），防止整机 OOM；容器场景把 GOMEMLIMIT 设为 cgroup limit 的 80-90%，配合 GOGC 默认即可。它不是硬限（GC 周期内可短时超出），也不是「超过即 Kill」。
- 面试官追问：设了 GOMEMLIMIT 后 GC 频繁导致 CPU 高怎么办？——把 GOGC 调小到与分配节奏匹配（或提升配额），本质是「内存预算 ↔ GC 频率」的定价，结合 GOMAXPROCS 与压测数据定。

### B5. 逃逸分析：什么情况对象会被分到堆上？

- 答案要点：编译器分析「对象会不会逃出函数作用域」：返回指针、闭包捕获、interface 动态分派（可能要存储到堆）、大量 concat、append 到外传 slice、大对象（>64KB 直接堆）。查看方式：go build -gcflags=-m（-m 层数越多输出越细）。栈上对象零 GC 成本 → 逃逸越少越好（热路径尤其）。
- 面试官追问：fmt.Sprintf 为什么「为了不逃逸」有时改用 strconv.AppendInt？——fmt 走 interface`{}` 参数，参数装箱必逃逸；strconv 直写 []byte 无装箱，热路径省一次堆分配。

### B6. STW 在 Go GC 里还有几次？量级多少？

- 答案要点：两次短 STW：mark start（开屏障、把根集置灰）、mark termination（关屏障、收尾扫描）；Go 1.8+ 的清扫（sweep）并发。量级：典型几十~几百 µs 到毫秒级，与 P 数量（stop-the-world 要等所有 P 到达安全点）和堆状态相关；这也是「偶发 p99 毛刺」的主源。
- 面试官追问：为什么 GOMAXPROCS 过大时 STW 会更长？——STW 要等所有 P 的协助到达点（GC safepoint），P 越多等待队列越长、协调成本越高。

### B7. 系统性降低 GC 压力，你会按什么顺序做？

- 答案要点：① 减少分配：池化（sync.Pool）、预分配（make 带 cap）、避免热路径字符串拼接（strings.Builder）与大 map/slice 反复扩容；② 减少逃逸：-gcflags=-m 排查热函数、避免 interface 装箱；③ 调参：GOGC/GOMEMLIMIT 按压测定；④ 架构级：热路径对象生命周期明确（事件循环复用缓冲）、避免「每请求一堆垃圾」的建模。
- 面试官追问：sync.Pool 的对象什么时候会被清掉？——每次 GC 清除（pool 与 GC 周期绑定），所以 Pool = 短期复用缓存，不是长期对象仓库；Get 也可能拿到 nil。

### B8. 撮合热路径面对 GC 抖动，你会怎么处理？（交易所场景）

- 答案要点：① 撮合线程内零分配：订单对象/成交记录全部池化复用，事件循环中不 new；② GC 毛刺靠「单线程 + 免锁」已脱离并发 GC 的主要风险面（同 A8），但 GC 仍会暂停整个世界 → 预算内接受 p99 毛刺，或用 GOMEMLIMIT 收住峰值；③ 测量闭环：压测 + pprof 对比（呼应题⑦低延迟）。
- 面试官追问：那为什么不干脆关掉 GC？——Go 没有「关闭 GC」的工程选项；关掉会导致内存只涨不还，崩溃风险大于毛刺。

## C. 内存模型与并发（8 题）

### C1. happens-before 是什么？举 3 个标准实例。

- 答案要点：定义：若 A happens-before B，则 A 的写在 B 的读之后可见（同步而非时间先后）。三个 built-in 实例：① goroutine 创建 happens-before 该 goroutine 的语句；② channel send happens-before 对应 receive（无缓冲严格、有缓冲配套）；③ mutex Unlock happens-before 下一个 Lock（同一把锁）；WaitGroup：所有 Add 前的写对 Wait 返回后的读可见（Done happens-before Wait 返回）。
- 面试官追问：两个 goroutine 用两个不同的 channel 互发消息，顺序有关系吗？——没有跨 channel 保证；只有「同一个 channel 上 send/receive」的配对才建立 happens-before。

### C2. 多个 goroutine 并发读写同一个 bool 变量，会发生什么？

- 答案要点：这是数据竞争（data race）：Go 内存模型不保证读侧可见性与读写互斥；-race 会报错。实际现象通常是「读了旧值」「一直读到初始值（寄存器缓存/CPU 缓存）」，但更隐蔽的是编译器重排（如把 bool 读到寄存器后循环瞬时）。正确姿势：atomic.Bool / atomic.Load/Store、channel 传递、或互斥锁。
- 面试官追问：加了 atomic 就一定按你写的顺序执行吗？——Go 的 sync/atomic 是顺序一致性语义（seq-cst），单一变量读写在跨 goroutine 上是「顺序一致的」；多个原子变量之间仍需 happens-before 链条。

### C3. -race 是怎么工作的？部署时能开吗？

- 答案要点：编译期插桩（TSan 思想）：每个共享内存访问前后插入检查，冲突时记录两个访问栈并 report。开销大（CPU 数倍到 10x+，内存增加明显），用于测试/CI 环境；生产默认不开，但 CI 必须开（P0-P2 的 CI 里都应有 -race 的测试 job）。
- 面试官追问：race 测不出「逻辑竞态」（如先读后写时序）怎么办？——race 只抓「同一块内存无同步并发访问」；逻辑竞态靠并发测试、fuzz、对账/不变式兜底（P2 撮合 fuzz 的动机）。

### C4. atomic 和 mutex 怎么选？

- 答案要点：粒度：atomic 用于单个变量（计数、标志、指针发布、seq 号）；mutex 用于复合临界区（多字段状态必须一起改，如账户冻结）。性能：atomic 是 CPU 指令（锁总线/缓存行），无系统调用；mutex 有竞争时睡眠唤醒。句式：「能用 atomic 的地方不用锁，但把多字段一致性寄托在 atomic 上是错的」。
- 面试官追问：读多写少的计数器用 atomic 还是 RWMutex？——纯计数器 atomic.AddInt64 就够（写方也无锁）；读快照需要多个字段时才考虑 RWMutex/snapshot 化。

### C5. 场景：发布一个「配置」给所有 worker 读，为什么用 atomic.Pointer[T] 而不是直接赋值结构体？

- 答案要点：直接赋值结构体字段在并发读写下是 data race（多字段非原子）；atomic.Pointer 发布「新配置指针」是单字写、顺序一致：读者 Load 后要么看到旧、要么看到新，绝不看到写了一半的配置；旧配置对象不被释放即「安全发布」。这是缺锁场景的标准模式（类似 double-checked locking 的正确化）。
- 面试官追问：读了新指针后，还要不要把整个对象当不可变？——要：发布后对象只读不写；若需更新就再发布新指针（copy-on-write），写线程绝不改已发布对象。

### C6. sync.Once 的语义与实现要点？

- 答案要点：保证 f 恰好执行一次（进程内）：第一个调用者执行 f，其余调用者阻塞等待其完成（Go 1.21 前语义；Done 后所有人直接返回）。实现要点：原子标志 + 互斥 + 双检查；坑：f 里 panic 不会重试（once 也算 done）；不能用 sync.Once 做「可重入」初始化。
- 面试官追问：singleflight 和 Once 有什么区别？——Once 是「永久至多一次」（全局初始化）；singleflight 是「同一瞬间的并发请求合并为一个」（缓存击穿：N 个并发 key miss 只让一个去打 DB），见 G6。

### C7. 讲讲「发布安全」：一个 goroutine 写好对象，另一个拿到它读，需要什么？

- 答案要点：需要 happens-before 链：写完成后「发布动作」（channel send / mutex unlock / atomic store / WaitGroup Done / 注意 goroutine 创建也算），读者拿到对象前的路径必须经过同一发布动作。没有同步则读者可能看到部分写（字段半新半旧）——这是「双重检查锁」在 Go 里必须用 atomic 的原因（非 volatile 语言没有 volatile 语义）。
- 面试官追问：struct 里有 int + string，atomic 发布整个指针安全，逐字段 atomic 存安全吗？——不安全：多字段各自原子不构成整体一致性（读者可能看到字段 1 新、字段 2 旧）；要整体发布指针（copy-on-write）。

### C8. 谁有权 close 一个 channel？为什么要遵守「只在发送方关闭」？

- 答案要点：红线：发送方拥有关闭权；接收方与「双方都可能发的场景」不 close。原因：接收方 close 会让其他发送方 panic（send on closed channel）；双方并发 close 会 panic（close of closed channel）；不 close 的泄漏 = 接收方一直等（尤其 range）。优雅停止模式：发送方在「所有发送完成后」close，接收方 range 自然退出；「双保险」：close(done) + 发送方自身退出 loop（见 D10）。
- 面试官追问：生产者还没发完，突然想取消怎么办？——close 不行（发送方 close 后自己也不能继续 send → panic）；改用一个 done channel/context 由外部 cancel + 生产者在 select 里退出，再由唯一发送方 close 业务 channel。

## D. channel 底层与陷阱（10 题）

### D1. hchan 结构体有哪些字段？各自干什么？

- 答案要点：qcount（当前元素数）、dataqsiz（环形缓冲容量）、buf（环形缓冲指针）、elemsize/elemtype（元素元信息）、sendx/recvx（生产/消费游标）、sendq/recvq（等待发送/接收的 sudog 双向链表，sudog 包着阻塞的 G）、closed（关闭标志）、lock（运行时互斥锁）。
- 面试官追问：channel 的 buffer 是环形的意义？——O(1) 入队出队、空间复用（容量分配一次）；读写只动游标，配合 lock 保证并发安全。

### D2. 无缓冲 channel 的一次发送完整流程？

- 答案要点：发送方先拿锁：查 recvq 是否有等待者 → 有则直接把值拷贝给接收方的栈/目标（不经过 buf），唤醒接收 G；无则发送方把自身 sudog 挂 sendq 并 park（让出 M）；被接收后返回。接收方对称：有 sendq 等待者则直接取值唤醒。有缓冲的则先走 buf（满则 park）——无缓冲 = 同步握手，有缓冲 = 队列 + 上限。
- 面试官追问：为什么无缓冲发送「直递」不经过 buf？——握手语义：发送在接收发生之前不返回；直递减少一次拷贝且无需 buffer。

### D3. channel 为什么需要锁？锁的是什么？

- 答案要点：buf、游标、等待队列都是共享状态，任意数量的 M 可同时访问同一 channel → 必须互斥：hchan.lock 保护 buf 与 sudog 队列的入队出队。锁是 runtime 内部锁（futex 系），临界区极短（几个字段操作 + 唤醒触发调度）。所以说 channel「无锁编程」是误区，它内部有锁，只是锁付出的时间极短。
- 面试官追问：那撮合热路径用 channel 为什么「贵」？——锁 + 潜在的 park/wakeup + GC 关注的对象引用，任何一笔都可能触发调度器路径；单线程事件循环没有这些开销（呼应 A8）。

### D4. close 一个 channel 的三种后果分别是什么？

- 答案要点：① 正常：接收方先取完 buf 余量，之后每次都立刻返回零值（且 ok=false，range 循环自然退出）；② 向已关闭 channel 发送：panic「send on closed channel」；③ 关闭已关闭/从接收方 close：panic「close of closed channel」。结论：关闭只能由且一次性由「确保再无发送」的发送方做。
- 面试官追问：接收方怎么区分「零值元素」与「关闭」？——value, ok := <-ch：ok=false 即关闭；这就是「绝不靠零值判断关闭」的纪律。

### D5. nil channel 在 send / receive / select 里分别什么行为？

- 答案要点：send/receive 永久阻塞（没有锁、没有队列、无法完成）；select 中 nil channel 的 case 会被禁用（永不满足）——这是「动态禁用某路」的经典技巧：把要停的路置 nil，select 不再选它。
- 面试官追问：nil channel 永久阻塞会泄漏 goroutine 吗？——会：误把 nil ch 当「空 channel」传给 worker，worker 永远等着 → 泄漏排查时看 pprof 的 chan receive 栈（呼应 A9）。

### D6. select 的实现讲一遍（runtime.selectgo）。

- 答案要点：selectgo 把 case 组装成 scase 数组；先快路径：无阻塞检查（有缓冲且可用 / 有等待者）随机序试探一次（随机序避免饥饿）；不满足再阻塞：按随机序把当前 G 挂到每个 channel 的等待队列（多队列挂一次），任何一个被唤醒后把 G 从其他队列摘除；有 default 且无就绪 → 走 default。多个 case 同时就绪时随机选一（公平）。
- 面试官追问：在循环里 select 常跳 default 有什么问题？——空转忙等（busy loop 吃 CPU），必须限流/阻塞等待事件而不是轮询 default。

### D7. 陷阱题：for-select 里接收一个会被关闭的 channel，为什么可能死循环？

- 答案要点：channel 关闭后接收立即返回零值且 ok=false；不加 ok 判断的 for-select 会以零值业务逻辑无限循环（如计数 0 当作正常消息处理）。修复：value, ok := <-ch; if !ok `{ return }` 或用 range 语义。这是「关闭意图被当数据」的经典面试陷阱。
- 面试官追问：怎么用 select 同时监听「数据」与「退出」双路？——case v, ok := <-dataCh（ok=false 时置 nil 并 return）；case <-ctx.Done()：select 双路 + nil 禁用，是优雅退出标准结构（D8/D10 复用）。

### D8. 超时实现：select + time.After 的泄漏问题怎么解？

- 答案要点：time.After 每次分配一个 Timer，若对应的 case 没触发（走了别的分支），Timer 要到 GC 才有机会释放；高频循环里会堆积。正确写法：timer := time.NewTimer(d); defer timer.Stop(); select `{ case <-timer.C: ... case <-ctx.Done(): ... }`——Stop 后可回收。更推荐统一用 context.WithTimeout 贯穿（D8 与 E3 呼应）。
- 面试官追问：timer.Stop() 之后 channel 里可能还有残留值吗？——可能（Stop 返回 false 表示 timer 已在触发竞态），严谨代码再加一个非阻塞 drain（select`{case <-timer.C: default:}`）。

### D9. 为什么「信号」用 chan struct`{}` 而非 chan bool 或 chan int？

- 答案要点：struct`{}` 零大小（空结构体），Channel 内的元素不占字节；语义清晰：信号 = 事件发生，无负载；配合 close(done) 广播语义（所有接收者同时收到）比「发 N 个值」省。bool 让人觉得「要读值」，容易误写成「读 false 当作没信号」。
- 面试官追问：第 1 行 `done := make(chan struct{})` 未关闭、长期不读，泄漏吗？——不泄漏资源（零大小），但若有 goroutine 阻塞在 <-done 且永不关闭，是 goroutine 泄漏（A9）。

### D10. 场景题：10 个 worker 从 jobs channel 消费，主 goroutine 如何优雅停止全部 worker？

- 答案要点：三步：① 发送方（主）把全部 job 发完后 close(jobs)（只有主在发，关权清晰）；② worker 用 for job := range jobs 消费，发完即退出——range 在通道关闭且耗尽后自动结束；③ 主用 WaitGroup 等 10 个 Done。若想「提前取消 + 不丢已发任务」：加 ctx.Done() 的 select 双路 + nil 禁用（D7 的修复）。模式名：close + done 双保险，绝不从 worker 侧 close。
- 面试官追问：如果又来了新任务（jobs 不能 close）怎么办？——不 close，用「任务包携带 done」或 ctx 取消 + 重新组织 job 源（如每批一个 channel、批次可废弃）。

## E. 并发模式（10 题）

### E1. worker pool 的核心思想与骨架（不写完整代码）。

- 答案要点：思想：限制并发度（避免一万个 goroutine 一拥而上）+ 复用 goroutine 生命周期（goroutine 创建便宜但非零）。骨架：jobs chan（带着任务）→ N 个常驻 worker goroutine（for job := range jobs / select+ctx）→ 结果 chan（可选）→ 发送方 close(jobs) + WaitGroup 聚合。变体：errgroup 版本（任意错即 cancel）、有界缓冲（背压）。
- 面试官追问：池子的大小怎么定？——看瓶颈资源：CPU 密集 ≈ GOMAXPROCS（或微余量）、IO 密集按连接池/下游并发上限（如 DB 连接数）定，用压测验证；不是拍脑袋 100。

### E2. 令牌桶限流怎么做？golang.org/x/time/rate 与 Redis 版区别？

- 答案要点：令牌桶：桶存令牌、固定速率补充、请求消耗令牌、桶满则令牌丢弃（允许突发）；rate.NewLimiter(rate.Limit(rps), burst) 即实现，Wait/WaitN 可阻塞或 AllowN 非阻塞。Redis 版（分布式）：多实例共享限流状态（如 Lua 脚本：INCR + EXPIRE 按窗口，或更精细的令牌/时间戳哈希）——单机 rate 无法跨实例计数。
- 面试官追问：限流发生在哪层？返回什么？——网关层（Phase 2 网关限流）：超限返回 429 + Retry-After，比在业务层限流早；撮合过载时的降级也是 429/熔断（题⑦⑧呼应）。

### E3. context.WithTimeout 与 select+time.After 的差别？怎么选？

- 答案要点：context 语义更全：可取消（CancelFunc）、可过期、可传播到下游（DB/Kafka/HTTP 调用自动感知）、嵌套合并（父 cancel 即全 cancel）；time.After 只是「本 select 的一次性超时」，无法传播。选择：凡是要把超时/取消传给「下一层调用」的都用 context（生产标准）；纯本 goroutine 内部等一个事件可用 timer 直判。
- 面试官追问：context 超时后 goroutine 一定退出吗？——不：必须每个环节都 select ctx.Done() 才能传播；只传 ctx 不监听，超时只是「别人收到了信号」。这是 context 使用最常见的坑（F1 再点一次）。

### E4. fan-in：合并多个 channel 时关闭顺序怎么处理？

- 答案要点：合并通道的关闭只能发生在「所有上游发送完」之后：为每个输入源起一个转发 goroutine，全部完成后由聚合 goroutine close(out)（WaitGroup 计数转发者）；绝不能在某一个源结束时就 close（会 panic）。反模式：调用方在某个分支直接 close(out)。
- 面试官追问：N 个源里有慢源怎么办？——可选：合并不被慢源阻塞的语义（带缓冲的 out + 浅队列），或把慢源分流；正确性优先：转发者不丢消息，背压体现在 out 缓冲。

### E5. 带优先级队列的消费者：怎么实现「撤单优先处理」？

- 答案要点：结构：container/heap（最小堆）+ 互斥锁 + 通知机制（cond 或 signal chan）；优先级字段（撤单 > 改单 > 新单，可按业务）入堆，消费者弹堆顶。交易所场景：撤单优先释放冻结资金，其次改单；堆的 O(log n) 入出队在低优先级队列规模下完全够。
- 面试官追问：为什么不用每优先级各一个 channel + select？——select 是随机就绪选择（无优先级语义），可能饥饿优先任务；堆显式优先级，语义精确可测（PriorityQueue 的经典测试用例）。

### E6. errgroup：能做什么？坑在哪？

- 答案要点：golang.org/x/sync/errgroup：并行执行一组任务，第一个错误返回（WithContext 时把 ctx 取消，其余 goroutine 靠 select ctx.Done() 自我退出），Group.Wait 聚合首个错误。坑：① WithContext 返回的 ctx 要 defer cancel()（忘了会泄漏）；② 子 goroutine 忽略 ctx 则取消不生效（E3 重播）；③ panic 不会转成 error（要用 recover 包装）；④ 共享变量仍需自己加锁（errgroup 不提供数据同步）。
- 面试官追问：想收集所有错误而不是第一个怎么办？——自己聚合：errChan + 等所有 Done 后再收集，或 errors.Join（Go 1.20+）。

### E7. 并发安全 LRU 怎么设计？读多写少优化呢？

- 答案要点：基础：sync.Mutex + map[key]*list.Element + container/list；Get 命中 → MoveToFront + 返回；Put → 存在则改值置前，不存在则插头，超 cap 从尾淘汰；复杂度 O(1)。优化：单锁变分片锁（shard，key 哈希分桶）摊薄竞争；读多写少用 RWMutex（注意 RLock 内的 MoveToFront 需要锁升级——经典坑，先解 RLock 再 Lock）。
- 面试官追问：缓存需要全局一致性吗（如撮合结果缓存）？——撮合/账务关键数据不能失效域不一致，宁可不用缓存或做带版本失效；LRU 缓存适合行情快照等「可重建数据」（项目里 kline/价格缓存即是）。

### E8. Kafka at-least-once 下行，消费端「幂等消费」与并发的冲突怎么处理？

- 答案要点：at-least-once 推论：重复投递必然发生 → 消费端以「幂等键 + 存储唯一约束」兜底：写入先查幂等键存在与否（或直接依赖唯一索引，DuplicateKey 异常即幂等跳过）。并发陷阱：同一幂等键的两次投递同时到达 → 先查后插有竞态 → 设计上依赖「原子性的唯一约束冲突/INSERT ON CONFLICT」，而不是先 SELECT；冲突回收走对账。
- 面试官追问：为什么不能只靠「offset 提交」保证？——offset 提交语义与业务成功不同步（处理成功与提交之间崩溃 → 重复），幂等是业务层兜底；两件事要用两种资料讲清楚（P1 买入账的测试用例即此）。

### E9. 信号量语义：`sem := make(chan struct{}, N)` 为什么是一种信号量？和 worker pool 区别？

- 答案要点：能力面：chan 容量 N + 取 token（sem <- struct`{}``{}`）+ 还 token（<-sem）即「最多 N 个并发」的计数信号量；天然阻塞与超时（select）。与 worker pool 区别：worker pool 是「固定 N 个执行者反复取任务」；信号量是「调用者自己跑，只是并发额度受限」——灵活（可限制任意临界区），但每处都要记得获取/释放成对。
- 面试官追问：信号量忘记了释放呢？——额度泄漏，最终全 block（活锁式卡死）；排查：goroutine 栈 + 计数器观测（呼应 A9/Observability）。

### E10. pipeline：多阶段处理的关闭顺序要遵守什么？

- 答案要点：纪律：① 每阶段「只从上游收、只向下游发」，下游的关闭由「该阶段的唯一发送方」负责（沿 D4/C8 的关闭权红线）；② 上游关闭后，当前阶段要 drain（把已在途的元素送完）再 close 自己的输出；③ 取消（ctx）时逐段退出，每段退出前「该段的消费者还活着」——否则会向已退出的下游发送（panic）。实践：每阶段 goroutine 一张生命周期图（go 例：initNumerator → square → sink，每段 WaitGroup 收口）。
- 面试官追问：某阶段很慢导致下游全线等待，怎么缓解？——分阶段缓冲（各段 channel 容量）与背压取舍：容量大缓冲抖动但延迟大；容量小背压强推上游——按预算各段给容量（题③推送到这里的通用论证）。

## F. 标准库与工程（8 题）

### F1. context 的传播规则：为什么「首参带 ctx」是硬规矩？

- 答案要点：context 是可取消/可超时的「服务器请求元数据 + 取消信号」载体：函数链路上每层都要显式接受并向下传递（ctx 必须作为第一个参数，不存结构体字段——存字段会让取消范围失去边界）。传播的意义：一处超时/取消 → 整条链响应（DB/Kafka/HTTP 调用都支持 ctx）。坑：子 ctx 依赖父，父取消子必取消；反过来不行。
- 面试官追问：WithValue 的 key 为什么要自定义类型而不是 string？——避免不同包撞 key（string 是全局字符串池）；标准做法 type key struct`{}` 或包级私有类型。

### F2. sync.Pool 的原理、适用场景、坑。

- 答案要点：原理：无锁本地（per-P）缓存 + 无竞争的 Get/Put 走 P 私有，竞争时互偷；每次 GC 会清空部分/全部缓存（Pool 与 GC 绑定，见 B7）。适用：高频创建、短期复用、重建便宜的对象（[]byte、事务对象），如 buffer 池。坑：Get 可能返回 nil（自建空对象）；Get 拿到的对象可能含上次的脏数据（要 reset）；不适合「长期命根数据」（会被清）。
- 面试官追问：Pool 里放连接（如 DB 连接）合适吗？——不合适：连接是长生命周期昂贵资源且会被 GC 清掉造成重建风暴；连接交给连接池（database/sql、gRPC 连接管理等），Pool 装无状态临时体。

### F3. sync.Map 什么时候该用，什么时候不该？

- 答案要点：适用：读多写少 + key 集合基本稳定 + 各 key 各自更新互不相干（如配置缓存、连接按 id 索引）；实现双层 map（read 无锁读 + dirty 加锁写 + miss 提升），读路径绝大多数无锁。不该用：写密集/增长型 map（每次 miss 提升开销大，不如 RWMutex+普通 map）、需要迭代 + 快照一致性的（sync.Map 迭代是非一致的弱一致视图）。
- 面试官追问：两个 goroutine 同时往 sync.Map 写同一个 key？——写走 dirty 需锁，语义安全（后写覆盖），但无一「存在性 CAS」保证（CompareAndSwap 有：1.20 起提供）。

### F4. defer 的三个经典坑。

- 答案要点：① 参数在 defer 语句处求值（值拷贝），不是函数运行时——defer fmt.Println(i) 在 i 变化后打印旧值；② 执行顺序 LIFO（后进先出），资源释放按逆序配对（锁/文件/连接）；③ 与命名返回值：defer 内可以改命名返回值（defer func()`{ ret = ... }`()），匿名返回值则改不了。性能：Go 1.14+ defer 在多数场景廉。
- 面试官追问：for 循环里 defer 会怎样？——defer 挂在函数栈上，循环里 defer 全部累积到函数退出才执行 → 资源/内存堆积：把循环体抽成函数（每轮一个新函数栈）。

### F5. 线上 pprof 定位「内存只涨不降」的流程？

- 答案要点：链路：① 暴露 /debug/pprof（生产建议独立端口/鉴权）；② 现象确认：监控 RSS/heap 曲线；③ go tool pprof -http :8080 http://host/debug/pprof/heap，看 inuse_space（当前占用，排查「谁持有」）与 alloc_objects/alloc_space（累计分配，排查「谁在疯狂分配」）两个视图；④ 定位到某类型/调用点 → 查是否被全局表/缓存/goroutine 引用（配合 goroutine profile）。结论要配合压测复现（P2 M5 同款方法）。
- 面试官追问：CPU 毛刺（GC 抖动）怎么看？——pprof 的 profile 采样 30s 看火焰图热函数；若热函数是 malloc/GC 相关 → B7 的对象池路线；再用 trace（runtime/trace）看 GC 频率与分配率。

### F6. slice 的经典坑：append 共享底层数组、扩容、循环变量。

- 答案要点：① 多个 slice 共享同一底层数组：s2 := s1[0:2] 后 append(s2, x) 可能覆盖 s1 的相邻元素（cap 足够时原地写）——语义是 append 改「自己的视图」但可能污染别人；② 扩容：cap < 1024 约翻倍、≥1024 约 1.25x，扩容会放弃共享（新数组）；③ 循环变量：Go 1.22 前 for i := range 迭代变量复用同一地址（goroutine 捕获 i 全读到终值），1.22 起每次迭代新变量——老代码要认得这个坑、新代码直接受益。
- 面试官追问：怎么快速判断 s2 = s1[0:2] 后 append(s2, x) 会不会改到 s1？——看 cap：len(s2) < cap(s1)-0 则共享剩余容量，append 会写底层数组；只想追加就显式 make+copy 或 append(s1[:0:0], ...)。

### F7. map 遍历顺序为什么随机？并发读写 map 会发生什么？

- 答案要点：遍历随机 = 语言保证？（不保证顺序）+ 运行时故意随机化起始桶，防程序隐式依赖顺序（也防哈希碰撞放大攻击）；实现：bucket 链 + 溢出桶，遍历从随机桶起步。并发读写：fatal error: concurrent map writes（运行时检测，几乎必然 crash）——map 不是并发安全容器，要么锁、要么 sync.Map、要么分片 map。
- 面试官追问：只读并发安全吗？——「只读 + 不扩容」时多个 reader 安全（无写者即无修改）；「一边读一遍往 map 塞新 key」不安全，哪怕只是检查存在性 + 写入也要锁/用 LoadOrStore（sync.Map）。

### F8. http.Server 的优雅关闭与超时怎么配？为什么必须配？

- 答案要点：属性：ReadTimeout/ReadHeaderTimeout 防慢速读取攻击（连接挂住吃资源）、WriteTimeout 限写、IdleTimeout 管 keep-alive 空闲；Shutdown(ctx) 优雅退出：先停接新连接，等活跃请求完成（或 ctx 超时强关），配合信号处理（SIGTERM/SIGINT）在退出前 drain。不配的后果：慢连接耗尽 fd、停机时请求被硬切。
- 面试官追问：Shutdown 与 Close 的区别？——Shutdown 停止监听 + 等已完成；Close 立即关全部活跃连接（活跃请求丢失）；生产先 Shutdown(ctx with timeout) 再兜底 Close。

## G. 综合场景（6 题）

### G1. 两个 goroutine 交替打印 1-100：奇数 goroutine 打奇数、偶数 goroutine 打偶数。

- 答案要点：思路：令牌传递（token passing）模拟「轮到你才打」：两个带缓冲容量 1 的 channel（或一个 chan struct`{}` 令牌 + 初始交给奇线程）；奇打 1 → 令牌交偶 → 偶打 2 → 令牌交奇……循环直到 100。要点：① 令牌 channel 容量 1 或初始放入令牌且只此一枚（防重复）；② 结束条件收敛（i > 100 时也把令牌传出去或 final sync 用 WaitGroup）；③ 这道题的隐藏考点是「锁+条件变量」写法对比：channel 版语义自解释、无死锁推导简单。
- 面试官追问：三个 goroutine 交替打 ABC 呢？——环状令牌：A → B → C → A 循环；N 个 goroutine = N 个一环传令牌，同上收敛（G2 直接复用）。

### G2. 三个 goroutine 循环打印 A、B、C（各 10 次）。

- 答案要点：三通道环：chA<-start；循环 i 次 `{ 打印 -> chB <- 1 -> <-chA }` 等外围（或用「谁收到令牌谁打印+传下一个」）：写作每个 goroutine { for `{ <-myCh; 打印; nextCh <- ok }` }。坑：起始令牌只能一个（从 A 的通道开始发）否则重复；收尾要把令牌传完再退出（防死锁）。
- 面试官追问：不用 channel 只用原子计数器行吗？——行但弱：原子计数 + 自旋「如果不是我的回合就继续等」是忙等（吃 CPU）；channel 版是阻塞等待。面试加分答法：「选择哪个看对延迟/CPU 的约束」。

### G3. 设计并发安全 LRU：接口 Get(key) / Put(key, value)，O(1)，支持并发。

- 答案要点：三步设计：① 结构：map[string]*list.Element + container/list；② Get：命中 → MoveToFront + 返回，未命中 → nil；③ Put：存在 → 覆盖并置前；不存在 → PushFront，超 cap 则 Back 淘汰 + 删 map 项；并发：sync.RWMutex 包全部（写操作 MoveToFront 需要 Lock，注意 Get 也要 Lock 因为改链表序——不要用 RLock）。进阶：分片（按 hash 分 16 桶，各桶独立 LRU）摊薄竞争；或读多写少加「热度忽略」优化。
- 面试官追问：为什么 Get 不能用 RLock？——MoveToFront 是写操作；若偏读不做 MRU 更新，则用 RLock 但淘汰策略退化（讲出这个取舍即高分）。

### G4. 综合题：实现限流下载器——同时最多 N 个下载、整体 qps 限速、任一下载失败怎么办？

- 答案要点：拼装件（这是 E1/E2/E6 的合体）：① 并发上限 N：worker pool（jobs chan + N worker）或信号量 chan struct`{}`;② 速率限制：rate.NewLimiter，worker 每次取任务前 Wait(1)（令牌桶整体控速）；③ 失败与取消：errgroup.WithContext——首个失败 cancel 其余（worker 在 select 里监听 ctx.Done() 提前退出），Wait 返回首个错误；④ 收尾：发送方 close(jobs) + WaitGroup 聚合。讲顺序：先并发骨架 → 再限速 → 再错误语义 → 再退出。
- 面试官追问：重试逻辑放哪？——放「任务执行单元」：第 3 次失败才 error；但重试必须满足幂等（下载到一半重下 = 覆盖写入），呼应 E8 的幂等消费心智。

### G5. 多生产者多消费者 + 每条消息「至少处理一次且不重复」。

- 答案要点：至少一次：Kafka/队列语义 + 提交时序（处理成功后再提交 offset/ack）→ 崩溃即重复是常态；不重复：消费者的持久化写入以「业务幂等键」做唯一约束（先查后插有竞态 → 依赖唯一索引冲突 / INSERT ON CONFLICT DO NOTHING），重复投递被幂等吞掉。并发同键：两个 worker 同时处理同幂等键的两条 → 锁 + 唯一约束双保险（E8 全量答案），对账（题⑤）兜底最终一致。
- 面试官追问：如果下游是「累加余额」这种不可幂等的操作呢？——要么改成「事件追加 + 回放求余额」（事件溯源，题④），要么以事件 id 做过账去重（双分录引用唯一事件 id）。

### G6. singleflight 防缓存击穿：N 个请求同时 miss，怎么只放一个去查源？

- 答案要点：思想：同一 key 的并发请求合并：第一个请求执行（查 DB/外部），其余等待同一执行结果（共享 channel），执行者返回后广播；x/sync/singleflight 的 Group.Do(key, fn) 即此，返回值带 shared 标志（区分"我是执行者"与"我是等待者"——等待者可选择缓存结果）。应用：行情快照缓存 miss、账户聚合查询。与分布式场景：单进程 singleflight 只合并本实例；多实例要 Redis 锁/合并层（细化到题⑧多活）。
- 面试官追问：执行者失败（panic/error）时等待者怎样？——错误会分发给所有等待者（各自重试策略），不缓存错误结果（防止缓存击穿的雪崩）；「错误不缓存」是与「结果缓存」的关键区别。

---

## 自测使用说明

- 每题先口述 1-2 分钟（力求以上要点逐条覆盖），再对照本文件核对漏点；漏点记入 ../interview/algorithms/ 或自测表的错题列。
- 标注「场景题/陷阱题」的题目，自测时必须手写运行（G 组 6 题 + D7/D8/D10 + E5 必须跑通），运行痕迹入库。
- W19 并发专项 15 题与本题库的对应：交替打印(G1)、交替打印 ABC(G2)、worker pool(E1)、生产者-消费者(G5)、超时控制(E3)、令牌桶限流(E2)、fan-in/fan-out(E4)、优先级队列(E5)、并发安全 LRU(E7/G3)、信号量(E9)、pipeline(E10)、errgroup(E6)、singleflight(G6)、优雅停止 worker(D10)、channel 双关闭陷阱(D4/D7)。
