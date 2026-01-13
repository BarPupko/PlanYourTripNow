import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ArrowLeft, Gift, MessageCircle } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import IVRILogo from './IrviLogo';
import LanguageSelector from './LanguageSelector';
import WeatherWidget from './WeatherWidget';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import colors from '../utils/colors';

const Header = ({ showBackButton = false, title = '', subtitle = '', showLogout = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const t = translations[language];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleBack = () => {
    navigate('/admin');
  };

  // Check if we're on admin dashboard
  const isAdminDashboard = location.pathname === '/admin';
  const isGiftCardsPage = location.pathname === '/gift-cards';
  const isPublicPage = location.pathname.includes('/register/');

  return (
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title={t.backToDashboard}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}

            {/* Make logo clickable to return to admin dashboard */}
            <button
              onClick={() => navigate('/admin')}
              className="hidden sm:block hover:opacity-80 transition-opacity"
              title="Go to Admin Dashboard"
            >
              <IVRILogo size="md" />
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="sm:hidden hover:opacity-80 transition-opacity"
              title="Go to Admin Dashboard"
            >
              <IVRILogo size="xs" />
            </button>

            <div className="min-w-0 flex-1">
              {isAdminDashboard ? (
                <>
                  <div className="flex items-center gap-2">
                    <WeatherWidget compact={true} />

                    {/* WhatsApp Bot Assistant */}
                    <a
                      href="https://wa.me/14155238886"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white rounded-full shadow-lg p-3 hover:shadow-xl transition-all hover:scale-105"
                      title="WhatsApp Assistant - Get trip info, check participants, and more!"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      <MessageCircle className="w-6 h-6 text-white" />
                    </a>

                    <p className="hidden sm:block text-sm text-gray-500">{t.IVRITours}</p>
                  </div>
                </>
              ) : title ? (
                <>
                  <h1 className="text-sm sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
                  {subtitle && (
                    <p className="hidden sm:block text-sm text-gray-600">{subtitle}</p>
                  )}
                </>
              ) : (
                <>
                  <h1 className="text-sm sm:text-2xl font-bold text-gray-900 truncate">{t.IVRITours}</h1>
                  <p className="hidden sm:block text-sm text-gray-500 mt-1">{t.tripManagement}</p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <LanguageSelector />

            {!isPublicPage && (
              <>
                {isAdminDashboard && (
                  <button
                    onClick={() => navigate('/gift-cards')}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                    style={{ color: colors.primary.teal }}
                    title="Gift Cards"
                  >
                    <Gift className="w-4 h-4" />
                    <span className="hidden sm:inline">Gift Cards</span>
                  </button>
                )}

                {isGiftCardsPage && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                    style={{ color: colors.primary.teal }}
                    title="Dashboard"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                )}
              </>
            )}

            {showLogout && !isPublicPage && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t.logout}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
