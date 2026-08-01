interface VoiceRecorderProps {
  escuchando: boolean;
  onIniciar: () => void;
}

function IconoMicrofono() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-10 w-10">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function VoiceRecorder({ escuchando, onIniciar }: VoiceRecorderProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onIniciar}
        disabled={escuchando}
        aria-label="Iniciar grabación de voz"
        className={`flex h-24 w-24 items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary/90 ${
          escuchando ? 'animate-pulse' : ''
        }`}
      >
        <IconoMicrofono />
      </button>
      {escuchando && <p className="text-lg font-bold text-primary">Escuchando...</p>}
    </div>
  );
}
