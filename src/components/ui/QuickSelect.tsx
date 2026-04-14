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
  multiSelect = false,
  selectedValues = []
}: {
  options: QuickSelectOption[],
  onSelect: (val: string) => void,
  label: string,
  onDelete?: (val: string) => void,
  isDeletable?: (val: string) => boolean,
  onAdd?: (val: string) => void,
  multiSelect?: false,
  selectedValues?: string[]
} | {
  options: QuickSelectOption[],
  onSelect: (val: string[]) => void,
  label: string,
  onDelete?: (val: string) => void,
  isDeletable?: (val: string) => boolean,
  onAdd?: (val: string) => void,
  multiSelect: true,
  selectedValues?: string[]
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      setDropdownPos({ top: rect.bottom + scrollY + 4, left: rect.left + scrollX });
    }
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
        }}
        className="flex items-center text-[9px] text-primary hover:text-primary-dim font-bold uppercase tracking-widest transition-colors"
      >
        {label} <ChevronDown className={cn("w-3 h-3 ml-1 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed w-72 bg-surface-container-highest border border-black/10 rounded-lg shadow-2xl z-[9999] overflow-hidden"
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
            >
              <div className="p-3 border-b border-black/5 bg-surface-container">
                <input
                  type="text"
                  placeholder={t('searchPresets' as any)}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface-container-highest border border-black/10 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary/30 outline-none"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                {showAddButton && (
                  <button
                    type="button"
                    onClick={() => {
                      onAdd(searchTerm);
                      if (multiSelect) {
                        (onSelect as (val: string[]) => void)([...selectedValues, searchTerm]);
                      } else {
                        (onSelect as (val: string) => void)(searchTerm);
                        setIsOpen(false);
                      }
                      setSearchTerm('');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-3 text-[10px] text-primary font-bold hover:bg-primary/10 border-b border-black/5 bg-primary/5 group transition-all"
                  >
                    <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-3 h-3" />
                    </div>
                    <span>{t('add' as any)}: "{searchTerm}"</span>
                  </button>
                )}
                
                {filteredOptions.length === 0 && !showAddButton && (
                  <div className="px-3 py-6 text-[10px] text-on-surface-variant text-center italic opacity-60">
                    {searchTerm ? t('noMatchingPresetsFound' as any) : t('noPresetsAvailable' as any)}
                  </div>
                )}
                
                {filteredOptions.map(opt => {
                  const value = typeof opt === 'string' ? opt : opt.value;
                  const label = typeof opt === 'string' ? t(opt as any) : opt.label;
                  return (
                    <div
                      key={value}
                      className="group flex items-center justify-between hover:bg-primary/5 transition-colors border-b border-black/5 last:border-none"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (multiSelect) {
                            const isSelected = selectedValues.includes(value);
                            const newValue = isSelected
                              ? selectedValues.filter(v => v !== value)
                              : [...selectedValues, value];
                            (onSelect as (val: string[]) => void)(newValue);
                          } else {
                            (onSelect as (val: string) => void)(value);
                            setIsOpen(false);
                          }
                        }}
                        className={cn(
                          "flex-1 text-left px-3 py-2.5 text-[10px] transition-all flex items-center gap-2",
                          multiSelect && selectedValues.includes(value) ? "text-primary font-bold bg-primary/5" : "text-on-surface hover:text-primary"
                        )}
                      >
                        {multiSelect && (
                          <div className={cn(
                            "w-3.5 h-3.5 rounded border transition-all flex items-center justify-center",
                            selectedValues.includes(value) ? "bg-primary border-primary" : "border-black/20 group-hover:border-primary/50"
                          )}>
                            {selectedValues.includes(value) && <Check className="w-2.5 h-2.5 text-on-primary" />}
                          </div>
                        )}
                        <span className="flex-1">{label}</span>
                      </button>
                      {onDelete && isDeletable?.(value) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(value);
                          }}
                          className="px-3 py-2.5 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete preset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
};
