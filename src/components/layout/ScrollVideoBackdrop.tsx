import { useEffect, useRef } from 'react';
import { motionValue } from 'motion/react';
import { useSiteData } from '@/hooks/useSiteData';
import { SECTION_IDS } from '@/config/site';

/** Tempo atual (s) do vídeo de fundo; a seção Processo usa para o timecode. */
export const backdropTime = motionValue(0);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Vídeo de bastidores fixo no fundo da página, desfocado e escurecido.
 * O tempo do vídeo acompanha a rolagem (scrub): conforme a página desce, o vídeo avança.
 * Na seção Processo ele ganha um pouco de foco e brilho.
 */
export function ScrollVideoBackdrop() {
  const { data } = useSiteData();
  const process = data?.settings.process;
  const src = process?.enabled ? process.videoUrl : '';
  const layerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const layer = layerRef.current;
    if (!video || !layer || !src) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Safari no iOS só mostra quadros depois de um play(); vídeo mudo pode tocar sozinho.
    const prime = () => {
      void video
        .play()
        .then(() => video.pause())
        .catch(() => undefined);
    };
    if (video.readyState >= 1) prime();
    else video.addEventListener('loadedmetadata', prime, { once: true });

    let frame = 0;
    let time = 0;
    let lastOpacity = -1;
    let lastBlur = -1;
    let lastTransform = '';

    const tick = () => {
      const vh = window.innerHeight;
      const y = window.scrollY;
      const start = vh * 0.5;
      const end = document.documentElement.scrollHeight - vh;
      const progress = clamp01((y - start) / Math.max(1, end - start));
      const fadeIn = clamp01((y - vh * 0.3) / (vh * 0.5));

      // Foco na seção Processo: entra ao chegar no topo e sai quando ela termina.
      let focus = 0;
      const section = document.getElementById(SECTION_IDS.process);
      if (section) {
        const r = section.getBoundingClientRect();
        focus = Math.min(clamp01((vh * 0.6 - r.top) / (vh * 0.6)), clamp01((r.bottom - vh * 0.4) / (vh * 0.6)));
      }

      const opacity = fadeIn * lerp(0.3, 0.62, focus);
      if (Math.abs(opacity - lastOpacity) > 0.003) {
        layer.style.opacity = opacity.toFixed(3);
        lastOpacity = opacity;
      }
      const blur = lerp(18, 4, focus);
      if (Math.abs(blur - lastBlur) > 0.15) {
        video.style.filter = `blur(${blur.toFixed(1)}px) saturate(0.85)`;
        lastBlur = blur;
      }
      const transform = `translate3d(0, ${((0.5 - progress) * 6).toFixed(2)}%, 0) scale(${lerp(1.32, 1.14, focus).toFixed(3)})`;
      if (transform !== lastTransform) {
        video.style.transform = transform;
        lastTransform = transform;
      }

      if (video.duration && !reduce) {
        const target = progress * (video.duration - 0.05);
        time = Math.abs(target - time) < 0.002 ? target : lerp(time, target, 0.14);
        if (!video.seeking && Math.abs(video.currentTime - time) > 1 / 40) video.currentTime = time;
        backdropTime.set(time);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      video.removeEventListener('loadedmetadata', prime);
    };
  }, [src]);

  if (!src) return null;

  return (
    <div ref={layerRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-0">
      <video
        ref={videoRef}
        src={src}
        poster={process?.posterUrl || undefined}
        muted
        playsInline
        preload="auto"
        tabIndex={-1}
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgb(10_10_10/0.45)_55%,rgb(10_10_10/0.92)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-transparent to-ink/80" />
    </div>
  );
}
