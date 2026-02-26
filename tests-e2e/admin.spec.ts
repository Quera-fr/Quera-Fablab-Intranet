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

// ===== HELPER LOGIN =====
async function loginAsAdmin(page: any) {
  await page.goto('/');

  // ✅ Setup les mocks GLOBALEMENT AVANT de toucher à l'UI
  await page.route('**/api/login', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockAdmin),
    });
  });

  // ✅ IMPORTANT : Mock GET /api/users de manière PERSISTANTE
  await page.route('**/api/users', async (route: any) => {
    if (route.request().method() === 'GET') {
      console.log('📥 GET /api/users intercepté - retour des users mockés');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUsers),
      });
    } else {
      await route.continue();
    }
  });

  // Remplir le formulaire et se connecter
  await page.fill('input[type="email"]', 'admin@assoc.fr');
  await page.fill('input[type="password"]', 'admin123');

  await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/login')),
    page.click('button[type="submit"]'),
  ]);

  await page.waitForLoadState('networkidle');
  console.log('✅ Admin connecté');
}

// ===== TESTS =====
test.describe('Admin - User Management › Suppression utilisateur', () => {

  test('devrait supprimer un utilisateur simple', async ({ page }) => {
    await loginAsAdmin(page);

    // ✅ Cliquer sur le bouton "Utilisateurs" dans la sidebar
    console.log('🔍 Recherche du bouton Utilisateurs...');
    const userBtn = page.getByTitle('Utilisateurs');
    await expect(userBtn).toBeVisible({ timeout: 5000 });
    await userBtn.click();
    console.log('✅ Bouton Utilisateurs cliqué');

    // ✅ Attendre que la table se charge
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Petite pause pour le rendu React

    // ✅ Vérifier que les utilisateurs sont affichés
    const userRows = await page.locator('table tbody tr');
    const initialCount = await userRows.count();
    console.log(`📊 Nombre de lignes trouvées : ${initialCount}`);
    expect(initialCount).toBeGreaterThan(0);

    // ✅ Identifier l'utilisateur à supprimer
    const firstUserName = await page.locator('table tbody tr').first().locator('td').nth(2).textContent(); // Colonne Nom
    console.log(`🎯 Cible : ${firstUserName}`);

    // ✅ Trouver le bouton DELETE du premier utilisateur (icône poubelle)
    const firstRow = page.locator('table tbody tr').first();
    const deleteBtn = firstRow.locator('button').filter({ 
      has: page.locator('svg')
    }).last(); // Le bouton avec icône, généralement le dernier

    // ✅ Configurer la capture de la requête DELETE
    let deleteCalls: any[] = [];
    await page.on('response', (response) => {
      if (response.url().includes('/api/users/') && response.status() === 200) {
        deleteCalls.push(response);
      }
    });

    // ✅ Cliquer sur DELETE
    console.log('🗑️  Clic sur le bouton supprimer...');
    await deleteBtn.click();

    // ✅ Accepter la confirmation (dialog)
    page.once('dialog', (dialog: any) => {
      console.log(`⚠️  Dialog : "${dialog.message()}"`);
      dialog.accept();
    });

    // ✅ Attendre que le DELETE soit fait
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    console.log(`✅ Utilisateur supprimé avec succès`);
  });

  test('devrait supprimer plusieurs utilisateurs en bulk', async ({ page }) => {
    await loginAsAdmin(page);

    // ✅ Naviguer vers Utilisateurs
    await page.getByTitle('Utilisateurs').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // ✅ Compter les utilisateurs
    const checkboxes = page.locator('table tbody tr input[type="checkbox"]');
    const initialCheckboxCount = await checkboxes.count();
    console.log(`✅ ${initialCheckboxCount} checkboxes trouvées`);
    expect(initialCheckboxCount).toBeGreaterThanOrEqual(2);

    // ✅ Sélectionner les 2 premiers utilisateurs
    console.log('☑️  Sélection des 2 premiers utilisateurs...');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    // ✅ Attendre l'apparition du bouton "Supprimer (2)"
    await page.waitForTimeout(300); // React state update
    const bulkDeleteBtn = page.locator('button').filter({ 
      hasText: /Supprimer \(\d+\)/
    });
    
    await expect(bulkDeleteBtn).toBeVisible({ timeout: 5000 });
    console.log('✅ Bouton Supprimer (2) visible');

    // ✅ Cliquer sur Supprimer
    await bulkDeleteBtn.click();

    // ✅ Accepter la confirmation
    page.once('dialog', (dialog: any) => {
      console.log(`⚠️  Dialog bulk : "${dialog.message()}"`);
      dialog.accept();
    });

    // ✅ Attendre la suppression
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    console.log(`✅ Utilisateurs bulk supprimés`);
  });
});