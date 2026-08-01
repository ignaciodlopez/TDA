# TDA Argentina

Plataforma independiente de consulta sobre la Televisión Digital Abierta (TDA) en Argentina: mapa
interactivo de estaciones transmisoras y repetidoras, fichas técnicas, herramientas de orientación
y distancia, guías prácticas y un explorador de canales y frecuencias.

**No es un sitio oficial** del Estado argentino, de ARSAT ni de ENACOM.

## Estado de los datos

Las 102 estaciones incluidas en `src/data/stations/` son **datos reales** (`isDemoData: false`) de
ubicación y ficha técnica, tomados de una tabla de Wikipedia que cita al portal de datos abiertos de
ARSAT. No se pudo contrastar esto de primera mano contra ARSAT, TDA o ENACOM (inaccesibles desde el
entorno donde se construyó esta versión), así que el nivel de verificación es *reportado por la
comunidad*. Las señales cargadas por estación son solo los 4 multiplex nacionales (canales 22-25);
los canales locales de cada ciudad todavía no están cargados. Ver el detalle completo, qué falta y
cómo mejorar la verificación en [`/fuentes-y-metodologia`](src/pages/fuentes-y-metodologia.astro) y
en la sección [Cómo cargar datos reales](#cómo-cargar-datos-reales-de-estaciones) más abajo.

## Stack técnico

- **Astro 5** (sitio estático) + **React 19** solo para las islas interactivas (mapa, buscador, herramientas).
- **TypeScript** en modo estricto (`strict`, `noUncheckedIndexedAccess`).
- **Tailwind CSS v4** (vía `@tailwindcss/vite`), tokens de diseño en `src/styles/global.css`.
- **MapLibre GL JS** sobre mapas vectoriales de [OpenFreeMap](https://openfreemap.org/) (OpenStreetMap), sin API key.
- **Astro Content Collections** + Zod para el modelo de datos (`src/content.config.ts`).
- **nanostores** para estado compartido entre islas cuando hace falta.
- **Vitest** (unidad) y **Playwright** (end-to-end).
- **ESLint** (flat config) + **Prettier**.

## Requisitos

- Node.js `^20.3.0` o `>=22.0.0` (ver `engines` en `package.json`).
- npm.

## Empezar

```bash
npm install
npm run dev
```

El sitio queda disponible en `http://localhost:4321`.

### Scripts disponibles

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente. |
| `npm run build` | Type-check (`astro check`) + build de producción a `dist/`. |
| `npm run preview` | Sirve el build de producción localmente. |
| `npm run typecheck` | Solo `astro check`. |
| `npm run lint` / `lint:fix` | ESLint sobre todo el proyecto. |
| `npm run format` / `format:check` | Prettier. |
| `npm run test` / `test:watch` | Tests unitarios (Vitest) sobre `src/lib/geo/`. |
| `npm run test:e2e` | Tests end-to-end (Playwright): compila, levanta el preview y corre `e2e/*.spec.ts` en Chromium desktop y mobile. |

`npm install` corre automáticamente `scripts/copy-maplibre-worker.mjs` (ver [nota sobre MapLibre y Vite](#nota-importante-maplibre-gl-y-vite)).

## Variables de entorno

Ninguna es obligatoria para desarrollar localmente: todas tienen un valor de ejemplo por defecto
en el código. Antes de desplegar a producción, copiá `.env.example` a `.env` y completá:

| Variable | Para qué se usa |
| --- | --- |
| `SITE_URL` | Dominio real del sitio (URLs canónicas, sitemap, Open Graph, JSON-LD). |
| `PUBLIC_CONTACT_EMAIL` | Correo real al que apuntan `/contacto` y `/reportar-error`. |

## Estructura del proyecto

```text
src/
  components/       Componentes de UI reutilizables (common/, map/, stations/)
  content/          Contenido editorial: guías (MDX), FAQ y recursos (JSON)
  content.config.ts Definición de las Content Collections (stations, guides, faq, resources)
  data/             Datos estructurados: estaciones, provincias/localidades, operadores
  features/         Islas de React por funcionalidad (map/, tools/, station-search/, channels/)
  layouts/          BaseLayout (HTML/head) y SiteLayout (+ Header/Footer)
  lib/
    geo/            Cálculos puros: distancia, azimut, filtros, GeoJSON, ranking (sin dependencias de Astro)
    data/           Capa de acceso a datos (hoy lee Content Collections; punto único para migrar a una API/DB)
    seo/            Helpers de JSON-LD
  pages/            Rutas del sitio (ver mapa completo en el punto 35 del spec original)
  styles/           global.css: tokens de Tailwind v4, modo oscuro, utilidades
  types/            Tipos compartidos (Station, Province, etc.)
e2e/                Tests de Playwright
scripts/            Scripts de mantenimiento (copiar el worker de MapLibre)
public/maplibre-gl/ Worker de MapLibre servido sin procesar (ver nota abajo)
```

## Modelo de datos

El esquema completo de una estación está en `src/content.config.ts` (validado con Zod). Resumen:

- `stations` — una estación por archivo JSON en `src/data/stations/`. Incluye ubicación, datos
  técnicos, señales, cobertura estimada y un bloque de **verificación** (`level`, `sourceName`,
  `sourceUrl`, `lastVerifiedAt`) que indica de dónde sale cada dato y qué tan confiable es.
- `guides` — guías en MDX (`src/content/guides/`), con nivel, tiempo de lectura, fuentes y guías relacionadas.
- `faq` / `resources` — arrays JSON en `src/content/faq/faq.json` y `src/content/resources/resources.json`.
- `provinces` / `localities` / `operators` — tablas de referencia simples en `src/data/` (no son Content Collections, son JSON plano importado directamente; ver `src/lib/data/geo.ts`).

Toda la UI accede a los datos exclusivamente a través de `src/lib/data/` (nunca importa
`astro:content` directamente en componentes), para poder migrar a una API o base de datos real
más adelante sin tocar componentes.

### Cómo cargar datos reales de estaciones

1. Verificá cada dato contra una fuente oficial (ver [Fuentes y metodología](src/pages/fuentes-y-metodologia.astro) para el detalle de qué se investigó y qué falta).
2. Creá un archivo JSON por estación en `src/data/stations/`, siguiendo el esquema de `src/content.config.ts`. `npx astro check` valida el esquema en cada build.
3. Marcá `isDemoData: false` y completá `verification.level`, `verification.sourceName` y `verification.sourceUrl` con la fuente real.
4. Si la localidad o provincia de la estación no existe todavía en `src/data/provinces/`, agregala ahí (nombre, slug, centroide).
5. Corré `npm run build` para confirmar que el esquema, el mapa y las páginas de estación/provincia/localidad siguen generándose sin errores.

## Nota importante: MapLibre y Vite

MapLibre GL JS carga un *web worker* propio para procesar tiles, que a su vez importa un chunk
interno (`maplibre-gl-shared.mjs`) mediante una ruta relativa. Si se deja que el bundler de Vite
reempaquete o renombre esos archivos (por ejemplo, importando el worker con `?url`), esa
referencia relativa se rompe: el worker nunca termina de cargar y **el mapa se queda sin estilo y
sin marcadores**, sin ningún error visible en consola más que un 404 de red al `maplibre-gl-worker.mjs`.

La solución aplicada acá es copiar ambos archivos tal cual (sin procesar) a `public/maplibre-gl/`
— se sirven como asset estático, conservando sus nombres y su ubicación relativa — y apuntar
`setWorkerUrl()` (en `src/features/map/MapView.tsx`) a esa ruta. La copia se hace automáticamente
en cada `npm install` vía el script `postinstall` (`scripts/copy-maplibre-worker.mjs`). Si se
actualiza la versión de `maplibre-gl`, conviene correr `node scripts/copy-maplibre-worker.mjs` de
nuevo a mano.

## Rendimiento

El mapa interactivo (`MapLibre`, ~900 KB) solo se carga en `/mapa`. La vista previa del mapa en la
página de inicio es un SVG estático server-rendered sin JavaScript
(`src/components/stations/MapPreviewStatic.astro`) — cargar la librería completa ahí solo para una
vista no interactiva bajaba el Performance de Lighthouse de home de 97 a 67 (LCP 3.6s → 2.4s,
Total Blocking Time 1080ms → 0ms). Estado actual medido con Lighthouse sobre el build de
producción:

| Página | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- |
| `/` | 97 | 100 | 100 | 100 |
| `/estaciones/[slug]` | 97 | 96–100 | 100 | 100 |
| `/mapa` | ~64 | 100 | 100 | 100 |

`/mapa` tiene un Performance más bajo porque ahí sí se carga MapLibre completo — es la página
donde el mapa interactivo es el contenido principal, no un extra. Es un trade-off esperado para
este tipo de aplicación (comparable a otros sitios con mapas interactivos reales).

## Accesibilidad

Apunta a WCAG 2.2 AA: navegación completa por teclado, foco visible, `prefers-reduced-motion`
respetado, contraste verificado en modo claro y oscuro (incluye tokens de texto separados de los
de fondo de botones — ver comentarios en `src/styles/global.css`), y una alternativa en formato
de lista para toda la información del mapa (botón "Listado" en `/mapa`, y `/estaciones` como
listado independiente).

## Despliegue

Pensado para desplegarse como sitio estático (`output: 'static'`) en cualquier hosting estático —
Cloudflare Pages, Netlify, Vercel, GitHub Pages, etc. Pasos generales:

1. `npm install`
2. Configurar `SITE_URL` y `PUBLIC_CONTACT_EMAIL` como variables de entorno del hosting (ver [Variables de entorno](#variables-de-entorno)).
3. `npm run build` (genera `dist/`).
4. Servir el contenido de `dist/` como sitio estático.

No requiere backend, base de datos ni funciones serverless para el MVP actual.

## Tests

```bash
npm run test        # Vitest: distancia, azimut, filtros, heurística de recepción
npm run test:e2e     # Playwright: flujos de inicio, mapa, fichas de estación, navegación y herramientas
```

Los tests e2e compilan el proyecto y levantan `astro preview` automáticamente
(`playwright.config.ts`); no hace falta tener un servidor corriendo de antemano.

## Fases futuras (no implementadas)

Reportes comunitarios con moderación, panel administrativo, cuentas de usuario, PWA y perfil
topográfico de elevación quedan fuera del MVP a propósito. El tipo `StationReport`
(`src/types/report.ts`) ya está definido para no bloquear ese diseño de datos más adelante, pero
no tiene UI ni backend todavía.
