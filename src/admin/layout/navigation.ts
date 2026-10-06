import { BadgeDollarSign, Clapperboard, Images, Inbox, LayoutDashboard, Settings2, type LucideIcon } from 'lucide-react';

export const adminNav: { label: string; to: string; icon: LucideIcon; end?: boolean }[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Serviços', to: '/admin/servicos', icon: Clapperboard },
  { label: 'Preços', to: '/admin/precos', icon: BadgeDollarSign },
  { label: 'Imagens', to: '/admin/imagens', icon: Images },
  { label: 'Configurações', to: '/admin/configuracoes', icon: Settings2 },
  { label: 'Orçamentos', to: '/admin/orcamentos', icon: Inbox },
];
