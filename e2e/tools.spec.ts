import { test, expect } from '@playwright/test';

test.describe('Herramientas', () => {
  test('el diagnóstico de problemas sugiere pasos según los síntomas elegidos', async ({ page }) => {
    await page.goto('/herramientas/diagnostico');
    await expect(page.getByText('Seleccioná al menos un síntoma')).toBeVisible();
    await page.getByLabel('La imagen se pixela').check();
    await expect(page.getByRole('heading', { name: /Pasos sugeridos/i })).toBeVisible();
    await expect(page.getByText(/orientación de la antena/i)).toBeVisible();
  });

  test('calcular distancia muestra resultados al elegir localidad y estación', async ({ page }) => {
    await page.goto('/herramientas/calcular-distancia');
    await page.getByLabel('Elegir localidad de origen').selectOption({ label: 'Rosario' });
    await page.getByLabel('Estación de destino').selectOption({ label: 'Córdoba Centro' });
    await expect(page.getByText('Azimut', { exact: true })).toBeVisible();
    await expect(page.getByText('Distancia lineal', { exact: true })).toBeVisible();
  });

  test('la página de herramientas enlaza a las 4 herramientas', async ({ page }) => {
    await page.goto('/herramientas');
    for (const name of ['Estación más cercana', 'Orientar antena', 'Calcular distancia', 'Diagnóstico de problemas']) {
      await expect(page.getByRole('heading', { name })).toBeVisible();
    }
  });
});
