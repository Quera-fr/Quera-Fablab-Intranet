import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CalendarView from './CalendarView';
import { User, Session } from '../../types';

global.fetch = vi.fn();
global.confirm = vi.fn();
global.alert = vi.fn();

const mockAdminUser: User = {
    id: 1, email: 'admin@test.com', lastname: 'Code', firstname: 'Admin', role: 'admin', dob: '1990-01-01', address: '123'
};

const mockStandardUser: User = {
    id: 2, email: 'user@test.com', lastname: 'Guy', firstname: 'Standard', role: 'adherent', dob: '2000-01-01', address: '456'
};

const mockSessions: Session[] = [
    {
        id: 1, type: 'activity', title: 'Test Activity', description: 'Desc', start_time: new Date().toISOString(), end_time: new Date(Date.now() + 3600000).toISOString(),
        max_participants: 10, status: 'approved', participants: [], activity_id: null
    }
];

describe('CalendarView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as vi.Mock).mockImplementation(async (url) => {
            if (url === '/api/sessions') {
                return { ok: true, json: async () => mockSessions };
            }
            if (url === '/api/users') {
                return { ok: true, json: async () => [mockAdminUser, mockStandardUser] };
            }
            if (url === '/api/quera-point-managers') {
                return { ok: true, json: async () => [] };
            }
            return { ok: true, json: async () => ({}) };
        });
    });

    describe('Connected user (admin)', () => {
        it('fetches sessions and users on mount', async () => {
            render(<CalendarView user={mockAdminUser} />);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith('/api/sessions');
                expect(global.fetch).toHaveBeenCalledWith('/api/users');
            });
        });

        it('displays action buttons for admin', async () => {
            render(<CalendarView user={mockAdminUser} />);

            await waitFor(() => {
                expect(screen.getByText(/Nouvelle Activité/i)).toBeInTheDocument();
                expect(screen.getByText(/Semaine Type/i)).toBeInTheDocument();
                expect(screen.getByText(/Résa. Local/i)).toBeInTheDocument();
            });
        });

        it('does not display login button for connected user', async () => {
            render(<CalendarView user={mockAdminUser} />);

            await waitFor(() => {
                expect(screen.queryByText(/Se connecter/i)).not.toBeInTheDocument();
            });
        });

        it('does not fetch users if user is standard adherent', async () => {
            render(<CalendarView user={mockStandardUser} />);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith('/api/sessions');
                // Users should NOT be fetched for non-admin/non-civic
                expect(global.fetch).not.toHaveBeenCalledWith('/api/users');
            });
        });

        it('toggles views (month, year, week)', async () => {
            render(<CalendarView user={mockAdminUser} />);
            await waitFor(() => expect(screen.getByText('Test Activity')).toBeInTheDocument());

            const monthButton = screen.getByText('Mois');
            await userEvent.click(monthButton);
            await waitFor(() => expect(screen.getByText(/Lun/)).toBeInTheDocument());

            const yearButton = screen.getByText('Année');
            await userEvent.click(yearButton);
            const currentMonthName = new Date().toLocaleDateString('fr-FR', { month: 'long' });
            await waitFor(() => expect(screen.getByText(new RegExp(currentMonthName, 'i'))).toBeInTheDocument());
        });

        it('handles batch homework creation', async () => {
            render(<CalendarView user={mockAdminUser} />);

            await waitFor(() => expect(screen.getByText('Test Activity')).toBeInTheDocument());

            const btn = screen.getByText(/Semaine Type/i);
            await userEvent.click(btn);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith('/api/sessions/homework/batch', expect.any(Object));
            });
        });

        it('handles multiple deletion (selection mode)', async () => {
            (global.confirm as vi.Mock).mockReturnValue(true);
            render(<CalendarView user={mockAdminUser} />);

            await waitFor(() => expect(screen.getByText('Test Activity')).toBeInTheDocument());

            const selectModeBtn = screen.getByText(/Sél. Multiple/i);
            await userEvent.click(selectModeBtn);

            // ✅ Correct - asynchrone, attend le re-render
            const cancelBtn = await screen.findByRole('button', { name: /Annuler/i });
            expect(cancelBtn).toBeInTheDocument();
        });
    });

    describe('Guest user (readOnly mode)', () => {
        it('displays calendar in read-only mode when user is null and readOnly=true', async () => {
            const mockOnLoginClick = vi.fn();
            render(
                <CalendarView user={null} readOnly={true} onLoginClick={mockOnLoginClick} />
            );

            await waitFor(() => {
                expect(screen.getByText('Planning')).toBeInTheDocument();
                expect(screen.getByText('Test Activity')).toBeInTheDocument();
            });
        });

        it('displays only login button for guest', async () => {
            const mockOnLoginClick = vi.fn();
            render(
                <CalendarView user={null} readOnly={true} onLoginClick={mockOnLoginClick} />
            );

            await waitFor(() => {
                expect(screen.getByText(/Se connecter/i)).toBeInTheDocument();
            });
        });

        it('hides all admin action buttons for guest', async () => {
            const mockOnLoginClick = vi.fn();
            render(
                <CalendarView user={null} readOnly={true} onLoginClick={mockOnLoginClick} />
            );

            await waitFor(() => {
                expect(screen.queryByText(/Nouvelle Activité/i)).not.toBeInTheDocument();
                expect(screen.queryByText(/Semaine Type/i)).not.toBeInTheDocument();
                expect(screen.queryByText(/Résa. Local/i)).not.toBeInTheDocument();
                expect(screen.queryByText(/Sél. Multiple/i)).not.toBeInTheDocument();
            });
        });

        it('calls onLoginClick when guest clicks login button', async () => {
            const mockOnLoginClick = vi.fn();
            render(
                <CalendarView user={null} readOnly={true} onLoginClick={mockOnLoginClick} />
            );

            await waitFor(() => {
                const loginBtn = screen.getByText(/Se connecter/i);
                expect(loginBtn).toBeInTheDocument();
                fireEvent.click(loginBtn);
                expect(mockOnLoginClick).toHaveBeenCalled();
            });
        });

        it('does not open session modal when guest clicks session in read-only mode', async () => {
            const mockOnLoginClick = vi.fn();
            render(
                <CalendarView user={null} readOnly={true} onLoginClick={mockOnLoginClick} />
            );

            await waitFor(() => {
                const activity = screen.getByText('Test Activity');
                fireEvent.click(activity);
                // Modal should not appear (no close button or title visible)
                expect(screen.queryByRole('button', { name: /Fermer|Annuler/i })).not.toBeInTheDocument();
            });
        });
    });
});