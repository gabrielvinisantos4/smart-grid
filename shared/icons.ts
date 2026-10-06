/**
 * Ícones disponíveis para serviços. O backend valida contra esta lista e o
 * frontend mapeia cada nome para o componente correspondente do Lucide.
 */
export const ICON_NAMES = [
  'Clapperboard',
  'Video',
  'Film',
  'Camera',
  'Aperture',
  'Focus',
  'Play',
  'SquarePlay',
  'MonitorPlay',
  'Projector',
  'Layers',
  'GalleryHorizontalEnd',
  'Images',
  'Image',
  'LayoutGrid',
  'Smartphone',
  'Mic',
  'Podcast',
  'Radio',
  'Music',
  'Megaphone',
  'Newspaper',
  'Type',
  'PenTool',
  'Palette',
  'Sparkles',
  'WandSparkles',
  'Lightbulb',
  'Target',
  'ChartLine',
  'Rocket',
  'Drone',
] as const;

export type IconName = (typeof ICON_NAMES)[number];
