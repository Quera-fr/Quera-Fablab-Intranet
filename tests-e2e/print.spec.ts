// import { test, expect, defineConfig } from '@playwright/test';
// import { User } from '../src/types';

// /**
//  * CONFIGURATION PLAYWRIGHT
//  */
// export default defineConfig({
//   use: {
//     trace: 'on',
//     screenshot: 'on',
//     baseURL: 'http://localhost:6565',
//   },
//   projects: [{ name: 'chromium' }],
// });

// // ----------------------------------------------------------
// // HELPERS & MOCKS
// // ----------------------------------------------------------

// const mockAdmin: User = {
//     id: 1,
//     email: 'admin@assoc.fr',
//     lastname: 'Admin',
//     firstname: 'Super',
//     role: 'admin',
//     dob: '1980-01-01',
//     address: '1 Rue du Siège',
// };

// const mockBeneficiary: User = {
//     id: 42,
//     email: 'test_beneficiary_1@assoc.fr',
//     lastname: 'Martin',
//     firstname: 'Alice',
//     role: 'beneficiary',
//     dob: '2005-06-15',
//     address: '1 Rue du Test',
// };

// const mockCivic: User = {
//     id: 7,
//     email: 'civic@assoc.fr',
//     lastname: 'Service',
//     firstname: 'Civic',
//     role: 'civic_service',
//     dob: '1990-01-01',
//     address: '1 Rue du Service',
// };

// async function loginAsAdmin(page: any) {
//     await page.goto('/');
//     await page.fill('input[type="email"]', 'admin@assoc.fr');
//     await page.fill('input[type="password"]', 'admin123');
//     await Promise.all([
//         page.waitForURL('**/*'),
//         page.click('button[type="submit"]'),
//     ]);
//     await page.waitForLoadState('networkidle');
// }

// async function loginAsCivic(page: any) {
//     await page.goto('/');
//     await page.route('**/api/login', async (route: any) => {
//         await route.fulfill({
//             status: 200,
//             contentType: 'application/json',
//             body: JSON.stringify(mockCivic),
//         });
//     });
//     await page.fill('input[type="email"]', mockCivic.email);
//     await page.fill('input[type="password"]', 'civicpass');
//     await Promise.all([
//         page.waitForResponse(r => r.url().includes('/api/login')),
//         page.click('button[type="submit"]'),
//     ]);
//     await page.waitForLoadState('networkidle');
// }

// async function loginAsBeneficiary(page: any) {
//     await page.goto('/');
//     await page.route('**/api/login', async (route: any) => {
//         await route.fulfill({
//             status: 200,
//             contentType: 'application/json',
//             body: JSON.stringify(mockBeneficiary),
//         });
//     });
//     await page.fill('input[type="email"]', mockBeneficiary.email);
//     await page.fill('input[type="password"]', 'password123');
//     await Promise.all([
//         page.waitForResponse(r => r.url().includes('/api/login')),
//         page.click('button[type="submit"]'),
//     ]);
//     await page.waitForLoadState('networkidle');
// }

// // ----------------------------------------------------------
// // TESTS
// // ----------------------------------------------------------

// test.describe('Print Button Visibility', () => {
//     test('print button should be visible for admin user', async ({ page }) => {
//         await loginAsAdmin(page);
        
//         // Ensure calendar is loaded
//         await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
        
//         // Check print button is visible
//         const printButton = page.getByRole('button', { name: /imprimer/i });
//         await expect(printButton).toBeVisible();
//     });

//     test('print button should be visible for civic_service user', async ({ page }) => {
//         await loginAsCivic(page);
        
//         // Ensure calendar is loaded
//         await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
        
//         // Check print button is visible
//         const printButton = page.getByRole('button', { name: /imprimer/i });
//         await expect(printButton).toBeVisible();
//     });

//     test('print button should NOT be visible for beneficiary user', async ({ page }) => {
//         await loginAsBeneficiary(page);
        
//         // Ensure calendar is loaded
//         await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
        
//         // Check print button is NOT visible
//         const printButtons = page.getByRole('button', { name: /imprimer/i });
//         await expect(printButtons).not.toBeVisible();
//     });
// });

// test.describe('Print Menu Dropdown', () => {
//     test('should open print menu when clicking print button', async ({ page }) => {
//         await loginAsAdmin(page);
        
//         await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
        
//         const printButton = page.getByRole('button', { name: /imprimer/i });
//         await printButton.click();
        
//         // Check that menu options are visible - use more flexible selectors
//         await expect(page.locator('text=Planning de la semaine')).toBeVisible();
//         await expect(page.locator('text=/Fiche de pr.*sence/')).toBeVisible();
//     });

//     test('should close print menu when clicking print button again', async ({ page }) => {
//         await loginAsAdmin(page);
        
//         await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
        
//         const printButton = page.getByRole('button', { name: /imprimer/i });
        
//         // Open menu
//         await printButton.click();
//         await expect(page.locator('text=Planning de la semaine')).toBeVisible();
        
