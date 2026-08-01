import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  mostrarVolver?: boolean;
  accionDerecha?: ReactNode;
}

function IconoFlechaAtras() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
      <path d="M15 19 8 12l7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TopBar({ mostrarVolver, accionDerecha }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <header className="flex min-h-touch items-center justify-between border-b border-outline-variant bg-surface px-page">
      <div className="flex w-10 justify-start">
        {mostrarVolver && (
          <button
            type="button"
            aria-label="Volver"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-high"
          >
            <IconoFlechaAtras />
          </button>
        )}
      </div>
      <span className="text-lg font-bold text-primary">GemSpark</span>
      <div className="flex w-10 justify-end">{accionDerecha}</div>
    </header>
  );
}
