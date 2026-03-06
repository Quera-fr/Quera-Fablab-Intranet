import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-select', () => ({
    default: ({ options, onChange, placeholder, isMulti }: any) => (
        <select
            multiple={!!isMulti}
            data-testid={`react-select-${placeholder}`}
            onChange={(e) => {
                if (!onChange) return;
                if (isMulti) {
                    const vals = Array.from(
                        (e.target as HTMLSelectElement).selectedOptions
                    ).map((o) => o.value);
                    if (vals.length > 0) {
                        onChange((options || []).filter((o: any) => vals.includes(String(o.value))));
                    } else {
                        // Fallback pour fireEvent.change qui surcharge .value mais pas .selectedOptions
                        const val = (e.target as HTMLSelectElement).value;
                        const opt = val ? (options || []).find((o: any) => String(o.value) === val) : null;
                        onChange(opt ? [opt] : []);
                    }
                } else {
                    const opt = (options || []).find((o: any) => String(o.value) === (e.target as HTMLSelectElement).value);
                    onChange(opt || null);
                }
            }}
        >
            <option value="">{placeholder}</option>
            {(options || []).map((opt: any) => (
                <option key={opt.value} value={String(opt.value)}>{opt.label}</option>
            ))}
        </select>
    ),
}));
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SessionModal from './SessionModal';
import { User, Session } from '../../../types';

global.fetch = vi.fn();

const mockAdminUser: User = {
    id: 1,
    email: 'admin@test.com',
    lastname: 'Admin',
    firstname: 'Super',
    role: 'admin',
    dob: '1990-01-01',
    address: '123 Admin St'
};

const mockBeneficiary: User = {
    id: 2,
    email: 'bene@test.com',
    lastname: 'Bene',
    firstname: 'Ficiary',
    role: 'beneficiary',
    dob: '2010-01-01',
    address: '123 Bene St'
};

const mockVolunteer: User = {
    id: 3,
    email: 'vol@test.com',
    lastname: 'Volun',
    firstname: 'Teer',
    role: 'volunteer',
    dob: '1995-01-01',
    address: '123 Vol St'
};

const mockAllUsers = [mockAdminUser, mockBeneficiary, mockVolunteer];

const mockActivitySession: Session = {
    id: 1,
    type: 'activity',
    title: 'Test Activity',
    description: 'This is a test activity description',
    start_time: '2025-10-10T14:00:00Z',
    end_time: '2025-10-10T16:00:00Z',
    max_participants: 20,
    deadline: '2025-10-01',
    status: 'pending',
    activity_id: 10,
    participants: [
        // **removed invalid `registration_date` and added required `role`**
        { user_id: 2, firstname: 'Ficiary', lastname: 'Bene', role_at_registration: 'beneficiary', role: 'beneficiary' }
    ]
};

