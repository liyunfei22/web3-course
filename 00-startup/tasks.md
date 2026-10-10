# Tasks 00 — 第 0 周分天任务（3-5 天）

> 使用说明：每任务含「预计时长（标准档参考）/ 前置 / 输出物」。冲刺档可把 D4+D5 合并到一天；最低档把 D3 拆为两天。
> **每日收尾不可省**：三行日志 + 当日 commit push（课程协议，见 `lecture.md` 第 5 节）。
> 证据统一存档：`00-startup/docs/startup-proof.md`（每个任务的截图/命令输出/版本号都往里追加，含日期标题）。

---

## D1 环境安装与基线验证（预计 4h / 前置：无 / 输出：startup-proof.md「环境」节）

1. 安装并按 `lecture.md` 第 1 节清单逐项验证：Go ≥ 1.22、Docker Desktop（daemon 运行中）、VS Code + Go 插件（或 GoLand）、git、k6、jq。
2. 配置 git 全局身份：`git config --global user.name` / `user.email`。
3. 记录全部版本号：`go version`、`git --version`、`node --version`、`k6 version`，按「工具 | 版本 | 安装日期」表格存进 startup-proof.md。
4. 跑通第一个 Go 程序：任意目录 `go mod init hello` 写 hello world，`go run .` 正常输出，`gofmt -l .` 无输出（零文件被格式化 = 格式本来就对）。
5. 首次 journal：写 `00-startup/journal/2026-..-..md`（当天日期）三行日志 + 第一个 commit。

**验收对照**：checklist #1；卡壳 >30 分钟即启动「30 分钟规则」换路。

## D2 中间件三件套：docker compose 一键起 + 连通验证（预计 3h / 前置：D1 / 输出：compose 全绿截图 + 验证输出）

1. 建 `00-startup/infra/` 目录，把下面的 `docker-compose.yml` 原样保存（Phase 0 最小版，内嵌开发密码 **app123** 仅限本机；正式版见 `../scaffolds/docker-compose.md`（A2 已交付：mysql:8.0 + redis:7.4-alpine，密码/库名走 .env），本周先用最小版打基础，P0-M1 起切换正式版）。
2. `docker compose up -d`，观察启动日志；`docker compose ps` 直到三服务全部 `healthy`（截图存 startup-proof.md「中间件」节）。
3. 连通验证三连（每条都要留输出）：
   - `docker compose exec mysql mysql -uroot -papp123 -e "SELECT 1;"`（另建库验证：创建 `CREATE DATABASE app;`）
   - `docker compose exec redis redis-cli ping` → 必须输出 `PONG`
   - `docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list` → 输出空表或 topic 列表（不报错即可）
4. 日常收摊习惯：`docker compose down`（数据卷保留 `docker compose down -v` 才删数据——先用 down，不要 -v）。

```yaml
# 00-startup/infra/docker-compose.yml — Phase 0 最小版（KRaft 单节点，mysql:8.0 与 A2 正式版对齐）
# 说明：正式版由 A2 交付于 ../scaffolds/docker-compose.md（密码/库名走 .env），P0-M1 起统一切换；本文件仅第 0 周打基础用。
services:
  mysql:
    image: mysql:8.0
    container_name: camp-mysql
    environment:
      MYSQL_ROOT_PASSWORD: app123
      MYSQL_DATABASE: app
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-uroot", "-papp123"]
      interval: 5s
      timeout: 3s
      retries: 30

  redis:
    image: redis:7.4-alpine
    container_name: camp-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 30

  kafka:
    image: apache/kafka:3.7.1
    container_name: camp-kafka
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
    healthcheck:
      test: ["CMD-SHELL", "/opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092 >/dev/null 2>&1"]
      interval: 10s
      timeout: 5s
      retries: 30

volumes:
  mysql_data:
```

**已知坑**：Kafka 首次启动会初始化存储目录，第一分钟 `healthcheck` 处于 starting 属正常；`KAFKA_NODE_ID` 与 `quorum voters` 必须数字一致（本文件都是 1），改任一必须同改。4000 端口类报错与端口占用：`lsof -i :9092` 排查。

