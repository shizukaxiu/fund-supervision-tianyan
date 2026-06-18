/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 深色科技风主背景
        'tech-bg': {
          900: '#0a0f1c',
          800: '#0f172a',
          700: '#1e293b',
        },
        // 科技蓝高亮色
        'tech-cyan': {
          DEFAULT: '#22d3ee',
          glow: 'rgba(34, 211, 238, 0.3)',
        },
        // 告警红
        'tech-rose': {
          DEFAULT: '#f43f5e',
          glow: 'rgba(244, 63, 94, 0.3)',
        },
        // 安全绿
        'tech-emerald': {
          DEFAULT: '#10b981',
          glow: 'rgba(16, 185, 129, 0.3)',
        },
        // 警告黄
        'tech-amber': {
          DEFAULT: '#fbbf24',
          glow: 'rgba(251, 191, 36, 0.3)',
        },
      },
      boxShadow: {
        // 克制：仅 subtle 内发光，避免宽外阴影
        'panel': 'inset 0 0 0 1px rgba(34, 211, 238, 0.05)',
        'panel-rose': 'inset 0 0 0 1px rgba(244, 63, 94, 0.05)',
        'glow-cyan': '0 0 16px rgba(34, 211, 238, 0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
