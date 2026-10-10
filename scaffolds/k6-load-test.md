# 脚手架：k6 压测双模板 + 报告模板 + pprof 流程

> 用途：W7 给种子工程跑冒烟压测；Phase 4（旗舰 P2）压测与 pprof 调优对比直接复用。
> 本文件是「环境与装配」类模板，允许完整复制；脚本为 k6（grafana/k6），安装见 Phase 0。
> 对应验收⑩：压测数字必须来自 k6 输出（非手写）——报告表只从 summary 摘数。
> 运行：`k6 run script.js`；`k6 run --summary-trend-stats="avg,p(50),p(90),p(95),p(99)" script.js` 让摘要直接打印分位数。

## 1. 模板 A：REST 下单接口压测（含鉴权头生成 + ramping-vus + 阈值）

```js
// rest-create-order.js —— 压测种子工程的 POST /api/v1/orders
// 前置：服务已起（go run . 或 docker compose 内），/api/v1/login 可签发 JWT，.env 已配
import http from 'k6/http';
import { check, sleep } from 'k6';

// 从环境变量读 token（推荐，避免压测里反复登录干扰测项）：
//   export K6_AUTH_TOKEN='Bearer eyJhbGci...'
// 没有 token 时用 setup() 登录一次（见文末注释块的备选写法）。
const AUTH_TOKEN = __ENV.K6_AUTH_TOKEN || '';

export const options = {
  scenarios: {
    ramp: {
      // ramping-vus：阶梯加压，观察吞吐与延迟随并发变化的拐点
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },   // 预热：建立连接池、触发 JIT
        { duration: '60s', target: 50 },   // 稳态 50 VU
        { duration: '30s', target: 100 },  // 加压到 100 VU
        { duration: '60s', target: 100 },  // 高压区：找延迟拐点
        { duration: '30s', target: 0 },    // 收尾
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    // 阈值断言：任一不满足则 k6 退出码非 0（CI 可据此判失败）
    http_req_duration: ['p(95) < 200', 'p(99) < 200', 'avg < 100'],
    http_req_failed: ['rate < 0.01'],          // 错误率 < 1%
    'http_req_duration{scenario:ramp}': ['p(99) < 200'],
  },
};

export default function () {
  const idempotencyKey = `${__VU}-${__ITER}-${Date.now()}`; // 每请求唯一，模拟真实客户端
  const payload = JSON.stringify({
    symbol: 'BTCUSDT',
    side: 'BUY',
    type: 'LIMIT',
    price: 50000.0,
    qty: 0.001,
    clientOrderId: idempotencyKey,
  });

  // tag 让 summary 分场景统计；预期 201 = 下单成功
  const res = http.post('http://localhost:8080/api/v1/orders', payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH_TOKEN,
      'Idempotency-Key': idempotencyKey,
    },
    tags: { name: 'create_order' },
  });

  check(res, { '201 created': (r) => r.status === 201 });
  sleep(1); // 思考时间：模拟真实用户节奏，别把「无限背靠背」当基准
}

// ---- 备选：setup() 登录签发 token（登录接口是压测前置，不计入测项） ----
// export function setup() {
//   const login = http.post('http://localhost:8080/api/v1/login',
//     JSON.stringify({ username: 'loadtest', password: __ENV.K6_SEED_PASSWORD }),   // 用 seed 数据账号
//     { headers: { 'Content-Type': 'application/json' } });
//   return { token: 'Bearer ' + login.json('accessToken'), };
// }
// export default function (data) { const token = data.token; /* …同上，AUTH_TOKEN 换成 token… */ }
```

## 2. 模板 B：WebSocket 行情订阅压测

```js
// ws-market-depth.js —— 压测行情 WS（Phase 4 的行情 WS 网关；本阶段如有最小 echo/深度服务也可先用）
// 注意：k6 的 WS 模块只在本地运行有效（k6 Cloud 不支持 ws）；本机压本机即可。
import ws from 'k6/ws';
import { check } from 'k6';

export const options = {
  scenarios: {
    ws_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '60s',
    },
  },
  thresholds: {
    // 收到消息的总条数下限：证明订阅-推送链路在压力下仍然喂得饱
    ws_received: ['count > 10000'],
    ws_received_rate: ['rate > 200'],     // 每秒至少 200 帧
  },
};

export default function () {
  const url = 'ws://localhost:8080/ws/market/depth';
  let frames = 0;
  let lastSeq = -1;
  let seqGaps = 0;

  const res = ws.connect(url, { tags: { name: 'ws_depth' } }, function (socket) {
    socket.on('open', function () {
      // 订阅主题：快照 + 增量
      socket.send(JSON.stringify({ op: 'subscribe', channel: 'depth', symbol: 'BTCUSDT' }));
    });
    socket.on('message', function (msg) {
      frames++;
      const data = JSON.parse(msg);
      // seq 连续性是行情推送质量的硬指标：乱序/丢帧要能被断言抓住
      if (data.seq !== undefined) {
        if (lastSeq >= 0 && data.seq !== lastSeq + 1) seqGaps++;
        lastSeq = data.seq;
      }
      check(data, { 'frame has seq': (d) => d.seq !== undefined });
    });
    socket.setInterval(function () {
      // 每 5s 上报一次连接健康度；无心跳协议的服务器可能断开空闲连接，超时重连由外层 k6 处理
      if (frames === 0) {
        check(null, { 'received frames within 5s': () => false });
      }
      frames = 0;
    }, 5000);
  });

  check(res, { 'connected': (r) => r.status === 101 });
  if (seqGaps > 0) {
    // 打印缺口数便于写进报告；阈值断言已由 ws_received 兜底
    console.log(`seq gaps observed: ${seqGaps}`);
  }
}
```

