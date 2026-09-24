import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ScrollToHash from './components/ScrollToHash.jsx';
import ScrollProgress, { useReveal } from './components/motion.jsx';
import { Footer } from './components/MatchCard.jsx';
import Scene3D from './three/Scene3D.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  useReveal();
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Scene3D />
      <div className="veil" />
      <ScrollProgress />
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
