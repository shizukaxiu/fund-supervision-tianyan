# 基金监管天眼 —— 项目开发路线图

## 一、项目定位

面向南京市医保经办部门的基金智能监管指挥台。通过可视化大屏 + 知识图谱 + 多 Agent 协同研判，模拟实时监测南京市市区医保结算数据，自动发现欺诈骗保、过度医疗、频繁购药、串换药品等异常行为，并生成核查任务。

> 一句话卖点：让每一笔医保基金支出都看得见、查得清、控得住。

---

## 二、核心约束与要求

### 2.1 数据范围
- **只覆盖南京市市区**，具体包含：鼓楼区、玄武区、秦淮区、建邺区、雨花台区、栖霞区、江宁区
- **不做省级/全国地图**，大屏中间展示南京市各区风险分布

### 2.2 数据规模
- **mock 就诊取药记录共 200 条**
- 正常记录与异常记录混合，贴近真实场景

### 2.3 不做医生月处方量对比
- 不统计医生月处方量是否显著高于同类科室
- 团伙挖掘改为基于：同一医生 + 同一药品 + 相近时间 + 追溯码重复

### 2.4 药品追溯码说明
- **追溯码 = 药品唯一身份证**，一物一码
- 同一追溯码被不同患者使用 → 疑似串换药品 / 回流药
- 同一追溯码在不同机构短时间内出现 → 高度可疑
- 追溯码缺失 → 追溯不合规

---

## 三、单条就诊取药记录数据字段

| 分组 | 字段名 | 类型 | 示例 | 用途 |
|---|---|---|---|---|
| 患者信息 | `patientId` | string | P001 | 识别患者 |
| | `name` | string | 张** | 展示用，脱敏 |
| | `gender` | string | 男 | 医学合理性 |
| | `age` | number | 58 | 用药剂量合理性 |
| | `insuranceType` | string | 职工医保 | 费用分析 |
| | `insuredCity` | string | 南京市 | 属地分析 |
| 就诊信息 | `recordId` | string | R20260616001 | 唯一标识 |
| | `visitTime` | datetime | 2026-06-16 09:30 | 时间序列分析 |
| | `hospitalId` | string | H001 | 医院分析 |
| | `hospitalName` | string | 南京市第一医院 | 展示 |
| | `hospitalLevel` | string | 三级甲等 | 就医合理性 |
| | `department` | string | 心内科 | 科室分析 |
| | `doctorId` | string | D001 | 医生行为分析 |
| | `doctorName` | string | 王医生 | 展示 |
| | `visitType` | string | 门诊/住院/急诊 | 费用合理性 |
| 诊断信息 | `diagnosis` | string | 高血压 | 展示 |
| | `icd10Code` | string | I10 | 医学合理性 |
| | `isChronic` | boolean | true | 慢特病管理 |
| | `severity` | string | 普通 | 重症/轻症 |
| 药品信息 | `drugName` | string | 氨氯地平片 | 展示 |
| | `drugCode` | string | YP001 | 药品统计 |
| | `drugCategory` | string | 降压药 | 分类分析 |
| | `isInsuranceCovered` | boolean | true | 医保目录内 |
| | `isCentralizedProcurement` | boolean | true | 集采药品监测 |
| | `dailyDose` | number | 1 | 日剂量 |
| | `duration` | number | 30 | 处方天数 |
| | `quantity` | number | 30 | 总数量 |
| | `unitPrice` | number | 2.5 | 单价 |
| | `drugAmount` | number | 75 | 药品金额 |
| | `traceCode` | string | 8690123456789 | 追溯码，防串换 |
| | `prescriptionType` | string | 院内/外配 | 处方来源 |
| 费用信息 | `totalAmount` | number | 320 | 总费用 |
| | `insurancePay` | number | 240 | 医保支付 |
| | `selfPay` | number | 80 | 个人支付 |
| 行为特征 | `visitCount7Days` | number | 5 | 7 天内就诊次数 |
| | `sameDrugCount30Days` | number | 3 | 30 天内同类药购买次数 |
| | `crossHospitalCount` | number | 4 | 跨院就诊次数 |
| | `isOverDose` | boolean | false | 是否超剂量 |
| | `isOverIndication` | boolean | false | 是否超适应症 |
| | `isDuplicatePrescription` | boolean | false | 是否跨院重复开药 |
| 位置信息 | `city` | string | 南京市 | 固定 |
| | `district` | string | 鼓楼区 | 南京市各区 |

