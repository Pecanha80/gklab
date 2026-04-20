import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image, Circle, Line, Text, Group, Arrow, Rect, Ellipse, Transformer } from 'react-konva';
import {
  Save,
  Trash2,
  RotateCcw,
  Type,
  X,
  Target,
  RectangleVertical,
  RectangleHorizontal,
  BoxSelect,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import useImage from 'use-image';
import { cn } from '../lib/utils';
import { useTranslation } from '../hooks/useTranslation';
import { VectorAvatar, KitColors } from './VectorAvatar';
import { VectorElement, EquipmentType } from './VectorElement';

type ElementType =
  | 'player' | 'gk'
  | 'ball' | 'cone' | 'disc' | 'goal' | 'ladder' | 'miniGoal' | 'ring' | 'mannequin' | 'box' | 'stake'
  | 'text'
  | 'arrow' | 'curvedArrow' | 'zigzag'
  | 'dashedArrow' | 'dashedCurvedArrow' | 'dashedZigzag'
  | 'shape' | 'ellipse';

interface TacticalElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  color?: string;
  label?: string;
  rotation?: number;
  points?: number[];
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  kitColors?: KitColors;
  facing?: 'front' | 'back';
}

interface TacticalBoardProps {
  onSave: (imageData: string) => void;
  onClose: () => void;
  initialData?: string;
}

const FIELD_IMAGES: Record<string, string> = {
  full: '/fields/full-pitch.png',
  half: '/fields/half-pitch.png',
  area: '/fields/penalty-area.png',
};

const MAX_CANVAS_W = 780;
const MAX_CANVAS_H = 520;
const FIELD_RATIOS: Record<string, number> = {
  full: 807 / 900,
  half: 1085 / 920,
  area: 1071 / 541,
};

function getCanvasSize(type: string): { w: number; h: number } {
  const ratio = FIELD_RATIOS[type] || 1;
  if (ratio >= MAX_CANVAS_W / MAX_CANVAS_H) {
    return { w: MAX_CANVAS_W, h: Math.round(MAX_CANVAS_W / ratio) };
  }
  return { w: Math.round(MAX_CANVAS_H * ratio), h: MAX_CANVAS_H };
}

// Which element types are drawn by click-and-drag
const DRAW_TOOLS = new Set<ElementType>([
  'arrow', 'dashedArrow', 'curvedArrow', 'dashedCurvedArrow', 'zigzag', 'dashedZigzag',
]);
const CURVED_TOOLS = new Set<ElementType>(['curvedArrow', 'dashedCurvedArrow']);
const ZIGZAG_TOOLS = new Set<ElementType>(['zigzag', 'dashedZigzag']);

const AVATAR_SIZE = 36;
const SPRITE_IMAGES: Record<string, string> = {
  player: '/jogador.png',
  gk: '/avatar.png',
};

const ELEMENT_TYPES: ElementType[] = ['ball', 'cone', 'disc', 'goal', 'ladder', 'miniGoal', 'ring', 'mannequin', 'box', 'stake'];


