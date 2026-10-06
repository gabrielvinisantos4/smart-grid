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

const credit = (name: string, user: string) => ({
  credit: `${name} / Unsplash`,
  creditUrl: `https://unsplash.com/@${user}?utm_source=studio&utm_medium=referral`,
});

export const seedMedia: SeedMedia[] = [
  { id: 'm-hero-camera', url: unsplash('photo-1570834322056-ba3e2994ab85', 2400), alt: 'Câmera de cinema em preto e branco', ...credit('Miguel Ángel Hernández', 'miguelherc96') },
  { id: 'm-camera-classic', url: unsplash('photo-1470338229081-eb5980be28c9'), alt: 'Câmera fotográfica e filmadora sobre a mesa', ...credit('Florian Klauer', 'florianklauer') },
  { id: 'm-lenses', url: unsplash('photo-1526007413281-c202e21eedf3'), alt: 'Câmera com lentes sobre superfície escura', ...credit('Joshua Hanks', 'jhanks787') },
  { id: 'm-clapper', url: unsplash('photo-1619344755866-f5c7ca79b2f6'), alt: 'Claquete em set de filmagem', ...credit('Asso Myron', 'assomyron') },
  { id: 'm-editing-imac', url: unsplash('photo-1579109652910-99b9be06aaec', 1400), alt: 'Estação de edição com timeline aberta', ...credit('Jakob Owens', 'jakobowens1') },
  { id: 'm-editing-desk', url: unsplash('photo-1543336472-fcf478c443db', 1600), alt: 'Monitor de edição em mesa minimalista', ...credit('James McKinven', 'jmckinven') },
  { id: 'm-phone-capture', url: unsplash('photo-1543525469-65b61cc2bc06', 1400), alt: 'Pessoa capturando conteúdo com o celular', ...credit('charlesdeluvio', 'charlesdeluvio') },
  { id: 'm-phone-hand', url: unsplash('photo-1545081576-5b7e640c083a', 1400), alt: 'Mão segurando smartphone', ...credit('Marek Pospíšil', 'marcusp') },
  { id: 'm-coffee-laptop', url: unsplash('photo-1587719425076-f770d7039908'), alt: 'Café, caderno e notebook sobre mesa escura', ...credit('Valeriia Miller', 'valeriiamiller') },
  { id: 'm-mug', url: unsplash('photo-1586284397987-0cabd666909c', 1400), alt: 'Caneca em preto e branco', ...credit('charlesdeluvio', 'charlesdeluvio') },
  { id: 'm-soundstage', url: unsplash('photo-1612544409025-e1f6a56c1152'), alt: 'Equipe de filmagem em estúdio', ...credit('Brands&People', 'brandsandpeople') },
  { id: 'm-crew', url: unsplash('photo-1632187981988-40f3cbaeef5e'), alt: 'Equipe reunida em volta da câmera', ...credit('Jakob Owens', 'jakobowens1') },
  { id: 'm-bts', url: unsplash('photo-1486693128850-a77436e7ba3c'), alt: 'Bastidores de gravação com câmera na mão', ...credit('Jakob Owens', 'jakobowens1') },
  { id: 'm-clapper-hands', url: unsplash('photo-1780516000985-08f96af45c9c', 1600), alt: 'Mãos segurando claquete em fundo escuro', ...credit('Darko Sokoleski', 'sokoltge') },
  { id: 'm-clapper-bw', url: unsplash('photo-1619518594466-5bfc2dcbb83d', 1400), alt: 'Claquete em preto e branco', ...credit('Irham Setyaki', 'setyaki') },
  { id: 'm-lifestyle-bw', url: unsplash('photo-1607932066513-77aa8f68705d', 1400), alt: 'Retrato editorial em preto e branco', ...credit('kevin turcios', 'kevin_turcios') },
  { id: 'm-reel-1', url: unsplash('photo-1665327469792-cf91f5b8d74c', 900), alt: 'Criadora gravando conteúdo no quarto', ...credit('Daria Trofimova', 'da161') },
  { id: 'm-reel-2', url: unsplash('photo-1654116970264-2f0fa1a26ccc', 900), alt: 'Gravação de vídeo em frente à câmera', ...credit('Anna Hecker', 'annaelise') },
  { id: 'm-reel-3', url: unsplash('photo-1669255034434-ebefed36da64', 900), alt: 'Especialista gravando conteúdo educativo', ...credit('Alan Quirvan', 'quirvan') },
  { id: 'm-reel-4', url: unsplash('photo-1669255034447-92a04063c6b8', 900), alt: 'Bastidores de gravação com celular', ...credit('Alan Quirvan', 'quirvan') },
  { id: 'm-dark-set', url: unsplash('photo-1681137063068-081072cf04b4'), alt: 'Set de gravação no escuro', ...credit('Huong Do', 'huongddn') },
];

