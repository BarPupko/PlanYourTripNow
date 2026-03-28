import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import RegistrationForm from './pages/RegistrationForm';
import Login from './pages/Login';
import GiftCards from './pages/GiftCards';
import GiftCardReveal from './pages/GiftCardReveal';
import GiftCardPurchase from './pages/GiftCardPurchase';
import FeedbackForm from './pages/FeedbackForm';
import FeedbacksDashboard from './pages/FeedbacksDashboard';
import PrivateRoute from './components/PrivateRoute';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <Router basename="/PlanYourTripNow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register/:tripId" element={<RegistrationForm />} />
          <Route path="/gift/:giftCardId" element={<GiftCardReveal />} />
          <Route path="/feedback/:tripId/:token" element={<FeedbackForm />} />
          <Route
            path="/admin/feedbacks"
            element={
              <PrivateRoute>
                <FeedbacksDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/gift-card-purchase" element={<GiftCardPurchase />} />
          <Route
            path="/gift-cards"
            element={
              <PrivateRoute>
                <GiftCards />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
