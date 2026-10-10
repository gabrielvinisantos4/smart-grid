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
  { id: 'm-pf-rafalavalle', file: 'portfolio-dra-rafalavalle.jpg', alt: 'Vídeo da Dra. Rafa Lavalle sobre saúde hormonal' },
  { id: 'm-pf-colorado', file: 'portfolio-colorado-50.jpg', alt: 'Vídeo do evento Colorado 50 anos' },
  { id: 'm-pf-picape', file: 'portfolio-branco-garage-picape.jpg', alt: 'Vídeo da Branco Garage com picape Chevrolet' },
  { id: 'm-pf-panificadora', file: 'portfolio-panificadora-valerio.jpg', alt: 'Vídeo da Panificadora Valério' },
  { id: 'm-pf-advocacia', file: 'portfolio-advocacia.jpg', alt: 'Vídeo para escritório de advocacia' },
  { id: 'm-pf-farmacia', file: 'portfolio-farmacia.jpg', alt: 'Vídeo de humor para farmácia' },
  { id: 'm-pf-combustivel', file: 'portfolio-branco-garage-combustivel.jpg', alt: 'Vídeo da Branco Garage: gasolina ou álcool' },
  { id: 'm-pf-saude', file: 'portfolio-saude-consultorio.jpg', alt: 'Vídeo gravado em consultório médico' },
  { id: 'm-pf-laboratorio', file: 'portfolio-laboratorio-coleta.jpg', alt: 'Vídeo de coleta de exames em domicílio' },
  { id: 'm-pf-pontocountry', file: 'portfolio-ponto-country.jpg', alt: 'Vídeo da Ponto Country para Barretos' },
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

const planFeatures = (videos: number) => [`${videos} conteúdos em vídeo`, 'Captação e edição incluídas'];

