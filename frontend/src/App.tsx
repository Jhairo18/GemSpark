import { Route, Routes } from 'react-router-dom';

import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { ScanPage } from './pages/ScanPage';
import { VoiceMealLogPage } from './pages/VoiceMealLogPage';
import { RecipeFromIngredientsPage } from './pages/RecipeFromIngredientsPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/escanear" element={<ScanPage />} />
      </Route>
      <Route path="/contarme-que-comi" element={<VoiceMealLogPage />} />
      <Route path="/que-puedo-cocinar" element={<RecipeFromIngredientsPage />} />
    </Routes>
  );
}

export default App;