describe('SessionModal', () => {
    let mockOnClose: any;
    let mockOnRegister: any;
    let mockOnUnregister: any;
    let mockOnDeleteSession: any;
    let mockOnValidateActivity: any;
    let mockOnFetchSessions: any;
    let mockShowSuccess: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnClose = vi.fn();
        mockOnRegister = vi.fn();
        mockOnUnregister = vi.fn();
        mockOnDeleteSession = vi.fn();
        mockOnValidateActivity = vi.fn();
        mockOnFetchSessions = vi.fn();
        mockShowSuccess = vi.fn();
    });

    const renderModal = (session = mockActivitySession, user = mockAdminUser) => {
        return render(
            <SessionModal
                selectedSession={session}
                user={user}
                allUsers={mockAllUsers}
                onClose={mockOnClose}
                onRegister={mockOnRegister}
                onUnregister={mockOnUnregister}
                onDeleteSession={mockOnDeleteSession}
                onValidateActivity={mockOnValidateActivity}
                onFetchSessions={mockOnFetchSessions}
                showSuccess={mockShowSuccess}
            />
        );
    };

    it('renders session details correctly', () => {
        renderModal();
        expect(screen.getByText('Test Activity')).toBeInTheDocument();
        expect(screen.getByText(/"This is a test activity description"/i)).toBeInTheDocument();
        expect(screen.getByText(/20 places/i)).toBeInTheDocument();

        // Beneficiary should be displayed
        expect(screen.getByText(/Ficiary Bene/i)).toBeInTheDocument();
        expect(screen.getByText(/Aucun bénévole/i)).toBeInTheDocument();
    });

    it('handles register when user is not participant', async () => {
        renderModal();

        const registerButton = screen.getByRole('button', { name: /S'inscrire/i });
        await userEvent.click(registerButton);

        expect(mockOnRegister).toHaveBeenCalledWith(mockActivitySession.id);
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockShowSuccess).toHaveBeenCalledWith("Inscription confirmée !");
    });

    it('handles unregister when user is participant', async () => {
        const sessionWithAdmin: Session = {
            ...mockActivitySession,
            participants: [{
                user_id: mockAdminUser.id,
                firstname: 'Super',
                lastname: 'Admin',
                role_at_registration: 'volunteer',
                role: 'admin'
            }]
        };
        renderModal(sessionWithAdmin);
    
        const unregisterButton = screen.getByRole('button', { name: /Se désister/i });
        await userEvent.click(unregisterButton);
    
        expect(mockOnUnregister).toHaveBeenCalledWith(sessionWithAdmin.id);
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockShowSuccess).toHaveBeenCalledWith("Inscription annulée !");
    });

    it('admin can unregister another user', async () => {
        renderModal();
        const trashButtons = screen.getAllByTitle('Retirer');
        await userEvent.click(trashButtons[0]);

        expect(mockOnUnregister).toHaveBeenCalledWith(mockActivitySession.id, mockBeneficiary.id);
        expect(mockShowSuccess).toHaveBeenCalledWith("Utilisateur retiré !");
    });

    it('admin can manually register a beneficiary', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

        const emptySession = { ...mockActivitySession, participants: [] };
        renderModal(emptySession);

        const benSelect = screen.getByTestId('react-select-+ Jeune');
        fireEvent.change(benSelect, { target: { value: mockBeneficiary.id.toString() } });
        await userEvent.click(screen.getAllByText('GO')[0]);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/registrations',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: expect.stringContaining(`"user_id":${mockBeneficiary.id}`)
                })
            );
            expect(mockOnFetchSessions).toHaveBeenCalled();
            expect(mockShowSuccess).toHaveBeenCalledWith('1 jeune(s) inscrit(s) !');
        });
    });

    /* ... rest of the tests stay unchanged ... */

    it('admin can delete session', async () => {
        renderModal();
        const deleteSessionBtn = screen.getByRole('button', { name: /Supprimer la session/i });
        await userEvent.click(deleteSessionBtn);

        expect(mockOnDeleteSession).toHaveBeenCalledWith(mockActivitySession.id);
    });

    it('admin can approve pending activity', async () => {
        renderModal();
        const approveBtn = screen.getByRole('button', { name: /Approuver l'atelier/i });
        await userEvent.click(approveBtn);

        expect(mockOnValidateActivity).toHaveBeenCalledWith(mockActivitySession.activity_id, 'approved');
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('admin can suspend approved activity', async () => {
        const approvedSession = { ...mockActivitySession, status: 'approved' as const };
        renderModal(approvedSession);

        const suspendBtn = screen.getByRole('button', { name: /Suspendre/i });
        await userEvent.click(suspendBtn);

        expect(mockOnValidateActivity).toHaveBeenCalledWith(mockActivitySession.activity_id, 'pending');
        expect(mockOnClose).toHaveBeenCalled();
    });

    // civic‑service activity test
    const mockCivicSession: Session = {
        ...mockActivitySession,
        activity_id: 20
    };

    it('admin can validate and delete an activity proposed by un service civique', async () => {
        renderModal(mockCivicSession);
        const approveBtn = screen.getByRole('button', { name: /Approuver l'atelier/i });
        await userEvent.click(approveBtn);
        expect(mockOnValidateActivity).toHaveBeenCalledWith(mockCivicSession.activity_id, 'approved');
        expect(mockOnClose).toHaveBeenCalled();

        const deleteBtn = screen.getByRole('button', { name: /Supprimer la session/i });
        await userEvent.click(deleteBtn);
        expect(mockOnDeleteSession).toHaveBeenCalledWith(mockCivicSession.id);
    });
});