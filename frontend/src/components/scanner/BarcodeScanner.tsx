import { useEffect, useRef } from 'react';

import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';

interface BarcodeScannerProps {
  onDetectado: (codigoBarras: string) => void;
}

export function BarcodeScanner({ onDetectado }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { estado, codigoDetectado } = useBarcodeScanner(videoRef);

  useEffect(() => {
    if (estado === 'detectado' && codigoDetectado) {
      onDetectado(codigoDetectado);
    }
  }, [estado, codigoDetectado, onDetectado]);

  if (estado === 'permiso_denegado') {
    return (
      <div className="flex flex-col gap-gap-component rounded-card bg-error-container p-page text-on-error-container">
        <p className="text-lg font-bold">No pudimos acceder a tu cámara.</p>
        <p>
          Habilita el permiso de cámara para este sitio en la configuración de tu navegador y
          vuelve a intentarlo.
        </p>
      </div>
    );
  }

  if (estado === 'error') {
    return (
      <p className="text-lg text-error">
        Ocurrió un problema al iniciar la cámara. Intenta nuevamente.
      </p>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-on-surface">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-48 w-64">
          <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-4 border-t-4 border-primary-container" />
          <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-4 border-t-4 border-primary-container" />
          <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-primary-container" />
          <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-4 border-r-4 border-primary-container" />
        </div>
      </div>

      {estado === 'solicitando_permiso' && (
        <p className="absolute bottom-6 left-0 right-0 text-center text-lg font-medium text-on-primary">
          Solicitando acceso a la cámara...
        </p>
      )}
    </div>
  );
}
