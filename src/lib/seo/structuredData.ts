/**
 * Helpers para generar JSON-LD (schema.org). Cada función devuelve un objeto plano listo para
 * serializar con JSON.stringify() dentro de un <script type="application/ld+json">.
 */

const SITE_NAME = 'TDA Argentina';

export function organizationJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: siteUrl,
    description:
      'Plataforma independiente de consulta sobre la Televisión Digital Abierta (TDA) en Argentina: mapa de estaciones, guías y herramientas.',
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface FaqJsonLdItem {
  question: string;
  answer: string;
}

export function faqPageJsonLd(items: FaqJsonLdItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export interface TechArticleJsonLdInput {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  author: string;
}

export function techArticleJsonLd(input: TechArticleJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: input.title,
    description: input.description,
    url: input.url,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: { '@type': 'Organization', name: input.author },
    publisher: { '@type': 'Organization', name: SITE_NAME },
  };
}

export interface StationJsonLdInput {
  name: string;
  url: string;
  latitude: number;
  longitude: number;
  addressLocality: string;
  addressRegion: string;
}

export function stationPlaceJsonLd(input: StationJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: input.name,
    url: input.url,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: input.latitude,
      longitude: input.longitude,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: input.addressLocality,
      addressRegion: input.addressRegion,
      addressCountry: 'AR',
    },
  };
}
