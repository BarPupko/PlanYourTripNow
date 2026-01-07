import { useLanguage } from '../contexts/LanguageContext';
import colors from '../utils/colors';

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en', flag: '🇨🇦', name: 'English (CA)' },
    { code: 'ru', flag: '🇷🇺', name: 'Русский' }
  ];

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Mobile: Show only flags */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="sm:hidden px-2 py-1.5 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:border-transparent bg-white cursor-pointer hover:bg-gray-50 transition-colors"
          style={{ focusRing: colors.primary.teal }}
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.flag}</option>
          ))}
        </select>

        {/* Desktop: Show full text */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="hidden sm:block px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:border-transparent bg-white cursor-pointer hover:bg-gray-50 transition-colors"
          style={{ focusRing: colors.primary.teal }}
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LanguageSelector;
