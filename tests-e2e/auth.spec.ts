import { test, expect } from '@playwright/test';
import { User } from '../src/types';

// Faux utilisateur bénéficiaire que l'API "renverrait"
const mockBeneficiary: User = {
    id: 42,
    email: 'test_beneficiary_1@assoc.fr',
    lastname: 'Martin',
    firstname: 'Alice',
    role: 'beneficiary',
    dob: '2005-06-15',
    address: '1 Rue du Test',
};
const mockAdmin: User = {
    id: 1,
    email: 'admin@assoc.fr',
    lastname: 'Admin',
    firstname: 'User',
    role: 'admin',
    dob: '1990-01-01',
    address: '1 Rue Admin',
};


// Helper réutilisable : simule une connexion bénéficiaire réussie
async function loginAsBeneficiary(page: any) {
    await page.goto('/');

    // On intercepte /api/login AVANT de cliquer pour renvoyer notre faux bénéficiaire
    await page.route('**/api/login', async (route: any) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockBeneficiary),
        });
    });

    await page.fill('input[type="email"]', 'test_beneficiary_1@assoc.fr');
    await page.fill('input[type="password"]', 'password123');

    await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/login')),
        page.click('button[type="submit"]'),
    ]);

    // On attend que le rendu React soit stable
    await page.waitForLoadState('networkidle');
}

// helper pour admin
async function loginAsAdmin(page: any) {
    await page.goto('/');

    await page.route('**/api/login', async (route: any) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockAdmin),
        });
    });

    await page.fill('input[type="email"]', 'admin@assoc.fr');
    await page.fill('input[type="password"]', 'admin123');

    await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/login')),
        page.click('button[type="submit"]'),
    ]);

    await page.waitForLoadState('networkidle');
}

test.describe('Authentification — Bénéficiaire', () => {

    // --- TEST 1 : connexion réussie ---
    test('un bénéficiaire peut se connecter avec ses identifiants', async ({ page }) => {
        await loginAsBeneficiary(page);

        // Le calendrier doit être visible
        await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();

        // Un bénéficiaire ne doit PAS voir les boutons admin/bénévole
        await expect(page.getByRole('button', { name: 'Nouvelle Activité' })).not.toBeVisible();
        await expect(page.getByRole('button', { name: 'Semaine Type' })).not.toBeVisible();
    });

    // --- TEST 2 : identifiants incorrects ---
    test("un message d'erreur s'affiche si les identifiants sont incorrects", async ({ page }) => {
        await page.goto('/');

        // Cette fois on laisse la vraie API répondre (mauvais mot de passe → 401)
        await page.fill('input[type="email"]', 'test_beneficiary_1@assoc.fr');
        await page.fill('input[type="password"]', 'mauvais_mot_de_passe');
        await page.click('button[type="submit"]');

        // Le message d'erreur doit apparaître
        await expect(page.locator('text=Identifiants incorrects')).toBeVisible();

        // On reste sur la page de login
        await expect(page.locator('h2', { hasText: 'Planning' })).not.toBeVisible();
    });

    // --- TEST 3 : déconnexion ---
    test('un bénéficiaire connecté peut se déconnecter', async ({ page }) => {
        // On se connecte d'abord
        await loginAsBeneficiary(page);
        await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();

        // On clique sur le bouton déconnexion (title="Déconnexion" dans App.tsx)
        await page.getByTitle('Déconnexion').click();

        // On doit retomber sur le formulaire de login
        await expect(page.locator('button[type="submit"]')).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Planning' })).not.toBeVisible();
    });
});
// ===== TESTS ADMINISTRATEUR =====
test.describe('Authentification — Administrateur', () => {

    test('un administrateur peut se connecter avec ses identifiants', async ({ page }) => {
        await loginAsAdmin(page);

        await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();

        await expect(page.getByRole('button', { name: 'Nouvelle Activité' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Semaine Type' })).toBeVisible();

        await expect(page.getByTitle('Utilisateurs')).toBeVisible();
    });

    test('un administrateur connecté peut se déconnecter', async ({ page }) => {
        await loginAsAdmin(page);
        await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();

        await page.getByTitle('Déconnexion').click();
            await expect(page.locator('button[type="submit"]')).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Planning' })).not.toBeVisible();
    });
});