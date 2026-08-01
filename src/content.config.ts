import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const signalSchema = z.object({
  physicalChannel: z.number().int().positive().nullable(),
  virtualChannel: z.string().nullable(),
  frequencyMhz: z.number().positive().nullable(),
  name: z.string(),
  network: z.enum(['nacional', 'local']),
  status: z.enum(['active', 'inactive', 'planned']),
});

const stationSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  stationType: z.enum(['transmitter', 'repeater']),
  status: z.enum(['active', 'incomplete', 'inactive', 'planned']),
  operator: z.string(),
  isDemoData: z.boolean(),
  location: z.object({
    country: z.literal('Argentina'),
    province: z.string(),
    department: z.string().nullable(),
    city: z.string(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    elevationMeters: z.number().nullable(),
  }),
  technicalData: z.object({
    towerHeightMeters: z.number().positive().nullable(),
    erpKw: z.number().positive().nullable(),
    polarization: z.enum(['horizontal', 'vertical', 'circular', 'elliptical']).nullable(),
    standard: z.literal('ISDB-T'),
  }),
  signals: z.array(signalSchema),
  coverage: z.object({
    estimatedRadiusKm: z.number().positive().nullable(),
    calculationMethod: z.enum(['erp-based-estimate', 'network-average-estimate', 'pending']),
  }),
  verification: z.object({
    level: z.enum(['official', 'multi-source', 'community', 'pending', 'outdated', 'insufficient']),
    sourceName: z.string(),
    sourceUrl: z.string().url().nullable(),
    lastVerifiedAt: z.string(),
  }),
  observations: z.string().nullable(),
  updatedAt: z.string(),
});

const stations = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/stations' }),
  schema: stationSchema,
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/guides' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      category: z.enum(['primeros-pasos', 'instalacion', 'solucion-de-problemas', 'contenido-tecnico']),
      level: z.enum(['inicial', 'intermedio', 'avanzado']),
      readingTimeMinutes: z.number().int().positive(),
      updatedAt: z.string(),
      author: z.string(),
      heroImage: image(),
      heroImageAlt: z.string(),
      heroImageCredit: z.object({
        author: z.string(),
        license: z.string(),
        sourceUrl: z.string().url(),
      }),
      sources: z
        .array(
          z.object({
            name: z.string(),
            url: z.string().url().nullable(),
          }),
        )
        .default([]),
      relatedGuides: z.array(z.string()).default([]),
    }),
});

const faq = defineCollection({
  loader: file('./src/content/faq/faq.json'),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    category: z.enum(['general', 'instalacion', 'recepcion', 'canales', 'datos']),
  }),
});

const resources = defineCollection({
  loader: file('./src/content/resources/resources.json'),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['normativa', 'manual', 'documentacion-tecnica', 'datos-abiertos', 'herramienta']),
    author: z.string(),
    date: z.string(),
    format: z.enum(['pdf', 'web', 'csv', 'json', 'xml']),
    url: z.string().url(),
    lastCheckedAt: z.string(),
  }),
});

export const collections = { stations, guides, faq, resources };
