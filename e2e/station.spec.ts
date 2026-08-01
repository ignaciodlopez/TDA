import { test, expect } from '@playwright/test';

test.describe('Ficha de estación', () => {
  test('muestra los datos técnicos y el aviso de dato de ejemplo', async ({ page }) => {
    await page.goto('/estaciones/cordoba-centro');
    await expect(page.getByRole('heading', { name: 'Córdoba Centro' })).toBeVisible();
    await expect(page.getByText('Dato de ejemplo — no utilizar como información real', { exact: true })).toBeVisible();
    await expect(page.getByText('Operativa').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver en el mapa' })).toHaveAttribute(
      'href',
      '/mapa?estacion=arg-cba-cordoba-centro',
    );
  });

  test('los campos sin verificar muestran el texto explícito en vez de quedar vacíos', async ({ page }) => {
    await page.goto('/estaciones/mendoza-centro');
    await expect(page.getByText('Sin información verificada').first()).toBeVisible();
  });

  test('el listado de estaciones enlaza correctamente a cada ficha', async ({ page }) => {
    await page.goto('/estaciones');
    await page.getByRole('link', { name: /Rosario Centro/ }).click();
    await expect(page).toHaveURL(/\/estaciones\/rosario-centro/);
    await expect(page.getByRole('heading', { name: 'Rosario Centro' })).toBeVisible();
  });
});
