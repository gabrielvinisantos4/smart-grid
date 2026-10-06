/** Âncoras e rotas usadas pela navegação. Textos e valores vêm do banco. */
export const SECTION_IDS = {
  hero: 'inicio',
  about: 'estudio',
  process: 'processo',
  results: 'resultados',
  configurator: 'orcamento',
  gallery: 'portfolio',
  contact: 'contato',
} as const;

export const ADMIN_BASE = '/admin';

export const MOTION = {
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  duration: 0.9,
};

/** Modo demonstração: página pública estática, sem backend (VITE_DEMO=1). */
export const IS_DEMO = import.meta.env.VITE_DEMO === '1';

/** Numeração editorial das seções: a seção de processo é opcional. */
export function sectionIndex(position: number, processEnabled: boolean): string {
  return String(position + (processEnabled && position >= 2 ? 1 : 0)).padStart(2, '0');
}
