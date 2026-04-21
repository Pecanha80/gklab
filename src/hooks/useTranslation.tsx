import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '../translations';

interface LanguageContextType {
  language: Language;
  changeLanguage: (newLanguage: Language) => void;
  /** Translates a key. Accepts known TranslationKeys or dynamic strings (presets, data keys). */
  t: (key: TranslationKey | (string & {})) => string;
  isPortuguese: boolean;
  isEnglish: boolean;
}

// Fallback / Initial value
const defaultContext: LanguageContextType = {
  language: 'pt',
  changeLanguage: () => {},
  t: (key: TranslationKey | string) => translations.pt[key as TranslationKey] || translations.en[key as TranslationKey] || String(key),
  isPortuguese: true,
  isEnglish: false,
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('pt');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('gk_language') as Language;
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = useCallback((newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('gk_language', newLanguage);
  }, []);

  const t = useCallback(
    (key: TranslationKey | string): string => {
      const k = key as TranslationKey;
      const result = translations[language][k] || translations.en[k];
      if (result) return result;
      
      // Handle categorized custom presets (e.g. [sessionCategory...]My Logic)
      const keyStr = String(key);
      if (keyStr.startsWith('[')) {
        return keyStr.replace(/^\[.*?\]/, '');
      }
      
      return keyStr;
    },
    [language]
  );

  const value = useMemo<LanguageContextType>(
    () => ({
      language,
      changeLanguage,
      t,
      isPortuguese: language === 'pt',
      isEnglish: language === 'en',
    }),
    [language, changeLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    return defaultContext;
  }
  return context;
}
