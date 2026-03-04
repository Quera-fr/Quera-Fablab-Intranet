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

// Factory function to create fresh mock users per test
const createMockUsers = (): User[] => [
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

// ===========================================================
// TEST E2E — L'utilisateur peut supprimer un utilisateur
// ===========================================================
test.describe('Admin — Suppression d\'un utilisateur', () => {

  test('devrait supprimer un utilisateur simple', async ({ page }) => {
    const mockUsers = createMockUsers();

    // Setup routes for this test only

    await page.route('**/api/login', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAdmin),
      });
    });

    // Route for both GET list and DELETE operations
    await page.route('**/api/users**', async (route: any) => {
      const method = route.request().method();
      const url = route.request().url();
      
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockUsers),
        });
      } else if (method === 'DELETE') {
        // Extract ID from URL (last path segment)
        const segments = url.split('/');
        const id = Number(segments[segments.length - 1]);
        if (!isNaN(id)) {
          const index = mockUsers.findIndex(u => u.id === id);
          if (index !== -1) {
            mockUsers.splice(index, 1);
          }
        }
        await route.fulfill({ status: 200 });
      } else {
        await route.continue();
      }
    });

    // Navigate to app
    await page.goto('/');

    // If the login form is present, perform login; otherwise assume already logged in
    const emailLocator = page.locator('input[type="email"]');
    if (await emailLocator.count() > 0) {
      await emailLocator.waitFor({ state: 'visible', timeout: 5000 });
      await page.fill('input[type="email"]', 'admin@assoc.fr');
      await page.fill('input[type="password"]', 'admin123');

      await Promise.all([
        page.waitForResponse((r: any) => r.url().includes('/api/login')),
        page.click('button[type="submit"]'),
      ]);
    }

    await page.waitForLoadState('networkidle');

    // Navigate to users
    await page.getByTitle('Utilisateurs').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const userRows = page.locator('table tbody tr');
    const initialCount = await userRows.count();
    expect(initialCount).toBe(3); // We expect our 3 mock users

    // Setup dialog handler
    page.once('dialog', (dialog: any) => dialog.accept());

    // Click delete on first row
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.locator('button[title="Supprimer"]').click();
    
    // Wait for deletion to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Vérifier que l'utilisateur a bien été supprimé
    const finalCount = await userRows.count();
    expect(finalCount).toBe(initialCount - 1);
  });
});

// ===========================================================
// TEST E2E — L'administrateur peut ajouter un utilisateur
// ===========================================================
test.describe("Administration — Ajout d'un utilisateur", () => {

  test("l'admin peut créer un utilisateur et le voir dans la liste", async ({ page }) => {
    const mockUsers = createMockUsers();

    // Setup routes for this test only

    await page.route('**/api/login', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAdmin),
      });
    });

    // Route for users list and creation
    let creationHandled = false;
    await page.route('**/api/users**', async (route: any) => {
      const method = route.request().method();
      
      if (method === 'POST' && !creationHandled) {
        creationHandled = true;
        const newUser: User = {
          id: 99,
          email: 'test_created@assoc.fr',
          lastname: 'User',
          firstname: 'TestCreated',
          role: 'volunteer',
          dob: '1995-05-20',
          address: 'Test Address',
        };
        mockUsers.push(newUser);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newUser),
        });
      } else if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockUsers),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to app
    await page.goto('/');

    // If the login form is present, perform login; otherwise assume already logged in
    const emailLocator2 = page.locator('input[type="email"]');
    if (await emailLocator2.count() > 0) {
      await emailLocator2.waitFor({ state: 'visible', timeout: 5000 });
      await page.fill('input[type="email"]', 'admin@assoc.fr');
      await page.fill('input[type="password"]', 'admin123');

      await Promise.all([
        page.waitForResponse((r: any) => r.url().includes('/api/login')),
        page.click('button[type="submit"]'),
      ]);
    }

    await page.waitForLoadState('networkidle');

    // Navigate to users
    await page.getByTitle('Utilisateurs').click();
    await page.waitForLoadState('networkidle');

    // Click add button
    await page.getByRole('button', { name: /ajouter/i }).click();
    await expect(page.getByText('Nouvel Utilisateur')).toBeVisible();

    const main = page.getByRole('main');

    // Fill form
    await main.getByPlaceholder('Prénom').fill('TestCreated');
    await main.getByPlaceholder('Nom', { exact: true }).fill('User');
    await main.getByPlaceholder('Email').fill('test_created@assoc.fr');
    await main.locator('select').selectOption('volunteer');
    await main.locator('input[type="date"]').fill('1995-05-20');
    await main.getByPlaceholder('Adresse').fill('Test Address');

    // Click create
    await page.getByRole('button', { name: /créer/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Verify
    await expect(page.getByText('Nouvel Utilisateur')).not.toBeVisible();
    await expect(page.getByText('TestCreated User')).toBeVisible();
  });
});
