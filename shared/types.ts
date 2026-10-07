/**
 * Tipos compartilhados entre o backend (server/) e o frontend (src/).
 * Toda informação de preço/configuração nasce no banco de dados e trafega
 * por estes contratos — nada de valores fixos espalhados pelo código.
 */

export type Role = 'owner' | 'viewer';

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Proprietário',
  viewer: 'Leitura',
};

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/* Mídia                                                                      */
/* -------------------------------------------------------------------------- */

export type MediaSource = 'upload' | 'remote';

export interface MediaAsset {
  id: string;
  url: string;
  alt: string;
  source: MediaSource;
  credit: string | null;
  creditUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Onde uma imagem está sendo usada (para avisos de exclusão no painel). */
export interface MediaUsage {
  kind: 'setting' | 'service' | 'gallery' | 'result';
  label: string;
}

export interface AdminMediaAsset extends MediaAsset {
  usage: MediaUsage[];
}

/* -------------------------------------------------------------------------- */
/* Serviços                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Tipo de serviço:
 * - "plan": plano mensal de preço fixo (o cliente escolhe no máximo um);
 * - "unit": conteúdo avulso cobrado por unidade.
 */
export type ServiceKind = 'plan' | 'unit';

export const SERVICE_KIND_LABELS: Record<ServiceKind, string> = {
  plan: 'Plano mensal',
  unit: 'Avulso',
};

export interface Service {
  id: string;
  kind: ServiceKind;
  name: string;
  description: string;
  icon: string;
  imageId: string | null;
  priceCents: number;
  minQty: number;
  maxQty: number;
  defaultQty: number;
  quickQuantities: number[];
  unitSingular: string;
  unitPlural: string;
  badge: string | null;
  /** Itens inclusos exibidos no card (ex.: "3 ajustes inclusos"). */
  features: string[];
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** O que o público enxerga de um serviço (sem metadados administrativos). */
export type PublicService = Pick<
  Service,
  | 'id'
  | 'kind'
  | 'name'
  | 'description'
  | 'icon'
  | 'imageId'
  | 'priceCents'
  | 'minQty'
  | 'maxQty'
  | 'defaultQty'
  | 'quickQuantities'
  | 'unitSingular'
  | 'unitPlural'
  | 'badge'
  | 'features'
>;

/* -------------------------------------------------------------------------- */
/* Configurações do site                                                      */
/* -------------------------------------------------------------------------- */

export type GalleryLayout = 'tall' | 'wide' | 'large' | 'square' | 'reel';

export interface GalleryItem {
  id: string;
  mediaId: string;
  label: string;
  caption: string;
  layout: GalleryLayout;
  grayscale: boolean;
  /** Vídeo do cliente (.mp4/.webm). Com vídeo, a foto vira a capa. */
  videoUrl?: string;
}

/**
 * Card vertical estilo Reels/TikTok com prova social: o print do vídeo,
 * quem é a pessoa/marca e quantas visualizações teve.
 */
export interface ResultItem {
  id: string;
  mediaId: string;
  views: string;
  /** Texto sobreposto ao card. Deixe vazio ao usar prints, que já trazem a legenda. */
  caption: string;
  /** Nome da pessoa ou marca que aparece no vídeo. */
  client: string;
  /** @ do perfil (Instagram/TikTok). */
  handle: string;
  /** Nicho/segmento, ex.: "Saúde feminina". */
  niche: string;
  url: string;
}

export interface Pillar {
  title: string;
  text: string;
}

export interface SiteSettings {
  brand: {
    name: string;
    tagline: string;
    logoId: string | null;
    accentColor: string;
  };
  seo: {
    pageTitle: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    /** Use *asteriscos* para destacar trechos em itálico serifado. */
    title: string;
    subtitle: string;
    ctaLabel: string;
    secondaryCtaLabel: string;
    imageId: string | null;
    tags: string[];
  };
  about: {
    eyebrow: string;
    title: string;
    text: string;
    imageId: string | null;
    pillars: Pillar[];
  };
  configurator: {
    eyebrow: string;
    title: string;
    text: string;
    /** Frase de destaque exibida no topo do configurador. */
    highlight: string;
    stepPlanLabel: string;
    stepTypeLabel: string;
    quantityQuestion: string;
    summaryTitle: string;
    summaryPlanLabel: string;
    totalLabel: string;
    requestCtaLabel: string;
    whatsappCtaLabel: string;
    emptyText: string;
    disclaimer: string;
  };
  /** Seção com vídeo controlado pela rolagem (scroll scrub). */
  process: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    text: string;
    /** Vídeo exibido em loop (caminho no site ou URL https de um .mp4/.webm). */
    videoUrl: string;
    /** Imagem mostrada enquanto o vídeo carrega. */
    posterUrl: string;
    steps: Pillar[];
  };
  results: {
    eyebrow: string;
    title: string;
    text: string;
    highlightValue: string;
    highlightLabel: string;
    items: ResultItem[];
  };
  gallery: {
    eyebrow: string;
    title: string;
    text: string;
    items: GalleryItem[];
  };
  finalCta: {
    title: string;
    text: string;
    ctaLabel: string;
    imageId: string | null;
  };
  contact: {
    whatsapp: string;
    /** Perfis do Instagram do estúdio (sem @). */
    instagrams: string[];
    email: string;
    city: string;
    whatsappIntro: string;
  };
  footer: {
    text: string;
  };
  login: {
    imageId: string | null;
  };
}

export interface PublicSitePayload {
  settings: SiteSettings;
  services: PublicService[];
  media: Record<string, MediaAsset>;
}

/* -------------------------------------------------------------------------- */
/* Orçamentos                                                                 */
/* -------------------------------------------------------------------------- */

export interface QuoteItemInput {
  serviceId: string;
  quantity: number;
}

export interface QuoteLine {
  serviceId: string;
  /** Ausente em orçamentos antigos (equivale a "unit"). */
  kind?: ServiceKind;
  name: string;
  unitPriceCents: number;
  quantity: number;
  subtotalCents: number;
  unitSingular: string;
  unitPlural: string;
}

export type QuoteStatus = 'new' | 'contacted' | 'won' | 'lost';
export type QuoteChannel = 'whatsapp' | 'request';

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  new: 'Novo',
  contacted: 'Em contato',
  won: 'Fechado',
  lost: 'Perdido',
};

export interface Quote {
  id: number;
  code: string;
  lines: QuoteLine[];
  totalCents: number;
  clientName: string | null;
  clientContact: string | null;
  clientCompany: string | null;
  notes: string | null;
  channel: QuoteChannel;
  status: QuoteStatus;
  createdAt: string;
}

export interface QuoteRequestInput {
  items: QuoteItemInput[];
  channel: QuoteChannel;
  clientName?: string;
  clientContact?: string;
  clientCompany?: string;
  notes?: string;
}

export interface QuoteRequestResult {
  quote: Quote;
  whatsappUrl: string | null;
}

/* -------------------------------------------------------------------------- */
/* Painel                                                                     */
/* -------------------------------------------------------------------------- */

export interface DashboardStats {
  quotesThisMonth: number;
  quotesTotal: number;
  valueThisMonthCents: number;
  averageTicketCents: number;
  activeServices: number;
  totalServices: number;
  mediaCount: number;
  topServices: { serviceId: string; name: string; quantity: number; quotes: number }[];
  daily: { date: string; count: number }[];
  recentQuotes: Quote[];
}
