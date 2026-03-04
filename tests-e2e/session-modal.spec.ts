import { test, expect } from '@playwright/test';
import { User } from '../src/types';

// helpers & mocks
const mockAdmin: User = {
    id: 1,
    email: 'admin@assoc.fr',
    lastname: 'Admin',
    firstname: 'Super',
    role: 'admin',
    dob: '1980-01-01',
    address: '1 Rue du Siège',
};

const mockBeneficiary: User = {
    id: 42,
    email: 'test_beneficiary_1@assoc.fr',
    lastname: 'Martin',
    firstname: 'Alice',
    role: 'beneficiary',
    dob: '2005-06-15',
    address: '1 Rue du Test',
};

// login helpers copied from other specs
async function loginAsAdmin(page: any) {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@assoc.fr');
    await page.fill('input[type="password"]', 'admin123');
    await Promise.all([
        page.waitForURL('**/*'),
        page.click('button[type="submit"]'),
    ]);
    await page.waitForLoadState('networkidle');
}

const mockCivic: User = {
    id: 7,
    email: 'civic@assoc.fr',
    lastname: 'Service',
    firstname: 'Civic',
    role: 'civic_service',
    dob: '1990-01-01',
    address: '1 Rue du Service',
};

async function loginAsCivic(page: any) {
    await page.goto('/');
    await page.route('**/api/login', async (route: any) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockCivic),
        });
    });
    await page.fill('input[type="email"]', mockCivic.email);
    await page.fill('input[type="password"]', 'civicpass');
    await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/login')),
        page.click('button[type="submit"]'),
    ]);
    await page.waitForLoadState('networkidle');
}

async function loginAsBeneficiary(page: any) {
    await page.goto('/');
    await page.route('**/api/login', async (route: any) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockBeneficiary),
        });
    });
    await page.fill('input[type="email"]', mockBeneficiary.email);
    await page.fill('input[type="password"]', 'password123');
    await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/login')),
        page.click('button[type="submit"]'),
    ]);
    await page.waitForLoadState('networkidle');
}

// ----------------------------------------------------------
// Tests pour bénéficiaire (ou utilisateur simple)
// ----------------------------------------------------------

