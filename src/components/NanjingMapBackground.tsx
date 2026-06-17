/**
 * 南京市区示意地图背景（科技风 SVG）
 *
 * 说明：本组件为示意性简图，非精确地理地图。
 * 坐标系 viewBox="0 0 1000 1000"，医院坐标映射需与本组件保持一致。
 */
export function NanjingMapBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(34,211,238,0.06)" strokeWidth="1" />
        </pattern>
        <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(34,211,238,0.12)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0)" />
        </radialGradient>
        <filter id="districtGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 背景网格 */}
      <rect width="1000" height="1000" fill="url(#grid)" />
      <rect width="1000" height="1000" fill="url(#mapGlow)" />

      {/* 外轮廓 */}
      <path
        d="M 80 180 L 720 120 L 920 300 L 940 960 L 120 940 Z"
        fill="none"
        stroke="rgba(34,211,238,0.15)"
        strokeWidth="2"
        strokeDasharray="8 6"
      />

      {/* 鼓楼区 */}
      <polygon
        points="200,200 450,150 480,350 320,420 180,350"
        fill="rgba(34,211,238,0.06)"
        stroke="rgba(34,211,238,0.35)"
        strokeWidth="1.5"
        filter="url(#districtGlow)"
      />
      <text x="315" y="285" fill="rgba(226,232,240,0.55)" fontSize="14" textAnchor="middle">
        鼓楼区
      </text>

      {/* 玄武区 */}
      <polygon
        points="450,150 720,180 700,380 520,350 480,350"
        fill="rgba(59,130,246,0.05)"
        stroke="rgba(59,130,246,0.35)"
        strokeWidth="1.5"
        filter="url(#districtGlow)"
      />
      <text x="585" y="275" fill="rgba(226,232,240,0.55)" fontSize="14" textAnchor="middle">
        玄武区
      </text>

      {/* 秦淮区 */}
      <polygon
        points="320,420 480,350 520,350 700,380 620,550 400,580 300,520"
        fill="rgba(168,85,247,0.05)"
        stroke="rgba(168,85,247,0.35)"
        strokeWidth="1.5"
        filter="url(#districtGlow)"
      />
      <text x="490" y="470" fill="rgba(226,232,240,0.55)" fontSize="14" textAnchor="middle">
        秦淮区
      </text>

      {/* 建邺区 */}
      <polygon
        points="100,420 320,420 300,520 400,580 380,750 120,700"
        fill="rgba(16,185,129,0.05)"
        stroke="rgba(16,185,129,0.35)"
        strokeWidth="1.5"
        filter="url(#districtGlow)"
      />
      <text x="245" y="585" fill="rgba(226,232,240,0.55)" fontSize="14" textAnchor="middle">
        建邺区
      </text>

      {/* 雨花台区 */}
      <polygon
        points="400,580 620,550 650,780 420,820 380,750"
        fill="rgba(245,158,11,0.05)"
        stroke="rgba(245,158,11,0.35)"
        strokeWidth="1.5"
        filter="url(#districtGlow)"
      />
      <text x="515" y="685" fill="rgba(226,232,240,0.55)" fontSize="14" textAnchor="middle">
        雨花台区
      </text>

      {/* 栖霞区 */}
      <polygon
        points="700,380 900,320 880,600 650,780 620,550"
        fill="rgba(244,63,94,0.05)"
        stroke="rgba(244,63,94,0.35)"
        strokeWidth="1.5"
        filter="url(#districtGlow)"
      />
      <text x="760" y="540" fill="rgba(226,232,240,0.55)" fontSize="14" textAnchor="middle">
        栖霞区
      </text>

      {/* 江宁区 */}
      <polygon
        points="120,700 380,750 420,820 650,780 880,600 920,950 150,920"
        fill="rgba(14,165,233,0.05)"
        stroke="rgba(14,165,233,0.35)"
        strokeWidth="1.5"
        filter="url(#districtGlow)"
      />
      <text x="540" y="870" fill="rgba(226,232,240,0.55)" fontSize="14" textAnchor="middle">
        江宁区
      </text>

      {/* 装饰性经纬线 */}
      <line x1="100" y1="500" x2="900" y2="500" stroke="rgba(34,211,238,0.1)" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="500" y1="100" x2="500" y2="900" stroke="rgba(34,211,238,0.1)" strokeWidth="1" strokeDasharray="4 4" />

    </svg>
  );
}
