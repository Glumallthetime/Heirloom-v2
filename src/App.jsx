import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';

import LandingPage      from './pages/LandingPage.jsx';
import LoginPage        from './pages/LoginPage.jsx';
import SignupPage       from './pages/SignupPage.jsx';
import OwnerDashboard   from './pages/OwnerDashboard.jsx';
import EstateManagement from './pages/EstateManagement.jsx';
import AddItemPage      from './pages/AddItemPage.jsx';
import EditItemPage     from './pages/EditItemPage.jsx';
import ResultsPage      from './pages/ResultsPage.jsx';
import FamilyView       from './pages/FamilyView.jsx';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"        element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/login"   element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/signup"  element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />

      {/* Family member route — always public */}
      <Route path="/e/:shareToken" element={<FamilyView />} />

      {/* Owner routes — require auth */}
      <Route path="/dashboard"                       element={<Protected><OwnerDashboard /></Protected>} />
      <Route path="/estate/:id"                      element={<Protected><EstateManagement /></Protected>} />
      <Route path="/estate/:id/item/new"             element={<Protected><AddItemPage /></Protected>} />
      <Route path="/estate/:id/item/:itemId/edit"    element={<Protected><EditItemPage /></Protected>} />
      <Route path="/estate/:id/results"              element={<Protected><ResultsPage /></Protected>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}
