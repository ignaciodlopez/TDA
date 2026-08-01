import { test, expect, type Page } from '@playwright/test';

// En mobile, el panel de filtros arranca colapsado detrás de un botón "Filtros" (el mapa ocupa
// toda la pantalla); en desktop siempre está visible. Este helper lo abre solo si hace falta.
async function ensureFiltersOpen(page: Page) {
  // Espera a que la isla del mapa (client:only) termine de hidratarse antes de decidir si hace
  // falta abrir el panel de filtros: recién ahí "Provincia" o el botón "Filtros" existen en el DOM.
  await page.getByPlaceholder(/Buscar estación, localidad o provincia/i).waitFor();
  const provinceSelect = page.getByLabel('Filtrar por provincia');
  if (!(await provinceSelect.isVisible())) {
    await page.getByRole('button', { name: /^Filtros/ }).click();
  }
  await expect(provinceSelect).toBeVisible();
}

test.describe('Mapa interactivo', () => {
  test('el mapa carga sin errores de consola y muestra los controles principales', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/mapa');
    await expect(page.getByRole('application', { name: /Mapa de estaciones de TDA/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Buscar estación, localidad o provincia/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mapa' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Listado' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('el listado es una alternativa accesible al mapa y muestra las estaciones', async ({ page }) => {
    await page.goto('/mapa');
    await page.getByRole('button', { name: 'Listado' }).click();
    await expect(page.getByText(/estaciones encontradas/)).toBeVisible();
    await expect(page.getByRole('link', { name: /Córdoba Centro/ })).toBeVisible();
  });

  test('filtrar por provincia actualiza los resultados y la URL', async ({ page }) => {
    await page.goto('/mapa');
    await page.getByRole('button', { name: 'Listado' }).click();
    await ensureFiltersOpen(page);
    await page.getByLabel('Filtrar por provincia').selectOption('Córdoba');
    await expect(page).toHaveURL(/province=C%C3%B3rdoba/);
    await expect(page.getByRole('link', { name: /Córdoba Centro/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Rosario Centro/ })).not.toBeVisible();
  });

  test('restablecer filtros limpia la selección', async ({ page }) => {
    await page.goto('/mapa?province=C%C3%B3rdoba');
    await ensureFiltersOpen(page);
    await expect(page.getByText('Restablecer filtros')).toBeVisible();
    await page.getByText('Restablecer filtros').click();
    await expect(page).not.toHaveURL(/province=/);
  });

  test('abrir una estación por URL (?estacion=) muestra su ficha en el panel', async ({ page }) => {
    await page.goto('/mapa?estacion=arg-cba-cordoba-centro');
    await expect(page.getByRole('heading', { name: 'Córdoba Centro' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver ficha completa' })).toHaveAttribute(
      'href',
      '/estaciones/cordoba-centro',
    );
  });
});
