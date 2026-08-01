import { Navigate, Route, Routes } from 'react-router-dom';

import { ProfilePage } from './pages/ProfilePage';
import { ScanPage } from './pages/ScanPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/perfil" replace />} />
      <Route path="/perfil" element={<ProfilePage />} />
      <Route path="/escanear" element={<ScanPage />} />
    </Routes>
  );
}

export default App;
