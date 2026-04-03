import { test, expect } from '@playwright/test';
import { User } from '../src/types';

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

async function loginAsBeneficiary(page: any) {
    await page.goto('/');
    await page.getByRole('button', { name: /Se connecter/i }).click();
    await expect(page.locator('input[type="email"]')).toBeVisible();

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
        page.waitForResponse((r: any) => r.url().includes('/api/login')),
        page.click('button[type="submit"]'),
    ]);

    await page.waitForLoadState('networkidle');
}

async function loginAsAdmin(page: any) {
    await page.goto('/');
    await page.getByRole('button', { name: /Se connecter/i }).click();
    await expect(page.locator('input[type="email"]')).toBeVisible();

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
        page.waitForResponse((r: any) => r.url().includes('/api/login')),
        page.click('button[type="submit"]'),
    ]);

    await page.waitForLoadState('networkidle');
}

test.describe('Authentification — Vue Publique', () => {
    test('page d\'accueil affiche le planning public avec bouton Se connecter', async ({ page }) => {
        await page.goto('/');

        // Planning should be visible
        await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();

        // Login button should be visible
        await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible();

        // Admin buttons should NOT be visible
        await expect(page.getByRole('button', { name: /Nouvelle Activité/i })).not.toBeVisible();
        await expect(page.getByRole('button', { name: /Semaine Type/i })).not.toBeVisible();
    });

    test('clic sur Se connecter affiche la page de login', async ({ page }) => {
        await page.goto('/');

        const loginBtn = page.getByRole('button', { name: /Se connecter/i });
        await loginBtn.click();

        // Login form should appear
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });
});

test.describe('Authentification — Bénéficiaire', () => {
    test('un bénéficiaire peut se connecter avec ses identifiants', async ({ page }) => {
        await loginAsBeneficiary(page);

        await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();

        // Beneficiary should not see admin buttons
        await expect(page.getByRole('button', { name: 'Nouvelle Activité' })).not.toBeVisible();
        await expect(page.getByRole('button', { name: 'Semaine Type' })).not.toBeVisible();
    });

    test('un message d\'erreur s\'affiche si les identifiants sont incorrects', async ({ page }) => {
        await page.goto('/');

        // Click login button first
        const loginBtn = page.getByRole('button', { name: /Se connecter/i });
        await loginBtn.click();

        await page.fill('input[type="email"]', 'test_beneficiary_1@assoc.fr');
        await page.fill('input[type="password"]', 'mauvais_mot_de_passe');
        await page.click('button[type="submit"]');

        await expect(page.locator('text=Identifiants incorrects')).toBeVisible();
    });

    test('un bénéficiaire connecté peut se déconnecter et retourner à la vue publique', async ({ page }) => {
        await loginAsBeneficiary(page);
        await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();

        await page.getByTitle('Déconnexion').click();

        // Should return to public view with login button
        await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
    });
});

test.describe('Authentification — Administrateur', () => {
    test('un administrateur peut se connecter avec ses identifiants', async ({ page }) => {
        await loginAsAdmin(page);

        await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
        await expect(page.getByRole('button', { name: /Nouvelle Activité/i })).toBeVisible();
    });

    test('un administrateur connecté peut se déconnecter', async ({ page }) => {
        await loginAsAdmin(page);
        await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();

        await page.getByTitle('Déconnexion').click();

        // Should return to public view
        await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible();
    });
});