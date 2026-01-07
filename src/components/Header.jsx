import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ArrowLeft, Gift } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import IVRILogo from './IrviLogo';
import LanguageSelector from './LanguageSelector';
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
    navigate('/');
  };

  // Check if we're on admin dashboard
  const isAdminDashboard = location.pathname === '/';
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

            <div className="hidden sm:block">
              <IVRILogo size="md" />
            </div>
            <div className="sm:hidden">
              <IVRILogo size="xs" />
            </div>

            <div className="min-w-0 flex-1">
              {isAdminDashboard ? (
                <>
                  <h1 className="text-sm sm:text-2xl font-bold text-gray-900 truncate">
                    <span className="hidden sm:inline">{t.dashboard}</span>
                    <span className="sm:hidden">{t.dashboardShort}</span>
                  </h1>
                  <p className="text-[10px] sm:text-sm text-gray-500 mt-1">{t.IVRITours}</p>
                </>
              ) : title ? (
                <>
                  <h1 className="text-sm sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
                  {subtitle && (
                    <p className="text-[10px] sm:text-sm text-gray-600">{subtitle}</p>
                  )}
                </>
              ) : (
                <>
                  <h1 className="text-sm sm:text-2xl font-bold text-gray-900 truncate">{t.IVRITours}</h1>
                  <p className="text-[10px] sm:text-sm text-gray-500 mt-1">{t.tripManagement}</p>
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
                    onClick={() => navigate('/')}
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
