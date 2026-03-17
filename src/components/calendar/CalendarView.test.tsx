import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
        max_participants: 10, status: 'approved', participants: []
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
            if (url === '/api/sessions/homework/batch') {
                return { ok: true, json: async () => ({}) };
            }
            if (url.startsWith('/api/sessions/') && url.length > '/api/sessions/'.length) {
                return { ok: true, json: async () => ({}) };
            }
            return { ok: true, json: async () => [] };
        });
    });

    it('fetches sessions and (if admin) users on mount', async () => {
        render(<CalendarView user={mockAdminUser} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/sessions');
            expect(global.fetch).toHaveBeenCalledWith('/api/users');
            expect(global.fetch).toHaveBeenCalledWith('/api/quera-point-managers');
            expect(screen.getByText('Test Activity')).toBeInTheDocument();
        });
    });

    it('does not fetch users if user is standard adherent', async () => {
        render(<CalendarView user={mockStandardUser} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/sessions');
            expect(global.fetch).not.toHaveBeenCalledWith('/api/users');
            expect(global.fetch).toHaveBeenCalledWith('/api/quera-point-managers');
        });
    });

    it('toggles views (month, year, week)', async () => {
        render(<CalendarView user={mockAdminUser} />);
        await waitFor(() => expect(screen.getByText('Test Activity')).toBeInTheDocument());

        const monthButton = screen.getByText('Mois');
        await userEvent.click(monthButton);
        await waitFor(() => {
            expect(screen.getByText('Lun')).toBeInTheDocument(); // Short day names usually represent month view
        });

        const yearButton = screen.getByText('Année');
        await userEvent.click(yearButton);
        const currentMonthName = new Date().toLocaleDateString('fr-FR', { month: 'long' });
        // The month names are displayed in year view
        await waitFor(() => {
            expect(screen.getAllByText(new RegExp(currentMonthName, 'i'))[0]).toBeInTheDocument();
        });
    });

    it('admin sees action buttons but standard user does not', async () => {
        const { rerender } = render(<CalendarView user={mockAdminUser} />);
        // Wait for state to settle from initial mount
        await waitFor(() => expect(screen.getByText('Test Activity')).toBeInTheDocument());

        expect(screen.getByText(/Nouvelle Activité/i)).toBeInTheDocument();
        expect(screen.getByText(/Semaine Type/i)).toBeInTheDocument();

        rerender(<CalendarView user={mockStandardUser} />);
        // Wait for re-render effects
        await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/sessions'));

        expect(screen.queryByText(/Nouvelle Activité/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Semaine Type/i)).not.toBeInTheDocument();
    });

    it('handles batch homework creation', async () => {
        render(<CalendarView user={mockAdminUser} />);

        await waitFor(() => expect(screen.getByText('Test Activity')).toBeInTheDocument());

        const btn = screen.getByText(/Semaine Type/i);
        await userEvent.click(btn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/sessions/homework/batch', expect.objectContaining({ method: 'POST' }));
        });
    });

    it('handles multiple deletion (selection mode)', async () => {
        (global.confirm as vi.Mock).mockReturnValue(true);
        render(<CalendarView user={mockAdminUser} />);

        await waitFor(() => expect(screen.getByText('Test Activity')).toBeInTheDocument());

        await waitFor(() => {
            expect(screen.getByText(/Sél. Multiple/i)).toBeInTheDocument();
        });

        const selectModeBtn = screen.getByText(/Sél. Multiple/i);
        await userEvent.click(selectModeBtn);

        // Click the session displayed
        const sessionEl = screen.getByText('Test Activity');
        await userEvent.click(sessionEl);

        const deleteBtn = screen.getByText(/Supprimer \(1\)/i);
        await userEvent.click(deleteBtn);

        await waitFor(() => {
            expect(global.confirm).toHaveBeenCalled();
            expect(global.fetch).toHaveBeenCalledWith('/api/sessions/1', expect.objectContaining({ method: 'DELETE' }));
        });
    });

    it('drags and drops a session correctly', async () => {
        render(<CalendarView user={mockAdminUser} />);
        await waitFor(() => expect(screen.getByText('Test Activity')).toBeInTheDocument());

        const sessionEl = screen.getByText('Test Activity').closest('div[draggable="true"]') as HTMLElement;
        expect(sessionEl).toBeInTheDocument();

        // Simulate drag start
        fireEvent.dragStart(sessionEl, { dataTransfer: { setData: vi.fn(), effectAllowed: '' } });

        // Find another slot to drop into (we know 'activity' row exists and has slots)
        const activityRowHeading = screen.getByText('Activités').closest('button');
        const activitySlotsContainer = activityRowHeading?.nextElementSibling;
        const slots = activitySlotsContainer?.querySelectorAll('.group\\/slot');
        expect(slots?.length).toBeGreaterThan(0);

        // Find a slot that doesn't have the current session (e.g. tomorrow)
        const dropSlot = slots![1];

        fireEvent.dragOver(dropSlot, { preventDefault: vi.fn(), dataTransfer: { dropEffect: '' } });
        fireEvent.drop(dropSlot, { preventDefault: vi.fn() });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/sessions/1', expect.objectContaining({ method: 'PATCH' }));
        });
    });

    it('opens add activity form on empty slot click (admin)', async () => {
        render(<CalendarView user={mockAdminUser} />);
        await waitFor(() => expect(screen.getByText('Test Activity')).toBeInTheDocument());

        await waitFor(() => {
            // Find an add button within an empty slot. We have specific hover plus buttons.
            const addButtonsContainers = screen.getAllByRole('button').filter(b => b.classList.contains('opacity-0'));
            // The plus sign is visible on group-hover, accessible via its click handler attached to the button with class opacity-0 group-hover/slot:opacity-100
            expect(addButtonsContainers.length).toBeGreaterThan(0);
        });

        const activityRowBtn = screen.getByText('Activités').closest('button');
        await userEvent.click(activityRowBtn!);

        await waitFor(() => {
            expect(screen.getByText('Nouvel Atelier')).toBeInTheDocument();
        });
    });
});
