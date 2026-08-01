// MapLibre GL JS carga su worker (procesamiento de tiles) y un chunk interno compartido
// (maplibre-gl-shared.mjs) mediante una importación relativa entre ambos archivos. Si se dejan
// pasar por el pipeline de assets de Vite (hashing/bundling), esa referencia relativa se rompe y
// el worker nunca carga (el mapa se queda sin estilo y sin marcadores, sin ningún error visible
// más que un 404 de red). La solución es copiar ambos archivos tal cual a public/, donde se
// sirven sin procesar y mantienen sus nombres y su ubicación relativa entre sí.
//
// Se ejecuta automáticamente en cada `npm install` (script "postinstall"). Si se actualiza la
// versión de maplibre-gl, conviene volver a correr `node scripts/copy-maplibre-worker.mjs`.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const sourceDir = path.join(rootDir, '..', 'node_modules', 'maplibre-gl', 'dist');
const targetDir = path.join(rootDir, '..', 'public', 'maplibre-gl');

const files = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];

if (!existsSync(sourceDir)) {
  console.warn('[copy-maplibre-worker] maplibre-gl no está instalado todavía, se omite la copia.');
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });

for (const file of files) {
  const from = path.join(sourceDir, file);
  const to = path.join(targetDir, file);
  if (!existsSync(from)) {
    console.warn(`[copy-maplibre-worker] no se encontró ${file} en ${sourceDir}`);
    continue;
  }
  copyFileSync(from, to);
  console.log(`[copy-maplibre-worker] copiado ${file} -> public/maplibre-gl/${file}`);
}
