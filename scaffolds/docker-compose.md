# 脚手架：docker-compose.yml（MySQL 8 + Redis 7 + Kafka KRaft）

> 用途：一条命令拉起 Phase 1/2/4 全部基础设施。本文件是「环境与装配」类模板，允许完整复制。
> 适用：W5 起所有需要 Kafka 的任务；P0/P2 项目直接复用（端口与密码按需改 .env）。
> 依赖：Docker Desktop（或 docker + compose v2）；首次拉到镜像约 5-15 分钟。

## 1. 文件：docker-compose.yml

```yaml
# 复制为 <项目根>/docker-compose.yml，与 .env.example 同目录。
# 版本说明：compose 文件用 v2 语法（services 顶层），无需 version 字段。
# 镜像策略：Kafka 用官方 apache/kafka（原生 KRaft，免 Zookeeper）；
# 如需换成 confluentinc/cp-kafka，环境变量前缀从 KAFKA_ 改为 KAFKA_CFG_ 即可。
name: exchange-dev

services:
  mysql:
    image: mysql:8.0
    container_name: ex-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root_dev_only}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-exchange}
      MYSQL_USER: ${MYSQL_USER:-exuser}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-expass}
      TZ: ${TZ:-Asia/Shanghai}
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --default-time-zone=+08:00
    ports:
      - "${MYSQL_PORT:-3306}:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./initdb:/docker-entrypoint-initdb.d:ro   # 可选：首次启动时执行建表脚本
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -u root -p$$MYSQL_ROOT_PASSWORD --silent"]
      interval: 5s
      timeout: 3s
      retries: 20
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 512M

  redis:
    image: redis:7.4-alpine
    container_name: ex-redis
    restart: unless-stopped
    environment:
      TZ: ${TZ:-Asia/Shanghai}
    command: ["redis-server", "--appendonly", "yes", "--maxmemory", "128mb", "--maxmemory-policy", "allkeys-lru"]
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
    deploy:
      resources:
        limits:
          memory: 256M

  kafka:
    image: apache/kafka:3.8.0
    container_name: ex-kafka
    restart: unless-stopped
    environment:
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qk # KRaft 集群 ID（任意 base64 风格字符串，首次格式化用）
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller     # 单节点同时扮演 broker 与 controller
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
      KAFKA_NUM_PARTITIONS: 3          # 新建 topic 默认分区数（与 W5 并发消费实验呼应）
      KAFKA_LOG_RETENTION_HOURS: 24    # 笔记本磁盘保护；生产按业务定
      KAFKA_HEAP_OPTS: "-Xmx512m -Xms512m"
      TZ: ${TZ:-Asia/Shanghai}
    ports:
      - "9092:9092"                    # 宿主机客户端（Go 程序跑在宿主机时用 localhost:9092）
    volumes:
      - kafka_data:/var/lib/kafka/data
    healthcheck:
      test: ["CMD-SHELL", "/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list >/dev/null 2>&1"]
      interval: 10s
      timeout: 5s
      retries: 30
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 1G

volumes:
  mysql_data:
  redis_data:
  kafka_data:
```

配套 `.env.example`：

```bash
# 复制为 .env 后按需修改；.env 不入 git（见 standards/code-quality.md）
MYSQL_ROOT_PASSWORD=root_dev_only
MYSQL_DATABASE=exchange
MYSQL_USER=exuser
MYSQL_PASSWORD=expass
MYSQL_PORT=3306
REDIS_PORT=6379
TZ=Asia/Shanghai
```

## 2. 使用步骤

```bash
cp .env.example .env          # 首次
docker compose up -d          # 起全部
docker compose ps             # 等三个容器 status 均为 healthy（Kafka 首次格式化约 20-60s）
docker compose logs -f kafka  # 看启动日志；出现 "started (kafka.server.KafkaRaftServer)" 即就绪
# 冒烟验证
docker exec ex-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
docker exec ex-redis redis-cli ping            # PONG
docker exec ex-mysql mysql -uexuser -pexpass exchange -e "SELECT 1;"
# 停/清
docker compose down          # 停，保留数据卷
docker compose down -v       # 停并删除数据卷（相当于格式化；慎用，见坑 6）
```

