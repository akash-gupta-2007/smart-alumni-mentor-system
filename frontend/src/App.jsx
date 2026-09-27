import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
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

// Role-based access control for nested routes
function RoleGuard({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/app" replace />;
  }
  return children;
}

function WorkspaceLayout() {
  useReveal();
  return (
    <>
      <Navbar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

function Shell() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute><WorkspaceLayout /></ProtectedRoute>}>
          <Route path="/app" element={<Navigate to="/app/profile" replace />} />
          <Route path="/app/profile" element={<Dashboard defaultTab="profile" />} />
          <Route path="/app/matches" element={<Dashboard defaultTab="matches" />} />
          <Route path="/app/availability" element={<RoleGuard allowedRoles={['alumni','coordinator','admin']}><Dashboard defaultTab="availability" /></RoleGuard>} />
          <Route path="/app/meetings" element={<Dashboard defaultTab="meetings" />} />
          <Route path="/app/goals" element={<Dashboard defaultTab="goals" />} />
          <Route path="/app/feedback" element={<Dashboard defaultTab="feedback" />} />
          <Route path="/app/admin" element={<RoleGuard allowedRoles={['coordinator','admin']}><Dashboard defaultTab="admin" /></RoleGuard>} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider><Shell /></AuthProvider>
  );
}
