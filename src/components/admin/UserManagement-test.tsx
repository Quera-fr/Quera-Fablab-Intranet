// Imports
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserManagement from './UserManagement';
import type { User } from '../../types';

// Données de test
const mockUsers: User[] = [
  { id: 1, email: 'user1@test.fr', lastname: 'Dupont', firstname: 'Jean', role: 'volunteer', dob: '1990-01-01', address: 'Rue 1' },
  { id: 2, email: 'user2@test.fr', lastname: 'Martin', firstname: 'Marie', role: 'beneficiary', dob: '2000-01-01', address: 'Rue 2' },
  { id: 3, email: 'user3@test.fr', lastname: 'Bernard', firstname: 'Sophie', role: 'beneficiary', dob: '2001-01-01', address: 'Rue 3' },
];

describe('UserManagement - Delete User', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  it('should delete a single user when confirm is accepted', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true); // Accepter la confirmation

    // ✅ Mock fetch avec les deux paramètres (url, options)
    (global.fetch as any).mockImplementation((url: string, options?: RequestInit) => {
      if (url === '/api/users' && (!options || options.method === 'GET')) {
        return Promise.resolve({ ok: true, json: async () => mockUsers });
      }
      if (url === '/api/users/1' && options?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    });

    render(<UserManagement />);

    // ✅ Attendre l'affichage des utilisateurs
    await waitFor(() => expect(screen.getByText('Dupont')).toBeInTheDocument());

    // ✅ Cliquer sur le bouton supprimer du premier utilisateur (icône Trash2 dans la première ligne)
    const deleteButtons = screen.getAllByRole('button');
    // Le bouton delete est généralement le dernier bouton d'une ligne (icône poubelle)
    const trashButtons = deleteButtons.filter(btn => btn.querySelector('svg')); // Buttons avec icône
    await user.click(trashButtons[0]);

    // ✅ Vérifier que confirm a été appelé
    expect(window.confirm).toHaveBeenCalledWith('Supprimer cet utilisateur ?');

    // ✅ Vérifier l'appel API
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/1', { method: 'DELETE' });
    });
  });

  it('should NOT delete if confirm is rejected', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    (global.fetch as any).mockImplementation((url: string, options?: RequestInit) => {
      if (url === '/api/users') {
        return Promise.resolve({ ok: true, json: async () => mockUsers });
      }
      return Promise.reject(new Error(`Should not fetch DELETE`));
    });

    render(<UserManagement />);
    await waitFor(() => expect(screen.getByText('Dupont')).toBeInTheDocument());

    // ✅ Cliquer sur le bouton supprimer
    const deleteButtons = screen.getAllByRole('button');
    const trashButtons = deleteButtons.filter(btn => btn.querySelector('svg'));
    await user.click(trashButtons[0]);

    // ✅ Vérifier que confirm a été appelé
    expect(window.confirm).toHaveBeenCalledWith('Supprimer cet utilisateur ?');

    // ✅ Vérifier que DELETE n'a PAS été appelé
    await waitFor(() => {
      const calls = (global.fetch as any).mock.calls;
      const deleteCalls = calls.filter((call: any) => 
        call[1] && call[1].method === 'DELETE'
      );
      expect(deleteCalls).toHaveLength(0);
    });
  });

  it('should delete multiple users in bulk', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    let batchDeleteCalled = false;
    (global.fetch as any).mockImplementation((url: string, options?: RequestInit) => {
      if (url === '/api/users') {
        return Promise.resolve({ ok: true, json: async () => mockUsers });
      }
      if (url === '/api/users/batch' && options?.method === 'DELETE') {
        batchDeleteCalled = true;
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    render(<UserManagement />);
    await waitFor(() => expect(screen.getByText('Dupont')).toBeInTheDocument());

    // ✅ Sélectionner 2 utilisateurs via les checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    // Le premier checkbox est généralement "Select All", les suivants sont pour les utilisateurs
    await user.click(checkboxes[1]); // User 1
    await user.click(checkboxes[2]); // User 2

    // ✅ Vérifier que le bouton "Supprimer (2)" apparaît
    await waitFor(() => {
      expect(screen.getByText(/Supprimer \(2\)/)).toBeInTheDocument();
    });

    // ✅ Cliquer sur "Supprimer (2)"
    const bulkDeleteBtn = screen.getByText(/Supprimer \(2\)/);
    await user.click(bulkDeleteBtn);

    // ✅ Confirmer
    expect(window.confirm).toHaveBeenCalled();

    // ✅ Vérifier que DELETE /batch a été appelé
    await waitFor(() => {
      expect(batchDeleteCalled).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users/batch',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});