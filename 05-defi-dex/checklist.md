# 05-defi-dex/checklist.md — Phase 5 验收清单（W15-W16，全「是」= 阶段完成）

> 规则见 `../CLAUDE.md` 3.3：每条布尔可判、外部可验证、答案只有是/否。证据位置为项目仓库内路径。
> 证据属主仓库：P3 = `p3-dex-clone/`；练习 = `solidity-labs/` / `foundry-labs/`（课程根目录下）。

## 主课与练习

- [ ] `solidity-labs/` 与 `foundry-labs/` 两个练习仓库已按 tasks 建好并全部 `git commit`（证据：两仓库命令行执行 `git log --oneline` 各有 ≥5 条提交，输出截图存各自 README）
- [ ] `foundry-labs/` 执行 `forge test` 输出全部通过（Failing tests: 0），命令输出截图存 README
- [ ] docs/cei-notes.md 存在，含 ≥3 处对课程示例违反 CEI 位置的标注，每处附 1 句「为什么会导致重入」的自述
- [ ] docs/ethernaut.md 存在，记录 Ethernaut 通关 ≥8 关（冲刺/最低档按 roadmap 第 5 节砍项时，此项在 README 注明「档位砍项」后允许为否，不阻塞完成）

## P3 项目验收（对应《project-acceptance-10》①②③④⑤⑥⑦⑧⑨⑩）

- [ ] P3 仓库 `git log` 无直接粘贴 Uniswap v2 源码的提交，`docs/uniswap-comparison.md` 记录自写实现与 v2-core 对照差异 ≥5 处（舍入方向/常数/接口取舍）
- [ ] `forge test` 输出 0 失败；`forge coverage` 输出全仓覆盖率 ≥80%，命令原文与截图存 README「测试」节
- [ ] fuzz 测试 ≥1000 轮累计运行 0 crash，且 docs/review.md 有 ≥1 条「fuzz 探测到边界 bug → 修复 → 回归」记录（含根因与修复前后测试输出）；invariant 测试 `k 不减少` 通过
- [ ] `slither .` 运行报告存 docs/security/slither.txt，medium 及以上严重级别 0 条，或每条附「已修复」/「已评估可接受+理由」
- [ ] docs/security/threat-model.md 存在，攻击面表覆盖 ≥4 项资产（重入/价格操纵/精度损失/approve 钓鱼），每项含攻击路径与对应测试名
- [ ] Factory+Pair+Router 三个地址写入 README「部署」节，Sepolia Etherscan 三个页面均显示 Verified，验证截图存 README（浏览器：https://sepolia.etherscan.io/）
- [ ] demo/ 下存在真实 swap 录屏（3-10 分钟，含部署→加池→swap→浏览器 tx/余额特写三幕）与 demo/script.md 分镜脚本；README「演示」节链接可打开
- [ ] 主流程闭环证据：录屏或 cURL/脚本输出中可见一次成功 swap（Balance 变化 + tx 上链）与一次失败 swap（滑点不足 revert）
- [ ] `.github/workflows/ci.yml` 包含 forge fmt --check + build + test + coverage 四步，使用固定 Foundry 版本；README「CI」节有最近 10 次 push 全绿截图（允许 1 次失败→修复→绿）
- [ ] docs/adr/ ≥3 篇 ADR（含 1 篇中途换方案），每篇含背景/备选/决定/后果
- [ ] docs/review.md 含 ≥3 个坑（现象/根因/解法/耗时四要素）与 ≥2 个取舍（选项对比表+理由+重来会怎样）
- [ ] 本 checklist 全勾选结果与各条证据路径已同步写入 `../QA/review-log.md`

## 加分项（不勾选不影响阶段完成）

- [ ] （加分）React 前端（wagmi/viem）连接钱包完成一次真实 swap，录屏存 demo/frontend-swap.mp4，README「演示」节可打开