export const seedServices = [
  {
    id: 'video',
    name: 'Vídeo',
    description: 'Vídeos estratégicos para Reels, anúncios e redes sociais.',
    icon: 'Clapperboard',
    imageId: 'm-phone-capture',
    priceCents: 15000,
    minQty: 1,
    maxQty: 60,
    defaultQty: 4,
    quickQuantities: [1, 2, 4, 6, 8, 10, 12],
    unitSingular: 'unidade',
    unitPlural: 'unidades',
    badge: 'Mais pedido',
  },
  {
    id: 'carrossel',
    name: 'Carrossel',
    description: 'Conteúdos visuais para informar, educar e gerar autoridade.',
    icon: 'Layers',
    imageId: 'm-coffee-laptop',
    priceCents: 10000,
    minQty: 1,
    maxQty: 60,
    defaultQty: 4,
    quickQuantities: [1, 2, 4, 6, 8, 10, 12],
    unitSingular: 'unidade',
    unitPlural: 'unidades',
    badge: null,
  },
  {
    id: 'audiovisual',
    name: 'Conteúdo Audiovisual',
    description: 'Produções audiovisuais completas para fortalecer sua marca.',
    icon: 'Film',
    imageId: 'm-clapper-hands',
    priceCents: 50000,
    minQty: 1,
    maxQty: 20,
    defaultQty: 1,
    quickQuantities: [1, 2, 3, 4, 6],
    unitSingular: 'produção',
    unitPlural: 'produções',
    badge: 'Premium',
  },
];

