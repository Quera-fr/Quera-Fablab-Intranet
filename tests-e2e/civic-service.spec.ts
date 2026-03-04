import { test, expect } from '@playwright/test';
import { User } from '../src/types';

// ===== MOCK =====
const mockServiceCivique: User = {
    id: 10,
    email: 'civic_service@assoc.fr',
    lastname: 'Dupont',
    firstname: 'Jean',
    role: 'civic_service',
    dob: '2000-01-01',
    address: '1 Rue du Service',
};

// ===== HELPER LOGIN =====
async function loginAsServiceCivique(page: any) {
    await page.goto('/');

    await page.route('**/api/login', async (route: any) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockServiceCivique),
        });
    });

    await page.fill('input[type="email"]', 'civic_service@assoc.fr');
    await page.fill('input[type="password"]', 'civicpass');

    await Promise.all([
        page.waitForResponse((r: any) => r.url().includes('/api/login')),
        page.click('button[type="submit"]'),
    ]);

    await page.waitForLoadState('networkidle');
}

// ===== SUITE =====
test.describe('Service Civique — Authentification', () => {

    test('peut se connecter et voit le planning', async ({ page }) => {
        await loginAsServiceCivique(page);

        await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
    });

    test('peut se déconnecter', async ({ page }) => {
        await loginAsServiceCivique(page);

        await page.getByTitle('Déconnexion').click();

        await expect(page.locator('button[type="submit"]')).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Planning' })).not.toBeVisible();
    });
});

test.describe('Service Civique — Publication d\'une activité', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsServiceCivique(page);
        await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
    });

    test('peut publier une activité avec tous les champs', async ({ page }) => {
        let activityCreated = false;
        let capturedBody: Record<string, any> = {};

        const mockActivity = {
            id: 999,
            title: 'Atelier Service Civique',
            description: 'Description test service civique',
            max_participants: 8,
            deadline: '2026-06-01',
            image_url: 'https://cdn.example.com/test.png',
            start_time: '2026-03-05T14:00:00.000Z',
            end_time: '2026-03-05T16:00:00.000Z',
            type: 'activity',
            status: 'pending',
            creator_name: 'Jean Dupont',
            participants: [],
        };

        await page.route('/api/upload', async (route: any) => {
            await route.fulfill({
                status: 200,
                json: { url: 'https://cdn.example.com/test.png' },
            });
        });

        await page.route('/api/activities', async (route: any) => {
            if (route.request().method() === 'POST') {
                capturedBody = route.request().postDataJSON();
                activityCreated = true;
                await route.fulfill({ status: 201, json: mockActivity });
            } else {
                await route.continue();
            }
        });

        await page.route('/api/sessions', async (route: any) => {
            if (route.request().method() === 'GET') {
                const realResponse = await route.fetch();
                const sessions = await realResponse.json();
                await route.fulfill({
                    status: 200,
                    json: [...sessions, {
                        id: 9999,
                        type: 'activity',
                        activity_id: 999,
                        start_time: '2026-03-05T14:00:00.000Z',
                        end_time: '2026-03-05T16:00:00.000Z',
                        title: 'Atelier Service Civique',
                        description: 'Description test service civique',
                        status: 'pending',
                        max_participants: 8,
                        participants: [],
                    }],
                });
            } else {
                await route.continue();
            }
        });

        // Ouvrir le formulaire
        await page.getByRole('button', { name: 'Nouvelle Activité', exact: true }).click();
        await expect(page.locator('h3', { hasText: 'Nouvel Atelier' })).toBeVisible();

        // Remplir tous les champs
        await page.fill('input[name="title"]', 'Atelier Service Civique');
        await page.fill('textarea[name="description"]', 'Description test service civique');
        await page.fill('input[name="max_participants"]', '8');
        await page.fill('input[name="deadline"]', '2026-06-01');

        // Image
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from('fake-image'),
        });
        await expect(page.locator('img[alt="Preview"]')).toBeVisible({ timeout: 3000 });

        // Soumettre
        await Promise.all([
            page.waitForResponse((r: any) =>
                r.url().includes('/api/activities') &&
                r.request().method() === 'POST'
            ),
            page.getByRole('button', { name: 'Soumettre' }).click(),
        ]);

        // Vérifications
        expect(activityCreated).toBeTruthy();
        expect(capturedBody.title).toBe('Atelier Service Civique');
        expect(capturedBody.description).toBe('Description test service civique');
        expect(capturedBody.max_participants).toBe(8);
        expect(capturedBody.deadline).toBe('2026-06-01');
        expect(capturedBody.image_url).toBe('https://cdn.example.com/test.png');

        // Le modal se ferme
        await expect(page.locator('h3', { hasText: 'Nouvel Atelier' })).not.toBeVisible();

        // L'activité apparaît dans le planning avec statut "pending"
        await expect(page.locator('text=Atelier Service Civique').first()).toBeVisible({ timeout: 5000 });
    });
});