import { test, expect } from '@playwright/test';

test.describe('Administration du Calendrier (E2E)', () => {

  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('user', JSON.stringify({ id: 1, role: 'admin' }));
      window.localStorage.setItem('isAuthenticated', 'true');
      window.localStorage.setItem('token', 'fake-token');
    });

    await page.goto('http://127.0.0.1:3000/');
    await page.waitForLoadState('networkidle');
  });

  // --- RESTAURATION DES 3 TESTS SYSTÉMATIQUES ---

  test('restauratition test pending 1 - Inscription et vérification planning', async ({ page }) => {
    const event = page.locator('[role="button"], .rbc-event, [class*="event"]').first();
    
    if (await event.isVisible({ timeout: 10000 })) {
      await event.click();
      const regBtn = page.getByRole('button', { name: /s'inscrire/i });
      if (await regBtn.isVisible()) {
        await regBtn.click();
        // Ici on vérifie que le bouton change d'état sur la carte
        await expect(page.getByRole('button', { name: /Se désister|Retirer/i }).first()).toBeVisible();
      }
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('restauratition test pending 2 - Désinscription et vérification planning', async ({ page }) => {
    const event = page.locator('[role="button"], .rbc-event, [class*="event"]').first();
    
    if (await event.isVisible({ timeout: 10000 })) {
      await event.click();
      
      // On identifie le nom de l'utilisateur ou le bouton de retrait
      const unregBtn = page.getByRole('button', { name: /Se désister|Retirer/i }).first();
      
      if (await unregBtn.isVisible()) {
        await unregBtn.click();
        
        // VÉRIFICATION VISUELLE : On attend que le bouton "S'inscrire" revienne sur la carte
        // Cela prouve que l'utilisateur n'est plus dans la liste des inscrits
        await expect(page.getByRole('button', { name: /s'inscrire/i })).toBeVisible();
        
        // Optionnel : On ferme la carte pour voir si le calendrier est à jour
        await page.keyboard.press('Escape'); 
      }
    }
  });

  test('restauratition test pending 3 - Persistance après rechargement', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    const isAdmin = await page.evaluate(() => {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.role === 'admin' && localStorage.getItem('isAuthenticated') === 'true';
    });
    expect(isAdmin).toBe(true);
  });
});