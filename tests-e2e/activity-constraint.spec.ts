import { test, expect } from '@playwright/test';

test.describe('Constraint: Maximum 1 Activity per Day', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.fill('input[type="email"]', 'admin@assoc.fr');
        await page.fill('input[type="password"]', 'admin123');

        await Promise.all([
            page.waitForURL('**/*'),
            page.click('button[type="submit"]')
        ]);

        await page.waitForLoadState('networkidle');
        await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
    });

    test('Should reject creating 2nd activity on same day - via form submission', async ({ page }) => {
        // Use far future date with randomization to avoid database conflicts across runs
        // Use 365+ days in future plus random offset (0-100 days)
        const baseOffset = 365 + Math.floor(Math.random() * 100);
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + baseOffset);
        const dateStr = new Date(futureDate.getTime() - futureDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];

        // Create first activity
        await page.getByRole('button', { name: 'Nouvelle Activité', exact: true }).click();
        await expect(page.locator('h3', { hasText: 'Nouvel Atelier' })).toBeVisible();

        await page.fill('input[name="title"]', 'First Activity - Same Day Test');
        await page.fill('textarea[name="description"]', 'This is the first activity');
        await page.fill('input[name="max_participants"]', '10');
        await page.fill('input[name="deadline"]', dateStr);
        await page.fill('input[name="start_time"]', `${dateStr}T16:30`);
        await page.fill('input[name="end_time"]', `${dateStr}T19:30`);
        await page.waitForTimeout(300);

        // Submit and wait for response simultaneously to avoid race conditions
        const firstResponses = await Promise.all([
            page.waitForResponse(response => 
                response.url().includes('/api/activities') && response.request().method() === 'POST'
            ),
            page.getByRole('button', { name: 'Soumettre' }).click()
        ]);
        expect([200, 201]).toContain(firstResponses[0].status());

        // Wait for modal to close after successful submission
        await expect(page.locator('h3', { hasText: 'Nouvel Atelier' })).not.toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(500);

        // Try to create second activity for the same day
        await page.getByRole('button', { name: 'Nouvelle Activité', exact: true }).click();
        await expect(page.locator('h3', { hasText: 'Nouvel Atelier' })).toBeVisible();

        await page.fill('input[name="title"]', 'Second Activity - Should Fail');
        await page.fill('textarea[name="description"]', 'This should fail because activity exists');
        await page.fill('input[name="max_participants"]', '15');
        await page.fill('input[name="deadline"]', dateStr);
        await page.fill('input[name="start_time"]', `${dateStr}T10:00`);
        await page.fill('input[name="end_time"]', `${dateStr}T12:00`);
        await page.waitForTimeout(300);

        // Submit and wait for rejection (400 status on constraint violation)
        const secondResponses = await Promise.all([
            page.waitForResponse(response => 
                response.url().includes('/api/activities') && response.request().method() === 'POST'
            ),
            page.getByRole('button', { name: 'Soumettre' }).click()
        ]);
        expect(secondResponses[0].status()).toBe(400);

        // Because the form closes no matter the response, just ensure behavior did not create a second activity
        // (we already asserted the 400 status above). Optionally, verify modal closed.
        await expect(page.locator('h3', { hasText: 'Nouvel Atelier' })).not.toBeVisible({ timeout: 5000 });
    });

    test('Should allow activities on different days', async ({ page }) => {
        // Use far future dates with randomization to avoid database conflicts
        // Use 365+ days in future plus random offset
        const baseOffset = 465 + Math.floor(Math.random() * 100);
        const futureDate1 = new Date();
        futureDate1.setDate(futureDate1.getDate() + baseOffset);
        const futureDate2 = new Date();
        futureDate2.setDate(futureDate2.getDate() + baseOffset + 1);

        const date1Str = new Date(futureDate1.getTime() - futureDate1.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        const date2Str = new Date(futureDate2.getTime() - futureDate2.getTimezoneOffset() * 60000).toISOString().split('T')[0];

        // Create activity on day 1
        await page.getByRole('button', { name: 'Nouvelle Activité', exact: true }).click();
        await expect(page.locator('h3', { hasText: 'Nouvel Atelier' })).toBeVisible();

        await page.fill('input[name="title"]', 'Activity Day 1');
        await page.fill('textarea[name="description"]', 'Activity on first day');
        await page.fill('input[name="max_participants"]', '10');
        await page.fill('input[name="deadline"]', date1Str);
        await page.fill('input[name="start_time"]', `${date1Str}T16:30`);
        await page.fill('input[name="end_time"]', `${date1Str}T19:30`);
        await page.waitForTimeout(300);

        const firstResponses = await Promise.all([
            page.waitForResponse(response => 
                response.url().includes('/api/activities') && response.request().method() === 'POST'
            ),
            page.getByRole('button', { name: 'Soumettre' }).click()
        ]);
        expect([200, 201]).toContain(firstResponses[0].status());

        // Wait for modal to close
        await expect(page.locator('h3', { hasText: 'Nouvel Atelier' })).not.toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(500);

        // Create activity on day 2 (different day - should succeed)
        await page.getByRole('button', { name: 'Nouvelle Activité', exact: true }).click();
        await expect(page.locator('h3', { hasText: 'Nouvel Atelier' })).toBeVisible();

        await page.fill('input[name="title"]', 'Activity Day 2');
        await page.fill('textarea[name="description"]', 'Activity on second day');
        await page.fill('input[name="max_participants"]', '15');
        await page.fill('input[name="deadline"]', date2Str);
        await page.fill('input[name="start_time"]', `${date2Str}T16:30`);
        await page.fill('input[name="end_time"]', `${date2Str}T19:30`);
        await page.waitForTimeout(300);

        const secondResponses = await Promise.all([
            page.waitForResponse(response => 
                response.url().includes('/api/activities') && response.request().method() === 'POST'
            ),
            page.getByRole('button', { name: 'Soumettre' }).click()
        ]);
        expect([200, 201]).toContain(secondResponses[0].status());

        // Modal should close after successful submission
        await expect(page.locator('h3', { hasText: 'Nouvel Atelier' })).not.toBeVisible({ timeout: 10000 });
    });
});
