import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActivityFormModal from './ActivityFormModal';
import { User } from '../../../types';

global.fetch = vi.fn();

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
    start_time: '2025-01-01T10:00',
    end_time: '2025-01-01T12:00',
    date: '2025-01-01'
});

describe('ActivityFormModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the form correctly', () => {
        render(<ActivityFormModal user={mockUser} calculateDefaultTimes={mockCalculateDefaultTimes} onClose={vi.fn()} onFetchSessions={vi.fn()} />);
        expect(screen.getByText('Nouvel Atelier')).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Titre de l'atelier")).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Description pédagogique')).toBeInTheDocument();
    });

    it('clicks on "Date du jour" to fill inputs', async () => {
        render(<ActivityFormModal user={mockUser} calculateDefaultTimes={mockCalculateDefaultTimes} onClose={vi.fn()} onFetchSessions={vi.fn()} />);

        const todayButton = screen.getByText('Date du jour');
        await userEvent.click(todayButton);

        const startTimeInput = document.querySelector('input[name="start_time"]') as HTMLInputElement;
        expect(startTimeInput).toBeInTheDocument();
        expect(startTimeInput.value).not.toBe('');
    });

    it('submits the form data to the correct API endpoint', async () => {
        (global.fetch as vi.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ id: 1 })
        });

        const mockOnClose = vi.fn();
        const mockOnFetchSessions = vi.fn();

        render(<ActivityFormModal user={mockUser} calculateDefaultTimes={mockCalculateDefaultTimes} onClose={mockOnClose} onFetchSessions={mockOnFetchSessions} />);

        await userEvent.type(screen.getByPlaceholderText("Titre de l'atelier"), 'My Activity');
        await userEvent.type(screen.getByPlaceholderText('Description pédagogique'), 'Desc');
        await userEvent.type(screen.getByPlaceholderText('Places'), '10');

        await userEvent.click(screen.getByRole('button', { name: /Soumettre/i }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/activities', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('"title":"My Activity"')
            }));
            expect(mockOnClose).toHaveBeenCalled();
            expect(mockOnFetchSessions).toHaveBeenCalled();
        });
    });

    it('handles image selection', async () => {
        render(<ActivityFormModal user={mockUser} calculateDefaultTimes={mockCalculateDefaultTimes} onClose={vi.fn()} onFetchSessions={vi.fn()} />);

        const file = new File(['hello'], 'hello.png', { type: 'image/png' });
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

        const mockReadAsDataURL = vi.fn();
        window.FileReader = class {
            onloadend: any;
            result = 'data:image/png;base64,1234';
            readAsDataURL(f: any) {
                mockReadAsDataURL(f);
                if (this.onloadend) {
                    this.onloadend({ target: { result: this.result } });
                }
            }
        } as any;

        await userEvent.upload(fileInput, file);

        expect(mockReadAsDataURL).toHaveBeenCalledWith(file);
    });
});
