import { test, expect } from '@playwright/test';

test.describe('Página de inicio', () => {
  test('muestra el hero, el buscador y los accesos principales', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Encontrá la señal de TDA más cercana/i })).toBeVisible();
    // El buscador del header se oculta en mobile (queda dentro del menú); el del hero, dentro de
    // <main>, siempre está visible, así que se apunta puntualmente a ese para evitar ambigüedad.
    await expect(page.locator('main').getByPlaceholder(/Ingresá tu localidad/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explorar el mapa' })).toHaveAttribute('href', '/mapa');
  });

  test('el buscador global sugiere localidades y navega al hacer click', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.locator('main').getByPlaceholder(/Ingresá tu localidad/i);
    await searchInput.fill('Rosario');
    await expect(page.getByRole('link', { name: /Rosario/ }).first()).toBeVisible();
    await page.getByRole('link', { name: /Rosario/ }).first().click();
    await expect(page).toHaveURL(/\/localidades\/rosario/);
  });

  test('el toggle de modo oscuro cambia el atributo data-theme', async ({ page }) => {
    await page.goto('/');
    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await page.getByRole('button', { name: /modo claro y oscuro/i }).click();
    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(after).not.toBe(before);
  });

  test('las guías destacadas y el listado de FAQ se muestran', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Guías destacadas' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Preguntas frecuentes' })).toBeVisible();
  });
});
