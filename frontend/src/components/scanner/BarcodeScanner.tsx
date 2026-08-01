import { useEffect, useRef } from 'react';

import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';

interface BarcodeScannerProps {
  onDetectado: (codigoBarras: string) => void;
}

export function BarcodeScanner({ onDetectado }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { estado, codigoDetectado, iniciar } = useBarcodeScanner(videoRef);

  useEffect(() => {
    void iniciar();
  }, [iniciar]);

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
    <div className="relative overflow-hidden rounded-card bg-on-surface">
      <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
      <div className="pointer-events-none absolute inset-8 rounded-card border-4 border-primary-container" />
      <p className="absolute bottom-4 left-0 right-0 text-center text-lg font-medium text-on-primary">
        {estado === 'solicitando_permiso' ? 'Solicitando acceso a la cámara...' : 'Buscando código...'}
      </p>
    </div>
  );
}
