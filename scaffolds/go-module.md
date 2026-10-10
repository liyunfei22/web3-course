# scaffolds/go-module.md — Go 服务骨架（可完整复制）

> 定位：P0-P2 全部 Go 服务的起点（As 骨架基线，A2 的 docker-compose/ci/k6 scaffold 与之配套）。
> 对齐：目录与依赖方向 `../standards/code-quality.md` 1.4（handler → service → store，禁止反向与环）；错误处理 1.2；并发 1.3。
> 用法：复制本文件代码块到项目对应路径，替换业务名（本骨架示例业务 `shortlink`），`go mod tidy` 后按第 12 节验证。
> 说明：骨架属「环境与装配」类脚手架（CLAUDE.md 3.2 例外条款），允许完整可复制；业务逻辑不在本文件（去 lecture/tasks 自己写）。

## 1. 目录布局（真实形态）

```
shortlink/
├── go.mod / go.sum
├── Makefile
├── .env.example
├── .gitignore                      # 至少含 .env、*.local、.DS_Store
├── cmd/server/main.go              # 入口：只做装配
├── internal/
│   ├── config/config.go            # viper：env + 默认值 + 校验
│   ├── server/router.go            # gin 装配：中间件 + 路由 + healthz + pprof
│   ├── middleware/                 # request_id / logger / recovery
│   ├── errs/errors.go              # 业务错误类型 + HTTP 状态码映射
│   ├── handler/                    # HTTP 层：绑定/校验/调 service/映射错误
│   ├── service/                    # 业务规则（短码生成/幂等判定）
│   └── store/                      # 持久层：接口（供单测 mock）+ MySQL 实现
└── migrations/                     # 迁移 SQL（001_init.up.sql / 001_init.down.sql）
```

包依赖方向：`handler → service → store`；`store` 定义接口、`service` 依赖接口（单测 mock 的入口）。

## 2. go.mod 依赖

```go
module github.com/<your-org>/shortlink

go 1.22

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/spf13/viper v1.18.2
	go.uber.org/zap v1.27.0
	github.com/go-sql-driver/mysql v1.8.0
	github.com/redis/go-redis/v9 v9.5.1
)
```

## 3. cmd/server/main.go（装配、优雅退出、healthz、pprof）

```go
package main

import (
	"context"
	"errors"
	"net/http"
	_ "net/http/pprof" // pprof: 在 :6060 上暴露 /debug/pprof（生产用独立端口）
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"

	"github.com/<your-org>/shortlink/internal/config"
	"github.com/<your-org>/shortlink/internal/server"
	"github.com/<your-org>/shortlink/internal/store"
)

func main() {
	// 1. 日志：先出 logger，之后一切错误都带它
	logger, err := zap.NewProduction()
	if err != nil {
		panic(err) // 启动期配置缺失 = 唯一允许 panic 的场景（code-quality 1.2）
	}
	defer logger.Sync() // #nosec G104 -- 刷盘失败可忽略

	// 2. 配置：启动时校验，缺关键项直接退出
	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("load config", zap.Error(err))
	}

	// 3. 依赖：连接池（带超时 ping 验证）
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	st, err := store.NewMySQL(ctx, cfg.DSN())
	if err != nil {
		logger.Fatal("init store", zap.Error(err))
	}
	defer st.Close()

	// 4. 路由装配与 HTTP 服务
	router := server.NewRouter(logger, st, cfg)
	srv := &http.Server{
		Addr:              cfg.HTTPAddr, // 例 :8080（from env APP_ADDR）
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	// 5. 优雅退出：等信号，给在途请求 10s 排水
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-quit
		logger.Info("shutting down")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			logger.Error("graceful shutdown failed", zap.Error(err))
			os.Exit(1)
		}
	}()

	logger.Info("http server listening", zap.String("addr", cfg.HTTPAddr))
	// pprof 独立端口（业务路由不暴露）
	go func() { _ = http.ListenAndServe(":6060", nil) }()
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logger.Fatal("server exited", zap.Error(err))
	}
}
```

## 4. internal/config/config.go（viper：env + 默认值 + 校验）

