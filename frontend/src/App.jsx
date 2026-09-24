import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ScrollToHash from './components/ScrollToHash.jsx';
import { useReveal } from './components/motion.jsx';
import { Footer } from './components/MatchCard.jsx';
import Scene3D from './three/Scene3D.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { AuthProvider, useAuth } from './lib/auth.jsx';

// RBAC at the route level: no token → login page (no more "Guest" workspace)
function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const loc = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

function Shell() {
  useReveal();
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Scene3D />
      <div className="veil" aria-hidden="true" />
      <Navbar />
      <main id="main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider><Shell /></AuthProvider>
  );
}
