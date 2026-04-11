import { createContext, useContext, useState, useEffect, useCallback, useMemo, createElement, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '../translations';

interface LanguageContextType {
  language: Language;
  changeLanguage: (newLanguage: Language) => void;
  t: (key: TranslationKey) => string;
  isPortuguese: boolean;
  isEnglish: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

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
    (key: TranslationKey): string => {
      return translations[language][key] || translations.en[key] || key;
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

  return createElement(LanguageContext.Provider, { value }, children);
}

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
