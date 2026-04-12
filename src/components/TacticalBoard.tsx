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

type ElementType =
  | 'player' | 'gk'
  | 'ball' | 'cone' | 'disc' | 'goal' | 'ladder' | 'miniGoal' | 'ring'
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

const ELEMENT_IMAGES: Record<string, string> = {
  ball: '/elements/ball.png',
  cone: '/elements/cone.png',
  disc: '/elements/disc.png',
  goal: '/elements/goal.png',
  ladder: '/elements/ladder.png',
  miniGoal: '/elements/mini-goal.png',
  ring: '/elements/ring.png',
};

const ELEMENT_SPRITE_SIZE: Record<string, { w: number; h: number }> = {
  ball: { w: 20, h: 20 },
  cone: { w: 24, h: 24 },
  disc: { w: 26, h: 10 },
  goal: { w: 48, h: 32 },
  ladder: { w: 20, h: 48 },
  miniGoal: { w: 36, h: 24 },
  ring: { w: 22, h: 22 },
};

const ELEMENT_TYPES: ElementType[] = ['ball', 'cone', 'disc', 'goal', 'ladder', 'miniGoal', 'ring'];

const CollapsibleSection: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({ title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 w-full text-left text-[10px] text-on-surface-variant uppercase font-bold mb-2"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {title}
      </button>
      {open && children}
    </div>
  );
};

const AvatarSprite = ({ x, y, type, isSelected, draggable, onClick, onTap, onDragEnd, id }: {
  x: number; y: number; type: 'player' | 'gk'; isSelected: boolean;
  draggable?: boolean; onClick?: () => void; onTap?: () => void; onDragEnd?: (e: any) => void; id?: string;
}) => {
  const [img] = useImage(SPRITE_IMAGES[type]);
  const size = AVATAR_SIZE;
  const half = size / 2;
  return (
    <Group id={id} x={x} y={y} draggable={draggable} onClick={onClick} onTap={onTap} onDragEnd={onDragEnd}>
      {isSelected && (
        <Circle radius={half + 3} fill="transparent" stroke="#fff" strokeWidth={2} shadowBlur={10} shadowColor="white" />
      )}
      {img ? (
        <Image image={img} x={-half} y={-half} width={size} height={size} />
      ) : (
        <Circle radius={half} fill="#555" />
      )}
    </Group>
  );
};

const ElementSprite = ({ x, y, type, isSelected, draggable, onClick, onTap, onDragEnd, onTransformEnd, id }: {
  x: number; y: number; type: ElementType; isSelected: boolean;
  draggable?: boolean; onClick?: () => void; onTap?: () => void; onDragEnd?: (e: any) => void; onTransformEnd?: (e: any) => void; id?: string;
}) => {
  const [img] = useImage(ELEMENT_IMAGES[type]);
  const size = ELEMENT_SPRITE_SIZE[type] || { w: 24, h: 24 };
  return (
    <Group id={id} x={x} y={y} draggable={draggable} onClick={onClick} onTap={onTap} onDragEnd={onDragEnd} onTransformEnd={onTransformEnd}>
      {isSelected && (
        <Rect x={-size.w / 2 - 3} y={-size.h / 2 - 3} width={size.w + 6} height={size.h + 6} stroke="#fff" strokeWidth={2} cornerRadius={4} shadowBlur={10} shadowColor="white" />
      )}
      {img ? (
        <Image image={img} x={-size.w / 2} y={-size.h / 2} width={size.w} height={size.h} />
      ) : (
        <Rect x={-size.w / 2} y={-size.h / 2} width={size.w} height={size.h} fill="#555" cornerRadius={3} />
      )}
    </Group>
  );
};

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
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const drawingRef = useRef<{ id: string; startX: number; startY: number; type: ElementType } | null>(null);

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

  // Add instant element (non-draw tools)
  const addElement = (type: ElementType, color: string = '#ffffff', label: string = '') => {
    const newElement: TacticalElement = {
      id: `el-${crypto.randomUUID()}`,
      type, x: 150, y: 150, color, label,
      rotation: 0, scaleX: 1, scaleY: 1,
      width: type === 'shape' ? 100 : type === 'ellipse' ? 120 : undefined,
      height: type === 'shape' ? 70 : type === 'ellipse' ? 70 : undefined,
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

  // Render line/arrow element based on its points
  const renderLineElement = (el: TacticalElement, isSelected: boolean) => {
    const pts = el.points || [0, 0, 50, -30];
    const selShadow = isSelected ? 8 : 0;
    const isArrow = el.type === 'arrow' || el.type === 'dashedArrow';
    const isCurved = CURVED_TOOLS.has(el.type);
    const isZigzag = ZIGZAG_TOOLS.has(el.type);
    const isDashed = el.type === 'dashedArrow' || el.type === 'dashedCurvedArrow' || el.type === 'dashedZigzag';

    if (isArrow) {
      return (
        <Arrow
          key={el.id} {...dragProps(el)}
          x={el.x} y={el.y}
          points={pts}
          pointerLength={16} pointerWidth={12}
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
      return (
        <Group key={el.id} {...dragProps(el)} x={el.x} y={el.y}>
          <Arrow
            points={curvePts}
            pointerLength={16} pointerWidth={12}
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
      return (
        <Arrow
          key={el.id} {...dragProps(el)}
          x={el.x} y={el.y}
          points={zigPts}
          pointerLength={16} pointerWidth={12}
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
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setActiveTool(null); addElement('player', '#3b82f6', 'AT'); }} className="flex flex-col items-center gap-1 p-2 bg-surface-container rounded border border-black/5 hover:border-primary transition-all">
                  <img src="/jogador.png" alt="Player" className="w-6 h-6 object-contain" />
                  <span className="text-[9px] font-bold">{t('attacker')}</span>
                </button>
                <button onClick={() => { setActiveTool(null); addElement('gk', '#eab308', 'GK'); }} className="flex flex-col items-center gap-1 p-2 bg-surface-container rounded border border-black/5 hover:border-yellow-500 transition-all">
                  <img src="/avatar.png" alt="GK" className="w-6 h-6 object-contain" />
                  <span className="text-[9px] font-bold">{t('goalkeeperTool')}</span>
                </button>
              </div>
            </CollapsibleSection>

            {/* Elements */}
            <CollapsibleSection title={t('elements')}>
              <div className="grid grid-cols-3 gap-2">
                {ELEMENT_TYPES.map(elType => (
                  <button
                    key={elType}
                    onClick={() => { setActiveTool(null); addElement(elType); }}
                    className="flex flex-col items-center gap-1 p-2 bg-surface-container rounded border border-black/5 hover:border-primary/50 transition-all"
                  >
                    <img src={ELEMENT_IMAGES[elType]} alt={elType} className="w-6 h-6 object-contain" />
                    <span className="text-[9px] font-bold">{t(elType as any)}</span>
                  </button>
                ))}
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

            {/* Delete */}
            {selectedId && (
              <div className="mt-auto pt-4 border-t border-black/10">
                <button
                  onClick={removeSelected}
                  className="w-full py-2 bg-error/10 text-error hover:bg-error/20 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('deleteSelected')}
                </button>
              </div>
            )}
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
                        <AvatarSprite
                          key={el.id}
                          {...dragProps(el)}
                          x={el.x} y={el.y}
                          type={el.type as 'player' | 'gk'}
                          isSelected={isSelected}
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
                        <ElementSprite
                          key={el.id}
                          {...dragProps(el)}
                          x={el.x} y={el.y}
                          type={el.type}
                          isSelected={isSelected}
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