export const seedServices = [
  {
    id: 'plano-4',
    kind: 'plan',
    name: '4 vídeos por mês',
    description: 'Uma estrutura pensada para manter sua marca ativa e consistente.',
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
    description: 'Uma estrutura pensada para manter constância e ampliar a presença da marca ao longo do mês.',
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
    description: 'Para marcas que precisam de maior frequência e presença contínua nas redes.',
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
    name: 'Carrossel avulso',
    description: 'Conteúdo visual desenvolvido para complementar a comunicação da sua marca.',
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
    description: 'Conteúdo em vídeo produzido e editado de acordo com a necessidade da sua marca.',
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
    features: [],
  },
  {
    id: 'video-institucional',
    kind: 'unit',
    name: 'Vídeo institucional',
    description: 'Apresente sua empresa, seu espaço ou seu produto de forma clara, profissional e alinhada à identidade da sua marca.',
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
    features: [],
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
    pageTitle: 'Feed Studio — Estratégia, criação e conteúdo com propósito',
    description: 'Projetos personalizados de social media e audiovisual, da estratégia à produção.',
  },
  hero: {
    eyebrow: 'Social Media · Audiovisual · Estratégia',
    title: 'Seu conteúdo. *Nossa criação.*',
    subtitle: 'Estratégia, criação e conteúdo com propósito.\nCada marca pede uma direção diferente. Por isso, desenvolvemos projetos personalizados, da estratégia à produção.',
    ctaLabel: 'Conhecer as possibilidades',
    secondaryCtaLabel: 'Ver portfólio',
    imageId: 'm-ref-clapper',
    tags: ['VIDEO', 'SOCIAL MEDIA', 'CONTENT', 'CREATIVE'],
  },
  about: {
    eyebrow: 'O estúdio',
    title: 'Conteúdo com *direção*, não apenas volume.',
    text: 'Somos um estúdio criativo que une estratégia de social media, linguagem audiovisual e edição precisa. Cada conteúdo nasce de uma intenção, ganha forma e chega ao feed com propósito.',
    imageId: 'm-ref-phone',
    pillars: [
      { title: 'Estratégia', text: 'Pauta, roteiro e calendário pensados para fortalecer o posicionamento da sua marca.' },
      { title: 'Produção', text: 'Captação profissional com luz, cuidado estético e atenção a cada detalhe.' },
      { title: 'Edição', text: 'Ritmo, cor e acabamento que valorizam cada conteúdo.' },
    ],
  },
  configurator: {
    eyebrow: 'Possibilidades',
    title: 'Encontre a estrutura ideal *para a sua marca.*',
    text: 'Combine estratégia, produção e conteúdo de acordo com as necessidades do seu projeto.',
    highlight: 'Gravamos com celular, de forma profissional.',
    stepPlanLabel: 'Escolha a base do seu projeto',
    stepTypeLabel: 'Adicione conteúdos avulsos',
    quantityQuestion: 'Quantos avulsos você precisa?',
    summaryTitle: 'Sua composição',
    summaryPlanLabel: 'Plano personalizado',
    totalLabel: 'Investimento estimado',
    requestCtaLabel: 'Solicitar proposta',
    whatsappCtaLabel: 'Enviar pelo WhatsApp',
    emptyText: 'Escolha a base do seu projeto ou inclua conteúdos avulsos para ver a composição.',
    disclaimer: 'Valores estimados. A proposta final é confirmada após o briefing.',
  },

  process: {
    enabled: true,
    eyebrow: 'Processo',
    title: 'Cada corte é *uma decisão.*',
    text: 'Do roteiro à entrega, cada detalhe faz parte da construção do conteúdo.',
    videoUrl: 'video/bastidores.mp4',
    posterUrl: 'video/bastidores-poster.jpg',
    steps: [
      { title: 'Roteiro', text: 'Pauta e narrativa pensadas para conduzir a atenção desde o primeiro segundo.' },
      { title: 'Captação', text: 'Produção realizada no estúdio ou no seu espaço, com atenção à imagem e aos detalhes.' },
      { title: 'Edição', text: 'Cortes, legendas, cor e som pensados para valorizar cada conteúdo.' },
      { title: 'Entrega', text: 'Conteúdos finalizados e prontos para publicação nos formatos definidos para cada projeto.' },
    ],
  },
  results: {
    eyebrow: 'Resultados',
    title: 'Conteúdo que *prende a atenção.*',
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
    text: 'Uma seleção de conteúdos desenvolvidos para diferentes marcas, do planejamento à edição. Toque para assistir com som.',
    items: [
      { id: 'g1', mediaId: 'm-pf-rafalavalle', label: 'Saúde', caption: 'Dra. Rafa Lavalle', layout: 'reel', grayscale: false, videoUrl: 'video/portfolio/dra-rafalavalle.mp4' },
      { id: 'g2', mediaId: 'm-pf-colorado', label: 'Evento', caption: 'Colorado 50 anos', layout: 'reel', grayscale: false, videoUrl: 'video/portfolio/colorado-50.mp4' },
      { id: 'g3', mediaId: 'm-pf-picape', label: 'Automotivo', caption: 'Branco Garage', layout: 'reel', grayscale: false, videoUrl: 'video/portfolio/branco-garage-picape.mp4' },
      { id: 'g4', mediaId: 'm-pf-panificadora', label: 'Panificadora', caption: 'Panificadora Valério', layout: 'reel', grayscale: false, videoUrl: 'video/portfolio/panificadora-valerio.mp4' },
      { id: 'g5', mediaId: 'm-pf-advocacia', label: 'Advocacia', caption: 'Escritório de advocacia', layout: 'reel', grayscale: false, videoUrl: 'video/portfolio/advocacia.mp4' },
      { id: 'g6', mediaId: 'm-pf-farmacia', label: 'Farmácia', caption: 'Humor no balcão', layout: 'reel', grayscale: false, videoUrl: 'video/portfolio/farmacia.mp4' },
      { id: 'g7', mediaId: 'm-pf-combustivel', label: 'Automotivo', caption: 'Branco Garage', layout: 'reel', grayscale: false, videoUrl: 'video/portfolio/branco-garage-combustivel.mp4' },
      { id: 'g8', mediaId: 'm-pf-saude', label: 'Saúde', caption: 'Rotina de consultório', layout: 'reel', grayscale: false, videoUrl: 'video/portfolio/saude-consultorio.mp4' },
      { id: 'g9', mediaId: 'm-pf-pontocountry', label: 'Moda country', caption: 'Ponto Country', layout: 'reel', grayscale: false, videoUrl: 'video/portfolio/ponto-country.mp4' },
      { id: 'g10', mediaId: 'm-pf-laboratorio', label: 'Laboratório', caption: 'Coleta em domicílio', layout: 'reel', grayscale: false, videoUrl: 'video/portfolio/laboratorio-coleta.mp4' },
    ],
  },
  finalCta: {
    title: 'Pronto para criar algo *memorável?*',
    text: 'Conheça as possibilidades para a sua marca e encontre a composição que mais faz sentido para o seu projeto.',
    ctaLabel: 'Explorar possibilidades',
    imageId: 'm-ref-editing',
  },
  contact: {
    whatsapps: [
      { name: 'Gabriel Vinicius', number: '5544997317970' },
      { name: 'Daniele Mochi', number: '5544999877430' },
    ],
    instagrams: ['gabrielvinisantos', 'danielemochii'],
    email: '',
    city: 'Colorado — PR',
    whatsappIntro: 'Olá! Gostaria de solicitar um orçamento personalizado.',
  },
  footer: {
    text: 'Estratégia, produção e edição para marcas que levam o próprio conteúdo a sério.',
  },
  login: {
    imageId: 'm-phone-hand',
  },
};
