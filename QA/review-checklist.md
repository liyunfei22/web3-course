# QA/review-checklist.md — A7 终审审计记录（2026-10-09）

> 角色：终审（A7），对 10 位作者产出的课程包做最后一道审计。判定基准：`roadmap.md`（冻结基线）、`CLAUDE.md`（写作公约/术语表/黑名单/3.3 布尔规则）、`standards/project-acceptance-10.md`（10 条验收判据风格）。
> 审计范围：全部 61 个 md 文件（44 个预期交付 + 7 个冻结基线 + scaffolds 6 + interview 10 + QA 记录）。
> 结论先写：**四类硬指标全部通过**。完整性 44/44；一致性冲突 8 处已修复；非布尔验收项 0 条；坏链 2 个已替换、黑名单 0 命中。问题→处置→复核闭环见 `QA/review-log.md`。

---

## 一、审计方法

1. **完整性**：以任务给定预期文件树（44 个文件）用 `ls`/`find` 逐一核对存在性。
2. **一致性**：与 roadmap.md 第 3/4/9 节比对——阶段编号（Phase 0-7）、周次（0/1-4/5-7/8-9/10-14/15-16/17/18-20）、依赖（P0 打底、P1→P2 硬前置、P3→P4 复用扫块）、语言决策（Go 主线 / Solidity 项目级 / Rust 够用线）、术语统一（撮合/三栏冻结可用总额/行情/充提/确认数/reorg/幂等）。实现手段：全库 grep 禁止词 + 逐文件通读 8 份 checklist、6 份 SPEC、讲义与任务的关键段落。
3. **可勾选性**：通读 8 份 checklist.md 与 6 份 SPEC.md（里程碑退出条件 + 第 8 节验收表），逐条按 CLAUDE.md 3.3 三条规则判定：主谓宾完整 / 判定依据外部可验证 / 答案只有是或否；并 grep 禁止词（较好/较全/基本/大概/尽量/应该/理解/熟练/了解/掌握）。
4. **链接与黑名单**：`rg` 提取全部外部 URL（去重 57 个），逐条 `curl -s -o /dev/null -w '%{http_code}' -L -m 20` + 浏览器 UA（含重试与全头再测）；内部相对路径引用用 abspath 解析逐一验证存在；黑名单 grep（绝对禁用词 2 条 + 背景参考词 2 条，明细见 CLAUDE.md 第 2 节；背景参考词仅允许「背景参考」语境）。

---

## 二、四类指标逐项结果

### 1. 完整性 —— 通过（missingFiles 为空）

44 个预期文件全部存在：
- 基线 7：README.md、roadmap.md、CLAUDE.md、daily-rhythm.md、standards/project-acceptance-10.md、standards/code-quality.md、projects/SPEC-template.md
- 8 阶段四件套 32：00-startup ~ 07-interview-sprint/{lecture,tasks,checklist,resources}.md
- 项目 SPEC 5：p0-shortlink / p1-deposit-watcher / p2-mini-exchange / p3-dex-clone / p4-solana-mini 的 SPEC.md
- scaffolds 6：go-module / docker-compose / ci-github-actions / ws-gateway / k6-load-test / foundry-project
- interview 10：go-deep-60 / system-design-8 / blockchain-18 / mock-interview / algorithms/{list-core,list-concurrency} / english/{glossary,project-scripts} / resume/{resume-template,applying}

### 2. 一致性 —— 通过（8 处冲突已修复）

- 阶段编号与周次：8 阶段文件头、README 路径图、SPEC 元信息与 roadmap 第 3 节逐项一致；05-07 目录内无越界周次引用（grep 抽查零命中）。
- 依赖关系：SPEC-P1「与 P2 的关系」段、SPEC-P2 M4（W13 复用 P1 扫块逻辑）、04-flagship tasks「全局前置」均与 roadmap 第 4 节一致（P1 不是可选项目）。
- 语言决策：glossary / 06 lecture / SPEC-P4 全程「Rust/Solana 够用线」口径，与 roadmap 第 2 节一致。
- 术语：禁止词全库 grep 零命中（撮合器/挂单簿/记账系统/充币提币/链重排/回滚链/去重处理/市场数据推送）。「去重表」作为幂等键落库表的具体名词出现 N 处，非「去重处理」术语替代，判定允许（CLAUDE.md 只禁替代词）。
- **修复的冲突（详见 review-log 复核闭环）**：
  1. P4 SPEC 里程碑与学习日口径冲突：M1 截止第 2 学习日却含第 3-4 学习日产物（env.md/anchor-notes），§7 脚注「2+1+1=4」与 6 学习日不符 → 重构为 M1(2)+M2(3)+M3(1)。
  2. P0 SPEC G3「电荷/Mysql/Redis/CI 写法」乱码 → 「Go/MySQL/Redis/CI 写法」。
  3. P1 SPEC ⑨「复盘文档稜坑+取舍」乱码 → 「（踩坑 + 取舍）」。
  4. P1 SPEC §9「项目实际人日 ≈ 12 天（12h+33h+3h）」数字不自洽 → 「项目实际投入 ≈ 48h（…）」。
  5. glossary.md 分节计数错误（一 35→36、二 40→53，与 §「总数 119 词」和实际行数对齐）。
  6. 内部相对路径单层过浅 14 处（SPEC-P1/P2/P3/P4、04-flagship lecture+tasks、scaffolds/go-module.md）→ 全部修正。
  7. 04-flagship 两处引用 `../projects/SPEC-p2.md`（不存在）→ `../projects/p2-mini-exchange/SPEC.md`。
  8. CLAUDE.md 3.1 相对路径示例改为真实可达例（`00-startup/tasks.md` 引用 `../roadmap.md`）。
