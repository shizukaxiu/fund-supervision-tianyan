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
        'panel': '0 0 20px rgba(34, 211, 238, 0.08), inset 0 0 0 1px rgba(34, 211, 238, 0.1)',
        'panel-rose': '0 0 20px rgba(244, 63, 94, 0.08), inset 0 0 0 1px rgba(244, 63, 94, 0.1)',
        'glow-cyan': '0 0 30px rgba(34, 211, 238, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scanLine 2s linear infinite',
      },
      keyframes: {
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
}