const CollapsibleSection: React.FC<{ title: string; rightAction?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }> = ({ title, rightAction, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2 w-full">
      <div className="flex items-center justify-between w-full mb-2 group">
        <button 
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 flex-1 text-left text-[10px] text-on-surface-variant uppercase font-bold"
        >
          {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {title}
        </button>
        {rightAction && <div onClick={e => e.stopPropagation()}>{rightAction}</div>}
      </div>
      <div className={cn("overflow-hidden transition-all", open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
        {children}
      </div>
    </div>
  );
};

// Removed old AvatarSprite


// Vector elements logic migrated to VectorElement.tsx


const SoccerFieldBackground = ({ type, width, height }: { type: string; width: number; height: number }) => {
  const [image] = useImage(FIELD_IMAGES[type] || FIELD_IMAGES.full);
  return (
    <Group>
      {image ? (
        <Image image={image} x={0} y={0} width={width} height={height} />
      ) : (
        <Rect x={0} y={0} width={width} height={height} fill="#2d6a1e" />
      )}
    </Group>
  );
};

// Generate zigzag points between two endpoints
function generateZigzag(x1: number, y1: number, x2: number, y2: number, segments = 6, amp = 12): number[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return [x1, y1, x2, y2];
  const nx = -dy / len;
  const ny = dx / len;
  const pts: number[] = [x1, y1];
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const side = i % 2 === 1 ? 1 : -1;
    pts.push(x1 + dx * t + nx * amp * side, y1 + dy * t + ny * amp * side);
  }
  pts.push(x2, y2);
  return pts;
}

const DRAWING_TOOLS_CONFIG: { type: ElementType; img: string; titleKey: string }[] = [
  { type: 'arrow', img: '/tools/straight-arrow.png', titleKey: 'straightArrow' },
  { type: 'curvedArrow', img: '/tools/curved-arrow.png', titleKey: 'curvedArrow' },
  { type: 'zigzag', img: '/tools/zigzag.png', titleKey: 'zigzagLine' },
  { type: 'dashedArrow', img: '/tools/dashed-arrow.png', titleKey: 'dashedArrow' },
  { type: 'dashedCurvedArrow', img: '/tools/dashed-curved-arrow.png', titleKey: 'dashedCurvedArrow' },
  { type: 'dashedZigzag', img: '/tools/dashed-zigzag.png', titleKey: 'dashedZigzag' },
  { type: 'shape', img: '/tools/rectangle.png', titleKey: 'rectangle' },
  { type: 'ellipse', img: '/tools/ellipse.png', titleKey: 'ellipseTool' },
];

export const TacticalBoard: React.FC<TacticalBoardProps> = ({ onSave, onClose, initialData }) => {
  const { t } = useTranslation();

  const [elements, setElements] = useState<TacticalElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fieldType, setFieldType] = useState('full');
  const [activeTool, setActiveTool] = useState<ElementType | null>(null);
  const [drawingId, setDrawingId] = useState<string | null>(null);
  
  // Default kit colors for newly inserted avatars
  const [playerColors, setPlayerColors] = useState<KitColors>({ shirt: '#3b82f6', shorts: '#ffffff', socks: '#3b82f6' });
  const [gkColors, setGkColors] = useState<KitColors>({ shirt: '#eab308', shorts: '#111111', socks: '#eab308' });
  
  // Default color for insertion of cones/discs/etc
  const [defaultElementColor, setDefaultElementColor] = useState<string>('#E63946');

  // Handle changing the global element color and active selected object color
  const updateDefaultElementColor = (val: string) => {
    setDefaultElementColor(val);
    if (selectedId) {
      setElements(prev => prev.map(el => {
        if (el.id === selectedId && ELEMENT_TYPES.includes(el.type)) {
          return { ...el, color: val };
        }
        return el;
      }));
    }
  };

  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const drawingRef = useRef<{ id: string; startX: number; startY: number; type: ElementType } | null>(null);

  // Track latest state for keyboard listeners without rebinding
  const stateRef = useRef({ elements, selectedId });
  useEffect(() => {
    stateRef.current = { elements, selectedId };
  }, [elements, selectedId]);

  const copiedElementRef = useRef<TacticalElement | null>(null);

  // Attach transformer to selected non-line elements
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    if (selectedId && !drawingId) {
      const el = elements.find(e => e.id === selectedId);
      if (el && !DRAW_TOOLS.has(el.type)) {
        const node = stageRef.current.findOne(`#${selectedId}`);
        if (node) {
          transformerRef.current.nodes([node]);
          transformerRef.current.getLayer()?.batchDraw();
          return;
        }
      }
    }
    transformerRef.current.nodes([]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId, elements, drawingId]);

  const getPointerPos = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    return pos || { x: 0, y: 0 };
  }, []);

  // Keyboard Shortcuts (Copy, Paste, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      const { elements: currentElements, selectedId: currentSelected } = stateRef.current;

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (currentSelected) {
          setElements(prev => prev.filter(el => el.id !== currentSelected));
          setSelectedId(null);
        }
      }

      // Copy (Ctrl+C or Cmd+C)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (currentSelected) {
          const elToCopy = currentElements.find(el => el.id === currentSelected);
          if (elToCopy) {
            copiedElementRef.current = elToCopy;
          }
        }
      }

      // Paste (Ctrl+V or Cmd+V)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (copiedElementRef.current) {
          const source = copiedElementRef.current;
          const newId = `el-${crypto.randomUUID()}`;
          const duplicate: TacticalElement = {
            ...source,
            id: newId,
            x: source.x + 20,
            y: source.y + 20,
          };
          // Deep clone arrays/objects inside
          if (source.kitColors) duplicate.kitColors = { ...source.kitColors };
          if (source.points) duplicate.points = [...source.points];
          
          setElements(prev => [...prev, duplicate]);
          setSelectedId(newId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Add instant element (non-draw tools)
  const addElement = (type: ElementType, color: string = '#ffffff', label: string = '') => {
    const newElement: TacticalElement = {
      id: `el-${crypto.randomUUID()}`,
      type, x: 150, y: 150, color, label,
      rotation: 0, scaleX: 1, scaleY: 1,
      width: type === 'shape' ? 100 : type === 'ellipse' ? 120 : undefined,
      height: type === 'shape' ? 70 : type === 'ellipse' ? 70 : undefined,
      kitColors: type === 'player' ? { ...playerColors } : type === 'gk' ? { ...gkColors } : undefined
    };
    setElements(prev => [...prev, newElement]);
    setSelectedId(newElement.id);
    setActiveTool(null);
  };

  // Select a draw tool
  const selectDrawTool = (type: ElementType) => {
    if (DRAW_TOOLS.has(type)) {
      setActiveTool(type);
      setSelectedId(null);
    } else {
      addElement(type, type === 'shape' || type === 'ellipse' ? 'rgba(255,255,255,0.15)' : '#ffffff');
    }
  };

  // Check if the target is the stage background (stage itself or the field image)
  const isBackgroundClick = (e: any) => {
    const target = e.target;
    if (target === target.getStage()) return true;
    // Also treat clicks on the field background image/rect as background
    const parent = target.getParent();
    if (parent && parent.getChildren().length <= 1 && (target.className === 'Image' || target.className === 'Rect')) {
      // Check if it's the first group in the layer (background)
      const layer = target.getLayer();
      if (layer && layer.getChildren()[0] === parent) return true;
    }
    return false;
  };

  // Compute points from start to current position
  const computePoints = (startX: number, startY: number, endX: number, endY: number, type: ElementType): number[] => {
    const dx = endX - startX;
    const dy = endY - startY;
    if (CURVED_TOOLS.has(type)) {
      const mx = dx / 2;
      const my = dy / 2;
      const len = Math.sqrt(dx * dx + dy * dy);
      const offset = Math.max(20, len * 0.3);
      const nx = len > 0 ? -dy / len : 0;
      const ny = len > 0 ? dx / len : 0;
      return [0, 0, mx + nx * offset, my + ny * offset, dx, dy];
    }
    return [0, 0, dx, dy];
  };

  // Canvas mouse down - start drawing
  const handleStageMouseDown = (e: any) => {
    if (activeTool && DRAW_TOOLS.has(activeTool)) {
      const pos = getPointerPos();
      const id = `el-${crypto.randomUUID()}`;
      const isCurved = CURVED_TOOLS.has(activeTool);
      drawingRef.current = { id, startX: pos.x, startY: pos.y, type: activeTool };
      const newEl: TacticalElement = {
        id, type: activeTool, x: pos.x, y: pos.y,
        color: '#ffffff', rotation: 0, scaleX: 1, scaleY: 1,
        points: isCurved ? [0, 0, 0, 0, 0, 0] : [0, 0, 0, 0],
      };
      setElements(prev => [...prev, newEl]);
      setDrawingId(id);
      setSelectedId(id);
    } else if (isBackgroundClick(e)) {
      setSelectedId(null);
    }
  };

  // Canvas mouse move - update drawing
  const handleStageMouseMove = () => {
    const drawing = drawingRef.current;
    if (!drawing) return;
    const pos = getPointerPos();
    const newPoints = computePoints(drawing.startX, drawing.startY, pos.x, pos.y, drawing.type);
    setElements(prev => prev.map(el =>
      el.id === drawing.id ? { ...el, points: newPoints } : el
    ));
  };

  // Canvas mouse up - finish drawing
  const handleStageMouseUp = () => {
    const drawing = drawingRef.current;
    if (!drawing) return;
    const pos = getPointerPos();
    const dx = pos.x - drawing.startX;
    const dy = pos.y - drawing.startY;

    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
      // Too short - remove
      setElements(prev => prev.filter(e => e.id !== drawing.id));
      setSelectedId(null);
    } else {
      // Final update with end position
      const newPoints = computePoints(drawing.startX, drawing.startY, pos.x, pos.y, drawing.type);
      setElements(prev => prev.map(el =>
        el.id === drawing.id ? { ...el, points: newPoints } : el
      ));
    }
    drawingRef.current = null;
    setDrawingId(null);
    setActiveTool(null);
  };

  const handleExport = () => {
    setSelectedId(null);
    setTimeout(() => {
      if (stageRef.current) {
        onSave(stageRef.current.toDataURL());
      }
    }, 50);
  };

  const removeSelected = () => {
    if (selectedId) {
      setElements(prev => prev.filter(e => e.id !== selectedId));
      setSelectedId(null);
    }
  };

  const clearBoard = () => {
    if (window.confirm(t('clearAllElements'))) {
      setElements([]);
      setSelectedId(null);
      setActiveTool(null);
      setDrawingId(null);
    }
  };

  const handleTransformEnd = (el: TacticalElement, e: any) => {
    const node = e.target;
    setElements(prev => prev.map(item =>
      item.id === el.id ? {
        ...item,
        x: node.x(), y: node.y(),
        scaleX: node.scaleX(), scaleY: node.scaleY(),
        rotation: node.rotation(),
      } : item
    ));
  };

  const dragProps = (el: TacticalElement) => ({
    id: el.id,
    draggable: !drawingId,
    onClick: () => { if (!drawingId) setSelectedId(el.id); },
    onTap: () => { if (!drawingId) setSelectedId(el.id); },
    onDragEnd: (e: any) => {
      setElements(prev => prev.map(item =>
        item.id === el.id ? { ...item, x: e.target.x(), y: e.target.y() } : item
      ));
    },
    onTransformEnd: (e: any) => handleTransformEnd(el, e),
  });

  // Update a specific anchor point of a line element
  const handleAnchorDrag = (elId: string, pointIndex: number, e: any) => {
    const node = e.target;
    setElements(prev => prev.map(el => {
      if (el.id !== elId || !el.points) return el;
      const newPoints = [...el.points];
      newPoints[pointIndex * 2] = node.x() - el.x;
      newPoints[pointIndex * 2 + 1] = node.y() - el.y;
      return { ...el, points: newPoints };
    }));
  };

  // Calculate arrow pointer size proportional to arrow length
  const getPointerSize = (pts: number[]) => {
    const dx = pts[pts.length - 2] - pts[0];
    const dy = pts[pts.length - 1] - pts[1];
    const length = Math.sqrt(dx * dx + dy * dy);
    const scale = Math.max(0.5, Math.min(1.0, length / 120));
    return { pointerLength: 10 * scale, pointerWidth: 8 * scale };
  };

  // Render line/arrow element based on its points
  const renderLineElement = (el: TacticalElement, isSelected: boolean) => {
    const pts = el.points || [0, 0, 50, -30];
    const selShadow = isSelected ? 8 : 0;
    const isArrow = el.type === 'arrow' || el.type === 'dashedArrow';
    const isCurved = CURVED_TOOLS.has(el.type);
    const isZigzag = ZIGZAG_TOOLS.has(el.type);
    const isDashed = el.type === 'dashedArrow' || el.type === 'dashedCurvedArrow' || el.type === 'dashedZigzag';

    if (isArrow) {
      const { pointerLength, pointerWidth } = getPointerSize(pts);
      return (
        <Arrow
          key={el.id} {...dragProps(el)}
          x={el.x} y={el.y}
          points={pts}
          pointerLength={pointerLength} pointerWidth={pointerWidth}
          fill="white" stroke="white" strokeWidth={2.5}
          dash={isDashed ? [8, 6] : undefined}
          shadowBlur={selShadow} shadowColor="white"
        />
      );
    }

    if (isCurved) {
      // pts = [0,0, cx,cy, ex,ey] — quadratic bezier control points
      const lp = pts.length >= 6 ? pts : [0, 0, 0, 0, 0, 0];
      // Sample quadratic bezier B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
      const segments = 20;
      const curvePts: number[] = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const t1 = 1 - t;
        curvePts.push(
          t1 * t1 * lp[0] + 2 * t1 * t * lp[2] + t * t * lp[4],
          t1 * t1 * lp[1] + 2 * t1 * t * lp[3] + t * t * lp[5],
        );
      }
      const { pointerLength, pointerWidth } = getPointerSize(pts);
      return (
        <Group key={el.id} {...dragProps(el)} x={el.x} y={el.y}>
          <Arrow
            points={curvePts}
            pointerLength={pointerLength} pointerWidth={pointerWidth}
            fill="white" stroke="white" strokeWidth={2.5}
            dash={isDashed ? [8, 6] : undefined}
            shadowBlur={selShadow} shadowColor="white"
          />
        </Group>
      );
    }

    if (isZigzag) {
      // pts = [0,0, ex,ey] - generate zigzag between them
      const zigPts = generateZigzag(pts[0], pts[1], pts[pts.length - 2], pts[pts.length - 1]);
      const { pointerLength, pointerWidth } = getPointerSize(pts);
      return (
        <Arrow
          key={el.id} {...dragProps(el)}
          x={el.x} y={el.y}
          points={zigPts}
          pointerLength={pointerLength} pointerWidth={pointerWidth}
          fill="white" stroke="white" strokeWidth={2.5}
          dash={isDashed ? [8, 6] : undefined}
          shadowBlur={selShadow} shadowColor="white"
        />
      );
    }

    return null;
  };

  // Render editable anchor points for selected line elements
  const renderAnchors = () => {
    if (!selectedId || drawingId) return null;
    const el = elements.find(e => e.id === selectedId);
    if (!el || !el.points || !DRAW_TOOLS.has(el.type)) return null;

    const isCurved = CURVED_TOOLS.has(el.type);
    const anchorCount = isCurved ? 3 : 2; // curved = 3 anchors, others = 2

    const anchors: React.ReactNode[] = [];
    for (let i = 0; i < anchorCount; i++) {
      const px = el.x + (el.points[i * 2] || 0);
      const py = el.y + (el.points[i * 2 + 1] || 0);
      const isMiddle = isCurved && i === 1;

      anchors.push(
        <Circle
          key={`anchor-${el.id}-${i}`}
          x={px}
          y={py}
          radius={isMiddle ? 5 : 6}
          fill={isMiddle ? '#3b82f6' : 'white'}
          stroke={isMiddle ? 'white' : '#3b82f6'}
          strokeWidth={2}
          draggable
          onDragMove={(e) => handleAnchorDrag(el.id, i, e)}
          onDragEnd={(e) => handleAnchorDrag(el.id, i, e)}
        />
      );
    }
    return <>{anchors}</>;
  };

  const toolBtnClass = "p-2 bg-surface-container rounded border border-black/5 hover:border-primary/50 transition-all flex items-center justify-center";
  const toolImgStyle: React.CSSProperties = { width: 22, height: 22, objectFit: 'contain' as const };
  const canvasSize = getCanvasSize(fieldType);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-surface/90 backdrop-blur-md">
      <div className="bg-surface-container border border-black/10 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-black/10 flex items-center justify-between bg-surface-container-highest">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">{t('tacticalDesigner')}</h3>
              <p className="text-[10px] text-on-surface-variant uppercase font-label tracking-widest">{t('digitalWhiteboard')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearBoard} className="p-2 text-on-surface-variant hover:text-error transition-colors" title="Clear Board">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button onClick={handleExport} className="bg-primary hover:bg-primary-dim text-on-primary px-4 py-2 rounded-md font-label text-xs font-bold transition-all flex items-center gap-2">
              <Save className="w-4 h-4" />
              {t('saveDiagram')}
            </button>
            <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Toolbar */}
          <div className="w-64 bg-surface-container-highest border-r border-black/10 p-4 flex flex-col gap-3 overflow-y-auto">
            {/* Field Type */}
            <CollapsibleSection title={t('fieldType')}>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'full', icon: RectangleVertical },
                  { id: 'half', icon: RectangleHorizontal },
                  { id: 'area', icon: BoxSelect },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFieldType(f.id)}
                    title={t(f.id === 'full' ? 'fullPitch' : f.id === 'half' ? 'halfPitch' : 'penaltyArea')}
                    className={cn(
                      "p-2 rounded border transition-all flex items-center justify-center",
                      fieldType === f.id ? "bg-primary/20 border-primary text-primary" : "bg-surface-container border-black/5 text-on-surface-variant hover:border-black/20"
                    )}
                  >
                    <f.icon className="w-6 h-6" />
                  </button>
                ))}
              </div>
            </CollapsibleSection>

            {/* Players */}
            <CollapsibleSection title={t('playersAssets')}>
              <div className="flex flex-col gap-3">
                {/* Player Row */}
                <div className="flex items-stretch gap-2 p-2 bg-surface-container rounded border border-black/5 hover:border-primary transition-all">
                  <button onClick={() => { setActiveTool(null); addElement('player', '#3b82f6', 'AT'); }} className="flex flex-col items-center justify-center gap-1 flex-1">
                    <Stage width={45} height={50} className="pointer-events-none">
                      <Layer>
                        <VectorAvatar x={22.5} y={25} type="player" isSelected={false} colors={playerColors} scaleXY={0.8} />
                      </Layer>
                    </Stage>
                    <span className="text-[9px] font-bold">{t('attacker')}</span>
                  </button>
                  <div className="flex flex-col justify-center gap-1 pl-2 border-l border-black/10">
                    <input type="color" title="Shirt" value={playerColors.shirt} onChange={(e) => {
                      setPlayerColors(p => ({...p, shirt: e.target.value}));
                      if (selectedId) setElements(prev => prev.map(el => el.id === selectedId && el.type === 'player' ? { ...el, kitColors: { ...(el.kitColors || playerColors), shirt: e.target.value } } : el));
                    }} className="w-5 h-5 border-0 p-0 rounded-full cursor-pointer" />
                    <input type="color" title="Shorts" value={playerColors.shorts} onChange={(e) => {
                      setPlayerColors(p => ({...p, shorts: e.target.value}));
                      if (selectedId) setElements(prev => prev.map(el => el.id === selectedId && el.type === 'player' ? { ...el, kitColors: { ...(el.kitColors || playerColors), shorts: e.target.value } } : el));
                    }} className="w-5 h-5 border-0 p-0 rounded-full cursor-pointer" />
                    <input type="color" title="Socks" value={playerColors.socks} onChange={(e) => {
                      setPlayerColors(p => ({...p, socks: e.target.value}));
                      if (selectedId) setElements(prev => prev.map(el => el.id === selectedId && el.type === 'player' ? { ...el, kitColors: { ...(el.kitColors || playerColors), socks: e.target.value } } : el));
                    }} className="w-5 h-5 border-0 p-0 rounded-full cursor-pointer" />
                  </div>
                </div>

                {/* GK Row */}
                <div className="flex items-stretch gap-2 p-2 bg-surface-container rounded border border-black/5 hover:border-yellow-500 transition-all">
                  <button onClick={() => { setActiveTool(null); addElement('gk', '#eab308', 'GK'); }} className="flex flex-col items-center justify-center gap-1 flex-1">
                    <Stage width={45} height={50} className="pointer-events-none">
                      <Layer>
                        <VectorAvatar x={22.5} y={25} type="gk" isSelected={false} colors={gkColors} scaleXY={0.8} />
                      </Layer>
                    </Stage>
                    <span className="text-[9px] font-bold">{t('goalkeeperTool')}</span>
                  </button>
                  <div className="flex flex-col justify-center gap-1 pl-2 border-l border-black/10">
                    <input type="color" title="Shirt" value={gkColors.shirt} onChange={(e) => {
                      setGkColors(p => ({...p, shirt: e.target.value}));
                      if (selectedId) setElements(prev => prev.map(el => el.id === selectedId && el.type === 'gk' ? { ...el, kitColors: { ...(el.kitColors || gkColors), shirt: e.target.value } } : el));
                    }} className="w-5 h-5 border-0 p-0 rounded-full cursor-pointer" />
                    <input type="color" title="Shorts" value={gkColors.shorts} onChange={(e) => {
                      setGkColors(p => ({...p, shorts: e.target.value}));
                      if (selectedId) setElements(prev => prev.map(el => el.id === selectedId && el.type === 'gk' ? { ...el, kitColors: { ...(el.kitColors || gkColors), shorts: e.target.value } } : el));
                    }} className="w-5 h-5 border-0 p-0 rounded-full cursor-pointer" />
                    <input type="color" title="Socks" value={gkColors.socks} onChange={(e) => {
                      setGkColors(p => ({...p, socks: e.target.value}));
                      if (selectedId) setElements(prev => prev.map(el => el.id === selectedId && el.type === 'gk' ? { ...el, kitColors: { ...(el.kitColors || gkColors), socks: e.target.value } } : el));
                    }} className="w-5 h-5 border-0 p-0 rounded-full cursor-pointer" />
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Elements */}
            <CollapsibleSection 
              title={t('elements')} 
              rightAction={
                <input 
                  type="color" 
                  value={defaultElementColor} 
                  onChange={(e) => updateDefaultElementColor(e.target.value)} 
                  title="Element Color" 
                  className="w-5 h-5 border-0 p-0 rounded-full cursor-pointer shadow-sm" 
                />
              }
            >
              <div className="grid grid-cols-3 gap-2">
                {ELEMENT_TYPES.map(elType => {
                  const cw = elType === 'goal' ? 40 : elType === 'miniGoal' ? 30 : elType === 'box' ? 30 : 26;
                  const ch = elType === 'ladder' ? 40 : elType === 'mannequin' ? 44 : elType === 'stake' ? 44 : 26;
                  const displayScale = elType === 'goal' ? 0.5 : elType === 'miniGoal' ? 0.7 : elType === 'ladder' ? 0.6 : elType === 'mannequin' ? 0.6 : elType === 'box' ? 0.5 : elType === 'stake' ? 0.5 : 1;
                  return (
                    <button
                      key={elType}
                      onClick={() => { setActiveTool(null); addElement(elType, defaultElementColor); }}
                      className="flex flex-col items-center justify-center gap-1 p-2 bg-surface-container rounded border border-black/5 hover:border-primary/50 transition-all h-16"
                    >
                      <Stage width={cw} height={ch} className="pointer-events-none">
                        <Layer>
                          <Group x={cw/2} y={ch/2} scaleX={displayScale} scaleY={displayScale}>
                            <VectorElement x={0} y={0} type={elType as EquipmentType} color={defaultElementColor} isSelected={false} />
                          </Group>
                        </Layer>
                      </Stage>
                      <span className="text-[9px] font-bold">{t(elType as any)}</span>
                    </button>
                  );
                })}
              </div>
            </CollapsibleSection>

            {/* Drawing Tools */}
            <CollapsibleSection title={t('drawingTools')}>
              <div className="grid grid-cols-3 gap-2">
                {DRAWING_TOOLS_CONFIG.map(tool => (
                  <button
                    key={tool.type}
                    onClick={() => selectDrawTool(tool.type)}
                    className={cn(
                      toolBtnClass,
                      activeTool === tool.type && "ring-2 ring-primary bg-primary/10"
                    )}
                    title={t(tool.titleKey as any)}
                  >
                    <img src={tool.img} alt="" style={toolImgStyle} />
                  </button>
                ))}
                <button
                  onClick={() => { setActiveTool(null); addElement('text', '#ffffff', 'TEXT'); }}
                  className={toolBtnClass}
                  title={t('textTool')}
                >
                  <Type className="w-5 h-5 text-on-surface-variant" />
                </button>
              </div>
              {activeTool && (
                <p className="text-[9px] text-primary mt-2 text-center font-medium">
                  {t('clickAndDrag' as any)}
                </p>
              )}
            </CollapsibleSection>

            {/* Avatar Color Config Removed - now in players list directly */}

            {/* Selected Element Actions & Delete */}
            {selectedId && (() => {
              const el = elements.find(e => e.id === selectedId);
              return (
                <div className="mt-auto pt-4 border-t border-black/10 flex flex-col gap-2">
                  {el && (el.type === 'player' || el.type === 'gk') && (
                    <button
                      onClick={() => {
                        setElements(prev => prev.map(item => item.id === selectedId ? { ...item, facing: item.facing === 'back' ? 'front' : 'back' } : item));
                      }}
                      className="w-full flex justify-center items-center gap-2 p-2 bg-surface-container text-on-surface rounded text-[10px] uppercase font-bold hover:bg-black/5 transition-colors tracking-wider"
                    >
                      {el.facing === 'back' ? '👤 Virar de Frente' : '🔄 Virar de Costas'}
                    </button>
                  )}
                  <button
                    onClick={removeSelected}
                    className="w-full py-2 bg-error/10 text-error hover:bg-error/20 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('deleteSelected')}
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-black/5 relative overflow-hidden flex items-center justify-center p-8">
            <div
              className="bg-black/5 rounded-lg shadow-2xl overflow-hidden border border-black/10"
              style={{ cursor: activeTool ? 'crosshair' : 'default' }}
            >
              <Stage
                width={canvasSize.w}
                height={canvasSize.h}
                ref={stageRef}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
                onTouchStart={handleStageMouseDown}
                onTouchMove={handleStageMouseMove}
                onTouchEnd={handleStageMouseUp}
              >
                <Layer>
                  <SoccerFieldBackground type={fieldType} width={canvasSize.w} height={canvasSize.h} />

                  {elements.map((el) => {
                    const isSelected = el.id === selectedId;
                    const selShadow = isSelected ? 8 : 0;

                    // Players & GK
                    if (el.type === 'player' || el.type === 'gk') {
                      return (
                        <VectorAvatar
                          key={el.id}
                          {...dragProps(el)}
                          x={el.x} y={el.y}
                          type={el.type as 'player' | 'gk'}
                          isSelected={isSelected}
                          colors={el.kitColors}
                          facing={el.facing}
                          scaleX={el.scaleX}
                          scaleY={el.scaleY}
                          rotation={el.rotation}
                        />
                      );
                    }

                    // Line-type elements
                    if (DRAW_TOOLS.has(el.type)) {
                      return renderLineElement(el, isSelected);
                    }

                    // Equipment elements (ball, cone, disc, goal, ladder, miniGoal, ring)
                    if (ELEMENT_TYPES.includes(el.type)) {
                      return (
                        <VectorElement
                          key={el.id}
                          {...dragProps(el)}
                          x={el.x} y={el.y}
                          type={el.type as EquipmentType}
                          color={el.color}
                          isSelected={isSelected}
                          scaleX={el.scaleX}
                          scaleY={el.scaleY}
                          rotation={el.rotation}
                        />
                      );
                    }

                    // Rectangle zone
                    if (el.type === 'shape') {
                      return (
                        <Rect
                          key={el.id} {...dragProps(el)}
                          x={el.x} y={el.y}
                          width={el.width || 100} height={el.height || 70}
                          fill={el.color} stroke="white" strokeWidth={1} dash={[5, 5]}
                          scaleX={el.scaleX} scaleY={el.scaleY}
                          shadowBlur={selShadow} shadowColor="white"
                        />
                      );
                    }

                    // Ellipse
                    if (el.type === 'ellipse') {
                      return (
                        <Ellipse
                          key={el.id} {...dragProps(el)}
                          x={el.x} y={el.y}
                          radiusX={(el.width || 120) / 2} radiusY={(el.height || 70) / 2}
                          fill={el.color} stroke="white" strokeWidth={1} dash={[5, 5]}
                          scaleX={el.scaleX} scaleY={el.scaleY}
                          shadowBlur={selShadow} shadowColor="white"
                        />
                      );
                    }

                    // Text
                    if (el.type === 'text') {
                      return (
                        <Text
                          key={el.id} {...dragProps(el)}
                          x={el.x} y={el.y} text={el.label}
                          fontSize={16} fill="white" fontStyle="bold"
                          scaleX={el.scaleX} scaleY={el.scaleY}
                          shadowBlur={selShadow} shadowColor="white"
                        />
                      );
                    }

                    return null;
                  })}

                  {/* Editable anchor points for selected line elements */}
                  {renderAnchors()}

                  {/* Transformer for non-line elements */}
                  <Transformer
                    ref={transformerRef}
                    rotateEnabled={true}
                    borderStroke="#fff"
                    borderStrokeWidth={1}
                    anchorStroke="#fff"
                    anchorFill="#333"
                    anchorSize={8}
                    anchorCornerRadius={2}
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
                  />
                </Layer>
              </Stage>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
