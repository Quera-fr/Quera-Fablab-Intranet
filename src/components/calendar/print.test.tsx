import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CalendarView from './CalendarView';
import { User, Session } from '../../types';

global.fetch = vi.fn();
global.window.open = vi.fn();

const mockAdminUser: User = {
    id: 1,
    email: 'admin@test.com',
    lastname: 'Admin',
    firstname: 'Super',
    role: 'admin',
    dob: '1990-01-01',
    address: '123 Street'
};

const mockCivicUser: User = {
    id: 2,
    email: 'civic@test.com',
    lastname: 'Service',
    firstname: 'Civic',
    role: 'civic_service',
    dob: '1995-01-01',
    address: '456 Street'
};

const mockBeneficiaryUser: User = {
    id: 3,
    email: 'beneficiary@test.com',
    lastname: 'Beneficiary',
    firstname: 'Test',
    role: 'beneficiary',
    dob: '2000-01-01',
    address: '789 Street'
};

const mockSessions: Session[] = [
    {
        id: 1,
        type: 'homework_help',
        activity_id: null,
        title: 'Aide aux devoirs',
        description: 'Soutien scolaire',
        start_time: new Date(2026, 2, 2, 16, 30).toISOString(),
        end_time: new Date(2026, 2, 2, 18, 30).toISOString(),
        status: 'approved',
        max_participants: 15,
        participants: [
            { user_id: 3, role_at_registration: 'beneficiary', firstname: 'Alice', lastname: 'Martin', role: 'beneficiary' }
        ]
    },
    {
        id: 2,
        type: 'activity',
        activity_id: 1,
        title: 'Atelier en direct',
        description: 'Activité pratique',
        start_time: new Date(2026, 2, 3, 14, 0).toISOString(),
        end_time: new Date(2026, 2, 3, 16, 0).toISOString(),
        status: 'approved',
        max_participants: 20,
        participants: [
            { user_id: 1, role_at_registration: 'admin', firstname: 'Super', lastname: 'Admin', role: 'admin' },
            { user_id: 3, role_at_registration: 'beneficiary', firstname: 'Bob', lastname: 'Johnson', role: 'beneficiary' }
        ]
    },
    {
        id: 3,
        type: 'room_booking',
        activity_id: null,
        title: 'Réservation salle',
        start_time: new Date(2026, 2, 4, 10, 0).toISOString(),
        end_time: new Date(2026, 2, 4, 12, 0).toISOString(),
        status: 'approved',
        max_participants: 1,
        participants: [
            { user_id: 2, role_at_registration: 'civic_service', firstname: 'Civic', lastname: 'Service', role: 'civic_service' }
        ]
    }
];

