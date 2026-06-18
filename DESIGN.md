# Design

## Overview

基金监管天眼是一款面向医保监管场景的指挥台型数据可视化大屏。设计语言以「冷静专业、权威可信」为核心：深色背景降低长时间值守的视觉疲劳，克制的青色体系传递科技感，语义色（玫瑰红/琥珀黄/翡翠绿）仅用于风险等级与状态指示，不做装饰。

## Register

product

## Color

### Primary palette

- **Background**: `#0a0f1c` (deep navy-black) — 主背景，沉稳、耐看不疲劳。
- **Surface**: `#0f172a` / `rgba(15, 23, 42, 0.60)` — 面板底色，与背景形成 subtle 层次。
- **Elevated surface**: `#1e293b` / `rgba(30, 41, 59, 0.60)` — 卡片、输入框、hover 状态。
- **Primary accent**: `#22d3ee` (cyan-400) — 主行动、选中状态、关键数据、科技高亮。
- **Primary accent muted**: `rgba(34, 211, 238, 0.10)` — 按钮背景、hover 背景。
- **Ink**: `#e2e8f0` (slate-200) — 主要正文、标题。
- **Muted ink**: `#94a3b8` (slate-400) — 次要说明、标签。保证在深色背景上对比度 ≥ 4.5:1。
- **Placeholder ink**: `#64748b` (slate-500) — placeholder 与禁用文字。

### Semantic colors

- **Critical / 极高**: `#f43f5e` (rose-500) — 极高风险、严重异常、关键告警。
- **High / 高**: `#f97316` (orange-500) — 高风险。
- **Medium / 中**: `#fbbf24` (amber-400) — 中风险、待处理状态。
- **Low / 低**: `#34d399` (emerald-400) — 低风险、已办结、正常状态。
- **Info**: `#22d3ee` (cyan-400) — 提示、运行中、选中。

### Color strategy

Restrained。青色作为主 accent 贯穿界面，语义色仅在风险等级、状态标签、图表数据中使用，整体饱和度克制。不使用多色渐变作为背景或文字装饰。

## Typography

- **Font family**: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` — 系统字体栈，保证大屏与演示电脑的可读性。
- **Base size**: `14px`。
- **Scale ratio**: 1.125（紧凑产品 UI 比例）。
- **Headings**: 固定 rem，不使用 fluid clamp。
- **Line length**: 正文 ≤ 75ch；数据表格可更宽。
- **Letter-spacing**: 标题 `-0.02em` 上限，避免字母拥挤。

## Layout

- 整体为固定一屏的 dashboard：`h-screen overflow-hidden`。
- 顶部标题栏 + KPI 卡片区 + 主体三栏 + 底部双区。
- 主体三栏：`300px 1fr 340px`（xl 断点），`320px 1fr 360px`（2xl）。
- 面板内部可滚动：`flex-1 overflow-y-auto`。
- 间距：面板间 `gap-3`（`0.75rem`）至 `gap-4`（`1rem`）；面板内 `p-4`（`1rem`）。

## Components

### Panel (tech-panel)

- 圆角：`12px` (`rounded-xl`)。
- 背景：`rgba(15, 23, 42, 0.60)` + `backdrop-blur-sm`。
- 边框：`1px solid rgba(34, 211, 238, 0.15)` 或对应语义色 15% 透明度。
- 不使用宽大外发光阴影；仅保留 subtle 内发光或 1px 边框。
- 角标装饰：仅保留 1px 细线，颜色透明度 50%，克制点缀。

### Buttons

- Primary: `bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20`。
- Secondary: `bg-slate-800/60 border border-slate-700 text-slate-300 hover:bg-slate-700/60`。
- Danger: `bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20`。
- Disabled: opacity 50，cursor not-allowed。
- 圆角：`8px` (`rounded-lg`) 按钮，`12px` 卡片。

### Risk badges

使用 `getRiskLevelColor` 统一映射：

- 极高：玫瑰红文字 + 10% 背景 + 30% 边框。
- 高：橙色文字 + 10% 背景 + 30% 边框。
- 中：琥珀黄文字 + 10% 背景 + 30% 边框。
- 低：翡翠绿文字 + 10% 背景 + 30% 边框。

### Progress bars

- 背景：`bg-slate-700/50`。
- 填充：单一纯色（cyan/emerald/amber/rose），不使用多色渐变装饰。
- 高度：`6px`（紧凑）或 `4px`（迷你）。

## Motion

- **默认过渡**：`150ms ease-out`。
- **数字滚动**：`800ms` spring，避免过长动画打断值守节奏。
- **列表项进入**：`200ms` fade/slide，单个元素不堆叠过长延迟。
- **加载动画**：简单旋转指示器，不超过 2s 循环。
- **Reduced motion**：所有动画在 `prefers-reduced-motion: reduce` 下退化为即时或淡入淡出；禁用持续脉冲、扫描线等装饰动画。

## Absolute design bans

- 不使用 `background-clip: text` 渐变文字。
- 不使用卡片上 `1px border + ≥16px blur` 的 ghost shadow。
- 不使用纯装饰性扫描线、脉冲边框、旋转地球。
- 不使用超过 `16px` 的卡片圆角。
- 不使用面板嵌套卡片。
- 地图背景不使用七彩分区，统一使用单色低透明度填充。
