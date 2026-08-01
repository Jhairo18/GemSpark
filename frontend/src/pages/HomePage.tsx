import { Link } from 'react-router-dom';

import { usePerfil } from '../context/PerfilContext';

function IconoCamara() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-10 w-10">
      <path
        d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H17a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.3" />
    </svg>
  );
}

function IconoMicrofono() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoGorroChef() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
      <path
        d="M6 9a3 3 0 1 1 1.2-5.7 3.5 3.5 0 0 1 6.6-1A3 3 0 0 1 18 9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 9h12v3a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9Z" />
      <path d="M7 14v5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomePage() {
  const { perfil } = usePerfil();

  if (!perfil) {
    // AppLayout ya garantiza que exista un perfil antes de renderizar esta ruta.
    return null;
  }

  return (
    <div className="flex flex-col gap-gap-component p-page">
      <div>
        <h1 className="text-3xl font-bold text-on-surface">Hola, {perfil.nombre.split(' ')[0]}</h1>
        <p className="text-lg text-on-surface-variant">¿Qué vamos a hacer hoy?</p>
      </div>

      <Link
        to="/escanear"
        className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-card bg-primary text-on-primary shadow-lg transition-all hover:shadow-xl hover:brightness-110"
      >
        <IconoCamara />
        <span className="text-xl font-bold">Escanear producto</span>
      </Link>

      <div className="grid grid-cols-2 gap-gap-component">
        <Link
          to="/contarme-que-comi"
          className="flex flex-col items-center gap-3 rounded-card bg-surface-container-lowest p-6 text-center shadow-sm transition-shadow hover:shadow-md"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <IconoMicrofono />
          </span>
          <span className="font-bold text-on-surface">Contarme qué comí</span>
        </Link>

        <Link
          to="/que-puedo-cocinar"
          className="flex flex-col items-center gap-3 rounded-card bg-surface-container-lowest p-6 text-center shadow-sm transition-shadow hover:shadow-md"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-500">
            <IconoGorroChef />
          </span>
          <span className="font-bold text-on-surface">¿Qué puedo cocinar?</span>
        </Link>
      </div>
    </div>
  );
}
