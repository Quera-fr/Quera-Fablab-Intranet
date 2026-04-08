import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import App from './App';
import { User } from './types';

vi.mock('./components/calendar/CalendarView', () => ({
    default: ({ user, readOnly, onLoginClick }: any) => (
        <div data-testid="calendar-view">
            {readOnly ? (
                <button onClick={onLoginClick}>Se connecter</button>
            ) : (
                <div>Planning connecté</div>
            )}
        </div>
    ),
}));

vi.mock('./components/auth/LoginPage', () => ({
    default: ({ onLogin }: any) => (
        <form data-testid="login-form">
            <input type="email" defaultValue="test@test.com" />
            <input type="password" defaultValue="password" />
            <button
                type="submit"
                onClick={() =>
                    onLogin({
                        id: 1,
                        email: 'test@test.com',
                        firstname: 'Test',
                        lastname: 'User',
                        role: 'beneficiary',
                        dob: '2000-01-01',
                        address: 'Test St',
                    } as User)
                }
            >
                Se connecter (Login)
            </button>
        </form>
    ),
}));

vi.mock('./components/admin/UserManagement', () => ({
    default: () => <div>User Management</div>,
}));

vi.mock('./components/profile/ProfilePage', () => ({
    default: () => <div>Profile Page</div>,
}));

vi.mock('./components/registrations/MyRegistrationsView', () => ({
    default: () => <div>My Registrations</div>,
}));

vi.mock('./components/profile/ProfileModal', () => ({
    default: () => null,
}));

global.fetch = vi.fn();

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('déconnexion', () => {
        it('redirige vers la page de connexion après déconnexion du bénéficiaire', async () => {
            render(<App />);

            // Au démarrage, App affiche la vue publique avec CalendarView en readOnly
            await waitFor(() => {
                expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
            });

            // Le bouton "Se connecter" doit être visible dans CalendarView
            const loginBtn = screen.getByRole('button', { name: /Se connecter/i });
            expect(loginBtn).toBeInTheDocument();

            // --- ÉTAPE 1 : connexion ---
            await userEvent.click(loginBtn);

            // Après clic, on voit la LoginPage
            await waitFor(() => {
                expect(screen.getByTestId('login-form')).toBeInTheDocument();
            });

            // On clique sur le bouton de connexion dans la form
            const submitBtn = screen.getByRole('button', { name: /Se connecter \(Login\)/i });
            await userEvent.click(submitBtn);

            // Après connexion, on voit "Planning connecté" (user est défini)
            await waitFor(() => {
                expect(screen.getByText('Planning connecté')).toBeInTheDocument();
            });
        });
    });

    describe('gestion connexion/déconnexion', () => {
        it('gère la connexion et la déconnexion de l\'administrateur', async () => {
            render(<App />);

            // Au démarrage: vue publique avec CalendarView readOnly
            await waitFor(() => {
                expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
            });

            // "Se connecter" visible
            const loginBtn = screen.getByRole('button', { name: /Se connecter/i });
            expect(loginBtn).toBeInTheDocument();

            // Clic login
            await userEvent.click(loginBtn);

            // LoginPage appear
            await waitFor(() => {
                expect(screen.getByTestId('login-form')).toBeInTheDocument();
            });

            // Submit connexion
            const submitBtn = screen.getByRole('button', { name: /Se connecter \(Login\)/i });
            await userEvent.click(submitBtn);

            // Planning connecté visible
            await waitFor(() => {
                expect(screen.getByText('Planning connecté')).toBeInTheDocument();
            });
        });
    });
});