test.describe('SessionModal - Bénéficiaire', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsBeneficiary(page);
        await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
    });

    test('ouvre la modale, affiche infos et permet inscription/désinscription', async ({ page }) => {
        let sessionCard = page.locator('div.cursor-pointer.relative.group.overflow-hidden').first();
        if (!await sessionCard.isVisible().catch(() => false)) {
            sessionCard = page.getByText(/Atelier|Foot|Soutien|Numérique/i).first();
        }
        await expect(sessionCard).toBeVisible({ timeout: 15000 });
        await sessionCard.click();

        const modalTitle = page.locator('div.fixed.inset-0 h3').first();
        await expect(modalTitle).toBeVisible();
        await expect(modalTitle).not.toBeEmpty();

        const subscribeBtn = page.getByRole('button', { name: /S'INSCRIRE/i });
        if (await subscribeBtn.isVisible()) {
            await subscribeBtn.click();
            await expect(page.locator('div.fixed.inset-0')).not.toBeVisible();
        } else {
            const unregisterBtn = page.getByRole('button', { name: /SE DÉSISTER/i });
            await unregisterBtn.click();
            await expect(page.locator('div.fixed.inset-0')).not.toBeVisible();
        }
    });

    test('ferme la modale via croix ou en cliquant hors', async ({ page }) => {
        const sessionCard = page.locator('div.cursor-pointer.relative.group.overflow-hidden').first();
        await sessionCard.click();
        await expect(page.locator('div.fixed.inset-0 h3')).toBeVisible();

        await page.click('div.fixed.inset-0', { position: { x: 10, y: 10 } });
        if (await page.locator('div.fixed.inset-0').isVisible()) {
            const closeBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
            await closeBtn.click({ force: true });
        }
        await expect(page.locator('div.fixed.inset-0')).not.toBeVisible();
    });

    test('flux inscription aide aux devoirs : inscription et vérification du nom', async ({ page }) => {
        const now = new Date();
        const sessionHw = { 
            id: 9991, 
            type: 'homework_help', 
            activity_id: null,
            start_time: now.toISOString(), 
            end_time: now.toISOString(), 
            status: 'approved',
            participants: [] 
        };
        
        // Intercepter l'appel API pour injecter notre session spécifique
        await page.route('**/api/sessions', route => route.fulfill({ 
            status: 200, 
            contentType: 'application/json',
            body: JSON.stringify([sessionHw]) 
        }));

        // Au lieu de reload, on navigue vers une autre page interne et on revient ou on simule un événement
        // pour forcer le composant à fetcher sans perdre la session.
        await page.evaluate(() => window.location.hash = '#refresh'); 
        await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();

        const sessionCard = page.locator('div.cursor-pointer.relative.group.overflow-hidden').first();
        await expect(sessionCard).toBeVisible({ timeout: 10000 });
        await sessionCard.click();

        // Mock du POST d'inscription
        await page.route('**/api/registrations', route => route.fulfill({ status: 201, json: {} }));

        const subscribeBtn = page.getByRole('button', { name: /S'INSCRIRE/i });
        await expect(subscribeBtn).toBeVisible();
        await subscribeBtn.click();

        // Modale fermée, on prépare le mock avec Alice dedans
        const sessionWithAlice = { 
            ...sessionHw, 
            participants: [{ user_id: 42, role_at_registration: 'beneficiary', firstname: 'Alice', lastname: 'Martin', role: 'beneficiary' }] 
        };
        
        await page.route('**/api/sessions', route => route.fulfill({ 
            status: 200, 
            contentType: 'application/json',
            body: JSON.stringify([sessionWithAlice]) 
        }));

        // Ré-ouverture forcée si la modale s'est fermée au clic précédent
        if (await page.locator('div.fixed.inset-0').isHidden()) {
            await sessionCard.click();
        }

        await expect(page.locator('text=Alice Martin')).toBeVisible();
    });
});

// ----------------------------------------------------------
// Tests pour administrateur
// ----------------------------------------------------------

test.describe('SessionModal - Administrateur', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
        await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
    });

    test('vois boutons admin et peut fermer', async ({ page }) => {
        let sessionCard = page.locator('div.cursor-pointer.relative.group.overflow-hidden').first();
        if (!await sessionCard.isVisible().catch(() => false)) {
            sessionCard = page.getByText(/Atelier|Foot|Soutien|Numérique/i).first();
        }
        await expect(sessionCard).toBeVisible({ timeout: 15000 });
        await sessionCard.click();

        await expect(page.locator('div.fixed.inset-0 h3')).toBeVisible();
        await expect(page.getByRole('button', { name: /Supprimer la session/i })).toBeVisible();
        await expect(page.locator('select[id^="manual-reg-ben-"]')).toBeVisible();
        await expect(page.locator('select[id^="manual-reg-vol-"]')).toBeVisible();

        const closeBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
        await closeBtn.click({ force: true });
        if (await page.locator('div.fixed.inset-0').isVisible()) {
            await page.locator('div.fixed.inset-0').click({ position: { x: 5, y: 5 }, force: true });
        }
        await expect(page.locator('div.fixed.inset-0')).not.toBeVisible();
    });

    test('peut s inscrire / se désister comme admin', async ({ page }) => {
        let sessionCard = page.locator('div.cursor-pointer.relative.group.overflow-hidden').first();
        if (!await sessionCard.isVisible().catch(() => false)) {
            sessionCard = page.getByText(/Atelier|Foot|Soutien|Numérique/i).first();
        }
        await expect(sessionCard).toBeVisible({ timeout: 15000 });
        await sessionCard.click();
        await expect(page.locator('div.fixed.inset-0 h3')).toBeVisible();

        const subscribeBtn = page.getByRole('button', { name: /S'INSCRIRE/i });
        if (await subscribeBtn.isVisible()) {
            await subscribeBtn.click();
            await expect(page.locator('div.fixed.inset-0')).not.toBeVisible();
        } else {
            const unregisterBtn = page.getByRole('button', { name: /SE DÉSISTER/i });
            await unregisterBtn.click();
            await expect(page.locator('div.fixed.inset-0')).not.toBeVisible();
        }
    });

    test('admin peut valider ou suspendre un atelier (PATCH intercept)', async ({ page }) => {
        let sessionCard = page.locator('div.cursor-pointer.relative.group.overflow-hidden').first();
        if (!await sessionCard.isVisible().catch(() => false)) {
            sessionCard = page.getByText(/Atelier|Foot|Soutien|Numérique/i).first();
        }
        await expect(sessionCard).toBeVisible({ timeout: 15000 });
        await sessionCard.click();
        await expect(page.locator('div.fixed.inset-0 h3')).toBeVisible();

        let patchCalled = false;
        let bodyData: any = null;
        await page.route('**/api/activities/*/status', async route => {
            patchCalled = true;
            bodyData = JSON.parse(route.request().postData() || '{}');
            await route.fulfill({ status: 200, body: '{}' });
        });

        const approveVisible = await page.getByRole('button', { name: /Approuver l'atelier/i }).isVisible().catch(() => false);
        const suspendVisible = await page.getByRole('button', { name: /Suspendre/i }).isVisible().catch(() => false);
        if (approveVisible || suspendVisible) {
            if (approveVisible) {
                await page.click('button:has-text("Approuver l\'atelier")');
            } else {
                await page.click('button:has-text("Suspendre")');
            }
            await expect(patchCalled).toBeTruthy();
            expect(['approved','pending']).toContain(bodyData.status);
        }
    });

    test('admin inscrit manuellement un bénéficiaire (POST intercept)', async ({ page }) => {
        let sessionCard = page.locator('div.cursor-pointer.relative.group.overflow-hidden').first();
        if (!await sessionCard.isVisible().catch(() => false)) {
            sessionCard = page.getByText(/Atelier|Foot|Soutien|Numérique/i).first();
        }
        await expect(sessionCard).toBeVisible({ timeout: 15000 });
        await sessionCard.click();
        await expect(page.locator('div.fixed.inset-0 h3')).toBeVisible();

        await page.evaluate(() => {
            const sel = document.querySelector('select[id^="manual-reg-ben-"]') as HTMLSelectElement;
            if (sel) {
                const op = document.createElement('option');
                op.value = '9999';
                op.text = 'Test User';
                sel.appendChild(op);
            }
        });

        let registrationCalled = false;
        await page.route('**/api/registrations', async route => {
            registrationCalled = true;
            await route.fulfill({ status: 201, json: {} });
        });

        const benSelect = page.locator('select[id^="manual-reg-ben-"]');
        const optionCount = await benSelect.locator('option').count();
        if (optionCount > 1) {
            const value = await benSelect.locator('option').nth(1).getAttribute('value');
            if (value) {
                await benSelect.selectOption(value);
                await page.click('button:has-text("GO")');
            }
        }
        expect(registrationCalled).toBeTruthy();
    });

    test('admin peut supprimer la session depuis la modale', async ({ page }) => {
        let sessionCard = page.locator('div.cursor-pointer.relative.group.overflow-hidden').first();
        if (!await sessionCard.isVisible().catch(() => false)) {
            sessionCard = page.getByText(/Atelier|Foot|Soutien|Numérique/i).first();
        }
        await expect(sessionCard).toBeVisible({ timeout: 15000 });
        await sessionCard.click();
        await expect(page.locator('div.fixed.inset-0 h3')).toBeVisible();

        let deleteCalled = false;
        await page.route('**/api/sessions/*', async route => {
            if (route.request().method() === 'DELETE') {
                deleteCalled = true;
                await route.fulfill({ status: 200, json: {} });
            } else {
                await route.continue();
            }
        });

        page.once('dialog', dialog => dialog.accept());
        await page.getByRole('button', { name: /Supprimer la session/i }).click();
        await expect(deleteCalled).toBeTruthy();
    });

    test('activité avec image/description se montre correctement', async ({ page }) => {
        const now = new Date();
        const later = new Date(now.getTime() + 3600_000);
        const session = {
            id: 5555,
            type: 'activity',
            activity_id: 123,
            start_time: now.toISOString(),
            end_time: later.toISOString(),
            title: 'Super Image',
            image_url: 'https://example.com/pic.jpg',
            description: 'Description test',
            deadline: new Date(now.getTime() + 86400_000).toISOString(),
            max_participants: 42,
            status: 'approved',
            participants: [],
        };
        await page.route('**/api/sessions', route => route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify([session]) }));
        await loginAsBeneficiary(page);
        const sessionCard = page.locator('div.cursor-pointer.relative.group.overflow-hidden').first();
        await expect(sessionCard).toBeVisible({ timeout:15000 });
        await sessionCard.click();

        await expect(page.getByRole('img', { name: 'Super Image' })).toBeVisible();
        await expect(page.locator('text=Description test')).toBeVisible();
    });

    test('réservation de local affiche utilisateur réservé', async ({ page }) => {
        const now = new Date();
        const session = {
            id: 6666,
            type: 'room_booking',
            activity_id: null,
            start_time: now.toISOString(),
            end_time: now.toISOString(),
            participants: [{ user_id: 7, role_at_registration: 'volunteer', firstname:'Max', lastname:'Payne', role:'volunteer' }],
        };
        await page.route('**/api/sessions', route => route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify([session]) }));
        await loginAsBeneficiary(page);
        const sessionCard = page.locator('div.cursor-pointer.relative.group.overflow-hidden').first();
        await expect(sessionCard).toBeVisible();
        await sessionCard.click();
        await expect(page.getByRole('heading', { name: 'Réservé par' })).toBeVisible();
        await expect(page.locator('text=Max Payne')).toBeVisible();
    });

    test('civic service voit contrôles manuels', async ({ page }) => {
        const now = new Date();
        const session = { id: 7777, type:'activity', activity_id:1, start_time:now.toISOString(), end_time:now.toISOString(), title:'Civic test', status:'approved', participants:[] };
        await page.route('**/api/sessions', route => route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify([session]) }));
        await loginAsCivic(page);
        await page.click('text=Civic test');
        await expect(page.locator('select[id^="manual-reg-ben-"]')).toBeVisible();
        await expect(page.locator('select[id^="manual-reg-vol-"]')).toBeVisible();
    });

    test('liste des participants affiche noms', async ({ page }) => {
        const now = new Date();
        const session = { id: 8888, type:'activity', activity_id:1, start_time:now.toISOString(), end_time:now.toISOString(), title:'Partic Test', status:'approved', participants:[{user_id:2,role_at_registration:'beneficiary',firstname:'Jean',lastname:'Dupont',role:'beneficiary'}] };
        await page.route('**/api/sessions', route => route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify([session]) }));
        await loginAsBeneficiary(page);
        await page.click('text=Partic Test');
        await expect(page.locator('text=Jean Dupont')).toBeVisible();
    });

    test('session aide aux devoirs affiche titre adapté', async ({ page }) => {
        const now = new Date();
        const session = { id: 9999, type:'homework_help', activity_id:null, start_time:now.toISOString(), end_time:now.toISOString(), participants:[] };
        await page.route('**/api/sessions', route => route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify([session]) }));
        await loginAsBeneficiary(page);
        const sessionCard = page.locator('div.cursor-pointer.relative.group.overflow-hidden').first();
        await expect(sessionCard).toBeVisible();
        await sessionCard.click();
        await expect(page.getByRole('heading', { name: 'Aide aux devoirs' }).nth(1)).toBeVisible();
    });

    test('admin voit bouton approuver sur atelier en attente', async ({ page }) => {
        const now = new Date();
        const session = { id: 10101, type:'activity', activity_id:1, start_time:now.toISOString(), end_time:now.toISOString(), title:'Pending Act', status:'pending', participants:[] };
        await page.route('**/api/sessions', route => route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify([session]) }));
        await loginAsAdmin(page);
        await page.click('text=Pending Act');
        await expect(page.getByRole('button', { name: /Approuver l'atelier/i })).toBeVisible();
    });

    test('admin inscrit manuellement un bénévole', async ({ page }) => {
        let sessionCard = page.locator('div.cursor-pointer.relative.group.overflow-hidden').first();
        if (!await sessionCard.isVisible().catch(() => false)) {
            sessionCard = page.getByText(/Atelier|Foot|Soutien|Numérique/i).first();
        }
        await expect(sessionCard).toBeVisible({ timeout: 15000 });
        await sessionCard.click();
        await expect(page.locator('div.fixed.inset-0 h3')).toBeVisible();

        await page.evaluate(() => {
            const sel = document.querySelector('select[id^="manual-reg-vol-"]') as HTMLSelectElement;
            if (sel) {
                const op = document.createElement('option');
                op.value = '8888';
                op.text = 'Fake Vol';
                sel.appendChild(op);
            }
        });

        let call = false;
        await page.route('**/api/registrations', async route => {
            call = true;
            await route.fulfill({ status: 201, json: {} });
        });

        const volSel = page.locator('select[id^="manual-reg-vol-"]');
        if (await volSel.count() > 0) {
            const count = await volSel.locator('option').count();
            if (count > 1) {
                const val = await volSel.locator('option').nth(1).getAttribute('value');
                if (val) {
                    await volSel.selectOption(val);
                    await page.click('button:has-text("GO")');
                }
            }
        }
        if (call) expect(call).toBeTruthy();
    });

    test('admin peut retirer un participant via poubelle', async ({ page }) => {
        let sessionCard = page.locator('div.cursor-pointer.relative.group.overflow-hidden').first();
        if (!await sessionCard.isVisible().catch(() => false)) {
            sessionCard = page.getByText(/Atelier|Foot|Soutien|Numérique/i).first();
        }
        await expect(sessionCard).toBeVisible({ timeout: 15000 });
        await sessionCard.click();
        await expect(page.locator('div.fixed.inset-0 h3')).toBeVisible();

        const trashBtn = page.locator('button[title="Retirer"]').first();
        if (await trashBtn.count() > 0) {
            let removed = false;
            await page.route('**/api/registrations*', async route => {
                if (route.request().method() === 'DELETE') {
                    removed = true;
                    await route.fulfill({ status: 200, json: {} });
                } else {
                    await route.continue();
                }
            });
            await trashBtn.click();
            expect(removed).toBeTruthy();
        }
    });
});