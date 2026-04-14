import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';

export const QuickSelect = ({
  options,
  onSelect,
  label,
  onDelete,
  isDeletable,
  multiSelect = false,
  selectedValues = []
}: {
  options: string[],
  onSelect: (val: string) => void,
  label: string,
  onDelete?: (val: string) => void,
  isDeletable?: (val: string) => boolean,
  multiSelect?: false,
  selectedValues?: string[]
} | {
  options: string[],
  onSelect: (val: string[]) => void,
  label: string,
  onDelete?: (val: string) => void,
  isDeletable?: (val: string) => boolean,
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
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt => {
    const translatedOpt = t(opt as any);
    return translatedOpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
           opt.toLowerCase().includes(searchTerm.toLowerCase());
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
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="fixed w-64 bg-surface-container-highest border border-black/10 rounded-lg shadow-2xl z-[9999] overflow-hidden"
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
            >
              <div className="p-2 border-b border-black/5">
                <input
                  type="text"
                  placeholder={t('searchPresets' as any)}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface-container border border-black/5 rounded px-2 py-1 text-xs"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                {filteredOptions.length === 0 && (
                  <div className="px-3 py-4 text-[10px] text-on-surface-variant text-center italic">
                    {searchTerm ? t('noMatchingPresetsFound' as any) : t('noPresetsAvailable' as any)}
                  </div>
                )}
                {filteredOptions.map(opt => (
                  <div
                    key={opt}
                    className="group flex items-center justify-between hover:bg-primary/10 transition-colors border-b border-black/5 last:border-none"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (multiSelect) {
                          const isSelected = selectedValues.includes(opt);
                          const newValue = isSelected
                            ? selectedValues.filter(v => v !== opt)
                            : [...selectedValues, opt];
                          (onSelect as (val: string[]) => void)(newValue);
                        } else {
                          (onSelect as (val: string) => void)(opt);
                          setIsOpen(false);
                        }
                        setSearchTerm('');
                      }}
                      className={cn(
                        "flex-1 text-left px-3 py-2 text-[10px] transition-colors flex items-center justify-between",
                        multiSelect && selectedValues.includes(opt) ? "text-primary font-bold bg-primary/5" : "hover:text-primary"
                      )}
                    >
                      {t(opt as any)}
                      {multiSelect && selectedValues.includes(opt) && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                    {onDelete && isDeletable?.(opt) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(opt);
                        }}
                        className="px-2 py-2 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete preset"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
};
