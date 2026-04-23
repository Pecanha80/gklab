import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Trash2, Check, Plus, FolderInput } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';

export type QuickSelectOption = string | { value: string; label: string };

export const QuickSelect = ({
  options,
  onSelect,
  onDelete,
  isDeletable,
  onAdd,
  selectedValues = [],
  onMove,
  multiSelect = true
}: {
  options: QuickSelectOption[],
  onSelect: (val: string[]) => void,
  onDelete?: (val: string) => void,
  isDeletable?: (val: string) => boolean,
  onAdd?: (val: string) => void,
  onMove?: (val: string, newCategory: string) => void,
  multiSelect?: boolean,
  selectedValues?: string[]
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [hoveredItem, setHoveredItem] = useState<{ label: string; top: number; right: boolean } | null>(null);
  // Category picker state for new items
  const [pendingNewValue, setPendingNewValue] = useState<string | null>(null);

  const headers = options.filter(opt => {
    const value = typeof opt === 'string' ? opt : opt.value;
    return value.startsWith('# ');
  }) as string[];

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const dropdownWidth = 288; // w-72
        const dropdownHeight = 400; // Expected max height
        const padding = 16;
        const scrollY = window.scrollY;

        let left = rect.left + window.scrollX;
        // Check right boundary (viewport)
        if (rect.left + dropdownWidth > window.innerWidth - padding) {
          left = window.innerWidth + window.scrollX - dropdownWidth - padding;
        }
        // Check left boundary (viewport)
        if (left < window.scrollX + padding) {
          left = window.scrollX + padding;
        }

        // Vertical positioning
        let top = rect.bottom + scrollY + 4;

        // If dropdown would overflow bottom, open upwards
        if (rect.bottom + dropdownHeight > window.innerHeight - padding) {
          top = rect.top + scrollY - dropdownHeight - 4;
          // Ensure it doesn't go off the top of the body
          if (top < scrollY + padding) {
            top = scrollY + padding;
          }
        }

        setDropdownPos({ top, left });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen]);

  const filteredOptions = options.filter(opt => {
    const value = typeof opt === 'string' ? opt : opt.value;
    const isHeader = typeof opt === 'string' ? value.startsWith('#') : !!(opt as { isHeader?: boolean }).isHeader;
    if (isHeader) return true;
    let optLabel = typeof opt === 'string' ? (isHeader ? t(value.replace('# ', '')) : t(opt)) : opt.label;
    // Strip [category] prefix if present
    if (typeof opt === 'string' && optLabel.startsWith('[')) {
      optLabel = optLabel.replace(/^\[.*?\]/, '');
    }
    return optLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
           value.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const showAddButton = onAdd && searchTerm && !options.some(opt => {
    const value = typeof opt === 'string' ? opt : opt.value;
    const optLabel = typeof opt === 'string' ? t(opt) : opt.label;
    return value.toLowerCase() === searchTerm.toLowerCase() ||
           optLabel.toLowerCase() === searchTerm.toLowerCase();
  });

  const hasCategories = headers.length > 0;

  const handleAddNewValue = (value: string) => {
    if (hasCategories) {
      // Show category picker
      setPendingNewValue(value);
    } else {
      // No categories - add directly
      if (onAdd) onAdd(value);
      if (multiSelect) {
        onSelect([...selectedValues, value]);
      } else {
        onSelect([value]);
        setIsOpen(false);
      }
      setSearchTerm('');
    }
  };

  const handleCategorySelect = (category: string | null) => {
    if (!pendingNewValue || !onAdd) return;
    const valueToAdd = category ? `[${category}]${pendingNewValue}` : pendingNewValue;
    onAdd(valueToAdd);
    if (multiSelect) {
      onSelect([...selectedValues, valueToAdd]);
    } else {
      onSelect([valueToAdd]);
    }
    setPendingNewValue(null);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm('');
          setHoveredItem(null);
          setPendingNewValue(null);
        }}
        className="flex items-center text-[9px] text-accent hover:text-accent/80 font-bold uppercase tracking-widest transition-colors"
      >
        <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
                <div
                  className="fixed inset-0 z-[9998] bg-transparent"
                  onClick={() => {
                    setIsOpen(false);
                    setHoveredItem(null);
                    setPendingNewValue(null);
                  }}
                />
                <AnimatePresence>
                  {hoveredItem && !pendingNewValue && (
                    <motion.div
                      initial={{ opacity: 0, x: hoveredItem.right ? 10 : -10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: hoveredItem.right ? 10 : -10, scale: 0.95 }}
                      className={cn(
                        "fixed z-[10000] w-64 p-3 bg-surface-elevated border border-white/[0.06] rounded-lg shadow-2xl pointer-events-none",
                        "text-[10px] leading-relaxed text-on-surface font-medium"
                      )}
                      style={{
                        top: hoveredItem.top,
                        left: hoveredItem.right ? dropdownPos.left + 300 : dropdownPos.left - 268
                      }}
                    >
                      <div className="absolute top-4 w-2 h-2 bg-surface-elevated border-l border-t border-white/[0.06] rotate-45"
                           style={{ [hoveredItem.right ? 'left' : 'right']: '-5px', transform: hoveredItem.right ? 'rotate(-45deg)' : 'rotate(135deg)' }} />
                      {hoveredItem.label}
                    </motion.div>
                  )}
                </AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute w-72 bg-surface-elevated border border-white/[0.06] rounded-xl shadow-2xl z-[9999] overflow-hidden flex flex-col"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                style={{
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  maxHeight: 'calc(100vh - 40px)'
                }}
              >
                {/* Category picker for new value */}
                {pendingNewValue ? (
                  <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="p-3 border-b border-white/[0.04] bg-accent/5">
                      <p className="text-[10px] font-bold text-on-surface mb-1">
                        {t('selectCategory') || 'Escolher área'}
                      </p>
                      <p className="text-[9px] text-on-surface-variant truncate">
                        "{pendingNewValue}"
                      </p>
                    </div>
                    <div className="overflow-y-auto max-h-[300px]">
                      {headers.map((header) => {
                        const groupKey = header.replace('# ', '');
                        return (
                          <button
                            key={header}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleCategorySelect(groupKey); }}
                            className="w-full text-left px-4 py-2.5 text-[10px] font-bold text-on-surface hover:bg-accent/10 transition-colors flex items-center gap-2 border-b border-white/[0.02]"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                            {t(groupKey)}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleCategorySelect(null); }}
                        className="w-full text-left px-4 py-2.5 text-[10px] font-medium text-on-surface-variant hover:bg-white/[0.04] transition-colors border-t border-white/[0.04]"
                      >
                        {t('noCategorySpecial') || 'Sem categoria'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPendingNewValue(null); }}
                        className="w-full text-center px-4 py-2 text-[10px] font-medium text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 border-b border-white/[0.04] bg-surface shrink-0">
                      <input
                        type="text"
                        placeholder={t('searchPresets') || 'Buscar...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-surface-elevated border border-white/[0.06] rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-accent/30 outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 min-h-0">
                      {showAddButton && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleAddNewValue(searchTerm); }}
                          className="w-full flex items-center gap-2 px-3 py-3 text-[10px] text-accent font-bold hover:bg-accent/10 border-b border-white/[0.04] bg-accent/5 group transition-all shrink-0"
                        >
                          <div className="w-5 h-5 rounded bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-3 h-3" />
                          </div>
                          <span className="truncate">{t('add')}: "{searchTerm}"</span>
                        </button>
                      )}

                      {filteredOptions.length === 0 && !showAddButton && (
                        <div className="px-3 py-6 text-[10px] text-on-surface-variant text-center italic opacity-60">
                          {searchTerm ? (t('noMatchingPresetsFound') || 'Nenhum resultado') : (t('noPresetsAvailable') || 'Sem presets')}
                        </div>
                      )}

                      <div className="divide-y divide-white/[0.04]">
                          {filteredOptions.map((opt, idx) => {
                            const value = typeof opt === 'string' ? opt : opt.value;
                            const isHeader = typeof opt === 'string' ? value.startsWith('# ') : !!(opt as { isHeader?: boolean }).isHeader;
                            let optLabel = typeof opt === 'string' ? (isHeader ? t(value.replace('# ', '')) : t(opt)) : opt.label;

                            // Strip [category] prefix if present for display
                            if (typeof opt === 'string' && !isHeader && optLabel.startsWith('[')) {
                              optLabel = optLabel.replace(/^\[.*?\]/, '');
                            }

                            if (isHeader) {
                              return (
                                <div
                                  key={`header-${idx}`}
                                  className="px-3 py-2 bg-white/[0.03] text-[9px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                                  {optLabel}
                                </div>
                              );
                            }

                            const isSelected = selectedValues.includes(value) || selectedValues.includes(optLabel);

                            return (
                              <div
                                key={value}
                                className="group relative transition-colors hover:bg-white/[0.03]"
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const wouldOverflowRight = rect.right + 300 > window.innerWidth;
                                  setHoveredItem({ label: optLabel, top: rect.top, right: !wouldOverflowRight });
                                }}
                                onMouseLeave={() => setHoveredItem(null)}
                              >
                                <div className="flex items-center justify-between">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (multiSelect) {
                                        const newValue = isSelected
                                          ? selectedValues.filter(v => v !== value && v !== optLabel)
                                          : [...selectedValues, value];
                                        onSelect(newValue);
                                      } else {
                                        onSelect([value]);
                                        setIsOpen(false);
                                      }
                                    }}
                                    className={cn(
                                      "flex-1 text-left px-3 py-2.5 text-[10px] transition-all flex items-center gap-2 min-w-0",
                                      isSelected ? "text-accent font-bold bg-accent/5" : "text-on-surface hover:text-accent"
                                    )}
                                  >
                                    {multiSelect && (
                                      <div className={cn(
                                        "w-3.5 h-3.5 rounded border transition-all flex items-center justify-center shrink-0",
                                        isSelected ? "bg-accent border-accent" : "border-white/[0.1] group-hover:border-accent/30"
                                      )}>
                                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                      </div>
                                    )}
                                    <span className="truncate flex-1">{optLabel}</span>
                                  </button>

                                  <div className="flex items-center gap-0.5 pr-1 shrink-0 bg-transparent">
                                    {onMove && !isHeader && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          onMove(value, '');
                                        }}
                                        className="p-2 -m-1 text-accent/30 hover:text-accent hover:bg-accent/10 rounded-full transition-all"
                                        title={t('moveTo') || 'Mover para'}
                                      >
                                        <FolderInput className="w-4 h-4" />
                                      </button>
                                    )}
                                    {onDelete && isDeletable?.(value) && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          onDelete(value);
                                        }}
                                        className="p-2 -m-1 text-on-surface/20 hover:text-error hover:bg-error/10 rounded-full transition-all"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