---

## 四、200 条 mock 数据分布

| 类型 | 数量 | 占比 | 生成方式 |
|---|---|---|---|
| 正常记录 | 140 | 70% | 随机生成，分散在 7 个区 |
| 频繁就医 | 20 | 10% | 同一患者 7 天内多次就诊 |
| 超量开药 | 15 | 7.5% | 慢病药数量超过 90 天用量 |
| 跨院重复开药 | 10 | 5% | 同一患者同一药品多家医院开具 |
| 串换药品（追溯码异常） | 8 | 4% | 同一追溯码被多患者使用 |
| 虚假住院/挂床 | 4 | 2% | 住院但 totalAmount < 500 |
| 超适应症用药 | 3 | 1.5% | 诊断与药品类别不匹配 |
| **合计** | **200** | **100%** | |

---

## 五、多 Agent 协同研判架构

### 5.1 批量风险识别层（5 个 Agent 并行）

点击"批量扫描"后，200 条记录同时进入以下 5 个 Agent：

| Agent | 输入字段 | 判断逻辑 | 输出 |
|---|---|---|---|
| **统计异常检测 Agent** | `visitCount7Days`, `sameDrugCount30Days`, `totalAmount`, `drugAmount`, `quantity` | 7 天就诊 ≥ 7 次 / 30 天同类药 ≥ 5 次 / 费用超均值 3 倍 / 药量 > 90 天 | 异常标签 + 风险分 |
| **行为模式识别 Agent** | `visitTime`, `hospitalId`, `crossHospitalCount`, `department`, `visitType`, `totalAmount` | 跨院 ≥ 3 家 / 住院费用 < 500 / 跨院重复开药 / 异常就诊时间 | 异常标签 + 风险分 |
| **医学合理性 Agent** | `diagnosis`, `icd10Code`, `drugName`, `drugCategory`, `dailyDose`, `duration`, `age`, `gender`, `isOverDose`, `isOverIndication` | 药品类别与诊断不匹配 / 超剂量 / 特殊人群用药异常 / 急诊开长处方 | 异常标签 + 风险分 |
| **药品耗材异常 Agent** | `traceCode`, `drugCode`, `drugName`, `isCentralizedProcurement`, `quantity`, `unitPrice` | 追溯码重复 / 集采药价异常 / 高价药短期大量开具 / 追溯码缺失 | 异常标签 + 风险分 |
| **团伙挖掘 Agent** | `patientId`, `doctorId`, `hospitalId`, `drugName`, `traceCode`, `visitTime` | 多患者共享同一医生+同一药品+相近时间 / 多患者追溯码重复 | 团伙 ID + 成员 |

### 5.2 个案研判层（5 个 Agent 串行/并行）

点击某条高风险记录后，进入下钻分析：

| Agent | 职责 | 输出 |
|---|---|---|
| **数据检索 Agent** | 调取该患者/医生/医院的历史记录和关联人员 | 关联记录清单 |
| **模式识别 Agent** | 给异常行为贴标签 | 异常模式 |
| **规则匹配 Agent** | 匹配医保政策违规条款 | 违规依据 |
| **风险量化 Agent** | 评估风险等级和置信度 | 风险等级 + 置信度 |
| **证据链整理 Agent** | 生成时间线、关系图、证据清单 | 结构化证据 |

### 5.3 处置执行层

| Agent | 职责 | 输出 |
|---|---|---|
| **报告生成 Agent** | 综合批量识别或个案研判结果，生成结构化报告 | Markdown 报告 |
| **飞检任务 Agent** | 基于报告生成核查任务书 | 任务书 |

---

## 六、核心功能模块

| 模块 | 功能 | Demo 效果 |
|---|---|---|
| 批量扫描入口 | 200 条记录一键扫描 | 进度条 + Agent 动画 |
| 扫描结果总览 | 异常数量、风险分布、团伙数量 | KPI 卡片 + 饼图 + 排行榜 |
| 南京市风险分布 | 按区展示风险金额 | 各区县卡片或地图热力 |
| 实时告警中心 | 滚动展示风险事件 | 告警列表 + severity 色标 |
| 风险网络图谱 | 医院-医生-患者-药店关系可视化 | AntV G6 关系图 |
| 多 Agent 协同研判 | 5 个子 Agent 动画并行，生成报告 | Agent 卡片逐个弹出 |
| 飞检任务生成 | 一键生成核查任务书 | 弹窗展示任务详情 |
| 监管成效看板 | 拦截金额、挽回损失统计 | 趋势图 + 排行榜 |