## 3. 常见问题排查表

| 现象 | 根因 | 解法 |
|---|---|---|
| 端口被占：`docker compose up` 报 bind 失败 / address already in use | 本机已有服务占用 3306/6379/9092 | `lsof -nP -iTCP:3306 -sTCP:LISTEN` 找到占用进程；改 `.env` 里对应端口重新 `up -d`，客户端连接串同步改 |
| 容器反复重启 / `docker compose ps` 里 Restarting | 启动命令失败或内存超限被 OOM 杀 | `docker compose logs <svc>` 看最后 20 行；`docker inspect ex-kafka | jq '.[0].State.OOMKilled'` 为 true 则是内存上限太小，调大 deploy.resources.limits.memory 后 `up -d` |
| Kafka 容器 healthy 但 Go 客户端报 `connection refused` | advertised.listeners 只广播 localhost:9092，客户端用的 host:port 与它不一致 | 客户端在宿主机 → 用 `localhost:9092`；客户端在另一个容器里 → 需要在 compose 里给 kafka 增加内部 listener（`KAFKA_LISTENERS` 加 `PLAINTEXT://0.0.0.0:19092` 并 `KAFKA_ADVERTISED_LISTENERS` 同时含 `PLAINTEXT://kafka:19092`），且 app 容器与 kafka 同网络 |
| 客户端 `connection refused` 但 Kafka 日志正常 | 服务还没就绪（健康检查未绿）就连接 | `docker compose ps` 等 kafka 显示 healthy 再连；写连接重试（kafka-go 默认会重试） |
| 客户端报 `Cluster ID 不匹配` / 启动日志报 cluster id 校验失败 | 数据卷里的集群 ID 与 CLUSTER_ID 环境变量不一致（换了机器或改过 compose） | `docker compose down -v` 清掉 kafka_data 卷后重新 `up -d` |
| MySQL 客户端报 `authentication plugin 'caching_sha2_password'` 不支持 | 用了过老客户端（如旧版 python 驱动） | 教学优先换新驱动；或建专用用户 `CREATE USER 'x'@'%' IDENTIFIED WITH mysql_native_password BY '...'` |
| Go 读 MySQL 时间比本地早/晚 8 小时 | 连接串没开 parseTime / 时区未对齐 | DSN 加 `?parseTime=true&loc=Local`；`default-time-zone` 已在 command 里设为本区（生产建议统一 UTC 存储） |
| 容器内 `curl localhost:9092` 不通 | 端口映射只对宿主机生效 | 容器内访问用服务名 `kafka:9092`（配坑 3 的 listener）；`localhost` 在容器里指容器自己 |
| Kafka 消费端频繁 rebalance / 处理超时 | SessionTimeout 过小或单条处理超过 timeout | 客户端 ReaderConfig.SessionTimeout 保持 ≥ 6s；先查处理逻辑里的阻塞调用（见 lecture 1.8） |
| 磁盘迅速占满 | KAFKA_LOG_RETENTION_HOURS 未设或生产量较大 | `docker exec ex-kafka /opt/kafka/bin/kafka-configs.sh --bootstrap-server localhost:9092 --alter --entity-type topics --entity-name <topic> --add-config retention.ms=86400000`；长期用再调 compose 默认值 |

## 4. 注意事项

- **时区**：本模板给教学机设了 `Asia/Shanghai` 便于对照日志；交易所生产约定一律 UTC 存储、展示层转本地时区——这是要写进 README 的取舍说明。
- **仅单机开发用**：单副本（replication.factor=1）、无认证、明文 PLAINTEXT。生产至少 3 副本 + SASL/TLS，不在本课程范围。
- **healthcheck 的 start_period**：Kafka 首次启动要格式化存储目录，健康检查 30s 内不判失败；若机器慢导致一直 unhealthy，把 interval/retries 调大。
- **`down -v` 会删数据**：MySQL/Redis 数据与 Kafka 全部日志都会消失，等同于清库；只在确认不需要旧数据时用（验收⑦的可复现要求也需要这条命令的正确使用）。
- 期望的「一键环境」验收方式：全新机器 `cp .env.example .env && docker compose up -d` 后，三个容器 healthy 用时 ≤ 5 分钟（不含拉镜像）。