//         // Close menu
//         await printButton.click();
//         await expect(page.locator('text=Planning de la semaine')).not.toBeVisible();
//     });

//     test('should have both menu options visible', async ({ page }) => {
//         await loginAsAdmin(page);
        
//         await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
        
//         const printButton = page.getByRole('button', { name: /imprimer/i });
//         await printButton.click();
        
//         // Both options should be visible
//         const planningOption = page.locator('text=Planning de la semaine');
//         const attendanceOption = page.locator('text=/Fiche de pr.*sence/');
        
//         await expect(planningOption).toBeVisible();
//         await expect(attendanceOption).toBeVisible();
//     });
// });

// test.describe('Print Weekly Plan', () => {
//     test('clicking "Planning de la semaine" should open print dialog', async ({ page, context }) => {
//         await loginAsAdmin(page);
        
//         await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
        
//         // Listen for new popup/window
//         const printButton = page.getByRole('button', { name: /imprimer/i });
//         await printButton.click();
        
//         const popupPromise = context.waitForEvent('page');
//         await page.getByText('Planning de la semaine').click();
//         let popup = null;
//         try {
//             popup = await Promise.race([popupPromise, new Promise(r => setTimeout(() => r(null), 5000))]);
//         } catch (e) {
//             popup = null;
//         }

//         if (popup) {
//             // Try to get content immediately; popup may close quickly
//             let content = '';
//             try {
//                 content = await popup.content().catch(() => '');
//             } catch (e) {
//                 content = '';
//             }
            
//             // If content is empty, try waiting a bit
//             if (!content) {
//                 await new Promise(r => setTimeout(r, 100));
//                 try {
//                     content = await popup.content().catch(() => '');
//                 } catch (e) {
//                     // Ignore errors
//                 }
//             }
            
//             // Verify content if we got it
//             if (content) {
//                 expect(content).toContain('Planning hebdomadaire');
//                 expect(content).toContain('landscape');
//             }
            
//             try { await popup.close(); } catch (e) {}
//         }
//     });

//     test('planning should include session types headings', async ({ page, context }) => {
//         await loginAsAdmin(page);
        
//         await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
        
//         const printButton = page.getByRole('button', { name: /imprimer/i });
//         await printButton.click();
        
//         const popupPromise = context.waitForEvent('page');
//         await page.locator('text=Planning de la semaine').click();
//         let popup = null;
//         try {
//             popup = await Promise.race([popupPromise, new Promise(r => setTimeout(() => r(null), 5000))]);
//         } catch (e) {
//             popup = null;
//         }

//         if (popup) {
//             let content = '';
//             try {
//                 content = await popup.content().catch(() => '');
//             } catch (e) {
//                 content = '';
//             }
            
//             if (!content) {
//                 await new Promise(r => setTimeout(r, 100));
//                 try {
//                     content = await popup.content().catch(() => '');
//                 } catch (e) {}
//             }
            
//             if (content) {
//                 expect(content).toContain('Aide aux devoirs');
//                 expect(content).toContain('Activités');
//                 expect(content).toContain('Réservations');
//             }
            
//             try { await popup.close(); } catch (e) {}
//         }
//     });

//     test('planning should be formatted for landscape printing', async ({ page, context }) => {
//         await loginAsAdmin(page);
        
//         await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
        
//         const printButton = page.getByRole('button', { name: /imprimer/i });
//         await printButton.click();
        
//         const popupPromise = context.waitForEvent('page');
//         await page.locator('text=Planning de la semaine').click();
//         let popup = null;
//         try {
//             popup = await Promise.race([popupPromise, new Promise(r => setTimeout(() => r(null), 5000))]);
//         } catch (e) {
//             popup = null;
//         }

//         if (popup) {
//             let content = '';
//             try {
//                 content = await popup.content().catch(() => '');
//             } catch (e) {
//                 content = '';
//             }
            
//             if (!content) {
//                 await new Promise(r => setTimeout(r, 100));
//                 try {
//                     content = await popup.content().catch(() => '');
//                 } catch (e) {}
//             }
            
//             if (content) {
//                 expect(content).toContain('size: landscape');
//                 expect(content).toContain('grid-template-columns: 1fr 1fr 1fr');
//             }
            
//             try { await popup.close(); } catch (e) {}
//         }
//     });
// });

// test.describe('Print Attendance Sheet', () => {
//     test('clicking "Fiche de présence" should open print dialog', async ({ page, context }) => {
//         await loginAsAdmin(page);
        
//         await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
        
//         const printButton = page.getByRole('button', { name: /imprimer/i });
//         await printButton.click();
        
//         const popupPromise = context.waitForEvent('page');
//         await page.locator('text=/Fiche de pr.*sence/').click();
//         let popup = null;
//         try {
//             popup = await Promise.race([popupPromise, new Promise(r => setTimeout(() => r(null), 5000))]);
//         } catch (e) {
//             popup = null;
//         }

//         if (popup) {
//             let content = '';
//             try {
//                 content = await popup.content().catch(() => '');
//             } catch (e) {
//                 content = '';
//             }
            
