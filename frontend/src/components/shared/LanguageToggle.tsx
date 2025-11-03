import React from 'react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { currentLanguage, changeLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'pt' ? 'en' : 'pt';
    changeLanguage(newLanguage);
  };

  const getCurrentLanguageLabel = () => {
    return currentLanguage === 'pt' ? 'PT' : 'EN';
  };

  const getNextLanguageLabel = () => {
    return currentLanguage === 'pt' ? 'EN' : 'PT';
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
      title={`Switch to ${getNextLanguageLabel()}`}
      aria-label={`Current language: ${getCurrentLanguageLabel()}. Click to switch to ${getNextLanguageLabel()}`}
    >
      <GlobeAltIcon className="h-5 w-5 text-gray-600" />
      <span className="text-sm font-medium text-gray-700">
        {getCurrentLanguageLabel()}
      </span>
    </button>
  );
};

export default LanguageToggle;