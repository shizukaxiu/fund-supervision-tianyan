# 第一轮 Prompt：生成基金监管天眼大屏骨架

## 项目背景

我正在参加一个医疗 AI Agent 开发比赛，项目名称为"基金监管天眼"，是一个医保基金智能监管可视化大屏。数据范围限定在南京市市区。

## 项目路径

所有代码必须生成在：`C:\Users\a1246\Desktop\基金监管天眼`

我已经在该目录下准备好了 mock 数据：
- `src/mock/records.json`：196 条就诊取药记录
- `src/mock/overview.json`：扫描总览统计
- `src/mock/alerts.json`：异常告警列表
- `src/mock/network.json`：关系网络数据
- `src/mock/caseAnalysis.json`：典型案例研判结果

## 技术栈要求

必须严格使用以下技术栈：
- **前端框架**：React 18 + Vite + TypeScript
- **样式**：TailwindCSS 3.x
- **状态管理**：Zustand
- **动画**：Framer Motion
- **图表**：ECharts（通过 `echarts-for-react`）
- **图标**：Lucide React
- **包管理器**：npm

## 你需要完成的tasks

### Task 1：初始化项目

在 `C:\Users\a1246\Desktop\基金监管天眼` 目录下执行：

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install zustand framer-motion echarts echarts-for-react lucide-react
```

### Task 2：配置 TailwindCSS

配置 `tailwind.config.js`：
- 深色科技风主题
- 主色：cyan-400（科技蓝）作为高亮色
- 辅助色：rose-500（告警红）、emerald-500（安全绿）、amber-400（警告黄）
- 背景色：slate-900 / slate-950
- 支持 `dark` 模式

配置 `src/index.css`：
- 引入 Tailwind 基础指令
- 设置全局深色背景
- 设置全局字体为系统默认无衬线字体

### Task 3：创建类型定义

在 `src/types/index.ts` 中定义以下类型（根据 mock 数据结构）：

```typescript
export interface MedicalRecord {
  recordId: string;
  patientId: string;
  name: string;
  gender: string;
  age: number;
  insuranceType: string;
  insuredCity: string;
  visitTime: string;
  hospitalId: string;
  hospitalName: string;
  hospitalLevel: string;
  department: string;
  doctorId: string;
  doctorName: string;
  visitType: string;
  diagnosis: string;
  icd10Code: string;
  isChronic: boolean;
  severity: string;
  drugName: string;
  drugCode: string;
  drugCategory: string;
  isInsuranceCovered: boolean;
  isCentralizedProcurement: boolean;
  dailyDose: number;
  duration: number;
  quantity: number;
  unitPrice: number;
  drugAmount: number;
  traceCode: string;
  prescriptionType: string;
  totalAmount: number;
  insurancePay: number;
  selfPay: number;
  visitCount7Days: number;
  sameDrugCount30Days: number;
  crossHospitalCount: number;
  isOverDose: boolean;
  isOverIndication: boolean;
  isDuplicatePrescription: boolean;
  city: string;
  district: string;
  abnormalType: string | null;
}

export interface OverviewData {
  scanDate: string;
  totalRecords: number;
  totalAmount: number;
  abnormalRecords: number;
  abnormalAmount: number;
  highRiskRecords: number;
  highRiskAmount: number;
  suspectedGangs: number;
  districtRisk: Record<string, number>;
  abnormalTypeCount: Record<string, number>;
}

export interface Alert {
  id: string;
  recordId: string;
  type: string;
  level: string;
  status: string;
  patientId: string;
  patient: string;
  hospital: string;
  doctor: string;
  amount: number;
  district: string;
  reason: string;
  time: string;
}
```

### Task 4：创建 Zustand 状态管理

在 `src/store/dashboardStore.ts` 中创建 store，包含：
- `overview`: OverviewData | null
- `alerts`: Alert[]
- `selectedAlert`: Alert | null
- `isScanning`: boolean
- `actions`:
  - `loadData()`: 加载 overview.json 和 alerts.json
  - `selectAlert(alert: Alert)`: 选中告警
  - `startScan()`: 开始扫描动画
  - `stopScan()`: 结束扫描动画

### Task 5：创建大屏布局

在 `src/App.tsx` 中创建整体布局。使用 CSS Grid 实现以下结构：

```
┌─────────────────────────────────────────────────────────────┐
│                    顶部 KPI 卡片区                           │
├──────────────┬──────────────────────────────┬───────────────┤
│              │                              │               │
│  实时告警    │     南京市各区风险分布        │  AI 风险研判  │
│  滚动列表    │                              │  报告卡片     │
│              │   ┌─────────────────────┐    │               │
│              │   │    风险网络图谱      │    │  飞检任务     │
│              │   │   医院-医生-患者     │    │  生成按钮     │
│              │   └─────────────────────┘    │               │
├──────────────┴──────────────────────────────┴───────────────┤
│                    底部：趋势图 + 排行榜                      │
└─────────────────────────────────────────────────────────────┘
```

具体要求：
- 整体背景：深色渐变（slate-950 到 slate-900）
- 每个区块有半透明边框和轻微发光效果
- 顶部 KPI 区高度约 120px
- 左侧面板宽度 320px
- 右侧面板宽度 360px
- 中间区域自适应
- 底部区域高度 220px

### Task 6：创建 KPI 卡片组件

在 `src/components/KpiCards.tsx` 中创建 6 个 KPI 卡片，读取 `overview.json`：

1. **扫描记录数**：`totalRecords`（196）
2. **涉及总金额**：`totalAmount`（¥48,918.55）
3. **异常记录数**：`abnormalRecords`（56）
4. **异常金额**：`abnormalAmount`（¥14,667.65）
5. **高风险记录**：`highRiskRecords`（29）
6. **疑似团伙数**：`suspectedGangs`（8）

要求：
- 每个卡片有图标、标题、数字
- 数字使用 Framer Motion 实现从 0 滚动到目标值的动画
- 异常相关卡片用 rose 色系高亮
- 金额用 `¥` 符号 + 千分位格式化

### Task 7：实现数据加载

在 `src/App.tsx` 中：
- 组件挂载时调用 `loadData()`
- 加载完成前显示加载动画
- 加载完成后渲染大屏

### Task 8：添加基础样式和交互

- 所有面板有圆角（rounded-xl 或 rounded-2xl）
- 面板有 hover 效果
- 顶部有项目名称和当前时间
- 添加"演示数据，不代表真实情况"的提示文字

## 输出要求

1. 生成所有必要的文件和目录
2. 确保 `npm run dev` 可以正常启动
3. 确保页面能正确读取 mock 数据并显示 KPI 卡片
4. 代码必须有中文注释，说明每个部分的作用
5. 不要生成 Phase 2-8 的组件，只完成本次要求的骨架和 KPI 卡片

## 验证方式

完成后，我应该能运行：

```bash
npm run dev
```

然后在浏览器中看到：
- 深色科技风的大屏页面
- 顶部 6 个 KPI 卡片，数字有滚动动画
- 左中右三栏布局清晰可见
- 页面标题为"基金监管天眼"

## 注意事项

- 所有 mock 数据文件已经存在，不要覆盖或修改它们
- 使用相对路径 `../mock/xxx.json` 或 `../../mock/xxx.json` 读取数据
- 金额格式化函数放在 `src/utils/formatters.ts`
- TypeScript 类型必须严格，不要出现 any
- 代码风格统一，使用函数组件 + hooks