describe('Print Functionality', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as vi.Mock).mockImplementation(async (url) => {
            if (url === '/api/sessions') {
                return { ok: true, json: async () => mockSessions };
            }
            if (url === '/api/users') {
                return { ok: true, json: async () => [mockAdminUser, mockCivicUser, mockBeneficiaryUser] };
            }
            return { ok: true, json: async () => [] };
        });
    });

    describe('Print Button Visibility', () => {
        it('should show print button for admin user', async () => {
            render(<CalendarView user={mockAdminUser} />);

            await waitFor(() => {
                const printButton = screen.getByRole('button', { name: /imprimer/i });
                expect(printButton).toBeInTheDocument();
                expect(printButton).toBeVisible();
            });
        });

        it('should show print button for civic_service user', async () => {
            render(<CalendarView user={mockCivicUser} />);

            await waitFor(() => {
                const printButton = screen.getByRole('button', { name: /imprimer/i });
                expect(printButton).toBeInTheDocument();
                expect(printButton).toBeVisible();
            });
        });

        it('should NOT show print button for beneficiary user', async () => {
            render(<CalendarView user={mockBeneficiaryUser} />);

            await waitFor(() => {
                const printButtons = screen.queryAllByRole('button', { name: /imprimer/i });
                expect(printButtons.length).toBe(0);
            });
        });
    });

    describe('Print Menu Dropdown', () => {
        it('should open print menu when clicking print button', async () => {
            const user = userEvent.setup();
            render(<CalendarView user={mockAdminUser} />);

            await waitFor(() => {
                const printButton = screen.getByRole('button', { name: /imprimer/i });
                expect(printButton).toBeInTheDocument();
            });

            const printButton = screen.getByRole('button', { name: /imprimer/i });
            await user.click(printButton);

            await waitFor(() => {
                expect(screen.getByText('Planning de la semaine')).toBeVisible();
                expect(screen.getByText('Fiche de présence')).toBeVisible();
            });
        });

        it('should close print menu when clicking print button again', async () => {
            const user = userEvent.setup();
            render(<CalendarView user={mockAdminUser} />);

            await waitFor(() => {
                const printButton = screen.getByRole('button', { name: /imprimer/i });
                expect(printButton).toBeInTheDocument();
            });

            const printButton = screen.getByRole('button', { name: /imprimer/i });
            
            // Open menu
            await user.click(printButton);
            await waitFor(() => {
                expect(screen.getByText('Planning de la semaine')).toBeVisible();
            });

            // Close menu
            await user.click(printButton);
            await waitFor(() => {
                expect(screen.queryByText('Planning de la semaine')).not.toBeInTheDocument();
            });
        });
    });

    describe('Print Menu Options', () => {
        it('should have "Planning de la semaine" option in menu', async () => {
            const user = userEvent.setup();
            render(<CalendarView user={mockAdminUser} />);

            await waitFor(() => {
                const printButton = screen.getByRole('button', { name: /imprimer/i });
                expect(printButton).toBeInTheDocument();
            });

            const printButton = screen.getByRole('button', { name: /imprimer/i });
            await user.click(printButton);

            await waitFor(() => {
                const planningOption = screen.getByText('Planning de la semaine');
                expect(planningOption).toBeVisible();
            });
        });

        it('should have "Fiche de présence" option in menu', async () => {
            const user = userEvent.setup();
            render(<CalendarView user={mockAdminUser} />);

            await waitFor(() => {
                const printButton = screen.getByRole('button', { name: /imprimer/i });
                expect(printButton).toBeInTheDocument();
            });

            const printButton = screen.getByRole('button', { name: /imprimer/i });
            await user.click(printButton);

            await waitFor(() => {
                const attendanceOption = screen.getByText('Fiche de présence');
                expect(attendanceOption).toBeVisible();
            });
        });

        it('should open new window when clicking "Planning de la semaine"', async () => {
            const user = userEvent.setup();
            const mockOpen = vi.fn(() => ({
                document: { write: vi.fn(), close: vi.fn() }
            }));
            global.window.open = mockOpen;

            render(<CalendarView user={mockAdminUser} />);

            await waitFor(() => {
                const printButton = screen.getByRole('button', { name: /imprimer/i });
                expect(printButton).toBeInTheDocument();
            });

            const printButton = screen.getByRole('button', { name: /imprimer/i });
            await user.click(printButton);

            const planningOption = screen.getByText('Planning de la semaine');
            await user.click(planningOption);

            await waitFor(() => {
                expect(mockOpen).toHaveBeenCalled();
            });
        });

        it('should open new window when clicking "Fiche de présence"', async () => {
            const user = userEvent.setup();
            const mockOpen = vi.fn(() => ({
                document: { write: vi.fn(), close: vi.fn() }
            }));
            global.window.open = mockOpen;

            render(<CalendarView user={mockAdminUser} />);

            await waitFor(() => {
                const printButton = screen.getByRole('button', { name: /imprimer/i });
                expect(printButton).toBeInTheDocument();
            });

            const printButton = screen.getByRole('button', { name: /imprimer/i });
            await user.click(printButton);

            const attendanceOption = screen.getByText('Fiche de présence');
            await user.click(attendanceOption);

            await waitFor(() => {
                expect(mockOpen).toHaveBeenCalled();
            });
        });
    });

    describe('Print Content', () => {
        it('should include session data in print output', async () => {
            const user = userEvent.setup();
            const mockWindowOpen = vi.fn();
            let capturedHtml = '';
            
            global.window.open = mockWindowOpen.mockImplementation(() => {
                return {
                    document: {
                        write: (html: string) => { capturedHtml = html; },
                        close: vi.fn()
                    }
                };
            });

            render(<CalendarView user={mockAdminUser} />);

            await waitFor(() => {
                const printButton = screen.getByRole('button', { name: /imprimer/i });
                expect(printButton).toBeInTheDocument();
            });

            const printButton = screen.getByRole('button', { name: /imprimer/i });
            await user.click(printButton);

            const planningOption = screen.getByText('Planning de la semaine');
            await user.click(planningOption);

            await waitFor(() => {
                expect(capturedHtml).toContain('PLANNING DE LA SEMAINE');
                expect(capturedHtml).toContain('Quera Fablab');
                expect(capturedHtml).toContain('LUNDI');
                expect(capturedHtml).toContain('MARDI');
                expect(capturedHtml).toContain('Aide aux devoirs');
            });
        });

        it('should include participant names in attendance sheet', async () => {
            const user = userEvent.setup();
            const mockWindowOpen = vi.fn();
            let capturedHtml = '';
            
            global.window.open = mockWindowOpen.mockImplementation(() => {
                return {
                    document: {
                        write: (html: string) => { capturedHtml = html; },
                        close: vi.fn()
                    }
                };
            });

            render(<CalendarView user={mockAdminUser} />);

            await waitFor(() => {
                const printButton = screen.getByRole('button', { name: /imprimer/i });
                expect(printButton).toBeInTheDocument();
            });

            const printButton = screen.getByRole('button', { name: /imprimer/i });
            await user.click(printButton);

            const attendanceOption = screen.getByText('Fiche de présence');
            await user.click(attendanceOption);

            await waitFor(() => {
                expect(capturedHtml).toContain('Fiche de présence');
                expect(capturedHtml).toContain('Alice Martin');
                expect(capturedHtml).toContain('Civic Service');
            });
        });
    });
});
