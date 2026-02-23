import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HomeworkFormModal from './HomeworkFormModal';

global.fetch = vi.fn();

const mockCalculateDefaultTimes = vi.fn().mockReturnValue({
    start_time: '2025-01-01T16:30',
    end_time: '2025-01-01T20:00',
    date: '2025-01-01'
});

describe('HomeworkFormModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the form correctly', () => {
        render(<HomeworkFormModal calculateDefaultTimes={mockCalculateDefaultTimes} onClose={vi.fn()} onFetchSessions={vi.fn()} />);
        expect(screen.getByText('Nouvelle Permanence')).toBeInTheDocument();
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

        render(<HomeworkFormModal calculateDefaultTimes={mockCalculateDefaultTimes} onClose={mockOnClose} onFetchSessions={mockOnFetchSessions} />);

        await userEvent.click(screen.getByRole('button', { name: /Créer/i }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/sessions/homework', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            }));
            expect(mockOnClose).toHaveBeenCalled();
            expect(mockOnFetchSessions).toHaveBeenCalled();
        });
    });

    it('clicks on "Date du jour" to fill inputs', async () => {
        render(<HomeworkFormModal calculateDefaultTimes={mockCalculateDefaultTimes} onClose={vi.fn()} onFetchSessions={vi.fn()} />);

        const todayButton = screen.getByText('Date du jour');
        await userEvent.click(todayButton);

        const startTimeInput = document.querySelector('input[name="start_time"]') as HTMLInputElement;
        expect(startTimeInput).toBeInTheDocument();
        expect(startTimeInput.value).not.toBe('');
    });
});
