import { z } from 'zod';
import { ICON_NAMES } from '../../shared/icons.ts';

const text = (max: number) => z.string().trim().max(max);
const mediaRef = z.string().trim().max(64).nullable();

export const serviceInputSchema = z
  .object({
    name: text(80).min(1, 'Informe o nome.'),
    description: text(400).default(''),
    icon: z.enum(ICON_NAMES),
    imageId: mediaRef.default(null),
    priceCents: z.number().int().min(0).max(100_000_000),
    minQty: z.number().int().min(1).max(999),
    maxQty: z.number().int().min(1).max(999),
    defaultQty: z.number().int().min(1).max(999),
    quickQuantities: z.array(z.number().int().min(1).max(999)).max(12).default([]),
    unitSingular: text(30).min(1).default('unidade'),
    unitPlural: text(30).min(1).default('unidades'),
    badge: text(30).nullable().default(null),
    active: z.boolean().default(true),
  })
  .refine((s) => s.maxQty >= s.minQty, { message: 'A quantidade máxima deve ser maior ou igual à mínima.', path: ['maxQty'] })
  .transform((s) => ({
    ...s,
    defaultQty: Math.min(s.maxQty, Math.max(s.minQty, s.defaultQty)),
    quickQuantities: [...new Set(s.quickQuantities)].filter((q) => q >= s.minQty && q <= s.maxQty).sort((a, b) => a - b),
    badge: s.badge ? s.badge : null,
  }));

export type ServiceInput = z.infer<typeof serviceInputSchema>;

export const pricesSchema = z.object({
  prices: z
    .array(z.object({ id: z.string().max(64), priceCents: z.number().int().min(0).max(100_000_000) }))
    .min(1)
    .max(200),
});

export const reorderSchema = z.object({ ids: z.array(z.string().max(64)).min(1).max(200) });

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor hexadecimal, ex.: #e8e2d6');

export const siteSettingsSchema = z.object({
  brand: z.object({
    name: text(60).min(1),
    tagline: text(120),
    logoId: mediaRef,
    accentColor: hexColor,
  }),
  seo: z.object({ pageTitle: text(120), description: text(300) }),
  hero: z.object({
    eyebrow: text(120),
    title: text(160).min(1),
    subtitle: text(300),
    ctaLabel: text(40).min(1),
    secondaryCtaLabel: text(40),
    imageId: mediaRef,
    tags: z.array(text(24).min(1)).max(8),
  }),
  about: z.object({
    eyebrow: text(60),
    title: text(160),
    text: text(1200),
    imageId: mediaRef,
    pillars: z.array(z.object({ title: text(40), text: text(200) })).max(6),
  }),
  configurator: z.object({
    eyebrow: text(60),
    title: text(120).min(1),
    text: text(300),
    stepTypeLabel: text(80),
    quantityQuestion: text(120),
    summaryTitle: text(60),
    summaryPlanLabel: text(60),
    totalLabel: text(60),
    requestCtaLabel: text(40).min(1),
    whatsappCtaLabel: text(40).min(1),
    emptyText: text(200),
    disclaimer: text(200),
  }),
  results: z.object({
    eyebrow: text(60),
    title: text(160),
    text: text(300),
    highlightValue: text(24),
    highlightLabel: text(120),
    items: z
      .array(
        z.object({
          id: z.string().max(64),
          mediaId: z.string().max(64),
          views: text(24),
          caption: text(120),
          client: text(60),
          handle: text(60)
            .default('')
            .transform((v) => v.replace(/^@/, '').replace(/^https?:\/\/(www\.)?(instagram|tiktok)\.com\/@?/, '').replace(/\/.*$/, '')),
          niche: text(60).default(''),
          url: z.union([z.literal(''), z.url().max(500).refine((v) => v.startsWith('https://'), 'Use um link https://')]),
        }),
      )
      .max(24),
  }),
  gallery: z.object({
    eyebrow: text(60),
    title: text(160),
    text: text(300),
    items: z
      .array(
        z.object({
          id: z.string().max(64),
          mediaId: z.string().max(64),
          label: text(24),
          caption: text(80),
          layout: z.enum(['tall', 'wide', 'large', 'square']),
          grayscale: z.boolean(),
        }),
      )
      .max(40),
  }),
  finalCta: z.object({ title: text(160), text: text(300), ctaLabel: text(40), imageId: mediaRef }),
  contact: z.object({
    whatsapp: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ''))
      .refine((v) => v === '' || (v.length >= 10 && v.length <= 15), 'WhatsApp inválido. Use DDI + DDD + número.'),
    instagrams: z
      .array(text(60).transform((v) => v.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, '')))
      .max(6)
      .transform((list) => [...new Set(list.filter(Boolean))]),
    email: z.union([z.literal(''), z.email().max(120)]),
    city: text(80),
    whatsappIntro: text(300).min(1),
  }),
  footer: z.object({ text: text(300) }),
  login: z.object({ imageId: mediaRef }),
});

export const quoteRequestSchema = z.object({
  items: z
    .array(z.object({ serviceId: z.string().max(64), quantity: z.number().int().min(1).max(999) }))
    .min(1, 'Selecione ao menos um serviço.')
    .max(50),
  channel: z.enum(['whatsapp', 'request']),
  clientName: text(80).optional(),
  clientContact: text(120).optional(),
  clientCompany: text(80).optional(),
  notes: text(600).optional(),
  /** Honeypot anti-spam: campo invisível que humanos não preenchem. */
  website: z.string().max(200).optional(),
});

export const quoteStatusSchema = z.object({ status: z.enum(['new', 'contacted', 'won', 'lost']) });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(120),
  password: z.string().min(1).max(200),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(10, 'A nova senha precisa de pelo menos 10 caracteres.').max(200),
});

export const createUserSchema = z.object({
  name: text(80).min(1),
  email: z.email().trim().toLowerCase().max(120),
  password: z.string().min(10, 'A senha precisa de pelo menos 10 caracteres.').max(200),
  role: z.enum(['owner', 'viewer']),
});

export const updateUserSchema = z.object({ role: z.enum(['owner', 'viewer']) });

export const mediaUpdateSchema = z.object({ alt: text(200) });

export const remoteMediaSchema = z.object({
  url: z
    .url()
    .max(1000)
    .refine((v) => v.startsWith('https://'), 'Use uma URL https://'),
  alt: text(200).default(''),
});
