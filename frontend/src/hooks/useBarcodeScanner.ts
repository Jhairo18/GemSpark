import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';

export type EstadoEscaner =
  | 'idle'
  | 'solicitando_permiso'
  | 'permiso_denegado'
  | 'escaneando'
  | 'detectado'
  | 'error';

interface UseBarcodeScannerResult {
  estado: EstadoEscaner;
  codigoDetectado: string | null;
  iniciar: () => Promise<void>;
  reiniciar: () => void;
}

export function useBarcodeScanner(
  videoRef: RefObject<HTMLVideoElement>,
): UseBarcodeScannerResult {
  const [estado, setEstado] = useState<EstadoEscaner>('idle');
  const [codigoDetectado, setCodigoDetectado] = useState<string | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const detener = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  const iniciar = useCallback(async () => {
    if (!videoRef.current) return;

    setEstado('solicitando_permiso');
    setCodigoDetectado(null);

    const reader = new BrowserMultiFormatReader();

    try {
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (result) {
            setCodigoDetectado(result.getText());
            setEstado('detectado');
            controlsRef.current?.stop();
          }
        },
      );
      controlsRef.current = controls;
      setEstado((actual) => (actual === 'detectado' ? actual : 'escaneando'));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setEstado('permiso_denegado');
      } else {
        setEstado('error');
      }
    }
  }, [videoRef]);

  const reiniciar = useCallback(() => {
    detener();
    setEstado('idle');
    setCodigoDetectado(null);
  }, [detener]);

  useEffect(() => detener, [detener]);

  return { estado, codigoDetectado, iniciar, reiniciar };
}