---

## 七、开发任务清单与进度评分

评分标准：0 = 未做，8 = 完成基本所有要求，10 = 超出预期

### Phase 1：项目骨架搭建
- [x] 1.1 初始化 React 项目（Vite + React + TypeScript）—— 进度：8/10
- [x] 1.2 配置 TailwindCSS + 深色科技风主题 —— 进度：8/10
- [x] 1.3 设计大屏布局：顶部 KPI + 左侧告警 + 中部南京市风险分布 + 右侧 AI 研判 —— 进度：8/10
- [x] 1.4 引入 ECharts / AntV G6 可视化库 —— 进度：5/10（已安装 ECharts，G6 后续引入）
- [x] 1.5 配置 Zustand 状态管理 —— 进度：8/10

### Phase 2：Mock 数据生成
- [x] 2.1 编写 ~200 条南京市就诊取药 mock 数据脚本 —— 进度：8/10
- [x] 2.2 确保正常记录 140 条 + 6 类异常记录共 56 条 —— 进度：8/10
- [x] 2.3 生成 `mock/records.json` —— 进度：8/10
- [x] 2.4 生成 `mock/overview.json`（扫描总览结果）—— 进度：8/10
- [x] 2.5 生成 `mock/alerts.json`（高风险告警列表）—— 进度：8/10
- [x] 2.6 生成 `mock/network.json`（关系网络数据）—— 进度：8/10
- [x] 2.7 生成 `mock/caseAnalysis.json`（20 个典型案例研判结果）—— 进度：8/10

### Phase 3：批量扫描与总览可视化
- [x] 3.1 实现"批量扫描"按钮 + 扫描进度动画 —— 进度：8/10
- [x] 3.2 实现 5 个风险识别 Agent 动画并行展示 —— 进度：8/10
- [x] 3.3 实现扫描结果 KPI 卡片（扫描记录数、命中异常、高风险个案、疑似团伙、涉及金额）—— 进度：8/10
- [x] 3.4 实现南京市各区风险分布展示（卡片或地图）—— 进度：8/10
- [x] 3.5 实现异常类型分布图 —— 进度：8/10
- [x] 3.6 实现风险医院/药店 TOP10 排行榜 —— 进度：8/10

### Phase 4：告警列表与实时感
- [x] 4.1 实现告警滚动列表 + 风险等级色标 —— 进度：8/10
- [x] 4.2 实现告警按等级筛选 —— 进度：8/10
- [x] 4.3 点击告警 → 全局选中状态更新 —— 进度：8/10
- [x] 4.4 实现新告警模拟推送（setInterval）—— 进度：8/10
- [x] 4.5 新告警到达提示音 + 闪烁动画 —— 进度：8/10

### Phase 5：风险网络图谱
- [ ] 5.1 设计图数据结构：医院、医生、患者、药店四类节点 —— 进度：0/10
- [ ] 5.2 使用 AntV G6 实现关系网络图 —— 进度：0/10
- [ ] 5.3 实现节点点击展示详情抽屉 —— 进度：0/10
- [ ] 5.4 实现团伙聚类高亮（同一团伙节点同色系）—— 进度：0/10
- [ ] 5.5 实现图谱缩放、拖拽、聚焦交互 —— 进度：0/10
- [ ] 5.6 点击告警后自动聚焦到对应节点/团伙 —— 进度：0/10

### Phase 6：多 Agent 个案研判
- [x] 6.1 实现右侧研判面板"多 Agent 协同研判中"动画 —— 进度：8/10
- [x] 6.2 实现 5 个个案研判 Agent 卡片逐个弹出 —— 进度：8/10
- [x] 6.3 实现报告生成 Agent，输出结构化 Markdown 报告 —— 进度：8/10
- [x] 6.4 报告包含：异常摘要、风险等级及依据、关联风险推测、处置建议 —— 进度：8/10
- [ ] 6.5 实现"重新研判"按钮（可选调真 LLM）—— 进度：0/10

