import {
  Aperture, Camera, ChartLine, Clapperboard, Drone, Film, Focus, GalleryHorizontalEnd, Image, Images, Layers, LayoutGrid,
  Lightbulb, Megaphone, Mic, MonitorPlay, Music, Newspaper, Palette, PenTool, Play, Podcast, Projector, Radio, Rocket,
  Smartphone, Sparkles, SquarePlay, Target, Type, Video, WandSparkles, type LucideIcon, type LucideProps,
} from 'lucide-react';
import type { IconName } from '@shared/icons';

/** Mapeia os nomes salvos no banco para os componentes do Lucide. */
export const ICONS: Record<IconName, LucideIcon> = {
  Clapperboard, Video, Film, Camera, Aperture, Focus, Play, SquarePlay, MonitorPlay, Projector, Layers, GalleryHorizontalEnd,
  Images, Image, LayoutGrid, Smartphone, Mic, Podcast, Radio, Music, Megaphone, Newspaper, Type, PenTool, Palette, Sparkles,
  WandSparkles, Lightbulb, Target, ChartLine, Rocket, Drone,
};

export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name as IconName] ?? Sparkles;
  return <Icon {...props} />;
}
