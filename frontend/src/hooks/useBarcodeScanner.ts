import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { createWorker, PSM } from 'tesseract.js';

import { extraerCodigoValido } from '../utils/codigoBarras';

export type EstadoEscaner = 'solicitando_permiso' | 'permiso_denegado' | 'escaneando' | 'error';

interface UseBarcodeScannerOptions {
  onDetectado?: (codigo: string) => void;
}

interface UseBarcodeScannerResult {
  estado: EstadoEscaner;
  codigoDetectado: string | null;
}

const INTERVALO_ZXING_MS = 250;
const INTERVALO_OCR_MS = 1200;
const FACTOR_ZOOM_OCR = 2.5;

export function useBarcodeScanner(
  videoRef: RefObject<HTMLVideoElement>,
  options?: UseBarcodeScannerOptions,
): UseBarcodeScannerResult {
  const [estado, setEstado] = useState<EstadoEscaner>('solicitando_permiso');
  const [codigoDetectado, setCodigoDetectado] = useState<string | null>(null);

  const onDetectadoRef = useRef(options?.onDetectado);
  onDetectadoRef.current = options?.onDetectado;

  useEffect(() => {
    const videoElem = videoRef.current;
    if (!videoElem) return;
    // Se vincula a un nuevo const con tipo explícito no-nulo: las funciones
    // anidadas más abajo (declaradas, no arrow assignments) no heredan el
    // estrechamiento de `videoElem` de TypeScript por sí solas.
    const video: HTMLVideoElement = videoElem;

    let cancelado = false;
    let yaDetectado = false;
    let streamActual: MediaStream | null = null;
    let workerActual: Awaited<ReturnType<typeof createWorker>> | null = null;

    setEstado('solicitando_permiso');
    setCodigoDetectado(null);

    // Dos vías de reconocimiento corriendo en paralelo, gana la primera que
    // encuentre algo válido:
    // 1) zxing decodifica el patrón de barras — instantáneo en cámaras que sí
    //    pueden enfocar de cerca (celulares).
    // 2) Tesseract (OCR) lee los dígitos impresos debajo de las barras — más
    //    lento, pero mucho más tolerante a cámaras sin macro (webcams de
    //    laptop), ya que los dígitos son trazos gruesos.
    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
    ]);
    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: INTERVALO_ZXING_MS,
    });

    const canvasZxing = document.createElement('canvas');
    const ctxZxing = canvasZxing.getContext('2d');
    const canvasOcr = document.createElement('canvas');
    const ctxOcr = canvasOcr.getContext('2d');

    // El checksum de EAN-13/UPC-A solo rechaza ~90% del ruido aleatorio: una
    // lectura de OCR mal hecha puede "por suerte" pasar el checksum y ser
    // completamente distinta al código real impreso. Para no aceptar un
    // código equivocado en silencio, se exige ver el MISMO candidato en dos
    // lecturas de OCR consecutivas antes de darlo por válido.
    let candidatoOcrPrevio: string | null = null;

    function manejarDeteccion(codigo: string) {
      if (cancelado || yaDetectado) return;
      yaDetectado = true;
      if (navigator.vibrate) navigator.vibrate(200);
      setCodigoDetectado(codigo);
      onDetectadoRef.current?.(codigo);
    }

    function intentarZxing() {
      if (cancelado || yaDetectado || !ctxZxing) return;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w && h) {
        canvasZxing.width = w;
        canvasZxing.height = h;
        ctxZxing.drawImage(video, 0, 0, w, h);
        try {
          const resultado = reader.decodeFromCanvas(canvasZxing);
          manejarDeteccion(resultado.getText());
          return;
        } catch {
          // Ningún código en este frame — normal, se reintenta.
        }
      }
      if (!cancelado && !yaDetectado) {
        setTimeout(intentarZxing, INTERVALO_ZXING_MS);
      }
    }

    async function intentarOcr() {
      if (cancelado || yaDetectado || !workerActual || !ctxOcr) return;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w && h) {
        const cropW = w * 0.75;
        const cropH = h * 0.3;
        const cropX = (w - cropW) / 2;
        const cropY = (h - cropH) / 2;
        canvasOcr.width = cropW * FACTOR_ZOOM_OCR;
        canvasOcr.height = cropH * FACTOR_ZOOM_OCR;
        ctxOcr.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvasOcr.width, canvasOcr.height);

        try {
          const { data } = await workerActual.recognize(canvasOcr);
          if (cancelado || yaDetectado) return;
          const codigo = extraerCodigoValido(data.text);
          if (codigo && codigo === candidatoOcrPrevio) {
            manejarDeteccion(codigo);
            return;
          }
          candidatoOcrPrevio = codigo;
        } catch {
          // Error puntual de OCR — se reintenta en el próximo ciclo.
          candidatoOcrPrevio = null;
        }
      }
      if (!cancelado && !yaDetectado) {
        setTimeout(() => void intentarOcr(), INTERVALO_OCR_MS);
      }
    }

    async function iniciar() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (cancelado) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamActual = stream;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');

        await new Promise<void>((resolve) => {
          if (video.readyState >= 2) {
            resolve();
            return;
          }
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            resolve();
          };
          video.addEventListener('loadedmetadata', onLoadedMetadata);
        });

        await video.play().catch(() => {});
        if (cancelado) return;

        setEstado('escaneando');
        intentarZxing();

        // Tesseract tarda unos segundos en inicializar (carga sus assets) —
        // mientras tanto zxing ya está intentando decodificar barras, así que
        // la cámara no se queda "sin hacer nada" en ese lapso.
        const worker = await createWorker('eng');
        if (cancelado) {
          await worker.terminate();
          return;
        }
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789',
          tessedit_pageseg_mode: PSM.SINGLE_LINE,
        });
        if (cancelado) {
          await worker.terminate();
          return;
        }
        workerActual = worker;
        void intentarOcr();
      } catch (err) {
        if (cancelado) return;
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setEstado('permiso_denegado');
        } else {
          setEstado('error');
        }
      }
    }

    void iniciar();

    return () => {
      cancelado = true;
      streamActual?.getTracks().forEach((track) => track.stop());
      videoElem.srcObject = null;
      void workerActual?.terminate();
    };
  }, [videoRef]);

  return { estado, codigoDetectado };
}
