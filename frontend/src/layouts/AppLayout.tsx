import { Navigate, Outlet } from 'react-router-dom';

import { usePerfil } from '../context/PerfilContext';
import { TopBar } from '../components/layout/TopBar';
import { BottomNav } from '../components/layout/BottomNav';

export function AppLayout() {
  const { perfil, loading } = usePerfil();

  if (loading) {
    return <p className="p-page text-lg text-on-surface-variant">Cargando...</p>;
  }

  if (!perfil) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-surface shadow-xl">
      <TopBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
