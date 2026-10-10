# 05-defi-dex/resources.md — Phase 5 资源清单（W15-W16）

> 全部链接来自 `../CLAUDE.md` 附录 A 已核实资源池；EIP-20 为经流程新增（见 `../QA/review-log.md`）。每条标注必读/选读与用途。

| 资源 | 必读/选读 | 用途 |
|---|---|---|
| Cyfrin Updraft https://updraft.cyfrin.io/courses | 必读 | 本阶段主教材：Solidity Fundamentals / Advanced / Foundry Full Course 全课，按 lecture 第 1 节导航推进 |
| Foundry Book https://book.getfoundry.sh/ | 必读 | Foundry 工具书：forge test/coverage/fuzz/invariant/verify 命令速查与配置项 |
| WTF Academy https://www.wtf.academy/ | 必读（对照） | 中文 Solidity 101/102，概念卡壳时的解释器，与 Cyfrin 同步推进 |
| Uniswap v2 core https://github.com/Uniswap/v2-core | 必读（对照） | P3 参照物：只读接口语义与边界常数，核心数学自写不 fork（铁律见 lecture 2） |
| Slither https://github.com/crytic/slither | 必读 | P3 安全自查工具，验收③的扫描报告来源 |
| SEPOLIA 区块浏览器 https://sepolia.etherscan.io/ | 必读 | 部署后源码验证与 tx 查询，验证截图证据位 |
| EIP-20 https://eips.ethereum.org/EIPS/eip-20 | 必读 | ERC-20 代币接口标准原文，P05-03 精读对象（池内两代币即两个 ERC-20） |
| Foundry Full Course 仓库 https://github.com/Cyfrin/foundry-full-course-cu | 选读 | Cyfrin Foundry 课配套代码与练习，卡壳时对照测试写法 |
| Ethernaut https://ethernaut.openzeppelin.com/ | 选读 | 链上安全通关练习，W15-W16 穿插完成 ≥8 关 |
| Damn Vulnerable DeFi https://github.com/OpenZeppelin/damn-vulnerable-defi | 选读 | 攻击者视角进阶练习（本阶段若时间富余再进入；目标不是通关是看懂攻击面） |
| RareSkills 博客 https://www.rareskills.io/blog | 选读 | AMM 数学/滑点/无常损失深度文章，k 值与 LP 公式的数学补充 |
| SWC 注册表 https://swcregistry.io/ | 选读 | 漏洞模式编号查询，与 Ethernaut 关卡、威胁模型条目对应使用 |

**书籍（只写书名，不写链接）**：本阶段无需整本阅读；Go 主线书籍见其他阶段 resources。