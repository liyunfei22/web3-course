# scaffolds/ws-gateway.md — WS 网关骨架（P1 M4 使用，P2 M3 行情复用）

> 用途：P1 M4 用它向 React 面板推送充值通知（订阅流名 `deposits`）；P2 M3 复用同一套骨架做行情 WS（订阅流名 = symbol，如 `BTCUSDT`）。本文件是脚手架：**接口签名与结构可复制，业务实现由学员自己写**。协议与并发模型是冻结设计，实现细节（缓冲大小 / 心跳周期 / 补发窗口）按你自己的取舍填。
> 关联验收：10 条验收⑥（闭环里 WS 帧可见）；`../03-blockchain-indexer/checklist.md` 的「断线重连补偿」条。

## 1. 设计总览

三个问题，每个的答案构成一个设计决策（学员把它写成 ADR-00x「为什么每连接一个 Writer goroutine」）：

| 问题 | 冻结答案 | 理由 |
|---|---|---|
| 读与写谁做主 | 每连接一个 **Writer goroutine**（唯一写者），Reader goroutine 只读 | 并发写同一 TCP 连接会交织损坏帧；单 Writer + channel 是 Go 惯用且面试必背的模式 |
| 慢消费者怎么办 | 写不进 channel 就断开（带日志） | 阻塞写者会拖垮全网关；断线后客户端走 seq 补偿，代价可接受 |
| 订阅怎么存 | 双向索引：`subs map[流名]map[*Conn]` + `reverse map[*Conn]map[流名]` | 一条连接订多个流（P1 演示多地址 / P2 多 symbol），双向索引让 O(1) 增删 |

## 2. 目录结构（完整给出，业务实现自写）

```
cmd/ws-gateway/main.go      # 装配：读配置、建 Hub、注册路由、优雅退出（照 cmd 骨架惯例）
internal/ws/
  hub.go                    # 连接登记 + 订阅索引 + fan-out（本文件的核心）
  conn.go                   # 单个连接的读写循环与心跳
  protocol.go               # 帧编解码（JSON）与类型定义
  seq.go                    # 每流单调递增的 seq 与补发 ring buffer
```

## 3. 消息协议（JSON 帧，冻结）

三类方向：客户端 → 服务端（控制），服务端 → 客户端（交付）。

客户端 → 服务端：
```json
{"type": "subscribe", "stream": "deposits", "lastSeq": 0}
{"type": "pong"}
```

服务端 → 客户端：
```json
{"type": "snapshot", "stream": "deposits", "seq": 128, "data": [ ...当前可见的全部充值(截断版)... ]}
{"type": "delta",    "stream": "deposits", "seq": 129, "data": { "action": "seen|status|reversed", ... }}
{"type": "welcome",  "seq": 0}
{"type": "ping"}
```

要点：
- **snapshot 是首次或补偿失效时的全量**；**delta 是增量**；两者都带 `seq`。
- snapshot 的 seq = 该流当前最新 seq；delta 的 seq 单调递增。
- 客户端重连时带 `lastSeq` 重新订阅：服务端补发 `(lastSeq, currentSeq]` 区间内的 delta；若 `lastSeq` 已滑出补发窗口（buffer 上限），发整份 snapshot 兜底。

## 4. 核心类型（接口签名，可复制；实现自写）

```go
package ws

type Hub struct {
    mu       sync.RWMutex
    conns    map[*Conn]struct{}                // 在线连接登记表
    subs     map[string]map[*Conn]struct{}     // 流名 -> 订阅者集合
    reverse  map[*Conn]map[string]struct{}     // 连接 -> 已订流名集合（反向索引）
    seq      map[string]int64                   // 每流最新 seq
    history  map[string]*ring.Buffer           // 每流增量补发窗口（最近 N 条）
}

func NewHub(historySize int) *Hub

func (h *Hub) Register(c *Conn) error          // conns 登记；返回重复注册错误
func (h *Hub) Unregister(c *Conn)              // 清理 conns + 双向订阅索引；恰好执行一次
func (h *Hub) Subscribe(c *Conn, stream string, lastSeq int64) (Snapshot, error)
func (h *Hub) Unsubscribe(c *Conn, stream string)
func (h *Hub) Publish(stream string, msg Delta) // fan-out：遍历订阅者写 channel

type Conn struct {
    id   string
    ws   *websocket.Conn
    send chan []byte            // 容量有限（慢消费者断连的开关）
    hub  *Hub
}
```

Subscribe 的返回语义（伪代码要点）：
1. `lastSeq == 0` → 返回整份 snapshot（seq = 当前流 seq）。
2. `0 < lastSeq < 当前seq` 且 `lastSeq ≥ 窗口下界` → 从 history 补发 delta 区间 `(lastSeq, current]`。
3. `lastSeq ≥ 当前seq` → 空补发（客户端已最新）.
4. `lastSeq < 窗口下界` → 返回 snapshot 兜底。
5. 记录反向索引，并登记 connection 的流订阅。

