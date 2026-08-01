import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export type EstadoEscaner =
  | 'solicitando_permiso'
  | 'permiso_denegado'
  | 'escaneando'
  | 'detectado'
  | 'error';

interface UseBarcodeScannerResult {
  estado: EstadoEscaner;
  codigoDetectado: string | null;
}

export function useBarcodeScanner(
  videoRef: RefObject<HTMLVideoElement>,
): UseBarcodeScannerResult {
  const [estado, setEstado] = useState<EstadoEscaner>('solicitando_permiso');
  const [codigoDetectado, setCodigoDetectado] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // `cancelado` vive en el closure de ESTA ejecución del efecto. Es la forma
    // correcta de manejar cleanup con trabajo async bajo React.StrictMode: en
    // desarrollo, React monta→limpia→vuelve a montar los efectos para detectar
    // código inseguro. Un ref compartido entre invocaciones no sirve aquí (la
    // segunda invocación lo resetearía antes de que la primera promesa
    // resuelva) — por eso cada ejecución guarda su propia bandera y sus
    // propios `controls`, así cualquier stream de cámara que se abra queda
    // garantizado a cerrarse exactamente una vez, sin importar el orden.
    let cancelado = false;
    let controlsActuales: Awaited<ReturnType<BrowserMultiFormatReader['decodeFromConstraints']>> | null =
      null;

    setEstado('solicitando_permiso');
    setCodigoDetectado(null);

    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromConstraints(
        { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
        videoRef.current,
        (result) => {
          if (result && !cancelado) {
            if (navigator.vibrate) navigator.vibrate(200);
            setCodigoDetectado(result.getText());
            setEstado('detectado');
            controlsActuales?.stop();
          }
        },
      )
      .then((controls) => {
        if (cancelado) {
          controls.stop();
          return;
        }
        controlsActuales = controls;
        setEstado((actual) => (actual === 'detectado' ? actual : 'escaneando'));
      })
      .catch((err) => {
        if (cancelado) return;
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setEstado('permiso_denegado');
        } else {
          setEstado('error');
        }
      });

    return () => {
      cancelado = true;
      controlsActuales?.stop();
    };
  }, [videoRef]);

  return { estado, codigoDetectado };
}
