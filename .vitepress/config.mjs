import { defineConfig } from 'vitepress'

// 站点以仓库根为 srcDir（课程 md 就地渲染，内部相对链接保持原样）
export default defineConfig({
  lang: 'zh-CN',
  title: 'Web3 课程 · 20 周',
  description: 'Web2 → Web3 交易所后端工程师 · 20 周全职课程包（CEX 后端主线 + 链上辅线）',
  base: '/web3-course/',
  srcDir: '.',
  cleanUrls: true,
  srcExclude: ['node_modules/**', '.git/**', '.github/**', '.vitepress/**', '.idea/**', 'QA/**'],
  lastUpdated: { text: '更新于' },

  themeConfig: {
    nav: [
      { text: '课程总览', link: '/' },
      { text: '学习路径', link: '/roadmap' },
      { text: '第 0 周', link: '/00-startup/tasks' },
      { text: '项目规格', link: '/projects/p2-mini-exchange/SPEC' },
      { text: '面试冲刺', link: '/interview/system-design-8' },
      { text: 'GitHub', link: 'https://github.com/liyunfei22/web3-course' },
    ],
    sidebar: [
      {
        text: '🚀 开始',
        items: [
          { text: '课程总览', link: '/' },
          { text: '冻结基线 roadmap', link: '/roadmap' },
          { text: '每日节奏', link: '/daily-rhythm' },
          { text: '验收 10 条标准', link: '/standards/project-acceptance-10' },
          { text: '代码规范', link: '/standards/code-quality' },
        ],
      },
      {
        text: '📦 阶段 0 · 启动与装备',
        collapsed: true,
        items: [
          { text: '讲义', link: '/00-startup/lecture' },
          { text: '任务', link: '/00-startup/tasks' },
          { text: '验收清单', link: '/00-startup/checklist' },
          { text: '资源', link: '/00-startup/resources' },
        ],
      },
      {
        text: '🐹 阶段 1 · Go + Web2 后端补课',
        collapsed: true,
        items: [
          { text: '讲义', link: '/01-go-web2/lecture' },
          { text: '任务', link: '/01-go-web2/tasks' },
          { text: '验收清单', link: '/01-go-web2/checklist' },
          { text: '资源', link: '/01-go-web2/resources' },
        ],
      },
      {
        text: '⚡ 阶段 2 · 分布式中间件',
        collapsed: true,
        items: [
          { text: '讲义', link: '/02-distributed/lecture' },
          { text: '任务', link: '/02-distributed/tasks' },
          { text: '验收清单', link: '/02-distributed/checklist' },
          { text: '资源', link: '/02-distributed/resources' },
        ],
      },
      {
        text: '⛓️ 阶段 3 · 区块链原理 + P1 充值监控',
        collapsed: true,
        items: [
          { text: '讲义', link: '/03-blockchain-indexer/lecture' },
          { text: '任务', link: '/03-blockchain-indexer/tasks' },
          { text: '验收清单', link: '/03-blockchain-indexer/checklist' },
          { text: '资源', link: '/03-blockchain-indexer/resources' },
        ],
      },
      {
        text: '🏛️ 阶段 4 · 旗舰迷你交易所',
        collapsed: true,
        items: [
          { text: '讲义', link: '/04-flagship-exchange/lecture' },
          { text: '任务', link: '/04-flagship-exchange/tasks' },
          { text: '验收清单', link: '/04-flagship-exchange/checklist' },
          { text: '资源', link: '/04-flagship-exchange/resources' },
        ],
      },
      {
        text: '🦄 阶段 5 · Solidity + DEX Clone',
        collapsed: true,
        items: [
          { text: '讲义', link: '/05-defi-dex/lecture' },
          { text: '任务', link: '/05-defi-dex/tasks' },
          { text: '验收清单', link: '/05-defi-dex/checklist' },
          { text: '资源', link: '/05-defi-dex/resources' },
        ],
      },
      {
        text: '🔵 阶段 6 · Solana + Anchor',
        collapsed: true,
        items: [
          { text: '讲义', link: '/06-solana/lecture' },
          { text: '任务', link: '/06-solana/tasks' },
          { text: '验收清单', link: '/06-solana/checklist' },
          { text: '资源', link: '/06-solana/resources' },
        ],
      },
      {
        text: '🎯 阶段 7 · 面试冲刺',
        collapsed: true,
        items: [
          { text: '讲义', link: '/07-interview-sprint/lecture' },
          { text: '任务', link: '/07-interview-sprint/tasks' },
          { text: '验收清单', link: '/07-interview-sprint/checklist' },
          { text: '资源', link: '/07-interview-sprint/resources' },
        ],
      },
      {
        text: '📋 项目规格书',
        collapsed: true,
        items: [
          { text: '规格书模板', link: '/projects/SPEC-template' },
          { text: 'P0 · 短链服务', link: '/projects/p0-shortlink/SPEC' },
          { text: 'P1 · 链上充值监控', link: '/projects/p1-deposit-watcher/SPEC' },
          { text: 'P2 · 旗舰迷你交易所', link: '/projects/p2-mini-exchange/SPEC' },
          { text: 'P3 · Uniswap v2 DEX Clone', link: '/projects/p3-dex-clone/SPEC' },
          { text: 'P4 · Solana 小程序', link: '/projects/p4-solana-mini/SPEC' },
        ],
      },
      {
        text: '🔧 脚手架模板',
        collapsed: true,
        items: [
          { text: 'Go 服务骨架', link: '/scaffolds/go-module' },
          { text: 'docker-compose', link: '/scaffolds/docker-compose' },
          { text: 'CI 流水线', link: '/scaffolds/ci-github-actions' },
          { text: 'WS 行情网关', link: '/scaffolds/ws-gateway' },
          { text: 'k6 压测 + pprof', link: '/scaffolds/k6-load-test' },
          { text: 'Foundry 工程', link: '/scaffolds/foundry-project' },
        ],
      },
      {
        text: '🗂️ 面试题库',
        collapsed: true,
        items: [
          { text: '系统设计 8 题', link: '/interview/system-design-8' },
          { text: 'Go 深挖 60 题', link: '/interview/go-deep-60' },
          { text: '区块链八股 18 类', link: '/interview/blockchain-18' },
          { text: 'Mock 面试脚本', link: '/interview/mock-interview' },
          { text: '算法题单（180 题）', link: '/interview/algorithms/list-core' },
          { text: 'Go 并发专项 15 题', link: '/interview/algorithms/list-concurrency' },
          { text: '英文术语 100 词', link: '/interview/english/glossary' },
          { text: '英文项目讲述稿', link: '/interview/english/project-scripts' },
          { text: '简历模板', link: '/interview/resume/resume-template' },
          { text: '投递策略', link: '/interview/resume/applying' },
        ],
      },
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索课程', buttonAriaLabel: '搜索课程' },
          modal: {
            noResultsText: '无匹配结果',
            resetButtonTitle: '清除查询条件',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    darkModeSwitchLabel: '外观',
    returnToTopLabel: '返回顶部',
  },
})