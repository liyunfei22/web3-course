# Phase 4 旗舰 P2 迷你交易所验收勾选（第 10-14 周）

> 规则：每条只允许勾选「是/否」，全部为「是」= 阶段完成。任何一条不能立即给出证据位置 = 记为「否」并列入修复清单。证据以项目内路径或截图为主；本表勾选版需复制进项目 README「验收」节（验收标准 ⑩）。
> 覆盖对齐：`../roadmap.md` 第 9 节（P2 全量 10 条验收，强制 ①②④⑤⑥⑧⑨⑩）与 `../standards/project-acceptance-10.md`。

## W10 撮合引擎（M1）

- [ ] 是/否：`go test -cover ./pkg/matching ./pkg/ledger` 输出撮合包覆盖率 ≥ 90%（全仓合并 ≥ 80%），命令原文与输出截图存入项目 README「测试」节。
- [ ] 是/否：`go test -run '^$' -fuzz FuzzMatchInvariant -fuzztime 30s` 本地运行 0 panic、0 失败，且 CI 或本地完成 ≥ 1000 轮记录（轮数与命令写入 `docs/test.md`）。
- [ ] 是/否：重启恢复测试通过：随机指令 ≥ 10000 条后 kill -9 强制退出，重启回放 WAL+快照后 `Depth()` 指纹与崩溃前一致，输出存 `docs/recovery.txt`。
- [ ] 是/否：撮合规则测试组全绿：IOC/FOK/市价/自成交防护各有命名测试（FOK 不全成即整单拒、IOC 部分成交后剩余取消、同 UserID 不成交），且同价 FIFO 由乱序注入用例断言成交顺序与提交顺序一致。

## W11 账务域（M2）

- [ ] 是/否：三栏守恒实验通过：并发指令（下单/撤单/成交/充提）≥ 500 条后逐账户 `total == frozen + available` 且全局变更仅来自充提，输出存 `docs/recon-balance.txt` 含零差异结论行；同时 `grep` 核心包（matching/ledger/marketdata）无 `float` 类型，成交取整方向有测试断言。
- [ ] 是/否：复式记账校验通过：任意事件序列后 Σdebit == Σcredit，校验脚本输出存 `docs/recon-journal.txt`。
- [ ] 是/否：幂等消费测试通过：同一 trade 事件重复投递 2 次，账务只入账 1 笔（唯一约束命中，由测试断言）。
- [ ] 是/否：内部对账与日切零差异：区间逐笔核对输出 mismatch=0 且比对笔数>0（`docs/recon-ledger.txt`），该任务在 T14 压测期间复跑产生第二个时间戳条目仍为 0；日切输出「期末 == 期初 + 当日流水」成立并写入 README「账务」节。

## W12 行情域（M3）

- [ ] 是/否：WS 断线重连 seq 补偿测试通过：注入抖动（丢包/延迟或进程重启）后客户端带 `lastSeq` 重连，帧序号连续无缺口，截图与补发帧序列存 `docs/ws-reconnect.*`。
- [ ] 是/否：三端一致性检查通过：重启全栈后 WS 重建 order book == 撮合 `Depth()`、账务余额 == 成交事件推演，脚本输出存 `docs/consistency.txt` 且零差异。
- [ ] 是/否：慢消费者背压有测试与日志：订阅连接 30s 不消费被主动断开，其余连接帧序不受影响。
- [ ] 是/否：镜像簿一致测试通过：随机操作序列后 `marketdata` 镜像簿与撮合 `Depth()` 逐档一致（断言在 CI 中运行）。

## W13 钱包域（M4）

- [ ] 是/否：Sepolia 真实充值入账录屏完成（3-10 分钟，存 `demo/`）：测试币转至派生充值地址 → pending/confirmed/finalized → ledger 入账 → WS 通知帧可见，录屏对照 `docs/deposit-run.txt` 中的 txHash。
- [ ] 是/否：提现链路录屏完成：提现广播 → SEPOLIA 区块浏览器回执页面 → 状态机 Confirmed → 余额扣减，并含 1 条风控拒绝（白名单/限额命中返回风控码）演示片段。
- [ ] 是/否：提现幂等与失败恢复测试通过：同一 `(userID, clientWithdrawID)` 重复提交只产生一笔提现；广播失败后状态机进入 Failed 且冻结资金已回补 available（测试断言）。
- [ ] 是/否：私钥检查通过：`grep -R` 项目仓库无助记词或私钥明文（`.env.example` 仅占位符），密钥只来自环境变量且方式写入 `docs/security.md`。
- [ ] 是/否：归集与三方对账零差异：`docs/sweep.log` 显示热钱包超阈值触发归集且热+冷余额之和与内部账一致；`docs/recon-3way.txt` 逐用户与全局两段均为 mismatch=0。
- [ ] 是/否：PoR CLI 验证通过：`por build` 输出 root，`por prove <userID>` + `por verify` 返回 true；篡改任一兄弟节点后 verify 返回 false（命令输出存 `docs/por-run.txt`）。

## W14 收尾（M5）

- [ ] 是/否：React 前端全业务闭环演示录屏完成（`demo/`，配套 `demo/script.md` 分镜）：登录 → 三栏余额 → 下单 → 成交 tape → 订单簿深度图 → 提现回执，全程可见。
- [ ] 是/否：压测报告入 README「压测」节且数字来源于 k6 输出文件（`docs/bench/` 三组原始输出）：A 下单 REST 的 QPS/P50/P99/错误率、B WS 推送延迟 P50/P99 分布、C 单 symbol 撮合 orders/s 与 trades/s；同一场景 pprof 调优前后对比表格 + 热点截图各 1 张。
- [ ] 是/否：`docs/adr/` 有 ≥ 3 篇 ADR 且每篇含背景/备选方案/决定/后果四要素，覆盖「撮合为什么单线程」「账务为什么复式记账」「行情为什么快照+增量」三题，其中 ≥ 1 篇为中途换方案记录。
- [ ] 是/否：`docs/review.md` 含 3 个踩坑（每坑：现象/根因/解法/耗时）与 3 个取舍决策（每决策：选项对比表+选择理由+如果重来），每个可改写成 2 分钟面试故事。
- [ ] 是/否：README 四节齐全：快速开始（编号步骤，全新环境 ≤ 30 分钟可复现）/ Mermaid 架构图（≥ 4 组件 + 数据流标注）/ 本 10 条验收表勾选复制版 / 成果清单（覆盖率、CI 绿标截图、录屏链接、压测数字，验收当天全部可打开）。
- [ ] 是/否：最近 10 次 CI push 全绿（绿标截图入 README「CI」节），流水线含 lint + test + coverage（≥ 80% 门禁）+ build 四步且工具版本固定。