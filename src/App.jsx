import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import RegistrationForm from './pages/RegistrationForm';
import Login from './pages/Login';
import GiftCards from './pages/GiftCards';
import GiftCardReveal from './pages/GiftCardReveal';
import GiftCardPurchase from './pages/GiftCardPurchase';
import GiftCardComplete from './pages/GiftCardComplete';
import FeedbackForm from './pages/FeedbackForm';
import FeedbacksDashboard from './pages/FeedbacksDashboard';
import BlogPostPage from './pages/BlogPostPage';
import BlogIndexPage from './pages/BlogIndexPage';
import PrivateRoute from './components/PrivateRoute';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/PlanYourTripNow/admin"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/PlanYourTripNow/login" element={<Login />} />
          <Route path="/register/:tripId" element={<RegistrationForm />} />
          <Route path="/PlanYourTripNow/register/:tripId" element={<RegistrationForm />} />
          <Route path="/gift/:giftCardId" element={<GiftCardReveal />} />
          {/* Gift card emails link here via PUBLIC_SITE_URL, which includes the
              /PlanYourTripNow prefix on GitHub Pages */}
          <Route path="/PlanYourTripNow/gift/:giftCardId" element={<GiftCardReveal />} />
          <Route path="/feedback/:tripId/:token" element={<FeedbackForm />} />
          <Route
            path="/PlanYourTripNow/admin/feedbacks"
            element={
              <PrivateRoute>
                <FeedbacksDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/blog" element={<BlogIndexPage />} />
          <Route path="/blog/:postId" element={<BlogPostPage />} />
          <Route path="/gift-card-purchase" element={<GiftCardPurchase />} />
          <Route path="/PlanYourTripNow/gift-card-purchase" element={<GiftCardPurchase />} />
          {/* PayPal return URL - must match return_url in functions/paypal.js */}
          <Route path="/gift-card/complete" element={<GiftCardComplete />} />
          <Route path="/PlanYourTripNow/gift-card/complete" element={<GiftCardComplete />} />
          <Route
            path="/PlanYourTripNow/gift-cards"
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
