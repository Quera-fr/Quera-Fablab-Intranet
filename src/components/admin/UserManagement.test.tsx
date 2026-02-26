<<<<<<< HEAD
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { User } from '../../types';
import UserManagement from './UserManagement';

// Mock Framer Motion (jsdom ne supporte pas les animations)
vi.mock('motion/react', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
            <div {...props}>{children}</div>
        ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ===== DONNÉES DE TEST =====

const mockUser: User = {
    id: 99,
    email: 'jean.dupont@test.fr',
    lastname: 'Dupont',
    firstname: 'Jean',
    role: 'volunteer',
    dob: '1990-05-20',
    address: '42 rue des Tests, Paris',
};

const mockUsers: User[] = [
    { id: 1, email: 'user1@test.fr', lastname: 'Dupont', firstname: 'Jean', role: 'volunteer', dob: '1990-01-01', address: 'Rue 1' },
    { id: 2, email: 'user2@test.fr', lastname: 'Martin', firstname: 'Marie', role: 'beneficiary', dob: '2000-01-01', address: 'Rue 2' },
    { id: 3, email: 'user3@test.fr', lastname: 'Bernard', firstname: 'Sophie', role: 'beneficiary', dob: '2001-01-01', address: 'Rue 3' },
];

// ===== RESET GLOBAL =====
beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ===========================================================
// TEST UNITAIRE — L'administrateur peut ajouter un utilisateur
// data : mail, nom, prénom, rôle, date de naissance, adresse
// ===========================================================
describe("UserManagement — Ajout d'un utilisateur", () => {

    it('affiche le titre "Utilisateurs" et le bouton Ajouter', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        render(<UserManagement />);

        expect(screen.getByText('Utilisateurs')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
    });

    it('ouvre le modal avec tous les champs quand on clique sur Ajouter', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        render(<UserManagement />);

        await userEvent.click(screen.getByRole('button', { name: /ajouter/i }));

        expect(screen.getByText('Nouvel Utilisateur')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Prénom')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Nom')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Adresse')).toBeInTheDocument();
    });

    it('envoie POST /api/users avec les bonnes données lors de la soumission', async () => {
        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ok: true, json: async () => [] })       // GET initial
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) })     // POST
            .mockResolvedValueOnce({ ok: true, json: async () => [] });      // GET refresh

        render(<UserManagement />);

        await userEvent.click(screen.getByRole('button', { name: /ajouter/i }));

        await userEvent.type(screen.getByPlaceholderText('Prénom'), 'Jean');
        await userEvent.type(screen.getByPlaceholderText('Nom'), 'Dupont');
        await userEvent.type(screen.getByPlaceholderText('Email'), 'jean.dupont@test.fr');
        await userEvent.selectOptions(screen.getByRole('combobox'), 'volunteer');
        fireEvent.change(document.querySelector('input[type="date"]') as HTMLElement, {
            target: { value: '1990-05-20' },
        });
        await userEvent.type(screen.getByPlaceholderText('Adresse'), '42 rue des Tests, Paris');

        await userEvent.click(screen.getByRole('button', { name: /créer/i }));

        await waitFor(() => {
            const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
            const postCall = calls.find(([url, opts]) =>
                url === '/api/users' && (opts as RequestInit)?.method === 'POST'
            );
            expect(postCall).toBeDefined();
            const body = JSON.parse((postCall![1] as RequestInit).body as string);
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

    it('ferme le modal et affiche le nouvel utilisateur dans le tableau', async () => {
        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ok: true, json: async () => [] })
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: async () => [mockUser] });

        render(<UserManagement />);

        await userEvent.click(screen.getByRole('button', { name: /ajouter/i }));
        await userEvent.type(screen.getByPlaceholderText('Prénom'), 'Jean');
        await userEvent.type(screen.getByPlaceholderText('Nom'), 'Dupont');
        await userEvent.type(screen.getByPlaceholderText('Email'), 'jean.dupont@test.fr');
        fireEvent.change(document.querySelector('input[type="date"]') as HTMLElement, {
            target: { value: '1990-05-20' },
        });
        await userEvent.type(screen.getByPlaceholderText('Adresse'), '42 rue des Tests, Paris');

        await userEvent.click(screen.getByRole('button', { name: /créer/i }));

        await waitFor(() => {
            expect(screen.queryByText('Nouvel Utilisateur')).not.toBeInTheDocument();
        });
        await waitFor(() => {
            expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
        });
    });
});

// ===========================================================
// TEST UNITAIRE — L'utilisateur peut supprimer un utilisateur
// ===========================================================
describe('UserManagement — Suppression d\'un utilisateur', () => {

    it('supprime un utilisateur quand la confirmation est acceptée', async () => {
        const user = userEvent.setup();
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        (global.fetch as any).mockImplementation((url: string, options?: RequestInit) => {
            if (url === '/api/users') {
                return Promise.resolve({ ok: true, json: async () => mockUsers });
            }
            if (url === '/api/users/1' && options?.method === 'DELETE') {
                return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
            }
            return Promise.reject(new Error(`Unexpected fetch: ${url}`));
        });

        render(<UserManagement />);

        await waitFor(() => expect(screen.getByText(/Jean Dupont/)).toBeInTheDocument());

        const deleteButtons = screen.getAllByTitle('Supprimer');
        await user.click(deleteButtons[0]);

        expect(window.confirm).toHaveBeenCalledWith('Supprimer cet utilisateur ?');

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/users/1', { method: 'DELETE' });
        });
    });

    it('ne supprime pas si la confirmation est refusée', async () => {
        const user = userEvent.setup();
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        (global.fetch as any).mockImplementation((url: string) => {
            if (url === '/api/users') {
                return Promise.resolve({ ok: true, json: async () => mockUsers });
            }
            return Promise.reject(new Error('Should not call DELETE'));
        });

        render(<UserManagement />);

        await waitFor(() => expect(screen.getByText(/Jean Dupont/)).toBeInTheDocument());

        const deleteButtons = screen.getAllByTitle('Supprimer');
        await user.click(deleteButtons[0]);

        expect(window.confirm).toHaveBeenCalledWith('Supprimer cet utilisateur ?');

        await waitFor(() => {
            const deleteCalls = (global.fetch as any).mock.calls.filter(
                (call: any) => call[1]?.method === 'DELETE'
            );
            expect(deleteCalls).toHaveLength(0);
        });
    });
=======
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import UserManagement from "./UserManagement";
import { User } from "../../types";

global.fetch = vi.fn();

const mockUsers: User[] = [
  {
    id: 1,
    firstname: "Alice",
    lastname: "Smith",
    role: "volunteer",
    email: "volunteer@test.com",
    dob: "1995-05-05",
    address: "…",
  },
  {
    id: 2,
    firstname: "Bob",
    lastname: "Doe",
    role: "beneficiary",
    email: "beneficiary@test.com",
    dob: "2005-10-10",
    address: "…",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  (global.fetch as Mock).mockImplementation(async (url) => {
    if (url === "/api/users") {
      return { ok: true, json: async () => mockUsers };
    }
    return { ok: true, json: async () => [] };
  });
});

it("fetches and displays volunteers and beneficiaries", async () => {
  render(<UserManagement />);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("/api/users");
  });

  expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  expect(screen.getByText("Bob Doe")).toBeInTheDocument();
  expect(screen.getAllByText(/volunteer/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/beneficiary/i).length).toBeGreaterThan(0);

  const rows = screen.getAllByRole("row");
  expect(rows.length).toBe(3); // header + two users
>>>>>>> test-unitaires-prativa
});
