import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { User } from '../../types';
import UserManagement from './UserManagement';


// ----------------------------------------------------------
// MOCK : motion/react (Framer Motion)
// jsdom ne supporte pas les animations CSS natives.
// On remplace motion.div par un <div> normal et
// AnimatePresence par un simple fragment pour éviter les
// crashes. Le comportement fonctionnel reste intact.
// ----------------------------------------------------------
vi.mock('motion/react', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
            <div {...props}>{children}</div>
        ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));


global.fetch = vi.fn();


// ----------------------------------------------------------
// DONNÉES DE TEST
// ----------------------------------------------------------
const mockUser: User = {
    id: 99,
    email: 'jean.dupont@test.fr',
    lastname: 'Dupont',
    firstname: 'Jean',
    role: 'volunteer',
    dob: '1990-05-20',
    address: '42 rue des Tests, Paris',
};

// ===========================================================
describe('UserManagement — Ajout d\'un utilisateur', () => {

    // Avant CHAQUE test : on réinitialise tous les mocks.
    // Sans ça, les appels d'un test contamineraient le suivant.
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ---------------------------------------------------------
    // TEST 1 : rendu initial
    // Vérifie que le composant s'affiche sans erreur et montre
    // le titre et le bouton "Ajouter".
    // ---------------------------------------------------------
    it('affiche le titre "Utilisateurs" et le bouton Ajouter', async () => {
        // On simule le GET /api/users au montage → liste vide
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        render(<UserManagement />);

        // getByText cherche un élément contenant exactement ce texte
        expect(screen.getByText('Utilisateurs')).toBeInTheDocument();

        // getByRole filtre par rôle ARIA ; /ajouter/i = insensible à la casse
        expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
    });


    // ---------------------------------------------------------
    // TEST 2 : ouverture du modal
    // Vérifie que cliquer "Ajouter" affiche le formulaire avec
    // TOUS les champs requis : prénom, nom, email, rôle, dob, adresse.
    // ---------------------------------------------------------
    it('ouvre le modal avec tous les champs quand on clique sur Ajouter', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        render(<UserManagement />);

        // Simuler un clic utilisateur réaliste
        await userEvent.click(screen.getByRole('button', { name: /ajouter/i }));

        // Le titre du modal doit apparaître
        expect(screen.getByText('Nouvel Utilisateur')).toBeInTheDocument();

        // Chaque champ du formulaire est identifié par son placeholder
        expect(screen.getByPlaceholderText('Prénom')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Nom')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();

        // Le <select> a le rôle ARIA "combobox"
        expect(screen.getByRole('combobox')).toBeInTheDocument();

        // querySelector permet de cibler par attribut CSS
        expect(document.querySelector('input[type="date"]')).toBeInTheDocument();

        expect(screen.getByPlaceholderText('Adresse')).toBeInTheDocument();
    });


    // ---------------------------------------------------------
    // TEST 3 : soumission du formulaire
    // ---------------------------------------------------------
    it('envoie POST /api/users avec les bonnes données lors de la soumission', async () => {
        // Séquence de 3 appels fetch dans l'ordre :
        //   1) GET /api/users (montage) → []
        //   2) POST /api/users (soumission) → succès
        //   3) GET /api/users (refresh) → []
        // mockResolvedValueOnce consomme une réponse à la fois.
        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ok: true, json: async () => [] })
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: async () => [] });

        render(<UserManagement />);

        // Ouvrir le modal
        await userEvent.click(screen.getByRole('button', { name: /ajouter/i }));

        // Remplir chaque champ
        await userEvent.type(screen.getByPlaceholderText('Prénom'), 'Jean');
        await userEvent.type(screen.getByPlaceholderText('Nom'), 'Dupont');
        await userEvent.type(screen.getByPlaceholderText('Email'), 'jean.dupont@test.fr');

        // Pour le <select>, on choisit une option par sa value HTML
        await userEvent.selectOptions(screen.getByRole('combobox'), 'volunteer');

        // Pour input[type="date"], fireEvent.change est plus fiable que userEvent.type
        // car jsdom ne simule pas le picker natif du navigateur.
        fireEvent.change(document.querySelector('input[type="date"]') as HTMLElement, {
            target: { value: '1990-05-20' },
        });

        await userEvent.type(screen.getByPlaceholderText('Adresse'), '42 rue des Tests, Paris');

        // Cliquer sur "Créer" pour soumettre
        await userEvent.click(screen.getByRole('button', { name: /créer/i }));

        // waitFor attend que les assertions asynchrones soient vraies
        await waitFor(() => {
            // On récupère le 2ème appel fetch (index 1 = POST)
            const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
            const postCall = calls.find((call) => {
                const [url, opts] = call as [string, RequestInit];
                return url === '/api/users' && opts?.method === 'POST';
            });

            expect(postCall).toBeDefined();

            // On parse le body JSON pour vérifier chaque champ indépendamment
            // (évite d'être sensible à l'ordre des clés dans JSON.stringify)
            const body = JSON.parse(postCall![1].body as string);
            expect(body).toMatchObject({
                firstname: 'Jean',
                lastname: 'Dupont',
                email: 'jean.dupont@test.fr',
                role: 'volunteer',
                dob: '1990-05-20',
                address: '42 rue des Tests, Paris',
            });
        });
    });


    // ---------------------------------------------------------
    // TEST 4 : fermeture du modal + mise à jour du tableau
    // ---------------------------------------------------------
    it('ferme le modal et affiche le nouvel utilisateur dans le tableau', async () => {
        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ok: true, json: async () => [] })       // GET initial
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) })     // POST
            .mockResolvedValueOnce({ ok: true, json: async () => [mockUser] }); // GET refresh

        render(<UserManagement />);

        // Ouvrir et remplir le formulaire (version rapide, contenu exact non testé ici)
        await userEvent.click(screen.getByRole('button', { name: /ajouter/i }));
        await userEvent.type(screen.getByPlaceholderText('Prénom'), 'Jean');
        await userEvent.type(screen.getByPlaceholderText('Nom'), 'Dupont');
        await userEvent.type(screen.getByPlaceholderText('Email'), 'jean.dupont@test.fr');

        fireEvent.change(document.querySelector('input[type="date"]') as HTMLElement, {
            target: { value: '1990-05-20' },
        });

        await userEvent.type(screen.getByPlaceholderText('Adresse'), '42 rue des Tests, Paris');

        await userEvent.click(screen.getByRole('button', { name: /créer/i }));

        // Le modal doit avoir disparu du DOM
        await waitFor(() => {
            expect(screen.queryByText('Nouvel Utilisateur')).not.toBeInTheDocument();
        });

        // Le nom complet doit être visible dans le tableau
        // (le composant affiche `u.firstname u.lastname` dans une <td>)
        await waitFor(() => {
            expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
        });
    });
});
