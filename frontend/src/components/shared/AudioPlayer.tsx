import { useEffect, useRef, useState } from 'react';

import { sintetizarVoz } from '../../api/tts';

interface AudioPlayerProps {
  texto?: string;
}

type Estado = 'idle' | 'cargando' | 'reproduciendo' | 'pausado' | 'error';

export function AudioPlayer({ texto }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [estado, setEstado] = useState<Estado>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  if (!texto) {
    return (
      <button
        type="button"
        disabled
        className="min-h-touch rounded-full bg-surface-container-high px-6 text-on-surface-variant opacity-60"
      >
        Escuchar explicación (próximamente)
      </button>
    );
  }

  const alternar = async () => {
    if (estado === 'reproduciendo') {
      audioRef.current?.pause();
      return;
    }
    if (audioUrl) {
      void audioRef.current?.play();
      return;
    }
    setEstado('cargando');
    try {
      const blob = await sintetizarVoz(texto);
      setAudioUrl(URL.createObjectURL(blob));
    } catch {
      setEstado('error');
    }
  };

  const etiqueta =
    estado === 'cargando'
      ? 'Generando audio...'
      : estado === 'reproduciendo'
        ? 'Pausar explicación'
        : estado === 'error'
          ? 'Error al generar audio — reintentar'
          : 'Escuchar explicación';

  return (
    <>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          autoPlay
          onPlay={() => setEstado('reproduciendo')}
          onPause={() => setEstado('pausado')}
          onEnded={() => setEstado('pausado')}
        />
      )}
      <button
        type="button"
        onClick={() => void alternar()}
        disabled={estado === 'cargando'}
        className="min-h-touch rounded-full bg-primary px-6 font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {etiqueta}
      </button>
    </>
  );
}
