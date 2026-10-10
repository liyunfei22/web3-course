# 脚手架：GitHub Actions CI（Go：lint + test + coverage + build + Docker 发布）

> 用途：给 P0 短链与 Phase 2 种子工程（及其后的 P1/P2 项目）复用的一条质量门禁流水线。
> 本文件是「环境与装配」类模板，允许完整复制；只改占位符（仓库名/镜像名）。
> 对应验收标准 `../standards/project-acceptance-10.md` ⑧：lint + test + coverage + build 四步、覆盖率门禁在 CI 强制、固定工具版本、依赖缓存。

## 1. 文件：.github/workflows/ci.yml

```yaml
# 复制到 <项目根>/.github/workflows/ci.yml
# 行为：push 到 main 与任何 PR 都跑 quality；仅 main 的 push 额外构建并推送 Docker 镜像。
name: ci

on:
  push:
    branches: [main]
  pull_request:

env:
  GO_VERSION: "1.23.x"          # 固定 Go 版本（大版本需与 go.mod 一致，见 go.mod 首行）
  COVERAGE_THRESHOLD: "80"      # 与验收①的 80% 门禁一致，改阈值需同步两处

jobs:
  quality:
    name: lint + test + coverage + build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache: true            # 按 go.sum 内容做模块缓存，命中后安装依赖秒级完成

      - name: Lint
        uses: golangci/golangci-lint-action@v6
        with:
          version: v1.61.0       # 固定 lint 工具版本，避免「昨天绿今天红」的工具漂移
          args: --timeout=5m

      - name: Test with race detector and coverage
        run: go test -race -coverprofile=coverage.out -covermode=atomic ./...

      - name: Enforce coverage threshold
        run: |
          total=$(go tool cover -func=coverage.out | tail -n 1 | awk '{print $NF}' | tr -d '%')
          echo "coverage: ${total}% (threshold: ${COVERAGE_THRESHOLD}%)"
          if (( $(echo "$total < $COVERAGE_THRESHOLD" | bc -l) )); then
            echo "::error::coverage ${total}% 低于门槛 ${COVERAGE_THRESHOLD}%"
            exit 1
          fi
          echo "::notice::coverage ${total}% >= ${COVERAGE_THRESHOLD}% 通过"
        shell: bash

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-out
          path: coverage.out
          retention-days: 14

      - name: Build
        run: go build ./...

  docker:
    name: build and push image
    needs: quality               # 质量门禁不过不发布
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write            # 推 GHCR 需要
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}   # Actions 内置令牌，无需手工配置

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          file: Dockerfile
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:latest
            ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha   # 跨运行复用构建缓存，二次构建显著提速
          cache-to: type=gha,mode=max

      - name: Image digest
        run: echo pushed ghcr.io/${{ github.repository }}:${{ github.sha }}
```

配套注意：`Dockerfile` 多阶段构建（builder 用 `golang:1.23`、运行用 `alpine` 或 `distroless`），镜像里不包含源码工作区与测试文件；`.dockerignore` 至少排除 .git、coverage.out、*.log。

## 2. 触发与缓存配置说明

| 配置 | 效果 |
|---|---|
| `push: branches: [main]` + `pull_request:` | 日常 PR 只跑质量门禁（不发布镜像），合入 main 才发布——避免每次 PR 都推镜像、tag 爆炸 |
| `actions/setup-go@v5` + `cache: true` | 按 go.sum 散列缓存模块，unix 平台命中后 setup 提速到秒级 |
| `golangci-lint-action@v6` + `version: v1.61.0` | 官方 action 自带 .cache 缓存；版本固定防止工具升级引入新告警 |
| 模板变量替换 | 仓库内多个 Go 模块需并行测试时，把 `go test ./...` 换成 `./...` 或循环 `./cmd/...`；本项目只在根模块，保持简单 |
| 推送 Docker 镜像的令牌 | `secrets.GITHUB_TOKEN` 为该仓库自动签发，scope 已在 permissions 声明；推私有包无需额外 secret |

## 3. 使用与验证步骤

1. 创建仓库后把项目 push 到 GitHub，`.github/workflows/ci.yml` 随仓库进入；
2. 打开 Actions 页：第一次 push 即触发 `ci` workflow——quality 在 PR 上运行，docker 只在 main；
3. 验证门禁：本地把覆盖率人为降到门槛以下（或临时把 COVERAGE_THRESHOLD 改成 99）提交一次，确认流水线显式红色且 `::error::` 行输出覆盖率数字；
4. 验收⑧要求的「最近 10 次 push 全绿」：截图 Actions 页的 workflow run 列表，允许 1 次「失败→修复→绿」记录（截图存项目 README「CI」节）；
5. 每日习惯：push 前先跑一遍 `golangci-lint run ./...` 与 `go test ./...` 本地自测，CI 只是门禁不是开发环境。

## 4. 常见问题排查

| 现象 | 根因 | 解法 |
|---|---|---|
| 流水线在 Setup Go 后一直等 / module 下载超时 | 网络到 proxy.golang.org 不稳定 | setup-go 的 cache 生效后很少发生；确认 go.mod/go.sum 已提交；或配置 `env: GOPROXY` 企业镜像 |
| `golangci-lint` 报「out of memory」 | Go 1.19+ 大项目默认内存分配 | args 加 `--concurrency=2`；或 `GOFLAGS=-buildvcs=false` |
| coverage 门禁行出现但颜色红 | 覆盖率低于 80 就是**正确行为** | 先补测试再提交，不要降阈值；阈值改动要同步验收①的数字 |
| docker job 失败 `permissions` 报错 | workflows 里没声明 `packages: write` | 对照模板补 permissions 块；私有包还需 `packages: read` 拉取基础依赖镜像 |
| push main 但 docker job 显示 skipped | `if` 条件只对 main push 生效 | PR 合绿后确认事件是 push（Actions 页 run 的 event 列）；手动重跑一次验证 |

## 5. 与验收标准的对应

- ⑧「lint + test + coverage + build 四步、push 即触发」→ quality job 四 step；
- 「覆盖率门禁在 CI 内强制（低于 80% 红）且与验收①数字一致」→ Enforce coverage threshold step 用同一个 COVERAGE_THRESHOLD 变量；
- 「固定工具版本（setup-go go-version 与 go.mod 一致）并有依赖缓存」→ env.GO_VERSION 与 go.mod 首行对齐 + setup-go cache + lint action 自带缓存；
- 本项目无前端时，React 管理页的 lint/build 单独加一个 job（node 20 + pnpm/npm cache），P0 全量部署时在 main push 上合入产物。