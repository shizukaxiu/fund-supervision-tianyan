# 基金监管天眼 - AI 开发交接文档

> 本文档面向后续继续开发本项目的 AI Agent。阅读本文档后再修改代码。

---

## 一、项目背景

本项目是医疗类 AI Agent 开发比赛的参赛作品，主题为**医保基金智能监管**。

- **项目名称**：基金监管天眼
- **数据范围**：南京市市区（鼓楼区、玄武区、秦淮区、建邺区、雨花台区、栖霞区、江宁区）
- **数据规模**：196 条 mock 就诊取药记录（140 正常 + 56 异常）
- **核心卖点**：多 Agent 协同研判医保基金异常，可视化大屏展示

---

## 二、技术栈

必须严格使用以下技术栈，不要随意替换：

| 用途 | 技术 |
|---|---|
| 前端框架 | React 18 + Vite + TypeScript |
| 样式 | TailwindCSS 3.x |
| 状态管理 | Zustand |
| 动画 | Framer Motion |
| 图表 | ECharts（echarts-for-react） |
| 关系图谱 | AntV G6 v5 |
| 图标 | Lucide React |
| 包管理器 | npm |

---

## 三、项目目录结构

```
基金监管天眼/
├── AGENTS.md                  # 本文件
├── README.md                  # 开发路线图 + 任务清单
├── index.html                 # 页面入口
├── package.json               # 依赖
├── tailwind.config.js         # Tailwind 配置
├── postcss.config.js          # PostCSS 配置
├── scripts/
│   └── generateMockData.py    # 生成 196 条 mock 数据
├── prompts/                   # 给 AI 的 Prompt 模板
│   └── round1.md
├── src/
│   ├── main.tsx               # React 入口
│   ├── App.tsx                # 主布局
│   ├── index.css              # 全局样式
│   ├── types/
│   │   └── index.ts           # TypeScript 类型定义
│   ├── store/
│   │   └── dashboardStore.ts  # Zustand 全局状态
│   ├── utils/
│   │   └── formatters.ts      # 格式化工具函数
│   ├── hooks/
│   │   └── useAlertStream.ts  # 实时告警推送 hook
│   ├── agents/
│   │   └── riskAgents.ts      # 批量风险识别 Agent 逻辑
│   ├── mock/                  # mock 数据（由 Python 脚本生成）
│   │   ├── records.json
│   │   ├── overview.json
│   │   ├── alerts.json
│   │   ├── network.json
│   │   └── caseAnalysis.json
│   └── components/            # React 组件
│       ├── KpiCards.tsx
│       ├── AlertList.tsx
│       ├── DistrictRiskMap.tsx
│       ├── FraudNetwork.tsx
│       ├── AnalysisPanel.tsx
│       ├── NodeDetailDrawer.tsx
│       ├── ScanModal.tsx
│       ├── TrendChart.tsx
│       └── RankBoard.tsx
```

---

## 四、关键开发规范

### 1. 不要覆盖 mock 数据
`src/mock/*.json` 由 `scripts/generateMockData.py` 生成。如果需要改数据结构：
- 先改 Python 脚本
- 再运行 `python scripts/generateMockData.py` 重新生成
- 不要手动改 JSON

### 2. 组件结构约定
每个面板组件统一使用以下结构，确保内部滚动正常：

```tsx
<div className="tech-panel corner-decoration h-full flex flex-col p-4">
  <div className="panel-title">...</div>
  <div className="flex-1 overflow-y-auto">
    {/* 内容区域 */}
  </div>
</div>
```

### 3. 大屏布局约定
- 整体页面固定一屏：`h-screen overflow-hidden`
- 主体三栏占满剩余空间：`flex-1 min-h-0`
- 各面板：`h-full overflow-hidden`，内部滚动
- 参考 `App.tsx` 中的 grid 布局

### 4. Agent 相关约定
- 批量风险识别 Agent：`src/agents/riskAgents.ts`
- 个案研判 Agent 数据：`src/mock/caseAnalysis.json`
- Agent 结果需包含 `confidence`（置信度 0-100）
- 协调器 Agent 用于综合各 Agent 意见

### 5. 类型安全
- 所有数据类型定义在 `src/types/index.ts`
- 不要写 `any`，必须严格 TypeScript
- 修改 mock 数据结构时同步更新类型

---

## 五、常见修改入口

| 想做什么 | 修改哪里 |
|---|---|
| 改 mock 数据字段/分布 | `scripts/generateMockData.py` |
| 改大屏布局或高度 | `src/App.tsx` |
| 改 KPI 卡片 | `src/components/KpiCards.tsx` |
| 改告警列表/筛选/搜索 | `src/components/AlertList.tsx` |
| 改南京市风险分布 | `src/components/DistrictRiskMap.tsx` |
| 改关系图谱 | `src/components/FraudNetwork.tsx` |
| 改节点详情抽屉 | `src/components/NodeDetailDrawer.tsx` |
| 改多 Agent 研判面板 | `src/components/AnalysisPanel.tsx` |
| 改批量扫描弹窗 | `src/components/ScanModal.tsx` |
| 改全局状态 | `src/store/dashboardStore.ts` |
| 改全局样式 | `src/index.css`、`tailwind.config.js` |

---

## 六、运行和构建

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# TypeScript 检查
npx tsc -b

# 重新生成 mock 数据
python scripts/generateMockData.py
```

---

## 七、当前已完成功能

- [x] 196 条南京市 mock 就诊记录
- [x] 深色科技风可视化大屏
- [x] 6 个 KPI 卡片 + 数字滚动动画
- [x] 批量扫描 + 5 个风险识别 Agent 并行动画
- [x] 实时告警中心 + 等级筛选 + 搜索
- [x] 南京市各区风险分布
- [x] AntV G6 风险网络图谱 + 路径高亮
- [x] 节点详情抽屉
- [x] 多 Agent 个案研判 + 置信度进度条
- [x] 协调器 Agent 冲突消解
- [x] 飞检任务书 + 状态流转
- [x] 全屏/刷新按钮
- [x] 响应式布局（大屏优先）

---

## 八、待优化方向（可选）

- [ ] 接入真实 LLM 重新研判（需要 API key）
- [ ] 动态导入 G6 减少 bundle 体积（当前 1.77MB）
- [ ] 数据导出功能（PDF/Excel）
- [ ] 更多时间序列图表
- [ ] 任务状态持久化
- [ ] 性能优化

---

## 九、重要提示

1. **不要随意升级 TailwindCSS 到 v4**，当前使用 v3，配置方式不同
2. **AntV G6 使用 v5**，API 与 v4 差异很大
3. **bundle 较大是因为 G6**，如需优化请用动态导入
4. **mock 数据均为虚构**，页面已标注"演示数据，不代表真实情况"
5. **PowerShell 中 `&&` 可能不支持**，命令建议分步执行
