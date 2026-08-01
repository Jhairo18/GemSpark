import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { getPerfil } from '../api/perfil';
import type { PerfilClinicoResponse } from '../types/perfil';

interface PerfilContextValue {
  perfil: PerfilClinicoResponse | null;
  loading: boolean;
  error: string | null;
  setPerfil: (perfil: PerfilClinicoResponse) => void;
  refetch: () => Promise<void>;
}

const PerfilContext = createContext<PerfilContextValue | null>(null);

export function PerfilProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfilState] = useState<PerfilClinicoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await getPerfil();
      setPerfilState(resultado);
    } catch {
      setError('No se pudo cargar el perfil. Verifica tu conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return (
    <PerfilContext.Provider value={{ perfil, loading, error, setPerfil: setPerfilState, refetch }}>
      {children}
    </PerfilContext.Provider>
  );
}

export function usePerfil(): PerfilContextValue {
  const context = useContext(PerfilContext);
  if (!context) {
    throw new Error('usePerfil debe usarse dentro de un PerfilProvider');
  }
  return context;
}
