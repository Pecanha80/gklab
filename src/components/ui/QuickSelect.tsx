import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Trash2, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';

export type QuickSelectOption = string | { value: string; label: string };

export const QuickSelect = ({
  options,
  onSelect,
  label,
  onDelete,
  isDeletable,
  onAdd,
  multiSelect = true,
  selectedValues = []
}: {
  options: QuickSelectOption[],
  onSelect: (val: string[]) => void,
  label: string,
  onDelete?: (val: string) => void,
  isDeletable?: (val: string) => boolean,
  onAdd?: (val: string) => void,
  multiSelect?: boolean,
  selectedValues?: string[]
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [hoveredItem, setHoveredItem] = useState<{ label: string; top: number; right: boolean } | null>(null);

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
    const label = typeof opt === 'string' ? t(opt as any) : opt.label;
    return label.toLowerCase().includes(searchTerm.toLowerCase()) ||
           value.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const showAddButton = onAdd && searchTerm && !options.some(opt => {
    const value = typeof opt === 'string' ? opt : opt.value;
    const label = typeof opt === 'string' ? t(opt as any) : opt.label;
    return value.toLowerCase() === searchTerm.toLowerCase() || 
           label.toLowerCase() === searchTerm.toLowerCase();
  });

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm('');
          setHoveredItem(null);
        }}
        className="flex items-center text-[9px] text-primary hover:text-primary-dim font-bold uppercase tracking-widest transition-colors"
      >
        {label} <ChevronDown className={cn("w-3 h-3 ml-1 transition-transform", isOpen && "rotate-180")} />
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
                  }} 
                />
                <AnimatePresence>
                  {hoveredItem && (
                    <motion.div
                      initial={{ opacity: 0, x: hoveredItem.right ? 10 : -10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: hoveredItem.right ? 10 : -10, scale: 0.95 }}
                      className={cn(
                        "fixed z-[10000] w-64 p-3 bg-surface-container-highest border border-primary/20 rounded-lg shadow-2xl pointer-events-none",
                        "text-[10px] leading-relaxed text-on-surface font-medium"
                      )}
                      style={{ 
                        top: hoveredItem.top,
                        left: hoveredItem.right ? dropdownPos.left + 300 : dropdownPos.left - 268
                      }}
                    >
                      <div className="absolute top-4 w-2 h-2 bg-surface-container-highest border-l border-t border-primary/20 rotate-45" 
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
                className="absolute w-72 bg-surface-container-highest border border-black/10 rounded-lg shadow-2xl z-[9999] overflow-hidden flex flex-col"
                style={{ 
                  top: dropdownPos.top, 
                  left: dropdownPos.left,
                  maxHeight: 'calc(100vh - 40px)'
                }}
              >
                <div className="p-3 border-b border-black/5 bg-surface-container shrink-0">
                  <input
                    type="text"
                    placeholder={t('searchPresets' as any)}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface-container-highest border border-black/10 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary/30 outline-none"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 min-h-0">
                  {showAddButton && (
                    <button
                      type="button"
                      onClick={() => {
                        onAdd(searchTerm);
                        if (multiSelect) {
                          onSelect([...selectedValues, searchTerm]);
                        } else {
                          onSelect([searchTerm]);
                          setIsOpen(false);
                        }
                        setSearchTerm('');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-3 text-[10px] text-primary font-bold hover:bg-primary/10 border-b border-black/5 bg-primary/5 group transition-all shrink-0"
                    >
                      <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-3 h-3" />
                      </div>
                      <span className="truncate">{t('add' as any)}: "{searchTerm}"</span>
                    </button>
                  )}
                  
                  {filteredOptions.length === 0 && !showAddButton && (
                    <div className="px-3 py-6 text-[10px] text-on-surface-variant text-center italic opacity-60">
                      {searchTerm ? t('noMatchingPresetsFound' as any) : t('noPresetsAvailable' as any)}
                    </div>
                  )}
                  
                  <div className="divide-y divide-black/5">
                    {filteredOptions.map(opt => {
                      const value = typeof opt === 'string' ? opt : opt.value;
                      const label = typeof opt === 'string' ? t(opt as any) : opt.label;
                      // Check both value and label to handle cases where parent stores translated text
                      const isSelected = selectedValues.includes(value) || selectedValues.includes(label);

                      return (
                        <div
                          key={value}
                          className="group flex items-center justify-between hover:bg-primary/5 transition-colors"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const wouldOverflowRight = rect.right + 300 > window.innerWidth;
                            setHoveredItem({ label, top: rect.top, right: !wouldOverflowRight });
                          }}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (multiSelect) {
                              const newValue = isSelected
                                ? selectedValues.filter(v => v !== value && v !== label)
                                : [...selectedValues, value];
                              onSelect(newValue);
                            } else {
                              onSelect([value]);
                              setIsOpen(false);
                            }
                            }}
                            className={cn(
                              "flex-1 text-left px-3 py-2.5 text-[10px] transition-all flex items-center gap-2 min-w-0",
                              isSelected ? "text-primary font-bold bg-primary/5" : "text-on-surface hover:text-primary"
                            )}
                          >
                            {multiSelect && (
                              <div className={cn(
                                "w-3.5 h-3.5 rounded border transition-all flex items-center justify-center shrink-0",
                                isSelected ? "bg-primary border-primary" : "border-black/20 group-hover:border-primary/50"
                              )}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-on-primary" />}
                              </div>
                            )}
                            <span className="truncate flex-1">{label}</span>
                          </button>
                          {onDelete && isDeletable?.(value) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(value);
                              }}
                              className="px-3 py-2.5 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              title="Delete preset"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
