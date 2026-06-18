import mapData from '../mock/nanjingMapPaths.json';

const COLORS = [
  'rgba(34,211,238,0.06)',
  'rgba(59,130,246,0.05)',
  'rgba(168,85,247,0.05)',
  'rgba(16,185,129,0.05)',
  'rgba(245,158,11,0.05)',
  'rgba(244,63,94,0.05)',
  'rgba(14,165,233,0.05)',
];

const STROKES = [
  'rgba(34,211,238,0.35)',
  'rgba(59,130,246,0.35)',
  'rgba(168,85,247,0.35)',
  'rgba(16,185,129,0.35)',
  'rgba(245,158,11,0.35)',
  'rgba(244,63,94,0.35)',
  'rgba(14,165,233,0.35)',
];

interface NanjingMapBackgroundProps {
  /** 与 G6 画布同步的 CSS transform，避免缩放/平移时地图与节点分层 */
  transform?: string;
}

/**
 * 南京市区真实地图背景（基于 GeoJSON 等距圆柱投影）
 * 坐标系 viewBox="0 0 1000 1000"，与 NetworkMapModal 使用同一投影坐标系
 */
export function NanjingMapBackground({ transform }: NanjingMapBackgroundProps) {
  const { width, height, districts } = mapData;

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform, transformOrigin: 'center center' }}
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
      <rect width={width} height={height} fill="url(#grid)" />
      <rect width={width} height={height} fill="url(#mapGlow)" />

      {/* 真实区划轮廓 */}
      {districts.map((district, index) => {
        const color = COLORS[index % COLORS.length];
        const stroke = STROKES[index % STROKES.length];
        return (
          <g key={district.adcode}>
            {district.paths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill={color}
                stroke={stroke}
                strokeWidth="1.5"
                filter="url(#districtGlow)"
              />
            ))}
            <text
              x={district.labelX}
              y={district.labelY}
              fill="rgba(226,232,240,0.6)"
              fontSize="13"
              fontWeight="500"
              textAnchor="middle"
              style={{ pointerEvents: 'none', textShadow: '0 0 4px rgba(0,0,0,0.6)' }}
            >
              {district.name}
            </text>
          </g>
        );
      })}

      {/* 装饰性经纬线 */}
      <line x1="100" y1={height / 2} x2={width - 100} y2={height / 2} stroke="rgba(34,211,238,0.1)" strokeWidth="1" strokeDasharray="4 4" />
      <line x1={width / 2} y1="100" x2={width / 2} y2={height - 100} stroke="rgba(34,211,238,0.1)" strokeWidth="1" strokeDasharray="4 4" />
    </svg>
  );
}
