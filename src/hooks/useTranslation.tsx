import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '../translations';

interface LanguageContextType {
  language: Language;
  changeLanguage: (newLanguage: Language) => void;
  t: (key: TranslationKey) => string;
  isPortuguese: boolean;
  isEnglish: boolean;
}

// Fallback / Initial value
const defaultContext: LanguageContextType = {
  language: 'pt',
  changeLanguage: () => {},
  t: (key: TranslationKey) => translations.pt[key] || translations.en[key] || key,
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

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = (): LanguageContextType => {
  return useContext(LanguageContext);
}
