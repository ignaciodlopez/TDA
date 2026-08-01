import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Dominio real del sitio: definir SITE_URL en .env antes de desplegar a producción (ver .env.example).
const SITE_URL = process.env.SITE_URL ?? 'https://tda-argentina.example';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
