import { useCallback, useEffect, useRef, useState } from 'react';

export interface FrameManifest {
  frames: number;
  width: number;
  height: number;
  fps: number;
  pattern: string;
  pad: number;
}

/** Ordem de carregamento "grossa → fina": a rolagem já funciona antes de todos os quadros chegarem. */
function loadOrder(count: number): number[] {
  const order: number[] = [];
  const seen = new Set<number>();
  for (let stride = 2 ** Math.ceil(Math.log2(count)); stride >= 1; stride /= 2) {
    for (let i = 0; i < count; i += stride) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  return order;
}

/**
 * Carrega a sequência de quadros de um vídeo (gerada por `npm run frames`)
 * quando a seção se aproxima da tela. Imagens decodificadas ficam em memória
 * para que desenhar no canvas durante a rolagem seja instantâneo.
 */
export function useFrameSequence(manifestPath: string, active: boolean) {
  const [manifest, setManifest] = useState<FrameManifest | null>(null);
  const [loaded, setLoaded] = useState(0);
  const images = useRef<(HTMLImageElement | null)[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!active || !manifestPath) return;
    let cancelled = false;
    const base = manifestPath.replace(/manifest\.json$/, '');

    (async () => {
      try {
        const res = await fetch(manifestPath);
        if (!res.ok) throw new Error('manifest');
        const data = (await res.json()) as FrameManifest;
        if (cancelled) return;
        images.current = new Array(data.frames).fill(null);
        setManifest(data);

        const queue = loadOrder(data.frames);
        const worker = async () => {
          while (queue.length && !cancelled) {
            const i = queue.shift()!;
            const img = new Image();
            img.decoding = 'async';
            img.src = base + data.pattern.replace('{n}', String(i + 1).padStart(data.pad, '0'));
            try {
              await img.decode();
              if (cancelled) return;
              images.current[i] = img;
              setLoaded((n) => n + 1);
            } catch {
              /* quadro ausente: usa o vizinho carregado */
            }
          }
        };
        await Promise.all(Array.from({ length: 6 }, worker));
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [manifestPath, active]);

  /** Quadro carregado mais próximo do índice pedido. */
  const nearest = useCallback((index: number): HTMLImageElement | null => {
    const list = images.current;
    if (!list.length) return null;
    for (let d = 0; d < list.length; d++) {
      const a = list[index - d];
      if (a) return a;
      const b = list[index + d];
      if (b) return b;
    }
    return null;
  }, []);

  return { manifest, loaded, images, nearest, error };
}
