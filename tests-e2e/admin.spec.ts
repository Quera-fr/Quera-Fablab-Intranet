import { test, expect } from '@playwright/test';
import { User } from '../src/types';

// ===== DONNÉES MOCK =====
const mockAdmin: User = {
  id: 1,
  email: 'admin@assoc.fr',
  lastname: 'Admin',
  firstname: 'Test',
  role: 'admin',
  dob: '1990-01-01',
  address: '1 Rue Admin',
};

const mockUsers: User[] = [
  {
    id: 2,
    email: 'test_volunteer_1@assoc.fr',
    lastname: 'Dupont',
    firstname: 'Jean',
    role: 'volunteer',
    dob: '1990-01-01',
    address: 'Rue 1',
  },
  {
    id: 3,
    email: 'test_beneficiary_1@assoc.fr',
    lastname: 'Martin',
    firstname: 'Marie',
    role: 'beneficiary',
    dob: '2000-01-01',
    address: 'Rue 2',
  },
  {
    id: 4,
    email: 'test_beneficiary_2@assoc.fr',
    lastname: 'Bernard',
    firstname: 'Sophie',
    role: 'beneficiary',
    dob: '2001-01-01',
    address: 'Rue 3',
  },
];

// ===== HELPER LOGIN avec mocks réseau =====
async function loginAsAdmin(page: any) {
  await page.goto('/');

  await page.route('**/api/login', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockAdmin),
    });
  });

  await page.route('**/api/users', async (route: any) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUsers),
      });
    } else {
      await route.continue();
    }
  });

  await page.fill('input[type="email"]', 'admin@assoc.fr');
  await page.fill('input[type="password"]', 'admin123');

  await Promise.all([
    page.waitForResponse((r: any) => r.url().includes('/api/login')),
    page.click('button[type="submit"]'),
  ]);

  await page.waitForLoadState('networkidle');
}

// ===== HELPER LOGIN sans mocks (vrai serveur) =====
async function loginAsReal(page: any) {
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
// TEST E2E — L'utilisateur peut supprimer un utilisateur
// ===========================================================
test.describe('Admin — Suppression d\'un utilisateur', () => {

  test('devrait supprimer un utilisateur simple', async ({ page }) => {
    await loginAsAdmin(page);

    const userBtn = page.getByTitle('Utilisateurs');
    await expect(userBtn).toBeVisible({ timeout: 5000 });
    await userBtn.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const userRows = page.locator('table tbody tr');
    const initialCount = await userRows.count();
    expect(initialCount).toBeGreaterThan(0);

    // Préparer le handler de dialog AVANT de cliquer
    page.once('dialog', (dialog: any) => dialog.accept());

    // Cliquer sur le bouton Supprimer (title="Supprimer") de la première ligne
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.locator('button[title="Supprimer"]').click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });
});

// ===========================================================
// TEST E2E — L'administrateur peut ajouter un utilisateur
// data : mail, nom, prénom, rôle, date de naissance, adresse
// ===========================================================
test.describe("Administration — Ajout d'un utilisateur", () => {

  const testEmail = `test_e2e_${Date.now()}@test.fr`;

  // Nettoyage après chaque test pour ne pas polluer la base
  test.afterEach(async ({ request }) => {
    const res = await request.get('/api/users');
    const users = await res.json();
    const created = users.find((u: any) => u.email === testEmail);
    if (created) {
      await request.delete(`/api/users/${created.id}`);
    }
  });

  test("l'admin peut créer un utilisateur et le voir dans la liste", async ({ page }) => {
    await loginAsReal(page);

    await page.getByTitle('Utilisateurs').click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /ajouter/i }).click();
    await expect(page.getByText('Nouvel Utilisateur')).toBeVisible();

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

    await expect(page.getByText('Nouvel Utilisateur')).not.toBeVisible();
    await expect(page.getByText('Jean Dupont')).toBeVisible();
  });
});