import { useRef, useState } from 'react';

interface AudioPlayerProps {
  audioUrl?: string;
}

/**
 * Stub: el audio real depende del TTS que entrega Jhairo. Hoy `ComparacionResponse`
 * (Entregable 2) solo trae `explicacion` (texto), no `audio_url` — a confirmar con
 * backend/IA si ese campo se agrega al contrato.
 */
export function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  if (!audioUrl) {
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

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play();
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={togglePlayback}
        className="min-h-touch rounded-full bg-primary px-6 font-bold text-on-primary transition-colors hover:bg-primary/90"
      >
        {playing ? 'Pausar explicación' : 'Escuchar explicación'}
      </button>
    </>
  );
}
