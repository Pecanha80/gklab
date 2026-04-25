import React from 'react';
import { Group, Path, Circle, Rect, Ellipse, Line } from 'react-konva';

export type EquipmentType = 'ball' | 'cone' | 'disc' | 'goal' | 'ladder' | 'miniGoal' | 'ring' | 'mannequin' | 'box' | 'stake';

interface VectorElementProps {
  x: number;
  y: number;
  type: EquipmentType;
  color?: string;
  isSelected: boolean;
  draggable?: boolean;
  onClick?: () => void;
  onTap?: () => void;
  onDragEnd?: (e: any) => void;
  onTransformEnd?: (e: any) => void;
  id?: string;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
}

export const VectorElement: React.FC<VectorElementProps> = ({
  x,
  y,
  type,
  color,
  isSelected,
  draggable,
  onClick,
  onTap,
  onDragEnd,
  onTransformEnd,
  id,
  scaleX = 1,
  scaleY = 1,
  rotation = 0,
}) => {
  const c = color || '#ffffff';

  // Selection outline bounds (based on the previous hardcoded sizes)
  const sizes: Record<EquipmentType, { w: number; h: number }> = {
    ball: { w: 20, h: 20 },
    cone: { w: 24, h: 24 },
    disc: { w: 26, h: 10 },
    goal: { w: 60, h: 24 },
    ladder: { w: 24, h: 60 },
    miniGoal: { w: 36, h: 18 },
    ring: { w: 24, h: 24 },
    mannequin: { w: 24, h: 48 },
    box: { w: 40, h: 32 },
    stake: { w: 8, h: 48 },
  };

  const size = sizes[type] || { w: 24, h: 24 };

  const renderShape = () => {
    switch (type) {
      case 'box':
        // GK Training Box — grass body, wood front face
        return (
          <Group>
            {/* Main Body — artificial grass */}
            <Rect x={-20} y={-8} width={40} height={24} fill="#2d6a1e" stroke="#1b3f12" strokeWidth={1} cornerRadius={2} />
            {/* Top Side — grass lighter */}
            <Rect x={-20} y={-16} width={40} height={12} fill="#3d8a2e" stroke="#2d6a1e" strokeWidth={1} cornerRadius={1} />
            {/* Grass details on top */}
            <Line points={[-15, -14, -13, -8, -11, -14]} stroke="#4a8b34" strokeWidth={1} />
            <Line points={[-5, -12, -3, -7, -1, -12]} stroke="#4a8b34" strokeWidth={1} />
            <Line points={[5, -14, 7, -9, 9, -14]} stroke="#4a8b34" strokeWidth={1} />
            <Line points={[13, -12, 15, -7, 17, -12]} stroke="#4a8b34" strokeWidth={1} />
            {/* Front Face — wood */}
            <Group x={-20} y={-8}>
              <Rect width={40} height={24} fill="#8B4513" stroke="#5D2E0C" strokeWidth={1} />
              {/* Wood grain details */}
              <Line points={[4, 6, 36, 6]} stroke="#A0632B" strokeWidth={0.5} />
              <Line points={[4, 12, 36, 12]} stroke="#A0632B" strokeWidth={0.5} />
              <Line points={[4, 18, 36, 18]} stroke="#A0632B" strokeWidth={0.5} />
            </Group>
          </Group>
        );

      case 'stake':
        // Training stake/pole (estaca)
        return (
          <Group>
            {/* Main Pole */}
            <Rect x={-2} y={-24} width={4} height={48} fill={c} cornerRadius={1} />
            {/* Pointy Bottom */}
            <Path data="M -2 24 L 2 24 L 0 32 Z" fill={c} />
            {/* Top Cap */}
            <Circle x={0} y={-24} radius={3} fill={c} />
            {/* Bright Color detail */}
            <Rect x={-2} y={-10} width={4} height={6} fill="#FFFF00" opacity={0.8} />
          </Group>
        );

      case 'cone':
        // Orange/colored cone: wide base, pointy top
        return (
          <Group>
            {/* Base */}
            <Rect x={-12} y={8} width={24} height={4} fill={c} cornerRadius={2} />
            {/* Body */}
            <Path data="M -8 8 L 8 8 L 3 -10 L -3 -10 Z" fill={c} />
            <Path data="M -3 -10 L 3 -10 Q 0 -14 -3 -10 Z" fill={c} />
            {/* White stripe */}
            <Path data="M -6 2 L 6 2 L 4 -4 L -4 -4 Z" fill="#ffffff" opacity={0.9} />
          </Group>
        );

      case 'disc':
        // Flat training disc (dome shape)
        return (
          <Group y={2}>
            {/* Base/Bottom */}
            <Ellipse x={0} y={0} radiusX={13} radiusY={4} fill={c} shadowColor="black" shadowBlur={2} shadowOffsetY={1} />
            {/* Top Dome */}
            <Path data="M -10 0 C -10 -8 10 -8 10 0 Z" fill={c} opacity={0.9} />
            <Circle x={0} y={-4} radius={2} fill="#000000" opacity={0.2} />
          </Group>
        );

      case 'ring':
        // Training ring
        return (
          <Ellipse 
            x={0} y={0} 
            radiusX={12} radiusY={12} 
            stroke={c} strokeWidth={4} 
            shadowColor="black" shadowBlur={2} shadowOffsetY={1}
          />
        );

      case 'ball':
        // Soccer ball
        return (
          <Group>
            <Circle x={0} y={0} radius={10} fill="#ffffff" stroke="#333333" strokeWidth={1.5} shadowColor="black" shadowBlur={2} shadowOffsetY={2} />
            {/* Simple pentagon pattern */}
            <Path data="M 0 -4 L 4 -1 L 2 4 L -2 4 L -4 -1 Z" fill="#333333" />
            <Line points={[0, -4, 0, -10]} stroke="#333333" strokeWidth={1} />
            <Line points={[4, -1, 9, -4]} stroke="#333333" strokeWidth={1} />
            <Line points={[2, 4, 6, 8]} stroke="#333333" strokeWidth={1} />
            <Line points={[-2, 4, -6, 8]} stroke="#333333" strokeWidth={1} />
            <Line points={[-4, -1, -9, -4]} stroke="#333333" strokeWidth={1} />
          </Group>
        );

      case 'ladder':
        // Agility ladder
        const rungs = [];
        for (let i = -24; i <= 24; i += 12) {
          rungs.push(<Line key={i} points={[-10, i, 10, i]} stroke={c} strokeWidth={3} />);
        }
        return (
          <Group>
            {/* Side rails */}
            <Line points={[-10, -28, -10, 28]} stroke="#333333" strokeWidth={2} />
            <Line points={[10, -28, 10, 28]} stroke="#333333" strokeWidth={2} />
            {rungs}
          </Group>
        );

      case 'goal':
      case 'miniGoal': {
        const gw = type === 'goal' ? 60 : 36;
        const gh = type === 'goal' ? 24 : 18;
        const hw = gw / 2;
        const hh = gh / 2;
        const netColor = c === '#ffffff' ? '#ffffff' : c;
        
        // Let's create a net grid
        const grid = [];
        for (let i = -hw + 4; i < hw; i += 4) {
          grid.push(<Line key={`v${i}`} points={[i, -hh, i, hh]} stroke={netColor} strokeWidth={0.5} opacity={0.5} />);
        }
        for (let j = -hh + 4; j < hh; j += 4) {
          grid.push(<Line key={`h${j}`} points={[-hw, j, hw, j]} stroke={netColor} strokeWidth={0.5} opacity={0.5} />);
        }

        return (
          <Group>
            {/* Net background */}
            <Rect x={-hw} y={-hh} width={gw} height={gh} fill="rgba(255,255,255,0.1)" />
            {grid}
            {/* Goal Posts & Crossbar */}
            <Path data={`M -${hw} ${hh} L -${hw} -${hh} L ${hw} -${hh} L ${hw} ${hh}`} stroke="#ffffff" strokeWidth={3} shadowColor="black" shadowBlur={2} shadowOffsetY={2} />
          </Group>
        );
      }

      case 'mannequin': {
        // Training mannequin (barreira)
        return (
          <Group y={4}>
            {/* Top Head - Oval loop style */}
            <Path 
              data="M -4 -20 C -4 -26, 4 -26, 4 -20 C 4 -16, -4 -16, -4 -20 Z" 
              stroke={c} strokeWidth={2.5} 
            />
            {/* Shoulders and Chest */}
            <Path 
              data="M -10 -16 L 10 -16 L 10 4 L -10 4 Z" 
              stroke={c} strokeWidth={2.5} fill={c} fillOpacity={0.2}
            />
            {/* Vertical Support Bars (Central + Sides) */}
            <Line points={[0, -22, 0, 24]} stroke={c} strokeWidth={2.5} />
            <Line points={[-6, -16, -6, 22]} stroke={c} strokeWidth={2.5} />
            <Line points={[6, -16, 6, 22]} stroke={c} strokeWidth={2.5} />
            
            {/* Horizontal Detail on Chest */}
            <Line points={[-10, -8, 10, -8]} stroke={c} strokeWidth={2.5} />
            
            {/* Lower Legs / Supports */}
            <Path 
              data="M -10 4 L -8 24 M 10 4 L 8 24" 
              stroke={c} strokeWidth={2.5} 
            />
            
            {/* Bottom Base */}
            <Rect x={-10} y={24} width={20} height={3} fill={c} cornerRadius={1} />
          </Group>
        );
      }

      default:
        return <Rect x={-10} y={-10} width={20} height={20} fill={c} />;
    }
  };

  return (
    <Group 
      id={id} 
      x={x} 
      y={y} 
      scaleX={scaleX}
      scaleY={scaleY}
      rotation={rotation}
      draggable={draggable} 
      onClick={onClick} 
      onTap={onTap} 
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    >
      {isSelected && (
        <Rect
          x={-size.w / 2 - 6}
          y={-size.h / 2 - 6}
          width={size.w + 12}
          height={size.h + 12}
          stroke="#fff"
          strokeWidth={2}
          dash={[4, 4]}
          cornerRadius={4}
          shadowBlur={10}
          shadowColor="white"
        />
      )}
      {renderShape()}
    </Group>
  );
};
