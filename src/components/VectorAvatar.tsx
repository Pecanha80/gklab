import React from 'react';
import { Group, Path, Circle, Ellipse, Text } from 'react-konva';

export interface KitColors {
  shirt: string;
  shorts: string;
  socks: string;
}

// Skin tone palette – index 0 is the default (medium/light)
const SKIN_TONES = [
  { base: '#FF9D5C' }, // Reference skin tone
  { base: '#FFCBA4' }, // medium-light
  { base: '#D4956A' }, // medium-dark
  { base: '#F5D5B2' }, // light
];

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
  skinToneIndex?: 0 | 1 | 2;
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
  skinToneIndex = 0,
}) => {
  const defaultColors =
    type === 'gk'
      ? { shirt: '#0000FF', shorts: '#0000FF', socks: '#0000FF' }
      : { shirt: '#3b82f6', shorts: '#ffffff', socks: '#3b82f6' };

  const c = colors || defaultColors;

  const skin = SKIN_TONES[skinToneIndex] ?? SKIN_TONES[0];
  const skinColor = skin.base;
  const shoeColor = '#222222';
  const hairColor = '#5D4037';
  const gloveColor = '#ffffff';

  const isFront = facing === 'front';

  // baseScale = 0.5 * scaleXY keeps the rendered size ~45px high
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

        {/* Selection ring */}
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

        {/* ── Main avatar group, centred around 0,0 ── */}
        <Group y={-6}>

          {/* ── NECK ── smooth trapezoid connecting head to shoulders */}
          <Path
            data="M -4 -22 Q -3.5 -17 -5 -14 L 5 -14 Q 3.5 -17 4 -22 Z"
            fill={skinColor}
          />

          {/* ── HEAD ── slightly oval, natural shape */}
          <Ellipse
            x={0}
            y={-30}
            radiusX={9}
            radiusY={10.5}
            fill={skinColor}
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={0.8}
          />

          {/* ── HAIR ── Style matching reference image */}
          {isFront ? (
            <Path
              data="M -9 -33 C -10 -40 -7 -46 -1 -46 C 4 -46.5 8 -43 9 -33 Q 6 -36 0 -36 Q -6 -36 -9 -33 Z"
              fill={hairColor}
            />
          ) : (
             <Path
              /* Back: larger hair coverage for full head coverage */
              data="M -9.5 -22 C -11 -30 -10 -45 -1 -45 C 8 -45 11 -30 9.5 -22 C 8 -24 5 -26 0 -26 C -5 -26 -8 -24 -9.5 -22 Z"
              fill={hairColor}
            />
          )}

          {/* ── BACK VIEW: collar/neckline detail ── */}
          {!isFront && (
            <Path
              data="M -6 -16 Q -3 -18 0 -18.5 Q 3 -18 6 -16"
              fill="transparent"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth={1}
            />
          )}

          {type === 'gk' ? (
            <>
              {/* ══════════ GK — READY STANCE (MATCHING IMAGE) ══════════ */}

              {/* ── GK TORSO ── */}
              <Path
                data="M -8 -16 L -16 -10 L -16 14 L 16 14 L 16 -10 L 8 -16 Z"
                fill={c.shirt}
              />
              {/* Crew neck detail */}
              <Path
                data="M -4 -16 Q 0 -13 4 -16 Z"
                fill={skinColor}
              />

              {/* ── GK LEFT ARM ── */}
              {/* Sleeve */}
              <Path data="M -16 -10 L -22 -6 L -19 -1 Z" fill={c.shirt} />
              {/* Forearm (Skin) */}
              <Path data="M -22 -6 L -26 4 L -21 7 L -19 -1 Z" fill={skinColor} />
              {/* Glove */}
              <Path
                data="M -26 4 C -30 4 -32 8 -30 14 Q -28 18 -24 16 L -21 7 Z"
                fill={gloveColor}
                stroke="rgba(0,0,0,0.1)"
                strokeWidth={0.5}
              />

              {/* ── GK RIGHT ARM ── */}
              {/* Sleeve */}
              <Path data="M 16 -10 L 22 -6 L 19 -1 Z" fill={c.shirt} />
              {/* Forearm (Skin) */}
              <Path data="M 22 -6 L 26 4 L 21 7 L 19 -1 Z" fill={skinColor} />
              {/* Glove */}
              <Path
                data="M 26 4 C 30 4 32 8 30 14 Q 28 18 24 16 L 21 7 Z"
                fill={gloveColor}
                stroke="rgba(0,0,0,0.1)"
                strokeWidth={0.5}
              />

              {/* ── GK SHORTS ── */}
              <Path
                data="M -16 14 L -18 28 L -6 28 L 0 20 L 6 28 L 18 28 L 16 14 Z"
                fill={c.shorts}
              />

              {/* ── GK LEGS ── */}
              {/* Thighs (Skin) */}
              <Path data="M -18 28 L -22 36 L -12 36 L -10 28 Z" fill={skinColor} />
              <Path data="M 18 28 L 22 36 L 12 36 L 10 28 Z" fill={skinColor} />

              {/* Socks */}
              <Path data="M -22 36 L -22 48 L -14 48 L -12 36 Z" fill={c.socks} />
              <Path data="M 22 36 L 22 48 L 14 48 L 12 36 Z" fill={c.socks} />

              {/* Boots */}
              <Path data="M -23 48 C -26 48 -26 54 -18 54 L -13 54 L -13 48 Z" fill={shoeColor} />
              <Path data="M 23 48 C 26 48 26 54 18 54 L 13 54 L 13 48 Z" fill={shoeColor} />
            </>
          ) : (
            <>
              {/* ══════════ PLAYER — UPDATED HUMANOID ══════════ */}

              {/* ── PLAYER TORSO ── */}
              <Path
                data="M -7 -16 L -13 -12 L -13 14 L 13 14 L 13 -12 L 7 -16 Z"
                fill={c.shirt}
              />
              <Path
                data="M -3.5 -16 Q 0 -13 3.5 -16 Z"
                fill={skinColor}
              />

              {/* ── PLAYER LEFT ARM ── */}
              <Path data="M -13 -12 L -18 -8 L -16 -4 Z" fill={c.shirt} />
              <Path data="M -18 -8 L -20 10 L -15 10 L -16 -4 Z" fill={skinColor} />

              {/* ── PLAYER RIGHT ARM ── */}
              <Path data="M 13 -12 L 18 -8 L 16 -4 Z" fill={c.shirt} />
              <Path data="M 18 -8 L 20 10 L 15 10 L 16 -4 Z" fill={skinColor} />

              {/* ── PLAYER SHORTS ── */}
              <Path
                data="M -13 14 L -14 28 L -2 28 L 0 20 L 2 28 L 14 28 L 13 14 Z"
                fill={c.shorts}
              />

              {/* ── PLAYER LEGS ── */}
              <Path data="M -14 28 L -14 36 L -6 36 L -6 28 Z" fill={skinColor} />
              <Path data="M 14 28 L 14 36 L 6 36 L 6 28 Z" fill={skinColor} />

              <Path data="M -14 36 L -14 48 L -8 48 L -6 36 Z" fill={c.socks} />
              <Path data="M 14 36 L 14 48 L 8 48 L 6 36 Z" fill={c.socks} />

              <Path data="M -14 48 C -17 48 -17 54 -10 54 L -7 54 L -7 48 Z" fill={shoeColor} />
              <Path data="M 14 48 C 17 48 17 54 10 54 L 7 54 L 7 48 Z" fill={shoeColor} />
            </>
          )}

          {/* ── LABEL ── */}
          {label && (
            <Text
              text={label}
              x={-20}
              y={58}
              width={40}
              align="center"
              fontSize={9}
              fill="#ffffff"
              fontStyle="bold"
              shadowColor="rgba(0,0,0,0.8)"
              shadowBlur={3}
              shadowOffsetY={1}
            />
          )}

        </Group>

      </Group>
    </Group>
  );
};
