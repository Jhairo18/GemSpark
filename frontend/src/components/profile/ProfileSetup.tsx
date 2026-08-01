import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePerfil } from '../../context/PerfilContext';
import { putPerfil } from '../../api/perfil';
import { ApiError } from '../../api/client';
import { validarBiometricos } from '../../utils/validation';
import { toCondicionesArray } from '../../types/perfil';
import type { CondicionesToggleState, DatosBiometricos } from '../../types/perfil';
import { ConditionToggle } from './ConditionToggle';
import { BiometricsForm } from './BiometricsForm';

const DATOS_INICIALES: DatosBiometricos = {
  edad: NaN,
  genero: 'masculino',
  altura: NaN,
  peso: NaN,
};

const CONDICIONES_INICIALES: CondicionesToggleState = {
  hipertension: false,
  diabetes: false,
};

export function ProfileSetup() {
  const { perfil, loading, error, setPerfil } = usePerfil();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [datos, setDatos] = useState<DatosBiometricos>(DATOS_INICIALES);
  const [condiciones, setCondiciones] = useState<CondicionesToggleState>(CONDICIONES_INICIALES);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [camposTocados, setCamposTocados] = useState<Set<'edad' | 'altura' | 'peso'>>(new Set());

  useEffect(() => {
    if (!perfil) return;
    setNombre(perfil.nombre);
    setDatos({
      edad: perfil.datos_biometricos.edad,
      genero: perfil.datos_biometricos.genero,
      altura: perfil.datos_biometricos.altura,
      peso: perfil.datos_biometricos.peso,
    });
    setCondiciones({
      hipertension: perfil.condiciones.includes('hipertension'),
      diabetes: perfil.condiciones.includes('diabetes'),
    });
  }, [perfil]);

  const errores = validarBiometricos(datos);
  const formularioValido =
    nombre.trim().length > 0 && Object.keys(errores).length === 0;

  const guardar = async () => {
    setGuardando(true);
    setErrorGuardado(null);
    try {
      const respuesta = await putPerfil({
        nombre: nombre.trim(),
        datos_biometricos: datos,
        condiciones: toCondicionesArray(condiciones),
      });
      setPerfil(respuesta);
      navigate('/');
    } catch (err) {
      setErrorGuardado(
        err instanceof ApiError
          ? err.message
          : 'No se pudo guardar el perfil. Intenta nuevamente.',
      );
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return <p className="p-page text-lg text-on-surface-variant">Cargando perfil...</p>;
  }

  if (error) {
    return <p className="p-page text-lg text-error">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-gap-component p-page">
      <h1 className="text-3xl font-bold text-primary">Tu perfil clínico</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="nombre" className="text-lg font-medium text-on-surface">
          Nombre
        </label>
        <input
          id="nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="min-h-touch rounded-card border border-outline-variant bg-surface-container-lowest px-4 text-lg transition-colors hover:border-primary"
        />
      </div>

      <BiometricsForm
        value={datos}
        errores={errores}
        camposTocados={camposTocados}
        onChange={setDatos}
        onTocarCampo={(campo) => setCamposTocados((prev) => new Set(prev).add(campo))}
      />
      <ConditionToggle value={condiciones} onChange={setCondiciones} />

      {errorGuardado && <p className="text-error">{errorGuardado}</p>}

      {perfil && (
        <p className="text-on-surface-variant">
          IMC actual: {perfil.datos_biometricos.imc.toFixed(1)} · Última actualización:{' '}
          {new Date(perfil.actualizado_en).toLocaleString('es-PE')}
        </p>
      )}

      <button
        type="button"
        disabled={!formularioValido || guardando}
        onClick={() => void guardar()}
        className="min-h-touch rounded-full bg-primary px-8 text-lg font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary"
      >
        {guardando ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  );
}
