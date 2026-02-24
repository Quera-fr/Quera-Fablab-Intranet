// On importe les outils de test React :
// - render : monte le composant dans un faux DOM (jsdom)
// - screen : permet de chercher des éléments dans ce faux DOM
// - waitFor : attend qu'une assertion devienne vraie (utile après les appels async)
import { render, screen, waitFor } from '@testing-library/react';

// userEvent simule de vraies interactions utilisateur (frappe clavier, clic...)
// plus fidèle à la réalité que fireEvent
import userEvent from '@testing-library/user-event';

// Les outils de Vitest pour créer des mocks et des assertions
import { describe, it, expect, vi, beforeEach } from 'vitest';

import LoginPage from './LoginPage';
import { User } from '../../types';

// On remplace le vrai fetch du navigateur par un faux contrôlable
// Cela évite tout appel réseau réel pendant les tests
global.fetch = vi.fn();

// Un faux utilisateur bénéficiaire — c'est ce que l'API renverrait en cas de succès
const mockBeneficiaryUser: User = {
    id: 42,
    email: 'alice@test.com',
    lastname: 'Martin',
    firstname: 'Alice',
    role: 'beneficiary',
    dob: '2005-06-15',
    address: '12 rue des Tests',
};

describe('LoginPage', () => {
    // Avant chaque test : on réinitialise tous les mocks pour que les tests
    // soient indépendants les uns des autres
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- TEST 1 : le formulaire s'affiche bien ---
    it('affiche le formulaire de connexion', () => {
        // vi.fn() crée une fonction vide qui ne fait rien — juste pour satisfaire la prop
        render(<LoginPage onLogin={vi.fn()} />);

        // On vérifie que les inputs et le bouton sont présents dans le DOM
        expect(document.querySelector('input[type="email"]')).toBeInTheDocument();
        expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
    });

    // --- TEST 2 : connexion réussie d'un bénéficiaire ---
    it('appelle onLogin avec les données du bénéficiaire quand la connexion réussit', async () => {
        // On configure le faux fetch pour simuler une réponse HTTP 200 de l'API
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,                                       // simule un code 200
            json: async () => mockBeneficiaryUser,          // simule la réponse JSON
        });

        // On crée un espion pour vérifier si onLogin a été appelé, et avec quoi
        const mockOnLogin = vi.fn();
        render(<LoginPage onLogin={mockOnLogin} />);

        // Les champs sont pré-remplis "admin@assoc.fr" / "admin123"
        // On les efface et on tape les identifiants du bénéficiaire
        const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
        const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

        await userEvent.clear(emailInput);
        await userEvent.type(emailInput, 'alice@test.com');
        await userEvent.clear(passwordInput);
        await userEvent.type(passwordInput, 'motdepasse123');

        // On clique sur "Se connecter"
        await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        // waitFor attend que les opérations asynchrones (fetch) se terminent
        await waitFor(() => {
            // fetch doit avoir été appelé avec la bonne URL et les bons paramètres
            expect(global.fetch).toHaveBeenCalledWith('/api/login', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'alice@test.com', password: 'motdepasse123' }),
            }));

            // onLogin doit avoir reçu exactement l'objet utilisateur renvoyé par l'API
            expect(mockOnLogin).toHaveBeenCalledWith(mockBeneficiaryUser);
        });
    });

    // --- TEST 3 : échec de connexion ---
    it('affiche "Identifiants incorrects" si le serveur renvoie une erreur', async () => {
        // Cette fois, on simule une réponse HTTP 401 (identifiants incorrects)
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false, // simule un code d'erreur (401, 403...)
        });

        const mockOnLogin = vi.fn();
        render(<LoginPage onLogin={mockOnLogin} />);

        // On soumet directement sans changer les champs (les valeurs par défaut suffisent)
        await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            // Le message d'erreur doit apparaître dans le DOM
            expect(screen.getByText('Identifiants incorrects')).toBeInTheDocument();
        });

        // onLogin ne doit PAS avoir été appelé — l'utilisateur ne doit pas être connecté
        expect(mockOnLogin).not.toHaveBeenCalled();
    });
});