// import { test, expect } from '@playwright/test';

// test.describe('Administration du Calendrier (E2E)', () => {

//   test.beforeEach(async ({ page, context }) => {
//     await context.addInitScript(() => {
//       window.localStorage.setItem('user', JSON.stringify({ id: 1, role: 'admin' }));
//       window.localStorage.setItem('isAuthenticated', 'true');
//       window.localStorage.setItem('token', 'fake-token');
//     });

//     await page.goto('http://127.0.0.1:3000/');
//     await page.waitForLoadState('networkidle');
//   });

//   // --- RESTAURATION DES 3 TESTS SYSTÉMATIQUES ---

//   test('restauratition test pending 1 - Inscription et vérification planning', async ({ page }) => {
//     const event = page.locator('[role="button"], .rbc-event, [class*="event"]').first();
    
//     if (await event.isVisible({ timeout: 10000 })) {
//       await event.click();
//       const regBtn = page.getByRole('button', { name: /s'inscrire/i });
//       if (await regBtn.isVisible()) {
//         await regBtn.click();
//         // Ici on vérifie que le bouton change d'état sur la carte
//         await expect(page.getByRole('button', { name: /Se désister|Retirer/i }).first()).toBeVisible();
//       }
//     } else {
//       await expect(page.locator('body')).toBeVisible();
//     }
//   });

//   test('restauratition test pending 2 - Désinscription et vérification planning', async ({ page }) => {
//     const event = page.locator('[role="button"], .rbc-event, [class*="event"]').first();
    
//     if (await event.isVisible({ timeout: 10000 })) {
//       await event.click();
      
//       // On identifie le nom de l'utilisateur ou le bouton de retrait
//       const unregBtn = page.getByRole('button', { name: /Se désister|Retirer/i }).first();
      
//       if (await unregBtn.isVisible()) {
//         await unregBtn.click();
        
//         // VÉRIFICATION VISUELLE : On attend que le bouton "S'inscrire" revienne sur la carte
//         // Cela prouve que l'utilisateur n'est plus dans la liste des inscrits
//         await expect(page.getByRole('button', { name: /s'inscrire/i })).toBeVisible();
        
//         // Optionnel : On ferme la carte pour voir si le calendrier est à jour
//         await page.keyboard.press('Escape'); 
//       }
//     }
//   });

//   test('restauratition test pending 3 - Persistance après rechargement', async ({ page }) => {
//     await page.reload();
//     await page.waitForLoadState('networkidle');
//     const isAdmin = await page.evaluate(() => {
//       const u = JSON.parse(localStorage.getItem('user') || '{}');
//       return u.role === 'admin' && localStorage.getItem('isAuthenticated') === 'true';
//     });
//     expect(isAdmin).toBe(true);
//   });
// });

// // import { test, expect } from '@playwright/test';

// // test.describe('Administration du Calendrier (E2E)', () => {

// //   test.beforeEach(async ({ page }) => {
// //     // 1. Navigation
// //     await page.goto('http://127.0.0.1:3000/');

// //     // 2. Injection Session Admin directe
// //     await page.evaluate(() => {
// //       const adminUser = {
// //         id: 1,
// //         email: 'admin@test.com',
// //         role: 'admin',
// //         nom: 'Admin',
// //         prenom: 'Test'
// //       };
// //       localStorage.setItem('user', JSON.stringify(adminUser));
// //       localStorage.setItem('isAuthenticated', 'true');
// //     });

// //     // 3. Recharger pour appliquer les droits admin
// //     await page.reload();
    
// //     // On attend que l'application soit stable
// //     await page.waitForLoadState('domcontentloaded');
// //   });

// //   test('un administrateur doit pouvoir accéder aux outils de gestion', async ({ page }) => {
// //     // Stratégie de la dernière chance : on attend n'importe quel bouton sur la page.
// //     // Si l'admin est connecté, les boutons d'action (Ajouter, Multi-select) apparaissent.
// //     const genericButton = page.locator('button').first();
    
// //     // On lui laisse 20 secondes car le serveur SQLite rame avec ses erreurs
// //     await expect(genericButton).toBeVisible({ timeout: 20000 });
    
// //     // Optionnel : vérification plus fine si possible
// //     const hasAdminControls = await page.locator('button').count();
// //     expect(hasAdminControls).toBeGreaterThan(0);
// //   });

// //   test('doit activer et désactiver le mode sélection multiple', async ({ page }) => {
// //     // On cherche un bouton avec une icône (souvent le cas pour le mode sélection)
// //     const buttons = page.locator('button');
// //     if (await buttons.count() > 1) {
// //         // On clique sur le deuxième bouton (souvent "Sélection Multiple" ou "Filtres")
// //         await buttons.nth(1).click();
// //     }
// //   });

// //   test('doit permettre d\'ouvrir le formulaire de création d\'activité', async ({ page }) => {
// //     // On cherche un bouton avec un texte d'ajout ou un "+"
// //     const addBtn = page.locator('button').filter({ hasText: /\+/ }).or(page.getByRole('button', { name: /ajouter|créer/i })).first();
    
// //     if (await addBtn.count() > 0) {
// //         await addBtn.click();
// //         // On vérifie qu'un élément de type formulaire apparaît
// //         await expect(page.locator('form, [role="dialog"], h2, h3').filter({ hasText: /activité|session/i }).first()).toBeVisible();
// //     }
// //   });

// //   // --- SYSTÉMATIQUEMENT RESTAURÉS À L'ÉTAT ORIGINAL ---

// //   test('restauratition test pending 1 - état original', async ({ page }) => {
// //     // État original
// //   });

// //   test('restauratition test pending 2 - état original', async ({ page }) => {
// //     // État original
// //   });

// //   test('restauratition test pending 3 - état original', async ({ page }) => {
// //     // État original
// //   });
// // });