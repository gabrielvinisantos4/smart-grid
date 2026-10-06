/**
 * Converte um vídeo em sequência de quadros WebP para a seção de "scroll scrub".
 *
 *   npm run frames -- caminho/do/video.mp4 [nome] [--step 2] [--width 720] [--quality 72]
 *
 * Gera public/scrub/<nome>/frame-001.webp … + manifest.json. Requer ffmpeg instalado.
 * Depois, em /admin → Configurações → Textos → "Processo", aponte para scrub/<nome>/manifest.json.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (name: string, fallback: number) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args.splice(i, 2)[1]) : fallback;
};
const step = flag('step', 2);
const width = flag('width', 720);
const quality = flag('quality', 72);
const [input, name = 'video'] = args;
if (!input || !fs.existsSync(input)) {
  console.error('Uso: npm run frames -- video.mp4 [nome] [--step 2] [--width 720] [--quality 72]');
  process.exit(1);
}

const outDir = path.resolve('public/scrub', name.replace(/[^\w-]/g, '-'));
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const probe = JSON.parse(
  execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate', '-of', 'json', input]).toString(),
);
const { width: srcW, r_frame_rate: rate } = probe.streams[0];
const [num, den] = String(rate).split('/').map(Number);
const targetW = Math.min(width, srcW) - (Math.min(width, srcW) % 2);

execFileSync('ffmpeg', [
  '-v', 'error', '-y', '-i', input,
  '-vf', `select=not(mod(n\\,${step})),scale=${targetW}:-2`,
  '-vsync', 'vfr', '-an', '-c:v', 'libwebp', '-quality', String(quality),
  path.join(outDir, 'frame-%03d.webp'),
]);

const frames = fs.readdirSync(outDir).filter((f) => f.endsWith('.webp')).length;
const first = path.join(outDir, 'frame-001.webp');
const dims = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', first]).toString().trim().split(',').map(Number);
const manifest = { frames, width: dims[0], height: dims[1], fps: num / den / step, pattern: 'frame-{n}.webp', pad: 3 };
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

const size = fs.readdirSync(outDir).reduce((n, f) => n + fs.statSync(path.join(outDir, f)).size, 0);
console.log(`› ${frames} quadros ${dims[0]}×${dims[1]} em ${path.relative(process.cwd(), outDir)} (${(size / 1024 / 1024).toFixed(1)} MB)`);