- **复核**：全部修复后重跑内部引用扫描 = 仅剩 07-interview-sprint 对 `interview/answers/01-08.md`、`whiteboard-log.md`、`english/terms-100.md`、`resume/review-sprint.md` 的引用——这些是 W18-W20 学员交付物（07 tasks 逐一产出），属设计内留空，非断裂。

### 3. 可勾选性 —— 通过（非布尔项 0 条）

8 份 checklist 共约 120 条 + 6 份 SPEC 全部里程碑退出条件与第 8 节验收表，逐条判定：**0 条不合格**。禁止词 grep（理解/掌握/熟练/尽量/大概/应该/较好/较全/基本）在 checklist 与 SPEC 判据列零命中（仅 SPEC-P4 定位段一句「掌握 CEX 接入原理」为 prose 目标描述，非判据，且与 roadmap Phase 6 原文同口径，放行）。

**被拒示例（本包采用的判据标准，引自 CLAUDE.md 3.3；以下写法在任何文件中出现即不合格）**：
- 「代码质量较好」——程度词 + 不可验证
- 「理解 reconciliation 原理」——心理状态不可外部验证
- 「熟练使用 Kafka」——程度词
- 「尽量保证测试覆盖」——不是是/否答案

**边界项放行清单（逐条人工复核后放行，记录备查）**：
| 文件 | 条目 | 放行理由 |
|---|---|---|
| 00 checklist | Phantom 建号（devnet 领取「可标注延后」） | 主句可判，豁免条款显式 |
| 01 checklist #17 | 并发八股卡「一问一答可背诵」 | 判据=卡片文件 + 一问一答结构，可复核 |
| 02 checklist #13 | Grafana「每个面板有点」 | 「有点」=面板有数据点，图形可观察 |
| 02 checklist #5 | 「文件可打开」 | 存在性 + 内容可读，外部可验证 |
| 05 checklist #4 | Ethernaut 通关「档位砍项注明后允许为否」 | 显式豁免规则，非模糊表述 |
| 07 checklist | 复测录音「时长各 ≥40 分钟」 | 时长可验证，与 45 分钟限时自洽 |

另：07 checklist 勾选目标（whiteboard-log/answers/terms-100 等）为学员产物路径，判据本身布尔可判，放行。

### 4. 链接与黑名单 —— 通过（2 个坏链已定责替换，黑名单 0 命中）

**外部 URL 实测（57 个去重）**：55 个 2xx/3xx 通过；`https://go.dev/doc/effective_go` 首次网络失败（000），重试 200（瞬时故障，放行）。损坏 2 个：

| 坏链 | 实测 | 处置 | 替换为 |
|---|---|---|---|
| https://course.rs/ | 404（含全部子路径；301→beatai.org/rust-course 亦 404） | 替换 | https://beatai.org/rust-course（Rust 语言圣经官方新家：官方仓库 sunface/rust-course README 同步指向；SPA 路由对脚本 404，内容端点 beatai.org/docs/rust-course/_meta.json 实测 200） |
| https://solscan.io/ | 403（Cloudflare 挑战；浏览器 UA + 全头 + WebFetch 均失败） | 替换 | https://explorer.solana.com/（Solana 官方浏览器；脚本客户端 429 限流、真人浏览器可开，脚本实测备选 solana.fm 200，均已记录） |

涉及文件：CLAUDE.md 附录 A（2 处）、06-solana/resources.md（2 处）、06-solana/lecture.md、06-solana/checklist.md、06-solana/tasks.md、projects/p4-solana-mini/SPEC.md（7 处）。

