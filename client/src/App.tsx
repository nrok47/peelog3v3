import { useEffect } from 'react';
import { HashRouter as BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useGameStore } from './store/gameStore';

import Login            from './screens/Login';
import Home             from './screens/Home';
import Battle           from './screens/Battle';
import Roster           from './screens/Roster';
import SpiritDetail     from './screens/SpiritDetail';
import Map              from './screens/Map';
import Forge            from './screens/Forge';
import SkillTree        from './screens/SkillTree';
import Adventure        from './screens/Adventure';
import Amulet           from './screens/Amulet';
import Evolution        from './screens/Evolution';
import ElementCodex     from './screens/ElementCodex';
import CorruptionEnding from './screens/CorruptionEnding';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuth, isLoading } = useGameStore();
  if (isLoading) return (
    <div className="loading-screen">
      <div className="loading-ghost">👻</div>
      <div className="loading-text">กำลังโหลด...</div>
    </div>
  );
  if (!isAuth) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { loadAll } = useGameStore();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <BrowserRouter>
      <div className="game-root">
        <Routes>
          <Route path="/login"      element={<Login />} />

          <Route path="/home"       element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/battle"     element={<ProtectedRoute><Battle /></ProtectedRoute>} />
          <Route path="/roster"     element={<ProtectedRoute><Roster /></ProtectedRoute>} />
          <Route path="/spirit/:id" element={<ProtectedRoute><SpiritDetail /></ProtectedRoute>} />
          <Route path="/map"        element={<ProtectedRoute><Map /></ProtectedRoute>} />
          <Route path="/forge"      element={<ProtectedRoute><Forge /></ProtectedRoute>} />
          <Route path="/skill-tree" element={<ProtectedRoute><SkillTree /></ProtectedRoute>} />
          <Route path="/adventure"  element={<ProtectedRoute><Adventure /></ProtectedRoute>} />
          <Route path="/amulet"     element={<ProtectedRoute><Amulet /></ProtectedRoute>} />
          <Route path="/evolution"  element={<ProtectedRoute><Evolution /></ProtectedRoute>} />
          <Route path="/codex"      element={<ProtectedRoute><ElementCodex /></ProtectedRoute>} />
          <Route path="/ending"     element={<ProtectedRoute><CorruptionEnding /></ProtectedRoute>} />

          <Route path="*"           element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
