import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RoomBookingFormModal from './RoomBookingFormModal';
import { User } from '../../../types';

global.fetch = vi.fn();
global.alert = vi.fn();

const mockUser: User = {
    id: 1,
    email: 'admin@test.com',
    lastname: 'Doe',
    firstname: 'John',
    role: 'admin',
    dob: '1990-01-01',
    address: '123 Test St'
};

const mockCalculateDefaultTimes = vi.fn().mockReturnValue({
    start_time: '2025-01-01T09:00',
    end_time: '2025-01-01T12:00',
    date: '2025-01-01'
});

describe('RoomBookingFormModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the form correctly', () => {
        render(<RoomBookingFormModal user={mockUser} calculateDefaultTimes={mockCalculateDefaultTimes} onClose={vi.fn()} onFetchSessions={vi.fn()} />);
        expect(screen.getByText('Réservation du local')).toBeInTheDocument();
        expect(document.querySelector('input[name="start_time"]')).toBeInTheDocument();
        expect(document.querySelector('input[name="end_time"]')).toBeInTheDocument();
    });

    it('submits the form data to the correct API endpoint', async () => {
        (global.fetch as vi.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ id: 1 })
        });

        const mockOnClose = vi.fn();
        const mockOnFetchSessions = vi.fn();

        render(<RoomBookingFormModal user={mockUser} calculateDefaultTimes={mockCalculateDefaultTimes} onClose={mockOnClose} onFetchSessions={mockOnFetchSessions} />);

        await userEvent.click(screen.getByRole('button', { name: /Créer/i }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/sessions/room', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('"user_id":1')
            }));
            expect(mockOnClose).toHaveBeenCalled();
            expect(mockOnFetchSessions).toHaveBeenCalled();
        });
    });

    it('alerts on error on submit', async () => {
        (global.fetch as vi.Mock).mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Error booking room' })
        });

        render(<RoomBookingFormModal user={mockUser} calculateDefaultTimes={mockCalculateDefaultTimes} onClose={vi.fn()} onFetchSessions={vi.fn()} />);

        await userEvent.click(screen.getByRole('button', { name: /Créer/i }));

        await waitFor(() => {
            expect(global.alert).toHaveBeenCalledWith('Error booking room');
        });
    });
});
