import type { SiteSettings } from '../../shared/types.ts';

/**
 * Conteúdo inicial (seed). Após o primeiro boot tudo isso vive no banco e é
 * editado pelo painel /admin — este arquivo só define o ponto de partida.
 */

const unsplash = (photo: string, w = 2000) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${w}&q=80`;

export interface SeedMedia {
  id: string;
  url: string;
  alt: string;
  credit: string;
  creditUrl: string;
}

/** Imagens que acompanham o projeto (prints reais), copiadas para os uploads no primeiro boot. */
export const seedLocalMedia: { id: string; file: string; alt: string }[] = [
  { id: 'm-ref-clapper', file: 'referencia-claquete.jpg', alt: 'Claquete em preto e branco' },
  { id: 'm-ref-editing', file: 'referencia-edicao.jpg', alt: 'Edição de vídeo no computador e no notebook' },
  { id: 'm-ref-phone', file: 'referencia-celular.jpg', alt: 'Gravação de conteúdo com o celular' },
  { id: 'm-ref-carousel', file: 'referencia-carrossel.jpg', alt: 'Mockup de carrossel do Instagram' },
  { id: 'm-result-daniellemello', file: 'resultado-daniellemelloa.jpg', alt: 'Reel de @daniellemelloa: é bem assim' },
  { id: 'm-result-rafalavalle-85', file: 'resultado-dra-rafalavalle-85mil.jpg', alt: 'Reel da @dra.rafalavalle: a libido da mulher na menopausa' },
  { id: 'm-result-rafalavalle-78', file: 'resultado-dra-rafalavalle-78mil.jpg', alt: 'Reel da @dra.rafalavalle: libido baixa nem sempre é emocional' },
  { id: 'm-result-brancogarage', file: 'resultado-branco-garage.jpg', alt: 'Vídeo da @branco.garage: gasolina ou álcool' },
  { id: 'm-result-tresrios', file: 'resultado-tresriosacabamentos.jpg', alt: 'Reel da Três Rios Acabamentos: Mega Feirão' },
  { id: 'm-result-panificadora', file: 'resultado-panificadoravalerio.jpg', alt: 'Reel da @panificadoravalerio: você é muito simpática' },
];

const credit = (name: string, user: string) => ({
  credit: `${name} / Unsplash`,
  creditUrl: `https://unsplash.com/@${user}?utm_source=studio&utm_medium=referral`,
});

export const seedMedia: SeedMedia[] = [
  { id: 'm-editing-imac', url: unsplash('photo-1579109652910-99b9be06aaec', 1400), alt: 'Estação de edição com timeline aberta', ...credit('Jakob Owens', 'jakobowens1') },
  { id: 'm-editing-desk', url: unsplash('photo-1543336472-fcf478c443db', 1600), alt: 'Monitor de edição em mesa minimalista', ...credit('James McKinven', 'jmckinven') },
  { id: 'm-phone-capture', url: unsplash('photo-1543525469-65b61cc2bc06', 1400), alt: 'Pessoa capturando conteúdo com o celular', ...credit('charlesdeluvio', 'charlesdeluvio') },
  { id: 'm-phone-hand', url: unsplash('photo-1545081576-5b7e640c083a', 1400), alt: 'Mão segurando smartphone', ...credit('Marek Pospíšil', 'marcusp') },
  { id: 'm-coffee-laptop', url: unsplash('photo-1587719425076-f770d7039908'), alt: 'Café, caderno e notebook sobre mesa escura', ...credit('Valeriia Miller', 'valeriiamiller') },
  { id: 'm-mug', url: unsplash('photo-1586284397987-0cabd666909c', 1400), alt: 'Caneca em preto e branco', ...credit('charlesdeluvio', 'charlesdeluvio') },
  { id: 'm-clapper-hands', url: unsplash('photo-1780516000985-08f96af45c9c', 1600), alt: 'Mãos segurando claquete em fundo escuro', ...credit('Darko Sokoleski', 'sokoltge') },
  { id: 'm-clapper-bw', url: unsplash('photo-1619518594466-5bfc2dcbb83d', 1400), alt: 'Claquete em preto e branco', ...credit('Irham Setyaki', 'setyaki') },
  { id: 'm-lifestyle-bw', url: unsplash('photo-1607932066513-77aa8f68705d', 1400), alt: 'Retrato editorial em preto e branco', ...credit('kevin turcios', 'kevin_turcios') },
];

const planFeatures = (videos: number) => [
  `${videos} vídeos por mês`,
  'Gravação com celular, de forma profissional',
];

