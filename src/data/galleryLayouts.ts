import type { GalleryLayout } from '@shared/types';

/**
 * Proporção (largura/altura) de cada formato da galeria editorial.
 * As linhas são justificadas: cada foto cresce proporcionalmente à sua
 * proporção, então todas da mesma linha ficam com a mesma altura e sem vazios.
 */
export const GALLERY_LAYOUTS: Record<GalleryLayout, { label: string; aspect: number }> = {
  large: { label: 'Destaque', aspect: 1.62 },
  wide: { label: 'Horizontal', aspect: 1.45 },
  square: { label: 'Quadrada', aspect: 1 },
  tall: { label: 'Vertical', aspect: 0.68 },
};

/**
 * Agrupa itens em linhas cuja soma de proporções se aproxima do alvo.
 * Alvos alternados geram alturas de linha diferentes — ritmo editorial.
 */
export function composeRows<T extends { layout: GalleryLayout }>(items: T[], targets: number[]): T[][] {
  const rows: T[][] = [];
  let row: T[] = [];
  let sum = 0;
  const target = () => targets[rows.length % targets.length];
  for (const item of items) {
    const aspect = GALLERY_LAYOUTS[item.layout].aspect;
    if (row.length && Math.abs(sum + aspect - target()) > Math.abs(sum - target())) {
      rows.push(row);
      row = [];
      sum = 0;
    }
    row.push(item);
    sum += aspect;
  }
  if (row.length) {
    // Uma última linha muito curta ficaria gigante: junta com a anterior.
    if (rows.length && sum < target() * 0.5) rows[rows.length - 1].push(...row);
    else rows.push(row);
  }
  return rows;
}
