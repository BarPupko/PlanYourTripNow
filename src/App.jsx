import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import RegistrationForm from './pages/RegistrationForm';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <Router basename="/PlanYourTripNow">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register/:tripId" element={<RegistrationForm />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
