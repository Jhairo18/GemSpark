import { NavLink } from 'react-router-dom';

function IconoInicio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoEscanear() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
      <path
        d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoPerfil() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.5 4-5.5 7-5.5s5.8 2 7 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 flex items-end justify-around border-t border-outline-variant bg-surface-container-lowest px-4 pb-2 pt-2">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex min-h-touch flex-1 flex-col items-center justify-center gap-0.5 transition-colors hover:text-primary ${
            isActive ? 'text-primary' : 'text-on-surface-variant'
          }`
        }
      >
        <IconoInicio />
        <span className="text-xs font-bold">Inicio</span>
      </NavLink>

      <NavLink to="/escanear" className="group flex flex-1 flex-col items-center gap-1">
        <span className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-transform group-hover:scale-105 group-hover:shadow-xl">
          <IconoEscanear />
        </span>
        <span className="text-xs font-bold text-primary">Escanear</span>
      </NavLink>

      <NavLink
        to="/perfil"
        className={({ isActive }) =>
          `flex min-h-touch flex-1 flex-col items-center justify-center gap-0.5 transition-colors hover:text-primary ${
            isActive ? 'text-primary' : 'text-on-surface-variant'
          }`
        }
      >
        <IconoPerfil />
        <span className="text-xs font-bold">Perfil</span>
      </NavLink>
    </nav>
  );
}
