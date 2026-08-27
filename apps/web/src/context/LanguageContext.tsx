import React, { createContext, useContext, useState, useEffect } from 'react';
import { PreferredLanguage } from '../types';
import { translations } from '../locales/translations';

interface LanguageContextType {
  language: PreferredLanguage;
  setLanguage: (lang: PreferredLanguage) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<PreferredLanguage>(() => {
    return (localStorage.getItem('villagio_lang') as PreferredLanguage) || 'en';
  });

  const setLanguage = (lang: PreferredLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('villagio_lang', lang);
  };

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