```go
package config

import (
	"fmt"

	"github.com/spf13/viper"
)

type Config struct {
	HTTPAddr  string
	MySQL     MySQL
	RedisAddr string
	AdminToken string // 管理接口用，仅从 env 注入，绝不进代码
}

type MySQL struct {
	Host string
	Port int
	User string
	Pass string
	DB   string
}

func (m MySQL) DSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?parseTime=true&charset=utf8mb4", m.User, m.Pass, m.Host, m.Port, m.DB)
}

func Load() (*Config, error) {
	v := viper.New()
	// 默认值（开发友好）：env 覆盖默认值；密钥类只允许 env，不留默认
	v.SetDefault("APP_ADDR", ":8080")
	v.SetDefault("MYSQL_HOST", "127.0.0.1")
	v.SetDefault("MYSQL_PORT", 3306)
	v.SetDefault("MYSQL_USER", "root")
	v.SetDefault("MYSQL_PASS", "app123") // 仅开发默认；生产必须 env 覆盖
	v.SetDefault("MYSQL_DB", "app")
	v.SetDefault("REDIS_ADDR", "127.0.0.1:6379")

	v.AutomaticEnv() // 直接读环境变量（12-factor：不读散落配置文件）

	cfg := &Config{
		HTTPAddr:   v.GetString("APP_ADDR"),
		MySQL:      MySQL{Host: v.GetString("MYSQL_HOST"), Port: v.GetInt("MYSQL_PORT"), User: v.GetString("MYSQL_USER"), Pass: v.GetString("MYSQL_PASS"), DB: v.GetString("MYSQL_DB")},
		RedisAddr:  v.GetString("REDIS_ADDR"),
		AdminToken: v.GetString("ADMIN_TOKEN"),
	}
	// 启动期校验：缺关键项 = 不可启动
	if cfg.AdminToken == "" {
		return nil, fmt.Errorf("ADMIN_TOKEN must be set")
	}
	return cfg, nil
}
```

## 5. internal/server/router.go（gin 路由注册 + healthz + pprof 同端口可选）

```go
package server

import (
	"net/http/pprof" // 若希望与业务同端口暴露，见下方注释；默认已由 main 独立 :6060 提供
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/<your-org>/shortlink/internal/config"
	"github.com/<your-org>/shortlink/internal/handler"
	"github.com/<your-org>/shortlink/internal/middleware"
	"github.com/<your-org>/shortlink/internal/store"
)

func NewRouter(logger *zap.Logger, st *store.Store, cfg *config.Config) *gin.Engine {
	if cfg.HTTPAddr == "" {
		gin.SetMode(gin.ReleaseMode) // 生产关闭 debug 输出
	}
	r := gin.New()
	r.Use(gin.Recovery()) // 兜底恢复（业务 panic → 500 JSON）

	// 中间件链（洋葱：请求从外到内）
	r.Use(middleware.RequestID())
	r.Use(middleware.Logger(logger))

	// 健康检查：探活数据库（250ms 超时）
	r.GET("/healthz", func(c *gin.Context) {
		ctx, cancel := c.Request.Context(), func() {}
		done := make(chan struct{})
		go func() { st.Ping(ctx); close(done) }()
		select {
		case <-done:
			c.JSON(200, gin.H{"status": "ok"})
		case <-time.After(250 * time.Millisecond):
			c.JSON(503, gin.H{"status": "degraded"})
		}
		cancel()
	})

	api := r.Group("/api/v1")
	{
		h := handler.NewShortlink(st)
		api.POST("/links", h.Create)
		api.GET("/links/:code", h.Redirect)
		admin := api.Group("", middleware.AdminAuth(cfg.AdminToken)) // 管理路由：ADMIN_TOKEN
		admin.DELETE("/links/:code", h.Delete)
	}

	// 若要与业务同端口暴露 pprof（开发方便）：
	// r.GET("/debug/pprof/*profile", gin.WrapF(pprof.Index))  // 生产按 main 的 :6060 方案
	return r
}
```

（`gin.WrapF` 与 `pprof` import 二选一：脚手架默认走 main 的独立 6060 端口，业务端口不暴露调试接口。）

## 6. internal/middleware（request-id / 日志 / 恢复 / 鉴权）