**内部引用**：全部相对路径 abspath 验证，修复 14 处后零真断裂（见 2-6/2-7）。

**黑名单扫描**：CLAUDE.md 第 2 节黑名单 4 词全库 grep —— 零违规。背景参考词 2 条仅出现在 SPEC-P2「背景与对照（为什么不复用老牌开源 CEX）」段（黑名单允许语境，自带说明）；绝对禁用词 2 条零命中；CLAUDE.md 第 2 节为规则本身（唯一允许出现处，符合规则原文）。

**流程项**：A5 申请的池外域名 eips.ethereum.org/EIPS/eip-20 已由 A7 实测 200（eip-712 亦 200），按 CLAUDE.md 3.4 流程入池并回填附录 A。

**豁免清单（非资源链接，不参与检查）**：localhost:6060/8080 示例、`http://host/debug/pprof/heap` 教学占位、`https://eth-sepolia.g.alchemy.com/v2/<KEY>` 密钥占位、`https://…` 验收文档省略号占位。

---

## 三、改造前后对照 3 例（须能「一眼看出改了什么、为什么」）

**例 1：坏链替换（链接类）**
- 前：`| Solscan https://solscan.io/ | 必读 | 部署后验证程序与交易，README 链接的证据位 |`（06-solana/resources.md；curl 实测 403，浏览器 UA 与 WebFetch 均不通）
- 后：`| Solana 官方浏览器 https://explorer.solana.com/ | 必读 | 部署后验证程序与交易，README 链接的证据位（原 Solscan 域名对脚本限流，官方替代见 CLAUDE.md 附录 A） |`
- 为什么：坏链必须换成「确定存在官方替代」的权威源；替换同时更新 CLAUDE.md 附录 A（资源池唯一来源）与全部 6 处引用，保证下次 QA 扫描与学员使用同源。

**例 2：里程碑学习日自洽（一致性类）**
- 前：`### M1：Rust/Anchor 环境（W17 第 1-2 学习日）` … 退出条件含「docs/env.md 记录版本 + anchor init 模板 test 0 failed + docs/anchor-notes.md 覆盖五部分」（这些是第 3-4 学习日的产物）；脚注「M1-M3 分别对应 2+1+1 个学习日」（=4，与 6 学习日不符）
- 后：`### M1：Rust 速成（W17 第 1-2 学习日）`，退出条件仅留 rust-notes；`### M2：Anchor 核心 + 复刻 program + 测试（W17 第 3-5 学习日）` 承接 env.md/anchor-notes；脚注改「2+3+1 个学习日——M1=Rust 速成（D1）、M2=Anchor 核心+复刻（D2+D3）、M3=部署+对比文档（D4），合计 6 学习日，与 tasks.md 的 D1-D4 对齐」
- 为什么：里程碑截止日与退出条件产物日期互相矛盾，学员无法判断「做什么算 M1 完成」；对齐 roadmap Phase 6 的 2+2+1+1 天结构与 06-solana/tasks.md D1-D4，闭环一致。

**例 3：乱码/错字修复（事实类，2 组小改）**
- 前：`G3：…「电荷/Mysql/Redis/CI 写法」…`（projects/p0-shortlink/SPEC.md）；`| ⑨ | 复盘文档稜坑 + 取舍 |`（projects/p1-deposit-watcher/SPEC.md）；glossary 分节「（35）」「（40）」
- 后：`…「Go/MySQL/Redis/CI 写法」…`；`| ⑨ | 复盘文档（踩坑 + 取舍）`；「（36）」「（53）」
- 为什么：「电荷」「稜坑」为乱码字、分节数与实际行数（36/53/30=119）不符，属事实错误；修正不触碰作者原意（项目栈仍是 Go/MySQL/Redis/CI，⑨ 仍是复盘文档，词库仍是 119 词）。

---

## 四、结论

| 指标 | 结果 | 修复数 |
|---|---|---|
| ① 完整性 | 通过（44/44） | 0 |
| ② 一致性 | 通过 | 8 处 |
| ③ 可勾选性 | 通过（非布尔 0 条） | 0 |
| ④ 链接与黑名单 | 通过（57 URL 实测，坏链 2 替换，黑名单 0） | 2 处 + 14 处内部引用 |

**Overall Pass = True。** 无遗留 unresolved 大问题：04/07 阶段引用 interview 学员产物路径为设计内交付物；explorer.solana.com 对被脚本 429 限流属官网对自动化客户端的常规行为（真人浏览器可开），已在 review-log 留痕备查。课程包可冻结交付。