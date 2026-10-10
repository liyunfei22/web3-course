# QA/review-log.md — 验收与修订记录

> 用途：记录课程包改了什么/为什么/影响哪些下游文件（CLAUDE.md 第 4 节）；验收结论与项目完成留痕（standards/project-acceptance-10.md 验收流程）。
> 冻结基线（README/roadmap/CLAUDE/daily-rhythm/standards·2/projects/SPEC-template）不可由作者单方修改；确需修改登记后由终审（A7）确认。

| 日期 | 记录人 | 类型 | 内容 | 影响文件 |
|---|---|---|---|---|
| 2026-10-09 | A1 | 交付 | 新增 Phase 0 四件套（00-startup/）、Phase 1 四件套（01-go-web2/）、projects/p0-shortlink/SPEC.md、scaffolds/go-module.md；QA 目录首建 | 上述文件（均为新增，未改冻结基线） |
| 2026-10-09 | A1 | 基线冲突裁定 | CLAUDE.md 3.5「任务总数 ≤ 15/阶段」与任务要求「15 CLI + 10 并发共 25 道练习」冲突：按基线为准，tasks.md 把练习按批分组摊入 14 个任务条目，25 道题目完整描述全部保留在 T-02~T-06 内 | 01-go-web2/tasks.md |
| 2026-10-09 | A1 | 分工裁定 | scaffolds/docker-compose、scaffolds/ci、scaffolds/k6 属 A2 交付（CLAUDE.md 第 5 节分工锚点）；Phase 0 最小版 compose 内联于 00-startup/tasks.md D2，仅第 0 周打基础用 | 00-startup/tasks.md |
| 2026-10-09 | A1 | 资源裁定 | 未引入池外资源；00-startup/resources.md 11 条、01-go-web2/resources.md 9 条均取自 CLAUDE.md 附录 A 已核实池，链接与标注与池内一致 | resources.md × 2 |
| 2026-10-09 | A1 | 对齐修正 | 核对 A2 已落盘的 scaffolds（docker-compose.md / ci-github-actions.md / k6-load-test.md）后对齐：Phase 0 最小版 compose 镜像改 mysql:8.0 + redis:7.4-alpine（原 8.4/7.2）；P0 SPEC 技术栈版本改「8.0 / 7.4-alpine（A2 锁定）」；P0 CI 改为直接复用 ci-github-actions.md 模板；go-module.md Makefile migrate 改 .env 驱动（MYSQL_ROOT_PASSWORD/MYSQL_DATABASE，默认值与 A2 一致）；lecture/tasks 中「正式版届时交付」表述改为「已交付」 | 00-startup/tasks.md、01-go-web2/lecture.md、01-go-web2/tasks.md、projects/p0-shortlink/SPEC.md、scaffolds/go-module.md |
| 2026-10-09 | A5 | 交付 | 新增 Phase 5 四件套（05-defi-dex/）、Phase 6 四件套（06-solana/）、projects/p3-dex-clone/SPEC.md、projects/p4-solana-mini/SPEC.md、scaffolds/foundry-project.md（均为新增，未改冻结基线） | 上述文件 |
| 2026-10-09 | A5 | 资源新增 | 按 CLAUDE.md 3.4 流程补充 EIP-20（https://eips.ethereum.org/EIPS/eip-20，核实日期 2026-10-09，用途：P05-03 ERC-20 接口标准精读，P3 池内两代币即两个 ERC-20）至 05-defi-dex/resources.md；其余链接全部取自附录 A 已核实池；备注：eips.ethereum.org 为池外新增域名，待终审 A7 HTTP 200 实测后入池 | 05-defi-dex/resources.md、CLAUDE.md 附录 A（候选，待 A7 确认） |
| 2026-10-09 | A5 | 基线对齐说明 | 任务描述称 Phase 6 为「D1-D4 共 4 天」，roadmap 第 3 节为 course.rs 2 天 → Anchor 2 天 → 复刻 1 天 → 部署+文档 1 天（共 6 学习日）：以基线为准，06-solana 按 D1/D2 各占 2 学习日、D3/D4 各 1 日编排，lecture/tasks 中已注明 | 06-solana/lecture.md、06-solana/tasks.md |
| 2026-10-09 | A7 | 终审交付 | 四类硬指标终审完成，全部通过（详见 QA/review-checklist.md）：完整性 44/44；一致性 8 处修复；checklist 非布尔 0 条；57 个外部 URL 实测、坏链 2 个定责替换、黑名单 0 命中。本行起为本轮审计的「问题→处置→复核」闭环 | — |
| 2026-10-09 | A7 | 坏链替换（已修复） | 问题：`https://course.rs/` 实测 404（全路径，301→beatai.org/rust-course 亦 404），Rust 语言圣经官方仓库 sunface/rust-course README 已改指新址；`https://solscan.io/` 实测 403（Cloudflare 挑战，浏览器 UA/全头/WebFetch 均不通）。处置：替换为官方新家 `https://beatai.org/rust-course`（SPA 路由，内容端点 https://beatai.org/docs/rust-course/_meta.json 实测 200）与官方浏览器 `https://explorer.solana.com/`（脚本客户端 429 限流=官网对自动化客户端常规行为，真人浏览器可开；脚本实测备选 solana.fm 200，未入池）。复核：替换后 `grep solscan.io|course.rs/` 全库 0 残留；受影响文件全部同步 | CLAUDE.md 附录 A（冻结文件，A7 确认变更）、06-solana/resources.md、06-solana/lecture.md、06-solana/checklist.md、06-solana/tasks.md、projects/p4-solana-mini/SPEC.md（7 处 Solscan） |
| 2026-10-09 | A7 | 一致性修复（已修复） | ① SPEC-P4 里程碑学习日自洽：M1 截止第 2 学习日却含第 3-4 日产物（env.md/anchor-notes 移入 M2），脚注「2+1+1」改「2+3+1（对齐 tasks.md D1-D4）」；② P0 SPEC「电荷/Mysql」乱码→「Go/MySQL/Redis/CI」；③ P1 SPEC「稜坑」→「踩坑」；④ P1 SPEC「人日≈12 天」与括号小时数（12+33+3=48h）不自洽→「项目实际投入≈48h」；⑤ glossary 分节计数 35/40→36/53（与总数 119 及实际行数一致）。复核：逐项 grep 复查零残留 | projects/p4-solana-mini/SPEC.md、projects/p0-shortlink/SPEC.md、projects/p1-deposit-watcher/SPEC.md、interview/english/glossary.md |
| 2026-10-09 | A7 | 内部引用修复（已修复） | 相对路径单层过浅 14 处（SPEC-P1×10、SPEC-P2×5、SPEC-P3×3、SPEC-P4×2、scaffolds/go-module.md×1 的 ../ 应为 ../../，反之亦然）+ 04-flagship lecture/tasks 引用不存在文件 `SPEC-p2.md` → `p2-mini-exchange/SPEC.md` + CLAUDE.md 3.1 相对路径示例改为真实可达例。复核：abspath 全库扫描仅剩 07-interview-sprint 指向 interview/answers|whiteboard-log|terms-100|review-sprint 等 W18-W20 学员交付物（设计内留空，非断裂） | projects/p1-deposit-watcher/SPEC.md、projects/p2-mini-exchange/SPEC.md、projects/p3-dex-clone/SPEC.md、projects/p4-solana-mini/SPEC.md、scaffolds/go-module.md、04-flagship-exchange/{lecture,tasks}.md、CLAUDE.md |
| 2026-10-09 | A7 | 资源入池（已闭环） | A5 于本日申请新增池外域名 eips.ethereum.org/EIPS/eip-20：A7 实测 HTTP 200（同域 eip-712 亦 200），按 CLAUDE.md 3.4 流程入池，附录 A 已回填（用途：P05-03 ERC-20 接口标准精读 / P3 自写 ERC-20） | CLAUDE.md 附录 A |
| 2026-10-09 | A7 | 观察记录（不改） | ① 07-interview-sprint 的 terms-100.md 与现成 glossary.md 并存：设计为「现成词库（日常块）+ W20 学员自建背诵卡（含例句三字段）」，lecture 4.1 已写明载体，非冲突；② SPEC-P1 §9「W9 约 33h」与 tasks 逐天「约 5h×8」的弹性口径差（约 40h）属规划软数字，保留作者口径；③ explorer.solana.com/beatai.org 对脚本客户端限流/SPA-404 属官网行为，已记录于 review-checklist 第 4 节，无需再改 | — |

## 项目验收记录（P0 及以后每项目结束追加）

| 日期 | 项目 | 达标条数/总条 | 结论与证据位置 | 记录人 |
|---|---|---|---|---|

<!-- 后续 A2-A7 与本课程维护者在此追加记录 -->