```go
package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// RequestID 注入 X-Request-Id（无则生成），贯穿响应头与日志
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.GetHeader("X-Request-Id")
		if id == "" {
			b := make([]byte, 8)
			_, _ = rand.Read(b) // #nosec G404 -- 仅作 tracing id
			id = hex.EncodeToString(b)
		}
		c.Set("request_id", id)
		c.Header("X-Request-Id", id)
		c.Next()
	}
}

// Logger 结构化访问日志：method/path/status/耗时/request_id
func Logger(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		logger.Info("access",
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.Int("status", c.Writer.Status()),
			zap.Duration("took", time.Since(start)),
			zap.String("request_id", c.GetString("request_id")),
		)
	}
}

// AdminAuth 管理接口鉴权：ADMIN_TOKEN 走 Header，不进 query（避免日志泄漏）
func AdminAuth(token string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.GetHeader("X-Admin-Token") != token {
			c.AbortWithStatusJSON(401, gin.H{"code": "unauthorized", "message": "invalid admin token", "request_id": c.GetString("request_id")})
			return
		}
		c.Next()
	}
}
```

## 7. internal/errs/errors.go（自定义错误 + HTTP 映射约定）

```go
package errs

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

// 业务错误 = 包内哨兵错误；判定一律 errors.Is/As（code-quality 1.2）
var (
	ErrNotFound       = errors.New("resource not found")
	ErrDuplicateKey   = errors.New("duplicate idempotency key")
	ErrInvalidInput   = errors.New("invalid input")
)

// Error 载体：HTTP 层统一错误模型 {code, message, request_id}
type Error struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	RequestID string `json:"request_id"`
}

// Respond 统一错误出口：service 层返回哨兵 error，handler 只做这一件事
func Respond(c *gin.Context, err error) {
	status := http.StatusInternalServerError
	code := "internal"
	switch {
	case errors.Is(err, ErrNotFound):
		status, code = http.StatusNotFound, "not_found"
	case errors.Is(err, ErrDuplicateKey):
		status, code = http.StatusConflict, "duplicate"
	case errors.Is(err, ErrInvalidInput):
		status, code = http.StatusUnprocessableEntity, "invalid_input"
	}
	c.AbortWithStatusJSON(status, Error{Code: code, Message: err.Error(), RequestID: c.GetString("request_id")})
}
```

**约定**：service 永不返回 HTTP 状态码（那会让业务与协议耦合）；映射表只存在于 handler 网关函数（本文件的 `Respond`）。错误传播一律 `fmt.Errorf("load link by code %s: %w", code, errs.ErrNotFound)` 保留链。

## 8. internal/handler/shortlink.go（handler 三层样例：绑定 → service → 映射）

```go
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/<your-org>/shortlink/internal/errs"
	"github.com/<your-org>/shortlink/internal/store"
)

type CreateReq struct {
	URL         string `json:"url" binding:"required"`
	ClientToken string `json:"client_token"` // 幂等键：重复返回 409
	ExpiresInSec *int64 `json:"expires_in_sec,omitempty"` // nil=永不过期
}

type Shortlink struct {
	st *store.Store
}

func NewShortlink(st *store.Store) *Shortlink { return &Shortlink{st: st} }

func (h *Shortlink) Create(c *gin.Context) {
	var req CreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		errs.Respond(c, errs.ErrInvalidInput)
		return
	}
	// 校验等业务规则在 service 层，见 lecture W3 REST 一节——本文件只示范 handler 形状
	link, err := h.st.CreateLink(c.Request.Context(), /* req 转换后的参数 */)
	if err != nil {
		errs.Respond(c, err) // 唯一错误出口
		return
	}
	c.JSON(http.StatusCreated, gin.H{"code": link.Code, "short_url": link.ShortURL()})
}
```

（`CreateLink` 的完整实现与业务校验留着你自己写——它是 P0-M1 的核心交付。）

## 9. internal/store/store.go（接口 + MySQL 实现）

```go
package store

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

// Link 数据模型（字段与 migrations/001_init.up.sql 对应）
type Link struct {
	ID        int64
	Code      string
	URL       string
	ClientToken sql.NullString
	ExpiresAt *time.Time // nil = 永不过期
	CreatedAt time.Time
}

type Store struct{ db *sql.DB }

func NewMySQL(ctx context.Context, dsn string) (*Store, error) {
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("open mysql: %w", err)
	}
	db.SetMaxOpenConns(20)   // 线程池化：不是每请求一条连接（lecture W1 的坑）
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(time.Hour)
	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("ping mysql: %w", err)
	}
	return &Store{db: db}, nil
}

func (s *Store) Close() error { return s.db.Close() }
func (s *Store) Ping(ctx context.Context) error { return s.db.PingContext(ctx) }

// CreateLink 示例：唯一约束冲突 → 翻译成 ErrDuplicateKey（幂等键靠 DB 兜底）
// 完整实现（code 生成、INSERT、冲突判定、错误翻译）由学员按 P0-M1 要求自己写。
```

