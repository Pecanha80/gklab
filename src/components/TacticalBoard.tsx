import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Circle, Line, Text, Group, Arrow, Rect } from 'react-konva';
import { 
  Save, 
  Trash2, 
  RotateCcw, 
  Download, 
  MousePointer2, 
  Type, 
  ArrowRight, 
  Square, 
  Circle as CircleIcon,
  X,
  Target,
  Users,
  Dumbbell,
  Circle as BallIcon
} from 'lucide-react';
import useImage from 'use-image';
import { cn } from '../lib/utils';
import { useTranslation } from '../hooks/useTranslation';

interface TacticalElement {
  id: string;
  type: 'player' | 'gk' | 'ball' | 'cone' | 'text' | 'shape' | 'arrow';
  x: number;
  y: number;
  color?: string;
  label?: string;
  rotation?: number;
  points?: number[];
  width?: number;
  height?: number;
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

const SoccerFieldBackground = ({ type, width, height }: { type: string, width: number, height: number }) => {
  const [image] = useImage(FIELD_IMAGES[type] || FIELD_IMAGES.full);

  return (
    <Group>
      {image ? (
        <Image image={image} x={0} y={0} width={width} height={height} />
      ) : (
        <Rect x={0} y={0} width={width} height={height} fill="#4a8c3f" />
      )}
    </Group>
  );
};

export const TacticalBoard: React.FC<TacticalBoardProps> = ({ onSave, onClose, initialData }) => {
  const { t } = useTranslation();

  const FIELD_TYPES = [
    { id: 'full', label: t('fullPitch') },
    { id: 'half', label: t('halfPitch') },
    { id: 'area', label: t('penaltyArea') },
  ];
  const [elements, setElements] = useState<TacticalElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'text' | 'arrow' | 'shape'>('select');
  const [fieldType, setFieldType] = useState('full');
  const stageRef = useRef<any>(null);

  const addElement = (type: TacticalElement['type'], color: string = '#3b82f6', label: string = '') => {
    const newElement: TacticalElement = {
      id: crypto.randomUUID(),
      type,
      x: 100,
      y: 100,
      color,
      label,
      rotation: 0,
      width: type === 'shape' ? 100 : undefined,
      height: type === 'shape' ? 100 : undefined,
      points: type === 'arrow' ? [0, 0, 50, 50] : undefined,
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const handleExport = () => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL();
      onSave(uri);
    }
  };

  const removeSelected = () => {
    if (selectedId) {
      setElements(elements.filter(e => e.id !== selectedId));
      setSelectedId(null);
    }
  };

  const clearBoard = () => {
    if (window.confirm(t('clearAllElements'))) {
      setElements([]);
      setSelectedId(null);
    }
  };

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
            <button 
              onClick={clearBoard}
              className="p-2 text-on-surface-variant hover:text-error transition-colors"
              title="Clear Board"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button 
              onClick={handleExport}
              className="bg-primary hover:bg-primary-dim text-on-primary px-4 py-2 rounded-md font-label text-xs font-bold transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {t('saveDiagram')}
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Toolbar */}
          <div className="w-64 bg-surface-container-highest border-r border-black/10 p-4 flex flex-col gap-6 overflow-y-auto">
            <div>
              <label className="text-[10px] text-on-surface-variant uppercase font-bold mb-3 block">{t('fieldType')}</label>
              <div className="grid grid-cols-1 gap-2">
                {FIELD_TYPES.map(f => (
                  <button 
                    key={f.id}
                    onClick={() => setFieldType(f.id)}
                    className={cn(
                      "px-3 py-2 rounded text-xs font-medium text-left transition-all border",
                      fieldType === f.id ? "bg-primary/20 border-primary text-primary" : "bg-surface-container border-black/5 text-on-surface-variant hover:border-black/20"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-on-surface-variant uppercase font-bold mb-3 block">{t('playersAssets')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => addElement('player', '#3b82f6', 'AT')} className="flex flex-col items-center gap-1 p-2 bg-surface-container rounded border border-black/5 hover:border-primary transition-all">
                  <CircleIcon className="w-5 h-5 text-blue-500" />
                  <span className="text-[9px] font-bold">{t('attacker')}</span>
                </button>
                <button onClick={() => addElement('player', '#ef4444', 'DF')} className="flex flex-col items-center gap-1 p-2 bg-surface-container rounded border border-black/5 hover:border-error transition-all">
                  <CircleIcon className="w-5 h-5 text-red-500" />
                  <span className="text-[9px] font-bold">{t('defender')}</span>
                </button>
                <button onClick={() => addElement('gk', '#eab308', 'GK')} className="flex flex-col items-center gap-1 p-2 bg-surface-container rounded border border-black/5 hover:border-yellow-500 transition-all">
                  <Users className="w-5 h-5 text-yellow-500" />
                  <span className="text-[9px] font-bold">{t('goalkeeperTool')}</span>
                </button>
                <button onClick={() => addElement('ball', '#ffffff')} className="flex flex-col items-center gap-1 p-2 bg-surface-container rounded border border-black/5 hover:border-white transition-all">
                  <div className="w-5 h-5 rounded-full bg-white border border-black/20" />
                  <span className="text-[9px] font-bold">{t('ball')}</span>
                </button>
                <button onClick={() => addElement('cone', '#f97316')} className="flex flex-col items-center gap-1 p-2 bg-surface-container rounded border border-black/5 hover:border-orange-500 transition-all">
                  <Square className="w-5 h-5 text-orange-500" />
                  <span className="text-[9px] font-bold">{t('cone')}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-on-surface-variant uppercase font-bold mb-3 block">{t('drawingTools')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setTool('select')} 
                  className={cn("p-2 rounded border transition-all flex flex-col items-center gap-1", tool === 'select' ? "bg-primary/20 border-primary text-primary" : "bg-surface-container border-black/5 text-on-surface-variant")}
                >
                  <MousePointer2 className="w-5 h-5" />
                  <span className="text-[9px] font-bold">{t('select')}</span>
                </button>
                <button 
                  onClick={() => addElement('arrow', '#ffffff')} 
                  className={cn("p-2 rounded border transition-all flex flex-col items-center gap-1", tool === 'arrow' ? "bg-primary/20 border-primary text-primary" : "bg-surface-container border-black/5 text-on-surface-variant")}
                >
                  <ArrowRight className="w-5 h-5" />
                  <span className="text-[9px] font-bold">{t('arrow')}</span>
                </button>
                <button 
                  onClick={() => addElement('text', '#ffffff', 'TEXT')} 
                  className={cn("p-2 rounded border transition-all flex flex-col items-center gap-1", tool === 'text' ? "bg-primary/20 border-primary text-primary" : "bg-surface-container border-black/5 text-on-surface-variant")}
                >
                  <Type className="w-5 h-5" />
                  <span className="text-[9px] font-bold">{t('textTool')}</span>
                </button>
                <button 
                  onClick={() => addElement('shape', 'rgba(59, 130, 246, 0.3)')} 
                  className={cn("p-2 rounded border transition-all flex flex-col items-center gap-1", tool === 'shape' ? "bg-primary/20 border-primary text-primary" : "bg-surface-container border-black/5 text-on-surface-variant")}
                >
                  <Square className="w-5 h-5" />
                  <span className="text-[9px] font-bold">{t('zone')}</span>
                </button>
              </div>
            </div>

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
            <div className="bg-black/5 rounded-lg shadow-2xl overflow-hidden border border-black/10">
              <Stage 
                width={800} 
                height={600} 
                ref={stageRef}
                onMouseDown={(e) => {
                  if (e.target === e.target.getStage()) {
                    setSelectedId(null);
                  }
                }}
              >
                <Layer>
                  <SoccerFieldBackground type={fieldType} width={800} height={600} />
                  
                  {elements.map((el) => {
                    const isSelected = el.id === selectedId;
                    
                    if (el.type === 'player' || el.type === 'gk') {
                      return (
                        <Group 
                          key={el.id} 
                          x={el.x} 
                          y={el.y} 
                          draggable 
                          onClick={() => setSelectedId(el.id)}
                          onDragEnd={(e) => {
                            setElements(elements.map(item => 
                              item.id === el.id ? { ...item, x: e.target.x(), y: e.target.y() } : item
                            ));
                          }}
                        >
                          <Circle 
                            radius={15} 
                            fill={el.color} 
                            stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.2)'} 
                            strokeWidth={isSelected ? 3 : 1}
                            shadowBlur={isSelected ? 10 : 0}
                            shadowColor="white"
                          />
                          <Text 
                            text={el.label} 
                            fontSize={10} 
                            fill="white" 
                            fontStyle="bold"
                            x={-7} 
                            y={-5} 
                          />
                        </Group>
                      );
                    }

                    if (el.type === 'ball') {
                      return (
                        <Circle 
                          key={el.id}
                          x={el.x}
                          y={el.y}
                          radius={8}
                          fill="white"
                          stroke="black"
                          strokeWidth={1}
                          draggable
                          onClick={() => setSelectedId(el.id)}
                          onDragEnd={(e) => {
                            setElements(elements.map(item => 
                              item.id === el.id ? { ...item, x: e.target.x(), y: e.target.y() } : item
                            ));
                          }}
                        />
                      );
                    }

                    if (el.type === 'cone') {
                      return (
                        <Rect 
                          key={el.id}
                          x={el.x}
                          y={el.y}
                          width={16}
                          height={16}
                          fill={el.color}
                          rotation={45}
                          draggable
                          onClick={() => setSelectedId(el.id)}
                          onDragEnd={(e) => {
                            setElements(elements.map(item => 
                              item.id === el.id ? { ...item, x: e.target.x(), y: e.target.y() } : item
                            ));
                          }}
                        />
                      );
                    }

                    if (el.type === 'arrow') {
                      return (
                        <Arrow 
                          key={el.id}
                          points={el.points || [0, 0, 50, 50]}
                          x={el.x}
                          y={el.y}
                          pointerLength={10}
                          pointerWidth={10}
                          fill="white"
                          stroke="white"
                          strokeWidth={2}
                          draggable
                          onClick={() => setSelectedId(el.id)}
                          onDragEnd={(e) => {
                            setElements(elements.map(item => 
                              item.id === el.id ? { ...item, x: e.target.x(), y: e.target.y() } : item
                            ));
                          }}
                        />
                      );
                    }

                    if (el.type === 'text') {
                      return (
                        <Text 
                          key={el.id}
                          x={el.x}
                          y={el.y}
                          text={el.label}
                          fontSize={16}
                          fill="white"
                          fontStyle="bold"
                          draggable
                          onClick={() => setSelectedId(el.id)}
                          onDragEnd={(e) => {
                            setElements(elements.map(item => 
                              item.id === el.id ? { ...item, x: e.target.x(), y: e.target.y() } : item
                            ));
                          }}
                        />
                      );
                    }

                    if (el.type === 'shape') {
                      return (
                        <Rect 
                          key={el.id}
                          x={el.x}
                          y={el.y}
                          width={el.width}
                          height={el.height}
                          fill={el.color}
                          stroke="white"
                          strokeWidth={1}
                          dash={[5, 5]}
                          draggable
                          onClick={() => setSelectedId(el.id)}
                          onDragEnd={(e) => {
                            setElements(elements.map(item => 
                              item.id === el.id ? { ...item, x: e.target.x(), y: e.target.y() } : item
                            ));
                          }}
                        />
                      );
                    }

                    return null;
                  })}
                </Layer>
              </Stage>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
