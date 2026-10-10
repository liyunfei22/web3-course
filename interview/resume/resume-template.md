# resume-template.md — 两页简历模板（数字驱动、STAR 四行段）

> 定位：roadmap W20 交付「简历 2 页数字驱动」；投递动作见 `resume/applying.md`（JD 关键词匹配自查表配合使用）。
> 使用顺序：①通读本文件的「四段写法与 4 行范例」→ ②按自己的项目数据替换 `X` 占位数字（数字必须来自 README/k6 报告/验收证据，禁止编造）→ ③对照「常见坑清单」自检 → ④有条件时找人过一遍（内推人/前同事）。
> 两页规则：第一页 = 头部 + 技能栏 + 项目（重点项目 2 个）；第二页 = 项目续 + 教育 + 证书/语言。正文一页放不下的优先级：量化数字 > STAR 行为 > 形容词。

---

## 一、头部模板（第一页顶部，6 行以内）

```
姓名（英文名放括号，如：Yifan Li (Leo)）
城市/可远程 | 电话 | 邮箱
GitHub: github.com/xxx（放项目仓库，不放空壳）| 博客/笔记: xxx（可选，放写过的 ADR/复盘）
职位意向：Go Backend Engineer (Crypto / Exchange)
一句话：5-month full-time transition from front-end (JS/TS/React) to Go backend + blockchain infrastructure, 4 production-grade projects, all measurable
```

## 二、技能栏模板（按 JD 关键词分组，不写形容词）

| 组 | 写法（每条 = 名词 + 一句用途，不要「精通/熟练」） |
|---|---|
| 后端语言 | **Go**：goroutine/channel、context 超时取消、pprof 调优、go test/-race、标准库 HTTP 与 net/ws |
| 中间件 | **MySQL**：事务/隔离级别/唯一约束防重复；**Redis**：缓存/分布式锁；**Kafka**：分区/消费组/offset 提交/幂等消费；Outbox 模式 |
| 区块链 | 以太坊：扫块 + 事件日志（topics/logIndex）、确认数/reorg 冲正、HD 钱包（BIP32/39/44）派生充值地址；Solidity/Foundry：fuzz/invariant/Slither；Sepolia 部署验证 |
| 工程化 | Docker Compose、GitHub Actions CI（lint+test+coverage+build）、k6 压测、OpenTelemetry/Prometheus 基础、REST/WS 服务设计 |

样板书写死规则：技能栏每个领域最多 4 行，全部是对「真实做过」的描述（每行都能指到项目里的证据）。

## 三、项目段写法：STAR 四行公式

每个项目 4 行：**第 1 行**项目名 + 一句话（规模词用数字）；**第 2-4 行**三条 bullet，每条 = STAR 压缩：情境/任务一句（动词开头省主语）+ 行动一句 + 结果量化一句。

**通用 bullet 公式**：`动词（Built/Designed/Refactored/Led）+ 做了什么 + 用什么技术 + 结果（数字 X → Y / 比率 / 时间）`

### 3.1 范例：P2 迷你交易所（旗舰项目，第一页）

