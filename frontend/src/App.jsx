import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ScrollToHash from './components/ScrollToHash.jsx';
import { useReveal } from './components/motion.jsx';
import { Footer } from './components/MatchCard.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { AuthProvider, useAuth } from './lib/auth.jsx';

// RBAC at the route level: no token → login page (no more "Guest" workspace)
function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="section wrap" style={{textAlign:'center',padding:'80px 0'}}><div style={{width:36,height:36,margin:'0 auto',border:'3px solid var(--line)',borderTopColor:'var(--gold)',borderRadius:'50%',animation:'spin 1s linear infinite'}} /><style jsx>{`@keyframes spin{to{transform:rotate(360deg)}`}</style><p style={{marginTop:16,color:'var(--muted)'}}>Restoring session…</p></div>;
  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

function Shell() {
  useReveal();
  return (
    <BrowserRouter>
      <ScrollToHash />
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