export const seedServices = [
  {
    id: 'plano-4',
    kind: 'plan',
    name: '4 vídeos por mês',
    description: 'Para manter uma presença constante nas redes.',
    icon: 'Smartphone',
    imageId: null,
    priceCents: 80000,
    unitSingular: 'mês',
    unitPlural: 'meses',
    badge: null,
    features: planFeatures(4),
  },
  {
    id: 'plano-8',
    kind: 'plan',
    name: '8 vídeos por mês',
    description: 'Dois vídeos por semana para crescer com consistência.',
    icon: 'Clapperboard',
    imageId: null,
    priceCents: 120000,
    unitSingular: 'mês',
    unitPlural: 'meses',
    badge: null,
    features: planFeatures(8),
  },
  {
    id: 'plano-12',
    kind: 'plan',
    name: '12 vídeos por mês',
    description: 'Três vídeos por semana para quem quer acelerar.',
    icon: 'Rocket',
    imageId: null,
    priceCents: 150000,
    unitSingular: 'mês',
    unitPlural: 'meses',
    badge: null,
    features: planFeatures(12),
  },
  {
    id: 'carrossel',
    kind: 'unit',
    name: 'Carrossel',
    description: 'Conteúdo visual para informar, educar e gerar autoridade.',
    icon: 'Layers',
    imageId: 'm-ref-carousel',
    priceCents: 14000,
    minQty: 1,
    maxQty: 30,
    defaultQty: 1,
    quickQuantities: [1, 2, 3, 4, 6, 8],
    unitSingular: 'carrossel',
    unitPlural: 'carrosséis',
    badge: null,
    features: ['3 ajustes inclusos'],
  },
  {
    id: 'video-avulso',
    kind: 'unit',
    name: 'Vídeo avulso',
    description: 'Um vídeo gravado com celular de forma profissional e editado para Reels e TikTok.',
    icon: 'Smartphone',
    imageId: 'm-phone-capture',
    priceCents: 25000,
    minQty: 1,
    maxQty: 30,
    defaultQty: 1,
    quickQuantities: [1, 2, 3, 4, 6],
    unitSingular: 'vídeo',
    unitPlural: 'vídeos',
    badge: null,
    features: ['Gravação com celular, de forma profissional'],
  },
  {
    id: 'video-institucional',
    kind: 'unit',
    name: 'Vídeo institucional',
    description: 'Apresente sua empresa, seu espaço ou seu produto com um vídeo completo.',
    icon: 'Film',
    imageId: 'm-clapper-hands',
    priceCents: 40000,
    minQty: 1,
    maxQty: 20,
    defaultQty: 1,
    quickQuantities: [1, 2, 3, 4],
    unitSingular: 'vídeo',
    unitPlural: 'vídeos',
    badge: null,
    features: ['Gravação com celular, de forma profissional'],
  },
];

