import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import RegistrationForm from './pages/RegistrationForm';
import Login from './pages/Login';
import GiftCards from './pages/GiftCards';
import GiftCardReveal from './pages/GiftCardReveal';
import PrivateRoute from './components/PrivateRoute';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <Router basename="/PlanYourTripNow">
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/tours" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register/:tripId" element={<RegistrationForm />} />
          <Route path="/gift/:giftCardId" element={<GiftCardReveal />} />
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
