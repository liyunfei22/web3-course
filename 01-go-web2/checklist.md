# Checklist 01 — Phase 1 验收（第 1-4 周，全「是」= 阶段完成）

> 判定规则：主谓宾完整 + 外部可验证 + 答案只有是/否（`../CLAUDE.md` 3.3）。证据默认存 `phase1/docs/phase1-proof.md` 与项目 README。

## W1 语言与工程化

- [ ] go.dev tour 全部模块截图带「completed」标记，存于 docs/phase1-proof.md「tour」节（证据：截图含模块清单）
- [ ] 15 道 CLI 练习全部在 `phase1/` 仓库内且 `go test ./...` 零失败，命令输出存档（证据：输出含 `ok` 行与通过数）
- [ ] 15 道 CLI 练习中 ≥5 题使用表驱动测试（`[]struct{name, in, want}` + `t.Run`），用 `grep -r "t.Run"` 统计结果存档
- [ ] personal 版迁移对照表 `docs/js-go-map.md` 存在且含 ≥12 行自述条目（不是讲义表格截图，逐行有自我举例）
- [ ] `go vet ./...` 与 `gofmt -l .` 在 phase1 仓库零输出，命令输出存档（证据：空输出 = 通过）

## W2 并发与调度

- [ ] 10 道并发练习全部通过 `go test -race ./...`，输出存档（证据：每道练习的 `ok ... -race` 行）
- [ ] docs/race-notes.md 存在，含 #8 并发计数器与 #10 并发写 map 的「原始 race 报错 → 根因 → 修复」三段记录（每题 3 小节）
- [ ] 八股卡新增 ≥10 张并发卡（GMP / channel 收发 happens-before / Mutex vs RWMutex / select 陷阱等，每卡一问一答可背诵），卡片文件在 phase1 仓库内
- [ ] 并发练习 #4（fan-in 有序汇总）输出严格按序，测试断言（含序号单调性）通过，代码与测试存档

## W3 HTTP / MySQL

- [ ] T-07 小服务 libcurl `/healthz` 返回 200（`curl http://localhost:8080/healthz` 输出中包含 `"status":"ok"` 或 200），输出存档
- [ ] T-07 panic 恢复测试通过：handler 内 panic 时响应为 500 JSON 且进程不退出（`go test` 断言 + httptest 用例存在）
- [ ] docs/isolation-lab.md 存在，含实验 1（脏读）与实验 2（不可重复读）在两种隔离级别下的四组观察记录，每组含「读到什么/结论」
- [ ] docs/sql-plan.md 存在，含同一条 `WHERE code=?` 查询建索引前（type=ALL）与建索引后（type≥ref）的两份 EXPLAIN 输出
- [ ] P0-M1 退出条件 5 条在 SPEC M1 全部勾选，证据（curl 输出/迁移输出）指向可见文件

## W4 Redis / Docker / CI / P0

- [ ] P0-M2 退出条件在 SPEC M2 全部勾选（含缓存 hit 可观测输出与过期码 410 测试）
- [ ] P0 的 Dockerfile 多阶段构建成功，`docker compose up` 后容器内 `/healthz` 返回 200（curl 输出存档）
- [ ] `.github/workflows/ci.yml` 含四步（lint/test/coverage/build），最近 10 次 push 全绿截图存 P0 项目 README「CI」节，其中覆盖率 ≥80% 门禁为流水线内的强制步骤（有低于阈值即红的记录或阈值脚本内容）
- [ ] P0-M3 退出条件在 SPEC M3 全部勾选：React 管理页能创建/删除/展示短链（录屏或分步截图），管理接口带 ADMIN_TOKEN 保护且 `.env` 不入库
- [ ] P0-M4 完成：SPEC 第 8 节验收表 ≥8 行勾选（10 条标准的 P0 判据），README 含 Mermaid 架构图（≥4 组件带数据流方向）、ADR ≥3 篇（≥1 篇中途换方案）、docs/review.md（≥3 坑含四要素 + ≥2 取舍含选项对比）、demo/ 录屏 3-10 分钟 + script.md 分镜
- [ ] 第 1-4 周日志不间断：`journal/` 文件数 ≥24 篇（每篇含完成/卡点/明日起点三行），git log 显示每天 ≥1 个推送 commit（`git log --oneline` 与日志日期对应存档）

**完成标准**：18 条全勾 + P0 验收 ≥8 条 = Phase 1 完成，进入 Phase 2（`../02-*/lecture.md`）。