export const defaultSettings: SiteSettings = {
  brand: {
    name: 'Feed Studio',
    tagline: 'Social Media & Produção Audiovisual',
    logoId: null,
    accentColor: '#e8e2d6',
  },
  seo: {
    pageTitle: 'Feed Studio — Orçamento personalizado de conteúdo',
    description: 'Monte seu plano de conteúdo personalizado e descubra o investimento ideal para sua marca.',
  },
  hero: {
    eyebrow: 'Social Media · Audiovisual · Estratégia',
    title: 'Seu conteúdo. *Nossa criação.*',
    subtitle: 'Monte seu plano de conteúdo personalizado e descubra o investimento ideal para sua marca. Gravamos com celular, de forma profissional.',
    ctaLabel: 'Montar meu orçamento',
    secondaryCtaLabel: 'Ver portfólio',
    imageId: 'm-ref-clapper',
    tags: ['VIDEO', 'SOCIAL MEDIA', 'CONTENT', 'CREATIVE'],
  },
  about: {
    eyebrow: 'O estúdio',
    title: 'Conteúdo com *direção*, não apenas volume.',
    text: 'Somos um estúdio criativo que une estratégia de social media, linguagem de cinema e edição precisa. Cada peça nasce de um roteiro, é gravada com celular de forma profissional e chega ao feed com intenção.',
    imageId: 'm-ref-phone',
    pillars: [
      { title: 'Estratégia', text: 'Pauta, roteiro e calendário pensados para o seu posicionamento.' },
      { title: 'Produção', text: 'Gravação com celular de forma profissional, com luz e direção de cena.' },
      { title: 'Edição', text: 'Ritmo, cor e acabamento de cinema em cada entrega.' },
    ],
  },
  configurator: {
    eyebrow: 'Orçamento',
    title: 'Monte seu *plano*',
    text: 'Escolha um plano mensal, adicione conteúdos avulsos e veja o investimento na hora.',
    highlight: 'Gravamos com celular, de forma profissional.',
    stepPlanLabel: 'Escolha um plano mensal',
    stepTypeLabel: 'Adicione conteúdos avulsos',
    quantityQuestion: 'Quantos avulsos você precisa?',
    summaryTitle: 'Seu orçamento',
    summaryPlanLabel: 'Plano personalizado',
    totalLabel: 'Investimento estimado',
    requestCtaLabel: 'Solicitar orçamento',
    whatsappCtaLabel: 'Enviar pelo WhatsApp',
    emptyText: 'Escolha um plano mensal ou adicione conteúdos avulsos para montar seu orçamento.',
    disclaimer: 'Valores estimados. A proposta final é confirmada após o briefing.',
  },

  process: {
    enabled: true,
    eyebrow: 'Processo',
    title: 'Cada corte é *uma decisão.*',
    text: 'Do roteiro à entrega: gravamos com celular, de forma profissional, e editamos cada detalhe.',
    videoUrl: 'video/bastidores.mp4',
    posterUrl: 'video/bastidores-poster.jpg',
    steps: [
      { title: 'Roteiro', text: 'Pauta e gancho pensados para prender nos primeiros três segundos.' },
      { title: 'Captação', text: 'Gravação com celular de forma profissional, no estúdio ou no seu espaço.' },
      { title: 'Edição', text: 'Cortes, legendas, cor e som com ritmo de cinema.' },
      { title: 'Entrega', text: 'Arquivos prontos para Reels, TikTok e anúncios.' },
    ],
  },
  results: {
    eyebrow: 'Resultados',
    title: 'Conteúdo que *para o scroll.*',
    text: 'Pessoas e marcas reais que confiaram no nosso roteiro, captação e edição, e os números que cada vídeo alcançou.',
    highlightValue: '+397 mil',
    highlightLabel: 'visualizações orgânicas em apenas seis conteúdos',
    items: [
      { id: 'r1', mediaId: 'm-result-daniellemello', views: '120 mil', caption: '', client: '', handle: 'daniellemelloa', niche: 'Lifestyle', url: '' },
      { id: 'r2', mediaId: 'm-result-rafalavalle-85', views: '85 mil', caption: '', client: '', handle: 'dra.rafalavalle', niche: 'Saúde feminina', url: '' },
      { id: 'r3', mediaId: 'm-result-rafalavalle-78', views: '78,4 mil', caption: '', client: '', handle: 'dra.rafalavalle', niche: 'Saúde feminina', url: '' },
      { id: 'r4', mediaId: 'm-result-brancogarage', views: '54,8 mil', caption: '', client: '', handle: 'branco.garage', niche: 'Automotivo', url: '' },
      { id: 'r6', mediaId: 'm-result-tresrios', views: '48,6 mil', caption: '', client: 'Três Rios Acabamentos', handle: 'tresriosacabamentos', niche: 'Revestimentos', url: '' },
      { id: 'r5', mediaId: 'm-result-panificadora', views: '11,1 mil', caption: '', client: '', handle: 'panificadoravalerio', niche: 'Panificadora', url: '' },
    ],
  },
  gallery: {
    eyebrow: 'Portfólio',
    title: 'Por trás de cada conteúdo, existe uma *história.*',
    text: 'Set, luz, roteiro, celular, timeline e café. O processo é tão cuidadoso quanto o resultado.',
    items: [
      { id: 'g1', mediaId: 'm-coffee-laptop', label: '001', caption: 'Pauta e roteiro', layout: 'large', grayscale: true },
      { id: 'g2', mediaId: 'm-phone-hand', label: '002', caption: 'Mobile first', layout: 'tall', grayscale: false },
      { id: 'g3', mediaId: 'm-clapper-bw', label: '003', caption: 'Take 01', layout: 'square', grayscale: true },
      { id: 'g4', mediaId: 'm-editing-desk', label: '004', caption: 'Edição & color', layout: 'wide', grayscale: false },
      { id: 'g5', mediaId: 'm-phone-capture', label: '005', caption: 'Gravação no celular', layout: 'tall', grayscale: true },
      { id: 'g6', mediaId: 'm-editing-imac', label: '006', caption: 'Pós-produção', layout: 'tall', grayscale: true },
      { id: 'g8', mediaId: 'm-lifestyle-bw', label: '007', caption: 'Lifestyle', layout: 'tall', grayscale: true },
      { id: 'g9', mediaId: 'm-mug', label: '008', caption: 'Briefing', layout: 'square', grayscale: true },
    ],
  },
  finalCta: {
    title: 'Pronto para criar algo *memorável?*',
    text: 'Monte seu plano em menos de um minuto e receba o orçamento direto no WhatsApp.',
    ctaLabel: 'Começar agora',
    imageId: 'm-ref-editing',
  },
  contact: {
    whatsapp: '5511999999999',
    instagrams: ['gabrielvinisantos', 'danielemochii'],
    email: '',
    city: 'São Paulo — Brasil',
    whatsappIntro: 'Olá! Gostaria de solicitar um orçamento personalizado.',
  },
  footer: {
    text: 'Estratégia, produção e edição para marcas que levam o próprio conteúdo a sério.',
  },
  login: {
    imageId: 'm-phone-hand',
  },
};
