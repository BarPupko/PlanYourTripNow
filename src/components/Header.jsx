import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ArrowLeft, Gift, MessageCircle, HelpCircle, Settings, Menu, X, FileText, Star, Bell, MessageSquare, Users } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import IVRILogo from './IrviLogo';
import LanguageSelector from './LanguageSelector';
import WeatherWidget from './WeatherWidget';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import colors from '../utils/colors';
import { startTour } from '../utils/tour';

const Header = ({ showBackButton = false, title = '', subtitle = '', showLogout = true, onOpenMigration, onDownloadInvoices, questionCount = 0, onOpenQuestions, onOpenUsers }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const t = translations[language];
  const [showMenu, setShowMenu] = useState(false);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/PlanYourTripNow/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleBack = () => {
    navigate('/PlanYourTripNow/admin');
  };

  // Check if we're on admin dashboard
  const isAdminDashboard = location.pathname === '/PlanYourTripNow/admin';
  const isGiftCardsPage = location.pathname === '/PlanYourTripNow/gift-cards';
  const isPublicPage = location.pathname.includes('/register/');

  // Pages where clicking the logo should warn before leaving
  const isAdminArea = isAdminDashboard || isGiftCardsPage || location.pathname.startsWith('/PlanYourTripNow/admin');
  const handleLogoClick = () => {
    navigate('/');
  };

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

            {/* Logo - goes to admin dashboard on admin pages, or shows home confirmation elsewhere */}
            <button
              onClick={handleLogoClick}
              className="hidden sm:block hover:opacity-80 transition-opacity"
              title={isAdminArea ? 'Go to Dashboard' : 'Go to Home Page'}
            >
              <IVRILogo size="lg" />
            </button>
            <button
              onClick={handleLogoClick}
              className="sm:hidden hover:opacity-80 transition-opacity"
              title={isAdminArea ? 'Go to Dashboard' : 'Go to Home Page'}
            >
              <IVRILogo size="sm" />
            </button>

            <div className="min-w-0 flex-1">
              {isAdminDashboard ? (
                <>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <WeatherWidget compact={true} />
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
                  <>
                    <button
                      id="tour-gift-cards"
                      onClick={() => navigate('/PlanYourTripNow/gift-cards')}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                      style={{ color: colors.primary.teal }}
                      title="Gift Cards"
                    >
                      <Gift className="w-4 h-4" />
                      <span className="hidden sm:inline">Gift Cards</span>
                    </button>
                    <button
                      onClick={onOpenQuestions}
                      className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
                      style={{ color: colors.primary.teal }}
                      title="Visitor Questions"
                    >
                      <Bell className="w-5 h-5" />
                      {questionCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                          {questionCount > 9 ? '9+' : questionCount}
                        </span>
                      )}
                    </button>
                    <button
                      id="tour-help-btn"
                      onClick={() => startTour(t)}
                      className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
                      style={{ color: colors.primary.teal }}
                      title="Take a tour"
                    >
                      <HelpCircle className="w-5 h-5" />
                    </button>
                  </>
                )}

                {isGiftCardsPage && (
                  <button
                    onClick={() => navigate('/PlanYourTripNow/admin')}
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
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(prev => !prev)}
                  className="flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  title="Menu"
                >
                  {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                    {onOpenQuestions && (
                      <button
                        onClick={() => { onOpenQuestions(); setShowMenu(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" style={{ color: colors.primary.teal }} />
                        Questions
                        {questionCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {questionCount}
                          </span>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => { navigate('/PlanYourTripNow/admin/feedbacks'); setShowMenu(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Star className="w-4 h-4 text-amber-400" />
                      Feedbacks
                    </button>
                    {onOpenUsers && (
                      <button
                        onClick={() => { onOpenUsers(); setShowMenu(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Users className="w-4 h-4" style={{ color: colors.primary.teal }} />
                        Users
                      </button>
                    )}
                    <a
                      href="https://wa.me/14155238886"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" style={{ color: '#25D366' }} />
                      WhatsApp Assistant
                    </a>
                    {onDownloadInvoices && (
                      <button
                        onClick={() => { onDownloadInvoices(); setShowMenu(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-gray-500" />
                        Download Invoices
                      </button>
                    )}
                    {onOpenMigration && (
                      <button
                        onClick={() => { onOpenMigration(); setShowMenu(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        Data Migration
                      </button>
                    )}
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { handleLogout(); setShowMenu(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t.logout}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Home navigation confirmation dialog */}
      {showHomeConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-5">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: '#E6F7F8' }}
              >
                <span className="text-2xl">🏠</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Leave this page?</h3>
              <p className="text-sm text-gray-500">Any unsaved progress will be lost.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowHomeConfirm(false)}
                className="flex-1 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Stay
              </button>
              <button
                onClick={() => { setShowHomeConfirm(false); navigate('/'); }}
                className="flex-1 py-2.5 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.primary.teal }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