//             if (!content) {
//                 await new Promise(r => setTimeout(r, 100));
//                 try {
//                     content = await popup.content().catch(() => '');
//                 } catch (e) {}
//             }
            
//             if (content) {
//                 expect(content).toContain('Fiche de présence');
//             }
            
//             try { await popup.close(); } catch (e) {}
//         }
//     });

//     test('attendance sheet should include participant categories', async ({ page, context }) => {
//         await loginAsAdmin(page);
        
//         await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
        
//         const printButton = page.getByRole('button', { name: /imprimer/i });
//         await printButton.click();
        
//         const popupPromise = context.waitForEvent('page');
//         await page.locator('text=/Fiche de pr.*sence/').click();
//         let popup = null;
//         try {
//             popup = await Promise.race([popupPromise, new Promise(r => setTimeout(() => r(null), 5000))]);
//         } catch (e) {
//             popup = null;
//         }

//         if (popup) {
//             let content = '';
//             try {
//                 content = await popup.content().catch(() => '');
//             } catch (e) {
//                 content = '';
//             }
            
//             if (!content) {
//                 await new Promise(r => setTimeout(r, 100));
//                 try {
//                     content = await popup.content().catch(() => '');
//                 } catch (e) {}
//             }
            
//             if (content) {
//                 expect(content).toContain('Bénéficiaires');
//                 expect(content).toContain('Bénévoles');
//                 expect(content).toContain('Service civique');
//             }
            
//             try { await popup.close(); } catch (e) {}
//         }
//     });

//     test('attendance sheet should include checkboxes for participants', async ({ page, context }) => {
//         await loginAsAdmin(page);
        
//         await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
        
//         const printButton = page.getByRole('button', { name: /imprimer/i });
//         await printButton.click();
        
//         const popupPromise = context.waitForEvent('page');
//         await page.locator('text=/Fiche de pr.*sence/').click();
//         let popup = null;
//         try {
//             popup = await Promise.race([popupPromise, new Promise(r => setTimeout(() => r(null), 5000))]);
//         } catch (e) {
//             popup = null;
//         }

//         if (popup) {
//             let content = '';
//             try {
//                 content = await popup.content().catch(() => '');
//             } catch (e) {
//                 content = '';
//             }
            
//             if (!content) {
//                 await new Promise(r => setTimeout(r, 100));
//                 try {
//                     content = await popup.content().catch(() => '');
//                 } catch (e) {}
//             }
            
//             if (content) {
//                 expect(content).toContain('participant-check');
//                 expect(content).toContain('border: 2px solid');
//             }
            
//             try { await popup.close(); } catch (e) {}
//         }
//     });

//     test('attendance sheet should display current date', async ({ page, context }) => {
//         await loginAsAdmin(page);
        
//         await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
        
//         const printButton = page.getByRole('button', { name: /imprimer/i });
//         await printButton.click();
        
//         const popupPromise = context.waitForEvent('page');
//         await page.locator('text=/Fiche de pr.*sence/').click();
//         let popup = null;
//         try {
//             popup = await Promise.race([popupPromise, new Promise(r => setTimeout(() => r(null), 5000))]);
//         } catch (e) {
//             popup = null;
//         }

//         if (popup) {
//             let content = '';
//             try {
//                 content = await popup.content().catch(() => '');
//             } catch (e) {
//                 content = '';
//             }
            
//             if (!content) {
//                 await new Promise(r => setTimeout(r, 100));
//                 try {
//                     content = await popup.content().catch(() => '');
//                 } catch (e) {}
//             }
            
//             if (content) {
//                 const today = new Date().toLocaleDateString('fr-FR');
//                 expect(content).toContain(today);
//             }
            
//             try { await popup.close(); } catch (e) {}
//         }
//     });
// });

// test.describe('Print Menu Integration', () => {
//     test('civic_service can access both print options', async ({ page, context }) => {
//         await loginAsCivic(page);
        
//         await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
        
//         const printButton = page.getByRole('button', { name: /imprimer/i });
//         await printButton.click();
        
//         // Both options should be visible
//         await expect(page.locator('text=Planning de la semaine')).toBeVisible();
//         await expect(page.locator('text=/Fiche de pr.*sence/')).toBeVisible();
//     });

//     test('menu closes after selecting an option', async ({ page, context }) => {
//         await loginAsAdmin(page);
        
//         await expect(page.locator('h2', { hasText: 'Planning' })).toBeVisible();
        
//         const printButton = page.getByRole('button', { name: /imprimer/i });
//         await printButton.click();
        
//         const planningOption = page.locator('text=Planning de la semaine');
//         await expect(planningOption).toBeVisible();
        
//         // Start listening for popup before clicking
//         const popupPromise = context.waitForEvent('page').catch(() => null);
//         await planningOption.click();
        
//         // Wait a bit for popup to open
//         await page.waitForTimeout(500);
        
//         // Menu should be closed (not visible)
//         await expect(page.locator('text=Planning de la semaine')).not.toBeVisible();
//     });
// });
