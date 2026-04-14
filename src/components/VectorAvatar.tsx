import React from 'react';
import { Group, Path, Circle, Ellipse, Rect, Text } from 'react-konva';

export interface KitColors {
  shirt: string;
  shorts: string;
  socks: string;
}

interface VectorAvatarProps {
  x: number;
  y: number;
  type: 'player' | 'gk';
  isSelected: boolean;
  colors?: KitColors;
  draggable?: boolean;
  onClick?: () => void;
  onTap?: () => void;
  onDragEnd?: (e: any) => void;
  onTransformEnd?: (e: any) => void;
  id?: string;
  scaleXY?: number;
  facing?: 'front' | 'back';
  label?: string;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
}

export const VectorAvatar: React.FC<VectorAvatarProps> = ({
  x,
  y,
  type,
  isSelected,
  colors,
  draggable,
  onClick,
  onTap,
  onDragEnd,
  onTransformEnd,
  id,
  scaleXY = 1,
  facing = 'front',
  label,
  scaleX = 1,
  scaleY = 1,
  rotation = 0,
}) => {
  // Default colors if not provided
  const defaultColors =
    type === 'gk'
      ? { shirt: '#eab308', shorts: '#111111', socks: '#eab308' } // yellow/black/yellow
      : { shirt: '#3b82f6', shorts: '#ffffff', socks: '#3b82f6' }; // blue/white/blue

  const c = colors || defaultColors;

  const skinColor = '#FFCDB2'; // More realistic skin tone
  const shoeColor = '#222222';
  const gloveColor = '#ffffff';
  const hairColor = '#5D4037'; // Brownish hair like the reference

  // The base paths draw a character around 90px tall (y from -38 to +50).
  // AVATAR_SIZE is assumed to be roughly 36-40.
  // We use scale 0.5 to make it ~45px, matching the UI size well.
  const baseScale = 0.5 * scaleXY;

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
      <Group scaleX={baseScale} scaleY={baseScale}>
        {/* Selection outline/shadow */}
        {isSelected && (
          <Circle
            x={0}
            y={0}
            radius={32 / baseScale}
            fill="transparent"
            stroke="#ffffff"
            strokeWidth={3 / baseScale}
            shadowBlur={12}
            shadowColor="white"
          />
        )}

      {/* Main Avatar Group */}
      <Group y={-6}>
        {/* Back layer: Neck */}
        <Rect x={-3} y={-20} width={6} height={10} fill={skinColor} />

        {/* Head */}
        {facing === 'back' ? (
          <Ellipse x={0} y={-28} radiusX={8} radiusY={10} fill={hairColor} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />
        ) : (
          <>
            <Ellipse x={0} y={-28} radiusX={8} radiusY={10} fill={skinColor} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />
            <Path
              data="M -8.5 -30 C -8.5 -40 8.5 -40 8.5 -30 C 5 -34 0 -36 -4 -34 C -6 -33 -8.5 -30 -8.5 -30 Z"
              fill={hairColor}
            />
          </>
        )}

        {type === 'gk' ? (
          <>
            {/* Long sleeves for GK */}
            <Path
              data="
                M -6 -14 L 6 -14 
                Q 15 -14 19 -8 L 25 6 
                L 17 9 L 13 0 
                L 12 12 L -12 12 
                L -13 0 L -17 9 
                L -25 6 Q -15 -14 -6 -14 Z
              "
              fill={c.shirt}
              stroke="rgba(0,0,0,0.08)"
              strokeWidth={1}
              lineJoin="round"
            />
            {/* V-Neck detail only if front */}
            {facing === 'front' && <Path data="M -4 -14 L 4 -14 L 0 -11 Z" fill="rgba(0,0,0,0.15)" />}
            
            {/* Gloves */}
            <Path 
              data="M -25 6 L -17 9 L -18 16 Q -22 17 -27 13 Z" 
              fill={gloveColor} 
              stroke="rgba(0,0,0,0.15)" 
              strokeWidth={1.5} 
              lineJoin="round" 
            />
            <Path 
              data="M 25 6 L 17 9 L 18 16 Q 22 17 27 13 Z" 
              fill={gloveColor} 
              stroke="rgba(0,0,0,0.15)" 
              strokeWidth={1.5} 
              lineJoin="round" 
            />
          </>
        ) : (
          <>
            {/* Short sleeves for Player */}
            <Path
              data="
                M -6 -14 L 6 -14 
                Q 14 -14 17 -8 L 21 -1 
                L 14 2 L 12 -2 
                L 12 12 L -12 12 
                L -12 -2 L -14 2 
                L -21 -1 Q -14 -14 -6 -14 Z
              "
              fill={c.shirt}
              stroke="rgba(0,0,0,0.08)"
              strokeWidth={1}
              lineJoin="round"
            />
            {/* V-Neck detail only if front */}
            {facing === 'front' && <Path data="M -4 -14 L 4 -14 L 0 -11 Z" fill="rgba(0,0,0,0.15)" />}

            {/* Bare arms for Player */}
            <Path 
              data="M -21 -1 L -14 2 L -17 14 L -24 10 Z" 
              fill={skinColor} 
              stroke="rgba(0,0,0,0.05)" 
              strokeWidth={1} 
              lineJoin="round" 
            />
            <Path 
              data="M 21 -1 L 14 2 L 17 14 L 24 10 Z" 
              fill={skinColor} 
              stroke="rgba(0,0,0,0.05)" 
              strokeWidth={1} 
              lineJoin="round" 
            />
          </>
        )}

        {/* Shorts */}
        <Path
          data="
            M -12 12 L 12 12 
            L 14 26 L 3 26 
            L 0 18 L -3 26 
            L -14 26 Z
          "
          fill={c.shorts}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={1}
          lineJoin="round"
        />

        {/* Knees (Skin gap between shorts and socks) */}
        <Path data="M -13 26 L -3.5 26 L -4 32 L -12.5 32 Z" fill={skinColor} />
        <Path data="M 13 26 L 3.5 26 L 4 32 L 12.5 32 Z" fill={skinColor} />

        {/* Socks */}
        <Path 
          data="M -12.5 32 L -4 32 L -5 45 L -12 45 Z" 
          fill={c.socks} 
          stroke="rgba(0,0,0,0.08)" 
          strokeWidth={1} 
        />
        <Path 
          data="M 12.5 32 L 4 32 L 5 45 L 12 45 Z" 
          fill={c.socks} 
          stroke="rgba(0,0,0,0.08)" 
          strokeWidth={1} 
        />

        {/* Shoes */}
        <Path 
          data="M -12 45 L -5 45 C -3 48 -4 52 -6 52 L -15 52 C -16 49 -14 45 -12 45 Z" 
          fill={shoeColor} 
          lineJoin="round" 
        />
        <Path 
          data="M 12 45 L 5 45 C 3 48 4 52 6 52 L 15 52 C 16 49 14 45 12 45 Z" 
          fill={shoeColor} 
          lineJoin="round" 
        />
      </Group>
      </Group>
    </Group>
  );
};
