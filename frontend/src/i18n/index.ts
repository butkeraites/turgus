import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import commonPt from '../locales/pt/common.json';
import commonEn from '../locales/en/common.json';
import authPt from '../locales/pt/auth.json';
import authEn from '../locales/en/auth.json';
import sellerPt from '../locales/pt/seller.json';
import sellerEn from '../locales/en/seller.json';
import buyerPt from '../locales/pt/buyer.json';
import buyerEn from '../locales/en/buyer.json';

// Define resources
const resources = {
  pt: {
    common: commonPt,
    auth: authPt,
    seller: sellerPt,
    buyer: buyerPt,
  },
  en: {
    common: commonEn,
    auth: authEn,
    seller: sellerEn,
    buyer: buyerEn,
  },
};

// Get saved language from localStorage or default to Portuguese
const getInitialLanguage = (): string => {
  const savedLanguage = localStorage.getItem('turgus-language');
  return savedLanguage && ['pt', 'en'].includes(savedLanguage) ? savedLanguage : 'pt';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'pt',
    defaultNS: 'common',
    ns: ['common', 'auth', 'seller', 'buyer'],
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Save language preference to localStorage
    saveMissing: false,
    
    // Development options
    debug: import.meta.env.DEV,
    
    // React specific options
    react: {
      useSuspense: false,
    },
  });

// Save language changes to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('turgus-language', lng);
});

export default i18n;