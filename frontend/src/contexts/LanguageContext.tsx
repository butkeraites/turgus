import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  availableLanguages: { code: string; name: string; nativeName: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const availableLanguages = [
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  // Load user's preferred language when they log in
  useEffect(() => {
    if (user && user.type === 'buyer' && user.language) {
      if (user.language !== i18n.language) {
        i18n.changeLanguage(user.language);
      }
    }
  }, [user, i18n]);

  const changeLanguage = async (language: string) => {
    if (availableLanguages.some(lang => lang.code === language)) {
      await i18n.changeLanguage(language);
      
      // If user is logged in as buyer, we could update their preference on the server
      // For now, we'll just store it locally via i18n's built-in localStorage handling
      if (user && user.type === 'buyer') {
        // TODO: Update user language preference on server
        console.log(`Would update user language preference to ${language}`);
      }
    }
  };

  const contextValue: LanguageContextType = {
    currentLanguage: i18n.language,
    changeLanguage,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};