import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { User } from './types';

// On intercepte fetch globalement
global.fetch = vi.fn();

// On mocke les composants lourds pour éviter leurs propres appels fetch.
// vi.mock remplace le module entier par une version simplifiée.
// Le composant mocké rend juste un div vide — on ne teste pas son contenu ici.
vi.mock('./components/calendar/CalendarView', () => ({
    default: () => <div data-testid="calendar-view" />,
}));
vi.mock('./components/admin/UserManagement', () => ({
    default: () => <div data-testid="user-management" />,
}));
vi.mock('./components/registrations/MyRegistrationsView', () => ({
    default: () => <div data-testid="my-registrations" />,
}));
vi.mock('./components/profile/ProfileModal', () => ({
    default: () => <div data-testid="profile-modal" />,
}));

const mockBeneficiaryUser: User = {
    id: 42,
    email: 'alice@test.com',
    lastname: 'Martin',
    firstname: 'Alice',
    role: 'beneficiary',
    dob: '2005-06-15',
    address: '12 rue des Tests',
};

describe('App — déconnexion', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('redirige vers la page de connexion après déconnexion du bénéficiaire', async () => {
        // On simule la réponse de l'API pour la connexion
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => mockBeneficiaryUser,
        });

        render(<App />);

        // Au démarrage, App affiche LoginPage car user === null
        // On vérifie que le bouton "Se connecter" est visible
        expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();

        // --- ÉTAPE 1 : connexion ---
        const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
        const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

        await userEvent.clear(emailInput);
        await userEvent.type(emailInput, 'alice@test.com');
        await userEvent.clear(passwordInput);
        await userEvent.type(passwordInput, 'motdepasse123');
        await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        // Après connexion, la sidebar et le calendrier (mocké) sont visibles
        await waitFor(() => {
            expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
        });

        // --- ÉTAPE 2 : déconnexion ---
        // Le bouton logout a title="Déconnexion" dans App.tsx
        const logoutButton = screen.getByTitle('Déconnexion');
        await userEvent.click(logoutButton);

        // Après la déconnexion, user redevient null → LoginPage s'affiche à nouveau
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
        });
    });
});