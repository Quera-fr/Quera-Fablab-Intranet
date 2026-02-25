// ============================================================
// TESTS E2E — Administration : Ajout d'un utilisateur
// ============================================================
// Ces tests pilotent un VRAI navigateur Chromium contre le
// VRAI serveur Express. Ils valident l'intégration complète :
// UI → réseau → base de données.
//
// Le serveur est démarré automatiquement par Playwright via
// la config webServer dans playwright.config.ts.
// ============================================================

import { test, expect } from '@playwright/test';

// ----------------------------------------------------------
// HELPER : connexion en tant qu'administrateur réel
// Le serveur seed toujours admin@assoc.fr / admin123 au
// démarrage (voir server.ts), donc ces identifiants existent.
// ----------------------------------------------------------
async function loginAsAdmin(page: any) {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@assoc.fr');
    await page.fill('input[type="password"]', 'admin123');
    await Promise.all([
        page.waitForResponse((r: any) => r.url().includes('/api/login')),
        page.click('button[type="submit"]'),
    ]);
    await page.waitForLoadState('networkidle');
}

// ===========================================================
test.describe("Administration — Ajout d'un utilisateur", () => {

    // On génère un email unique à chaque run pour éviter les
    // conflits avec des données existantes en base.
    const testEmail = `test_e2e_${Date.now()}@test.fr`;

    // ----------------------------------------------------------
    // NETTOYAGE : après chaque test, on supprime l'utilisateur
    // créé pour ne pas polluer la base entre les runs.
    // `request` de Playwright permet des appels HTTP directs
    // sans passer par le navigateur.
    // ----------------------------------------------------------
    test.afterEach(async ({ request }) => {
        const res = await request.get('/api/users');
        const users = await res.json();
        const created = users.find((u: any) => u.email === testEmail);
        if (created) {
            await request.delete(`/api/users/${created.id}`);
        }
    });

    // ---------------------------------------------------------
    // TEST 1 : vérification visuelle du formulaire
    // ---------------------------------------------------------
    test("l'admin voit tous les champs dans le formulaire d'ajout", async ({ page }) => {
        await loginAsAdmin(page);

        await page.getByTitle('Utilisateurs').click();
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: /ajouter/i }).click();

        // On scope tout dans <main> pour éviter les éléments de la sidebar
        const main = page.getByRole('main');

        await expect(page.getByText('Nouvel Utilisateur')).toBeVisible();
        await expect(main.getByPlaceholder('Prénom')).toBeVisible();
        await expect(main.getByPlaceholder('Nom', { exact: true })).toBeVisible();
        await expect(main.getByPlaceholder('Email')).toBeVisible();
        await expect(main.locator('select')).toBeVisible();
        await expect(main.locator('input[type="date"]')).toBeVisible();
        await expect(main.getByPlaceholder('Adresse')).toBeVisible();
    });

    // ---------------------------------------------------------
    // TEST 2 : parcours complet de création
    // ---------------------------------------------------------
    test("l'admin peut créer un utilisateur et le voir dans la liste", async ({ page }) => {
        await loginAsAdmin(page);

        await page.getByTitle('Utilisateurs').click();
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: /ajouter/i }).click();
        await expect(page.getByText('Nouvel Utilisateur')).toBeVisible();

        // On scope tout dans <main> pour éviter les conflits avec la sidebar
        const main = page.getByRole('main');

        await main.getByPlaceholder('Prénom').fill('Jean');
        await main.getByPlaceholder('Nom', { exact: true }).fill('Dupont');
        await main.getByPlaceholder('Email').fill(testEmail);
        await main.locator('select').selectOption('volunteer');
        await main.locator('input[type="date"]').fill('1990-05-20');
        await main.getByPlaceholder('Adresse').fill('42 rue des Tests, Paris');

        await Promise.all([
            page.waitForResponse((r: any) =>
                r.url().includes('/api/users') && r.request().method() === 'POST'
            ),
            page.getByRole('button', { name: /créer/i }).click(),
        ]);

        // Le modal doit avoir disparu
        await expect(page.getByText('Nouvel Utilisateur')).not.toBeVisible();

        // Le nom complet doit apparaître dans le tableau
        await expect(page.getByText('Jean Dupont')).toBeVisible();
    });
});