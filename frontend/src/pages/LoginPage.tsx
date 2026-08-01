import { Navigate } from 'react-router-dom';

import { usePerfil } from '../context/PerfilContext';
import { ProfileSetup } from '../components/profile/ProfileSetup';

export function LoginPage() {
  const { perfil, loading } = usePerfil();

  if (loading) {
    return <p className="p-page text-lg text-on-surface-variant">Cargando...</p>;
  }

  if (perfil) {
    return <Navigate to="/" replace />;
  }

  return <ProfileSetup />;
}