**接口隔离提示**：P0 单测要求 mock 外部依赖（`standards/code-quality.md` 1.5）——做法：`service` 依赖接口如 `LinkStore interface { CreateLink(ctx, ...) }`，测试里注入内存 stub；`Store` 实现该接口。骨架保留 `Store` 结构体，接口定义留给 P0 本人。

## 10. migrations/001_init.up.sql（迁移与清库示例）

```sql
-- 001_init.up.sql
CREATE TABLE IF NOT EXISTS links (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    code         VARCHAR(32)  NOT NULL,
    url          TEXT         NOT NULL,
    client_token VARCHAR(64)  NULL,
    expires_at   DATETIME     NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_code (code),
    UNIQUE KEY uq_client_token (client_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS visits (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    link_id    BIGINT       NOT NULL,
    ip         VARCHAR(45)  NULL,
    user_agent VARCHAR(255) NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_link_id (link_id),
    CONSTRAINT fk_visits_link FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

```sql
-- 001_init.down.sql（清库可重复：README 写明 `docker compose down -v` + 重跑迁移）
DROP TABLE IF EXISTS visits;
DROP TABLE IF EXISTS links;
```

## 11. Makefile（本地一键 + CI 同一入口）

```make
# 密码/库名与 A2 compose（../scaffolds/docker-compose.md）一致，走 .env；缺省值仅本地开发用
-include .env
export MYSQL_ROOT_PASSWORD MYSQL_DATABASE
MYSQL_ROOT_PASSWORD ?= root_dev_only
MYSQL_DATABASE ?= app

.PHONY: run build lint test coverage migrate

run:
	go run ./cmd/server

build:
	go build ./...

lint:
	gofmt -l .     # 零输出 = 通过
	go vet ./...

test:
	go test -race ./...

# 覆盖率门禁：低于 80% 退出码非 0（CI 与本地同一命令）
coverage:
	@go test -coverprofile=/tmp/cover.out ./... >/dev/null
	@go tool cover -func=/tmp/cover.out | awk '/total:/ {print; if ($$3+0 < 80) exit 1}'

migrate:
	docker compose exec -T mysql mysql -uroot -p$(MYSQL_ROOT_PASSWORD) $(MYSQL_DATABASE) < migrations/001_init.up.sql
```

## 12. 运行验证（骨架自检三步）

1. 项目根放置 A2 的 `docker-compose.md` 模板（同目录脚手架，或 Phase 0 最小版）→ `cp .env.example .env`（填库名/密码，与 Makefile 变量一致）→ `docker compose up -d` → `make migrate` → `make run`。
2. `curl -i localhost:8080/healthz` → 200 `{"status":"ok"}`；`curl -i localhost:8080/api/v1/links`（未带 body）→ 422 统一错误 JSON（含 request_id）。
3. `go tool pprof -http=:8081 http://localhost:6060/debug/pprof/heap` → 浏览器出现火焰图（Phase 4 调优时用同一入口）。

**与 A2 scaffolds 的接缝（已对齐）**：本骨架 `Makefile` 命令名与 `ci-github-actions.md`（同目录，四步流水线：lint/test/coverage/build + golangci-lint + 覆盖率门禁）同名一致；`.env` 变量（MYSQL_ROOT_PASSWORD / MYSQL_DATABASE / REDIS_ADDR）与 `docker-compose.md` 的 env 占位一致（默认值 root_dev_only / exchange，本地开发可改 app）；k6 冒烟脚本用 `k6-load-test.md` 的模板 A 改 URL 即可。若后续 A2 变更基线，此处随动并记录于 `QA/review-log.md`。

## 13. 变更记录

| 版本 | 日期 | 变更 | 作者 |
|---|---|---|---|
| v1.0 | 2026-10-09 | 初稿 | A1 |