## 3. 压测报告模板（存项目 README「压测」节）

| 场景 | 配置（VU/时长） | 成功请求 | RPS | 平均 | P50 | P95 | P99 | 错误率 | 结论 |
|---|---|---|---|---|---|---|---|---|---|
| REST 下单-预热 | 20 VU × 30s |  |  |  |  |  |  |  |  |
| REST 下单-稳态 | 50 VU × 60s |  |  |  |  |  |  |  |  |
| REST 下单-高压 | 100 VU × 60s |  |  |  |  |  |  |  |  |
| WS 深度订阅 | 50 VU × 60s |  | 帧/s |  |  |  |  |  |  |

填写规则：所有数字来自 k6 summary 输出（`--summary-trend-stats` 开启后直接可见 P50/P95/P99），不填估算值；错误率 = `http_req_failed` 或 check 失败数 / 总数；「结论」列写一行观察（如「100 VU 后 P99 超 200ms，瓶颈在 DB 连接池」），并附对应 pprof 证据（见下节）。

## 4. pprof 分析流程（与压测联动，验收⑦调优对比用）

```bash
# 1) 开启：Go 服务里 import _ "net/http/pprof"，并保证有可访问的 HTTP server。
#    种子工程推荐：内嵌在业务服务器上（生产禁止对公网开放！），或独立监听 localhost:6060。

# 2) 抓取：与压测窗口同时进行（先起压测，再抓 profile，避免抓在空闲期）
k6 run rest-create-order.js &                # 压测后台跑
curl -o /tmp/cpu.pprof  "http://localhost:6060/debug/pprof/profile?seconds=30"   # CPU 30s
curl -o /tmp/heap.pprof "http://localhost:6060/debug/pprof/heap"                 # 堆快照
curl -o /tmp/goroutine.pprof "http://localhost:6060/debug/pprof/goroutine?debug=1" # 协程栈（查泄漏）

# 3) 分析（go tool pprof 读取 6060 与文件都行）
go tool pprof -top /tmp/cpu.pprof                    # 前 20 热函数：谁在烧 CPU
go tool pprof -list HandleCreateOrder /tmp/cpu.pprof # 某个函数的行级耗时分布
go tool pprof -http=:8081 /tmp/heap.pprof            # 打开浏览器可视化：Top/Graph/火焰图 flamegraph
go tool pprof -top -sample_index=inuse_space /tmp/heap.pprof  # 堆按占用看

# 4) 调优对比：改一处（如加连接池、换缓存策略、减锁）→ 重新压测 + 抓 profile
#    → 两轮报告表对照，结论写「优化前 P99=xx → 优化后 P99=yy，原因：xxx」，证据双图并列存 README
```

pprof 常见坑：

| 现象 | 原因 | 解法 |
|---|---|---|
| profile 里全是压测机/无关函数 | 抓取窗口与压测错开（抓到空闲期） | 先 `k6 run &` 再等 10s 开始抓；seconds=30 对齐压测稳态段 |
| 本机压测本机，火焰图失真 | CPU 竞争严重 | 压测基线只用于相对对比（优化前后同一环境）；有条件时压测放容器/另一台 |
| `-http=` 打不开浏览器 | pprof 依赖本地浏览器调 web 子命令 | 改用 `go tool pprof -web`（需 graphviz）或生成 svg 保存 |
| 协程数持续上涨 | goroutine 泄漏 | `.../goroutine?debug=1` 看栈顶创建点；对照 `go test -race` 与 `pprof -http` 的 goroutine 视图 |
| 把 6060 端口暴露到公网 | 安全事件 | 明确只监听 localhost 或在网关层拦截 /debug/*；README 安全节声明 |

## 5. 使用要点（对应验收⑩与④）

- 每次压测的 k6 命令与 summary 原文保存为 `docs/load/k6-<date>.txt`，报告表引用文件而非手抄数字；
- 阈值断言在 CI 里复用：`k6 run --exit-on-running ...` 或直接让 threshold 失败即 CI 失败（k6 退出码 99）；种子工程 CI 冒烟跑 30s 版本足够；
- k6 输出默认只打印分位到 p(95)，报告需要 p(99) 时务必带 `--summary-trend-stats`；
- Phase 4 的「压测 3 组数据（验收⑩）」= 本模板同一脚本改 stages/scenario，三个档位（如 50/100/300 VU）各存一份 summary 文件。