**channel 容量与关闭纪律（最容易踩的坑）**：
- 关闭只允许在 Unregister 路径发生，且用 `sync.Once` 或关闭前先标记 closed 加锁——双写/双关都是 panic 源。
- Publish 写 channel 用 `select { case conn.send <- msg: default: 断开 }`；永远不要在持有 Hub 锁的情况下写 socket。
- Reader 永不关闭 channel，Writer 关闭——与 `../standards/code-quality.md` 1.3「channel 所有权单一方向」一致。

## 5. 连接生命周期（Connection lifecycle）

```
建立握手（Accept/Gin 升级）→ 生成 conn.id + 建 send channel + Register
  → 启动 Writer goroutine（for { select: 读 send 写 socket / ticker 发 ping / ctx 取消 })
  → 启动 Reader goroutine（for { 读帧：subscribe/pong；错误 → 触发关闭 })
关闭路径：任何一方出错 → 关底层连接 → Unregister（幂等）→ close send → 两 goroutine 退出
```

要点：
- **Writer 是唯一触碰 socket 写端的 goroutine**；Reader 读到的 subscribe 通过给 Writer 的 channel 或 Hub 的锁安全转发。
- 优雅关闭：服务退役时 Hub 遍历 conns，逐个发 `{"type":"bye"}` 再关（P1 可省略，P2 高可用主备话题里回来）。

## 6. 心跳（ping / pong）

- 服务端每个连接每 30s 写一帧 `{"type":"ping"}`（与业务帧共用 Writer 通道）。
- 客户端应答 `{"type":"pong"}`；服务端用 `websocket.SetReadDeadline` 滚动刷新：任何读帧（含 pong）都重置 deadline，90s 无任何帧 → 读超时 → 走关闭路径。
- 为什么用 read deadline 而不是计数：NAT/负载均衡器会在空闲时回收静默连接，deadline 是「保活 + 踢死尸」二合一。

## 7. fan-out 广播要点

```
Publish(stream, delta):
  1. seq[stream]++；delta.seq = seq[stream]
  2. history[stream] 追加（满则覆盖最旧）
  3. 快照读 subs[stream]，逐个非阻塞投递；投不进 → 标记慢消费者，由对该 conn 的清理路径断开
```

- 订阅集合的读取与 Unsubscribe 并发：统一走 Hub 锁；发布不持有锁做网络 I/O。
- 同一个 stream 的增量顺序 = publish 顺序，即 Kafka 消费者组单分区消费顺序（P1 中 deposits 事件与 WS delta 的序由此保证）。

## 8. 断线重连 seq 补偿（客户端契约）

- 客户端保存 `lastSeq`（本流最后收到的 delta.seq 或 snapshot.seq）。
- 重连 → `subscribe {stream, lastSeq}` → 服务端按第 4 节规则补发 → 客户端校验连续（收到 `seq > lastSeq+1` 视为协议违约，本地错误日志 + 重新 snapshot）。
- 测试期望（写入网关单测）：
  - 订阅后收到 snapshot，seq 与流当前值一致；
  - 断线模拟：Publish 5 条后新连接带 `lastSeq=snapshot.seq` 订阅，只收到 5 条 delta，seq 连续；
  - 带过旧 lastSeq（小于窗口下界）订阅 → 收到整份 snapshot 而非部分 delta；
  - 慢消费者：把 send channel 容量设 1，连续 Publish 超过容量 → 该连接被断开且 Hub 登记表不再含它；
  - 并发：多个 goroutine 同时 Subscribe/Unsubscribe/Publish，`-race` 干净。

## 9. P1 接入方式（不写实现）与 P2 差异

- P1：Kafka `deposits` 消费者 → 每事件一次 `hub.Publish("deposits", delta)`；REST 首次拉取即 snapshot 数据源；面板订阅 `deposits`。
- P2 M3 差异：stream = symbol；快照数据源从「REST 查询」换成「行情服务内存快照」，seq 按流独立（每 symbol 自己的序号）——骨架不变，只是 Publish 的调用方和数据源变了。这正说明边界要按本骨架切，别把 P1 的 MySQL 查询硬编码进 ws 包。

## 10. 验收挂钩

- 本脚手架交付的门槛：上述「测试期望」5 条单测全绿 + `-race`；实体放 P1 仓库 `internal/ws/`（M4 退出条件）。
- 「断线重连补偿」演示 = 客户端打印订阅前后 seq 序列（输出存 `demo/`）——即 `../03-blockchain-indexer/checklist.md` 对应条目。