**验收对照**：checklist #2、#3。

## D3 注册清单与链上预装备（预计 2.5h / 前置：D1 / 输出：RPC 区块号记录 + 钱包/余额截图）

1. 注册 Alchemy（或 Infura），创建 App 网络选 **Sepolia**，复制 JSON-RPC URL 到 `docs/startup-proof.md`（KEY 属于轻度敏感信息，只存本机文档，不进 git 也无妨；`.env` 相关的 git 忽略惯例从 P0 就要养成：仓库根建 `.gitignore`，至少含 `.env`、`.DS_Store`、`*.local`）。
2. 安装 MetaMask → 创建账户 → 网络切换到 Sepolia（显示「Sepolia test network」）→ 复制地址 → 到 Alchemy 水龙头（`resources.md` 链接）领测试 ETH → 到 sepolia.etherscan.io 查该地址余额 > 0，截图存档。
3. 安装 Phantom → 创建账户（选做：领 1 次 devnet SOL：faucet.solana.com，地址粘贴后 Claim；这只是预注册，Phase 6 才用）。
4. **读链验证**（checklist #4 的判据）：
   ```bash
   curl -s -X POST https://eth-sepolia.g.alchemy.com/v2/<你的KEY> \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq .result
   ```
   结果形如 `"0x6f2a3b"`：用 `$((16#6f2a3b))` 转十进制记录；到 sepolia.etherscan.io 核对 Latest Block 一致，两个数字都写进 startup-proof.md。

**验收对照**：checklist #4、#5、#6。

## D4 GitHub 组织与课程仓库骨架（预计 2h / 前置：D3 / 输出：组织 + 仓库 + 首个 commit）

1. 登录 GitHub → 右上角创建 **Organization**（免费档即可）→ 名建议 `yourname-web3-camp`。
2. 组织内建仓库 `web3-camp`（Private），初始化 README。
3. 本地克隆，建骨架：`docs/` 目录（把 startup-proof.md 挪进 `docs/` 并提交）、`.gitignore`（含 `.env` 等）、`README.md` 写一句话课程说明 + 目录链接（指向 `00-startup/lecture.md` 等）。
4. 写入占位 CI（本阶段只验证 Actions 跑通，四步流水线 W4 再补）：
```yaml
# .github/workflows/ci.yml — 占位版：仅验证 Actions 通道；Phase 1 W4 替换为四步流水线
name: ci
on: [push]
jobs:
  hello:
    runs-on: ubuntu-latest
    steps:
      - run: echo "course repo actions channel ok"
```
5. 首次提交（Conventional Commits 规范，见 `../standards/code-quality.md` 1.6）：
   `chore: init course repo skeleton`，push 后到仓库 Actions 页确认该次运行绿色，截图存档。

**验收对照**：checklist #7。

## D5 动机页、课程协议与自评（预计 3h / 前置：D2 + D4 / 输出：journal/startup.md + 自评记录）

1. 写 `00-startup/journal/startup.md`，三栏（目标岗位 / 每日可用小时 + 选定弹性档位 / 截止日）+ 课程协议 5 条承诺（抄录后逐条点头签署）。
2. 完成 `lecture.md` 第 6 节**自评 10 题**：每题 60 秒口答，把盲区题号与「说不出的点」写进 startup.md，并按第 7 节核对参考答案。
3. 自评产出定位：盲区清单 → 写下它对应 Phase 1 的章节（W1 链路 / W2 并发 / W3 数据库 / W4 缓存锁 / Phase 2 队列）——这份清单就是第 1 周学习的注意力地图。
4. 每周末的复盘规划习惯从本周开始：周日回顾本周 checklist 证据是否齐全（缺的截图/输出周六补）。
5. 本周 commit 收尾：`chore: mark phase 0 checklist complete`（`../standards/code-quality.md` 1.6 的每阶段收尾提交约定）。

**验收对照**：checklist #8、#9、#10。