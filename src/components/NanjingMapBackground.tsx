import mapData from '../mock/nanjingMapPaths.json';

const DISTRICT_FILL = 'rgba(34, 211, 238, 0.05)';
const DISTRICT_STROKE = 'rgba(34, 211, 238, 0.25)';
const LABEL_FILL = 'rgba(226, 232, 240, 0.55)';

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
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(34,211,238,0.05)" strokeWidth="1" />
        </pattern>
        <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(34, 211, 238, 0.08)" />
          <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
        </radialGradient>
      </defs>

      {/* 背景网格 */}
      <rect width={width} height={height} fill="url(#grid)" />
      <rect width={width} height={height} fill="url(#mapGlow)" />

      {/* 真实区划轮廓 - 统一使用低透明度青色，避免七彩分区 */}
      {districts.map((district) => (
        <g key={district.adcode}>
          {district.paths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill={DISTRICT_FILL}
              stroke={DISTRICT_STROKE}
              strokeWidth="1"
            />
          ))}
          <text
            x={district.labelX}
            y={district.labelY}
            fill={LABEL_FILL}
            fontSize="12"
            fontWeight="500"
            textAnchor="middle"
            style={{ pointerEvents: 'none' }}
          >
            {district.name}
          </text>
        </g>
      ))}

      {/* 装饰性经纬线 */}
      <line x1="100" y1={height / 2} x2={width - 100} y2={height / 2} stroke="rgba(34,211,238,0.08)" strokeWidth="1" strokeDasharray="4 4" />
      <line x1={width / 2} y1="100" x2={width / 2} y2={height - 100} stroke="rgba(34,211,238,0.08)" strokeWidth="1" strokeDasharray="4 4" />
    </svg>
  );
}
