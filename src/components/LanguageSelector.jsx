import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import colors from '../utils/colors';

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-gray-600" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:border-transparent bg-white cursor-pointer hover:bg-gray-50 transition-colors"
          style={{ focusRing: colors.primary.teal }}
        >
          <option value="en">English (CA)</option>
          <option value="ru">Русский</option>
        </select>
      </div>
    </div>
  );
};

export default LanguageSelector;