export const defaultSettings: SiteSettings = {
  brand: {
    name: 'Noir Studio',
    tagline: 'Social Media & Produção Audiovisual',
    logoId: null,
    accentColor: '#e8e2d6',
  },
  seo: {
    pageTitle: 'Noir Studio — Orçamento personalizado de conteúdo',
    description: 'Monte seu plano de conteúdo personalizado e descubra o investimento ideal para sua marca.',
  },
  hero: {
    eyebrow: 'Social Media · Audiovisual · Estratégia',
    title: 'Seu conteúdo. *Nossa criação.*',
    subtitle: 'Monte seu plano de conteúdo personalizado e descubra o investimento ideal para sua marca.',
    ctaLabel: 'Montar meu orçamento',
    secondaryCtaLabel: 'Ver portfólio',
    imageId: 'm-hero-camera',
    tags: ['VIDEO', 'SOCIAL MEDIA', 'CONTENT', 'CREATIVE'],
  },
  about: {
    eyebrow: 'O estúdio',
    title: 'Conteúdo com *direção*, não apenas volume.',
    text: 'Somos um estúdio criativo que une estratégia de social media, linguagem de cinema e edição precisa. Cada peça nasce de um roteiro, ganha forma em set e chega ao feed com intenção.',
    imageId: 'm-bts',
    pillars: [
      { title: 'Estratégia', text: 'Pauta, roteiro e calendário pensados para o seu posicionamento.' },
      { title: 'Produção', text: 'Captação com equipamento profissional, luz e direção de cena.' },
      { title: 'Edição', text: 'Ritmo, cor e acabamento de cinema em cada entrega.' },
    ],
  },
  configurator: {
    eyebrow: 'Orçamento',
    title: 'Monte seu *conteúdo*',
    text: 'Escolha os formatos, defina a quantidade e personalize seu plano.',
    stepTypeLabel: 'Escolha o tipo de conteúdo',
    quantityQuestion: 'Quantos conteúdos você precisa por mês?',
    summaryTitle: 'Seu orçamento',
    summaryPlanLabel: 'Plano personalizado',
    totalLabel: 'Investimento mensal',
    requestCtaLabel: 'Solicitar orçamento',
    whatsappCtaLabel: 'Enviar pelo WhatsApp',
    emptyText: 'Selecione um ou mais formatos para começar a montar o seu plano.',
    disclaimer: 'Valores estimados. A proposta final é confirmada após o briefing.',
  },
  results: {
    eyebrow: 'Resultados',
    title: 'Conteúdo que *para o scroll.*',
    text: 'Pessoas e marcas reais que confiaram no nosso roteiro, captação e edição, e os números que cada vídeo alcançou.',
    highlightValue: '+349 mil',
    highlightLabel: 'visualizações orgânicas em apenas cinco conteúdos',
    items: [
      { id: 'r1', mediaId: 'm-reel-1', views: '120 mil', caption: '', client: '', handle: '', niche: 'Lifestyle', url: '' },
      { id: 'r2', mediaId: 'm-reel-2', views: '85 mil', caption: '', client: '', handle: '', niche: 'Saúde feminina', url: '' },
      { id: 'r3', mediaId: 'm-reel-3', views: '78,4 mil', caption: '', client: '', handle: '', niche: 'Saúde feminina', url: '' },
      { id: 'r4', mediaId: 'm-reel-4', views: '54,8 mil', caption: '', client: '', handle: '', niche: 'Automotivo', url: '' },
      { id: 'r5', mediaId: 'm-phone-capture', views: '11,1 mil', caption: '', client: '', handle: '', niche: 'Varejo', url: '' },
    ],
  },
  gallery: {
    eyebrow: 'Portfólio',
    title: 'Por trás de cada conteúdo, existe uma *história.*',
    text: 'Set, luz, roteiro, celular, timeline e café. O processo é tão cuidadoso quanto o resultado.',
    items: [
      { id: 'g1', mediaId: 'm-soundstage', label: '001', caption: 'Set — Campanha institucional', layout: 'large', grayscale: true },
      { id: 'g2', mediaId: 'm-phone-hand', label: '002', caption: 'Mobile first', layout: 'tall', grayscale: false },
      { id: 'g3', mediaId: 'm-clapper-bw', label: '003', caption: 'Take 01', layout: 'square', grayscale: true },
      { id: 'g4', mediaId: 'm-editing-desk', label: '004', caption: 'Edição & color', layout: 'wide', grayscale: false },
      { id: 'g5', mediaId: 'm-lenses', label: '005', caption: 'Equipamento', layout: 'square', grayscale: true },
      { id: 'g6', mediaId: 'm-editing-imac', label: '006', caption: 'Pós-produção', layout: 'tall', grayscale: true },
      { id: 'g7', mediaId: 'm-crew', label: '007', caption: 'Bastidores', layout: 'wide', grayscale: false },
      { id: 'g8', mediaId: 'm-lifestyle-bw', label: '008', caption: 'Lifestyle', layout: 'tall', grayscale: true },
      { id: 'g9', mediaId: 'm-mug', label: '009', caption: 'Briefing', layout: 'square', grayscale: true },
    ],
  },
  finalCta: {
    title: 'Pronto para criar algo *memorável?*',
    text: 'Monte seu plano em menos de um minuto e receba o orçamento direto no WhatsApp.',
    ctaLabel: 'Começar agora',
    imageId: 'm-camera-classic',
  },
  contact: {
    whatsapp: '5511999999999',
    instagram: 'noirstudio',
    email: 'contato@noirstudio.com.br',
    city: 'São Paulo — Brasil',
    whatsappIntro: 'Olá! Gostaria de solicitar um orçamento personalizado.',
  },
  footer: {
    text: 'Estratégia, produção e edição para marcas que levam o próprio conteúdo a sério.',
  },
  login: {
    imageId: 'm-crew',
  },
};