> **Mini Crypto Exchange (Go) — in-memory matching engine + double-entry ledger + WS market data + cold/hot wallet (5 weeks, 4 teammates' worth of scope solo)**
> - Built a price-time-priority matching engine sharded by symbol, running single-threaded in memory with WAL + snapshot recovery; **fuzz-tested 0 failures over N rounds**, `go test -cover` **84% total / 93% matching + ledger**.
> - Designed a double-entry ledger (frozen/available/total) with transactional outbox to Kafka; deposit/reversal idempotent via (txHash, logIndex) unique key — **verified 200 duplicate deliveries → exactly 1 credit**.
> - Delivered a snapshot+delta WebSocket feed with per-client seq recovery; **k6-benchmarked /order at ~X QPS, P50=Xms, P99=Xms, 0% errors**, then cut P99 by Y% after pprof-guided refactor (docs in README).

（占位替换提醒：X/Y/N 全部来自 k6 报告 + pprof 对比 + fuzz 记录，面试会被抽查。）

### 3.2 范例：P1 链上充值监控服务（第二页）

> **Deposit Monitoring Service — Sepolia USDC deposits: poll + WS block scan, idempotent credit, reorg reversal, Kafka + WS + React dashboard (2 weeks)**
> - Scanned Transfer events by (address, topics) with poll/WS dual-track scanning and safe-depth lag; status=1 filtering; reached dashboard **≤ Xs** from chain event (screen-recorded frame timing).
> - Implemented a pending → confirmed → finalized state machine with per-amount confirmations and sequence-numbered reversal events on reorg; **exactly-once credit proven on N-day run of real deposits**.
> - Ran `go test -cover` at **82%** and documented 3 pitfalls (WS drop → silent block loss; logIndex uniqueness) in docs/review.md with root causes.

### 3.3 范例：P3 DEX Clone（第二页）

> **Uniswap v2-style DEX (Solidity + Foundry) — hand-written Factory/Pair/Router + CEI, deployed & verified on Sepolia (2 weeks)**
> - Implemented constant-product math from scratch (mint/burn/swap, sqrt-k, fee logic); **`forge coverage` 85%**; invariant suite asserts x·y≥k and LP share conservation across **N-thousand fuzz rounds, 0 counterexamples**.
> - Followed checks-effects-interactions with explicit guards; **Slither: 0 high / 0 medium**, every finding assessed with evidence file in docs/security/.
> - Deployed on Sepolia with Etherscan source verification (contract 0x…); real swap screen-recording shows approve → swap → balance change; docs/deploy.md reproduces in 30 min.

## 四、教育段（4 行）

- 行 1：学历（学校 + 专业 + 年份，应届/往届写清）；无 CS 学位就写「主修 X，自修 CS 核心课」。
- 行 2：**全职转型项目**（20 周 / 5 个月，弹性 15-22 周）：Go 后端 70% + 区块链 30%，产出 4 个完整项目（P0-P4 可加一行概述）。
- 行 3：关键产出汇总一行：5 个验收全过的项目、180 题算法、2 万字工程文档（ADR/复盘）。
- 行 4（可选）：证书/语言/社区（如 OKX Web3 学习活动、Ethernaut 通关数、英语 CET-6/雅思）。

## 五、常见坑清单（投递前逐条自检）

| 坑 | 表现为 | 改法 |
|---|---|---|
| 形容词堆砌 | 「精通 Go」「熟悉微服务」「深入理解……」 | 全部删掉，换成「做过 + 证据」句（看技能栏写法） |
| 无数字 | 「负责撮合系统」 | 每条 bullet 至少 1 个数字（QPS/覆盖%/延迟/轮数/时长） |
| 放 demo 链接 | 链接指向没维护 / 需要登录 / 打不开的站点 | 只放：GitHub 仓库 + 部署 URL + 录屏（均须当场可用，验收⑩同标准） |
| 一条 bullet 塞三件事 | 「设计并实现了撮合和账务和行情」 | 一条只讲一个 STAR，拆行 |
| 用「我们」 | 「我们做的撮合引擎」 | 统一「I」/「Built」；团队项目写明「my part: …」 |
| 简历与讲述稿数字不一致 | 面试时说的 QPS 和简历差 10 倍 | 简历、README、讲述稿三处数字必须同一来源 |
| 篇幅超 2 页 / 字号小于 10pt | 排版堆砌 | 砍形容词砍教育细节，第一页必须能 20 秒扫完 |
| 中文简历写拼音 | 「撮合引擎匹配引擎」不统一 | 术语统一用「撮合引擎」/「matching engine」双语（CLAUDE.md 术语表） |
| 时间线断裂 | 转岗 5 个月项目空窗说不清 | 空窗期写成「全职转型项目」并列出产出，面试有据 |

## 六、中英文双语版提示

- **中文版**：投 Bitget/Gate/HTX/MEXC/KuCoin 等以中文团队为主的公司；术语按 CLAUDE.md（撮合引擎/账务/三栏/充提/确认数/归集/对账），数字保留英文单位（QPS/P99 照写）。
- **英文版**：投 OKX/Bybit/海外团队（通常英文 JD）；标题统一用第 3 节的英文例句；技能栏保留技术名词原样（order book, idempotency, WAL 等，与 `english/glossary.md` 一致）。
- 两版差异仅限措辞与措辞顺序，**项目数字、仓库链接、时间线必须完全一致**——面试官会交叉核对。
- 文件名：`resume-zh.md` / `resume-en.md`（或导出 PDF，文件名含日期与版本，如 `resume-en-v3-2026-11.pdf`）。

## 七、自检清单（投递前逐条勾选）

- [ ] 简历共 2 页，第一页 20 秒可扫出「Go + 交易所四大件 + 数字」
- [ ] 每条项目 bullet 含至少 1 个数字，且与 README/k6 报告可对上
- [ ] 无形容词堆砌（熟练/精通/深入理解/较好 全部删除）
- [ ] 无打不开的链接：GitHub 仓库、部署 URL、录屏当场可访问
- [ ] JD 关键词匹配自查表（`applying.md`）中「Go/GMP/Redis/Kafka/MySQL/幂等/撮合/钱包」8 项均能在简历中找到对应行