### Phase 7：飞检任务生成
- [x] 7.1 实现"生成飞检任务"按钮 —— 进度：8/10
- [x] 7.2 任务书弹窗：任务编号、核查对象、核查要点、限时要求 —— 进度：8/10
- [x] 7.3 任务状态流转：待派发 → 已派发 → 已核查 → 已办结 —— 进度：8/10

### Phase 8：监管成效看板与 Polish
- [ ] 8.1 实现本月拦截金额、挽回损失趋势图 —— 进度：0/10
- [x] 8.2 实现数字滚动动画 —— 进度：8/10
- [x] 8.3 实现全屏模式、刷新按钮、数据时间戳 —— 进度：8/10
- [x] 8.4 实现移动端/大屏响应式适配 —— 进度：7/10（基础响应式已完成，大屏优先）
- [x] 8.5 添加"演示数据，不代表真实情况"提示 —— 进度：8/10
- [ ] 8.6 准备 5 分钟 Demo 解说词 —— 进度：0/10
- [ ] 8.7 录制 Demo 演示视频或 GIF —— 进度：0/10

---

## 八、推荐技术栈

| 用途 | 选型 |
|---|---|
| 前端框架 | React 18 + Vite + TypeScript |
| UI 样式 | TailwindCSS |
| 图表 | ECharts |
| 关系图谱 | AntV G6 |
| 南京市地图 | ECharts 南京市 GeoJSON（可选，没有则用区县卡片） |
| 动画 | Framer Motion |
| 状态管理 | Zustand |
| 大模型 | DeepSeek / Kimi / OpenAI API（用于重新研判兜底） |
| Mock 数据 | 纯前端 `src/mock/*.json` |

---

## 九、目录结构建议

```
基金监管天眼/
├── README.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   ├── nanjing.json            # 南京市地图 GeoJSON（可选）
│   └── alert-sound.mp3         # 告警提示音
├── scripts/
│   └── generateMockData.js     # 生成 200 条 mock 数据脚本
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── KpiCards.tsx
│   │   ├── ScanButton.tsx      # 批量扫描按钮
│   │   ├── ScanProgress.tsx    # 扫描进度动画
│   │   ├── AgentCards.tsx      # Agent 协同动画卡片
│   │   ├── AlertList.tsx
│   │   ├── DistrictRiskMap.tsx # 南京市各区风险分布
│   │   ├── TrendChart.tsx
│   │   ├── FraudTypeChart.tsx
│   │   ├── FraudNetwork.tsx
│   │   ├── RiskReport.tsx
│   │   ├── TaskModal.tsx
│   │   └── RankBoard.tsx
│   ├── agents/                 # Agent 逻辑
│   │   ├── statisticalAgent.ts
│   │   ├── behaviorAgent.ts
│   │   ├── medicalAgent.ts
│   │   ├── drugAgent.ts
│   │   ├── gangAgent.ts
│   │   ├── orchestrator.ts
│   │   └── reporter.ts
│   ├── mock/
│   │   ├── records.json
│   │   ├── overview.json
│   │   ├── alerts.json
│   │   ├── network.json
│   │   └── caseAnalysis.json
│   ├── services/
│   │   ├── mockApi.ts
│   │   └── llm.ts
│   ├── types/
│   │   └── index.ts
│   ├── store/
│   │   └── dashboardStore.ts
│   └── utils/
│       └── formatters.ts
```

---

## 十、5 分钟 Demo 演示脚本

1. **开场**：打开"医保天眼"大屏，今日南京市结算数据滚动
2. **批量扫描**：点击"启动智能扫描"，200 条记录进入 5 个风险识别 Agent，动画并行展示
3. **扫描总览**：展示异常数量、风险分布、疑似团伙、涉及金额、TOP 风险区
4. **点击最高风险告警**：进入个案下钻
5. **多 Agent 协同研判**：5 个个案研判 Agent 卡片逐个弹出，生成结构化报告
6. **关系图谱**：自动聚焦到该案例的节点和关联团伙
7. **生成飞检任务**：一键生成任务书，展示核查对象和要点
8. **成效看板**：展示本月拦截金额、挽回损失

---

## 十一、风险提示

- 南京市地图数据需确保准确，区县边界无争议
- 所有机构、人名、金额均为虚构，页面需注明"演示数据，不代表真实情况"
- 涉及医保政策条款需引用真实法规，避免编造
- 告警声音在 Demo 现场需提前测试音量
- 大屏 Demo 建议使用 1920×1080 或更高分辨率展示
