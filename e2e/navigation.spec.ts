import { test, expect } from '@playwright/test';

test.describe('Navegación y accesibilidad', () => {
  test('el enlace "Saltar al contenido principal" es el primer elemento enfocable', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: /Saltar al contenido principal/i });
    await expect(skipLink).toBeFocused();
    await skipLink.press('Enter');
    await expect(page).toHaveURL(/#contenido-principal$/);
  });

  test('la navegación principal es accesible por teclado', async ({ page }) => {
    await page.goto('/');
    // En mobile la navegación principal está oculta detrás del botón de menú; en desktop siempre
    // está visible. Se abre el menú solo cuando hace falta.
    const desktopNav = page.getByRole('navigation', { name: 'Navegación principal' });
    let nav = desktopNav;
    if (!(await desktopNav.isVisible())) {
      await page.getByRole('button', { name: /menú de navegación/i }).click();
      nav = page.getByRole('navigation', { name: 'Navegación móvil' });
    }
    const mapaLink = nav.getByRole('link', { name: 'Mapa' });
    await mapaLink.focus();
    await expect(mapaLink).toBeFocused();
    await mapaLink.press('Enter');
    await expect(page).toHaveURL(/\/mapa$/);
  });

  test('los breadcrumbs muestran la ruta de navegación', async ({ page }) => {
    await page.goto('/estaciones/cordoba-centro');
    const breadcrumbs = page.getByRole('navigation', { name: 'Ruta de navegación' });
    await expect(breadcrumbs.getByRole('link', { name: 'Inicio' })).toBeVisible();
    await expect(breadcrumbs.getByRole('link', { name: 'Estaciones' })).toBeVisible();
    await expect(breadcrumbs.getByText('Córdoba Centro')).toBeVisible();
  });
});
