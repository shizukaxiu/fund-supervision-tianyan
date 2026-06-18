import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Graph } from '@antv/g6';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Map as MapIcon, Network } from 'lucide-react';
import type { NetworkData, Alert, MedicalRecord, NetworkNode } from '../types';
import { NodeDetailDrawer } from './NodeDetailDrawer';
import { NanjingMapBackground } from './NanjingMapBackground';
import hospitalMapCoords from '../mock/hospitalMapCoords.json';

interface NetworkMapModalProps {
  network: NetworkData;
  records: MedicalRecord[];
  selectedAlert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
}

const MAP_SIZE = 1000;

/** 医院名称在地图上的简称，避免主城区医院标签互相遮挡 */
const HOSPITAL_SHORT_NAMES: Record<string, string> = {
  H001: '鼓楼医院',
  H002: '省人医',
  H003: '市一医院',
  H004: '中大医院',
  H005: '市中医院',
  H006: '南医二附院',
  H007: '江宁医院',
  H008: '栖霞区医院',
  H009: '雨花台医院',
  H010: '建邺医院',
};

/** 对距离过近的医院做轻微斥力分离，仅影响显示位置，不改变真实投影坐标 */
function separateHospitals(
  positions: Record<string, { x: number; y: number }>,
  minDistance = 60,
  iterations = 40
): Record<string, { x: number; y: number }> {
  const hospitalIds = Object.keys(positions);
  if (hospitalIds.length < 2) return positions;

  const result: Record<string, { x: number; y: number }> = {};
  for (const id of hospitalIds) {
    result[id] = { ...positions[id] };
  }

  for (let i = 0; i < iterations; i++) {
    let moved = false;
    for (let a = 0; a < hospitalIds.length; a++) {
      for (let b = a + 1; b < hospitalIds.length; b++) {
        const idA = hospitalIds[a];
        const idB = hospitalIds[b];
        const posA = result[idA];
        const posB = result[idB];
        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < minDistance) {
          const overlap = (minDistance - dist) / 2;
          const offsetX = (dx / dist) * overlap;
          const offsetY = (dy / dist) * overlap;
          result[idA].x -= offsetX;
          result[idA].y -= offsetY;
          result[idB].x += offsetX;
          result[idB].y += offsetY;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return result;
}

export function NetworkMapModal({ network, records, selectedAlert, isOpen, onClose }: NetworkMapModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  const typeColors: Record<string, string> = {
    hospital: '#22d3ee',
    doctor: '#fbbf24',
    patient: '#f43f5e',
    pharmacy: '#10b981',
  };

  const gangColors = [
    '#f43f5e', '#22d3ee', '#fbbf24', '#10b981',
    '#a78bfa', '#fb923c', '#60a5fa', '#c084fc',
  ];

  // 使用 Python 脚本基于真实 GeoJSON 投影生成的统一坐标
  const mapPositions = useMemo(() => network.mapPositions ?? {}, [network]);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    // 将 1000x1000 投影坐标映射到 SVG 实际显示区域（保持与背景地图一致）
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const displaySize = Math.min(containerWidth, containerHeight);
    const scale = displaySize / MAP_SIZE;
    const offsetX = (containerWidth - displaySize) / 2;
    const offsetY = (containerHeight - displaySize) / 2;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    // 医院节点先做轻微斥力分离，避免主城区医院密集重叠
    const hospitalPositions: Record<string, { x: number; y: number }> = {};
    network.nodes.forEach((node) => {
      if (node.type === 'hospital') {
        const pos = mapPositions[node.id] ?? (hospitalMapCoords as Record<string, { x: number; y: number }>)[node.id];
        if (pos) hospitalPositions[node.id] = { x: pos.x * scale + offsetX, y: pos.y * scale + offsetY };
      }
    });
    const separatedHospitals = separateHospitals(hospitalPositions, 90 * scale, 60);

    const getNodePosition = (node: NetworkNode) => {
      if (node.type === 'hospital' && separatedHospitals[node.id]) {
        return separatedHospitals[node.id];
      }
      const pos = mapPositions[node.id];
      if (pos) return { x: pos.x * scale + offsetX, y: pos.y * scale + offsetY };
      // fallback：医院节点使用独立坐标表，其余居中
      if (node.type === 'hospital') {
        const fallback = (hospitalMapCoords as Record<string, { x: number; y: number }>)[node.id];
        if (fallback) return { x: fallback.x * scale + offsetX, y: fallback.y * scale + offsetY };
      }
      return { x: centerX, y: centerY };
    };

    // 医院节点排在最后渲染，确保标签和描边不被医生/患者覆盖
    const sortedNodes = [...network.nodes].sort((a, b) => {
      if (a.type === 'hospital' && b.type !== 'hospital') return 1;
      if (a.type !== 'hospital' && b.type === 'hospital') return -1;
      return 0;
    });

    const nodes = sortedNodes.map((node) => {
      const pos = getNodePosition(node);
      const isHospital = node.type === 'hospital';
      const isDoctor = node.type === 'doctor';
      const baseSize = isHospital
        ? 14
        : isDoctor
          ? Math.max(7, Math.min(16, node.value / 400))
          : Math.max(5, Math.min(12, node.value / 600));
      const gangColor = node.gangId
        ? gangColors[parseInt(node.gangId.replace('G', '')) % gangColors.length]
        : typeColors[node.type];

      return {
        id: node.id,
        style: {
          x: pos.x,
          y: pos.y,
          labelText: isHospital ? (HOSPITAL_SHORT_NAMES[node.id] ?? node.name) : node.name,
          labelFill: '#e2e8f0',
          labelFontSize: isHospital ? 9 : 9,
          labelMaxWidth: 100,
          labelOffsetX: isHospital ? 10 : 0,
          labelOffsetY: isHospital ? -4 : (isDoctor ? -5 : 0),
          size: baseSize,
          fill: gangColor,
          stroke: isHospital ? '#fff' : (node.gangId ? '#fff' : gangColor),
          lineWidth: isHospital ? 2 : (node.gangId ? 2 : 1),
          opacity: isHospital ? 1 : 0.8,
          labelBackground: isHospital,
          labelBackgroundFill: 'rgba(15,23,42,0.7)',
          labelBackgroundRadius: 4,
          labelBackgroundPadding: [2, 4],
        },
        data: {
          type: node.type,
          value: node.value,
          gangId: node.gangId,
          baseSize,
          gangColor,
        },
      };
    });

    const edges = network.edges.map((edge) => ({
      id: `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      style: {
        stroke: 'rgba(34, 211, 238, 0.25)',
        lineWidth: Math.max(1, Math.min(3, edge.value / 2)),
        opacity: 0.55,
      },
      data: {
        value: edge.value,
      },
    }));

    const graph = new Graph({
      container: containerRef.current,
      data: { nodes, edges },
      // 节点位置由真实地图投影坐标决定，医院固定，医生/患者围绕医院散开；
      // 不启用自动布局，避免力导向把节点拉离地图真实位置。
      node: {
        state: {
          highlight: {
            size: (d: any) => d.data.baseSize * 1.3,
            lineWidth: 3,
            stroke: '#fff',
            opacity: 1,
            labelFontSize: 12,
            labelFontWeight: 'bold',
          },
          dim: {
            opacity: 0.15,
            labelOpacity: 0.15,
          },
        },
      },
      edge: {
        state: {
          highlight: {
            stroke: '#22d3ee',
            lineWidth: 3,
            opacity: 1,
          },
          dim: {
            opacity: 0.08,
          },
        },
      },
      behaviors: [
        'drag-canvas',
        'zoom-canvas',
        {
          type: 'drag-element',
          enable: (event: any) => {
            const id = event.target?.id;
            // 禁止拖动医院节点（保持与地图对齐）
            return typeof id === 'string' && !id.startsWith('H');
          },
        },
      ],
      background: 'transparent',
    });

    graphRef.current = graph;
    graph.render();

    graph.on('node:click', (event: any) => {
      const nodeId = event.target?.id || event?.data?.id;
      if (nodeId) {
        const node = network.nodes.find((n) => n.id === nodeId);
        if (node) setSelectedNode(node);
      }
    });

    return () => {
      graph.destroy();
      graphRef.current = null;
    };
  }, [isOpen, network, mapPositions]);

  // 当选中告警变化时高亮路径
  useEffect(() => {
    if (!graphRef.current || !isOpen) return;
    const graph = graphRef.current;
    const allNodeIds = network.nodes.map((n) => n.id);

    allNodeIds.forEach((id) => graph.setElementState(id, []));
    network.edges.forEach((edge) => {
      graph.setElementState(`${edge.source}-${edge.target}`, []);
    });

    if (!selectedAlert) return;

    const record = records.find((r) => r.recordId === selectedAlert.recordId);
    const highlightIds = record
      ? [record.patientId, record.doctorId, record.hospitalId]
      : [selectedAlert.patientId];

    allNodeIds.forEach((id) => {
      graph.setElementState(id, highlightIds.includes(id) ? ['highlight'] : ['dim']);
    });
    network.edges.forEach((edge) => {
      const isHighlighted = record
        ? (edge.source === record.patientId && edge.target === record.doctorId) ||
          (edge.source === record.doctorId && edge.target === record.hospitalId)
        : false;
      graph.setElementState(`${edge.source}-${edge.target}`, isHighlighted ? ['highlight'] : ['dim']);
    });
  }, [selectedAlert, network, records, isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm"
        >
          {/* 顶部工具栏 */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <MapIcon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">风险网络地图模式</h2>
                <p className="text-xs text-slate-400">医院固定于南京市区真实位置 · 医生与患者可拖拽</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700/80 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>关闭</span>
            </button>
          </div>

          {/* 地图 + 图谱容器 */}
          <div className="absolute inset-0">
            <NanjingMapBackground />
            <div ref={containerRef} className="absolute inset-0 w-full h-full">
              <NodeDetailDrawer
                node={selectedNode}
                records={records}
                onClose={() => setSelectedNode(null)}
              />
            </div>
          </div>

          {/* 底部图例 */}
          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-6 px-4 py-2 rounded-lg bg-slate-900/80 border border-slate-700/50 text-xs">
              <div className="flex items-center gap-2">
                <Network className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-300">
                  {network.nodes.length} 节点 · {network.edges.length} 关系 · {network.gangs} 团伙
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-slate-400">医院（固定）</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-slate-400">医生（可拖拽）</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-400">患者（可拖拽）</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
