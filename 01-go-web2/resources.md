# Resources 01 — Phase 1 资源清单（9 条 + 2 本书，全部来自已核实资源池）

> 规则：只允许池内链接（`../CLAUDE.md` 附录 A）；每条标注必读/选读 + 用途；书籍只写书名。

| 资源 | 链接 | 标注 | 用途 |
|---|---|---|---|
| go.dev Tour | https://go.dev/tour/ | 必读 | W1 第一天全通；语法第一课，卡住章节标星 W2 回炉 |
| Effective Go | https://go.dev/doc/effective_go | 必读 | W1-W4 每周 2 章精读；error 哲学与命名规范的权威出处 |
| Go By Example | https://gobyexample.com/ | 选读 | 语法速查字典；练习卡壳时先翻它，再查官方 doc |
| Go 内存模型 | https://go.dev/ref/mem | 选读 | W2 并发章节配套：happens-before 与 channel/Mutex 的同步语义（只读第 1-3 节 + 同步机制清单） |
| Docker 文档 | https://docs.docker.com/ | 必读 | W4 Dockerfile 多阶段构建与 compose 网络/卷；troubleshooting 依据 |
| GitHub Actions 文档 | https://docs.github.com/en/actions | 必读 | W4 四步流水线：workflow/job/step 与缓存、版本固定 |
| k6 文档 | https://k6.io/docs/ | 必读 | W4 P0 收尾冒烟：脚本写法与 P50/P99 报告解读 |
| SEPOLIA 区块浏览器 | https://sepolia.etherscan.io/ | 选读 | Phase 0 已用；本阶段无需新操作（Phase 3 刷存在感） |

**书籍（只写书名，不写链接）**：

- 《The Go Programming Language》(Go 圣经)——必读书；W1-W2 读并发与接口相关章（第 8、9 章优先），W3-W4 补错误处理与测试章；与 tour/Effective Go 三线并进，练习驱动选读。
- 《MySQL 实战 45 讲》(极客时间)——必读书；W3 前读完前 20 讲（索引与事务），EXPLAIN 与隔离级别实验（T-08）与之对照；后续阶段可回查。

**使用顺序建议**：正课 = tour（第一天）→ Effective Go（每章配当日主课）→ Go By Example（速查）；补课（每日可选加餐） = Go 圣经（每章一节）与 MySQL 45 讲（每讲一节）。