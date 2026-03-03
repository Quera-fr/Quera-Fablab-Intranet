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

    it('envoie bien deadline et image_url dans le body de la requête', async () => {
        // Mock fetch: d'abord /api/upload, ensuite /api/activities
        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ url: 'https://cdn.example.com/jardin.png' })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 999 })
            });

        // Mock FileReader pour simuler le résultat base64
        window.FileReader = class {
            onloadend: ((e: any) => void) | null = null;
            result = 'data:image/png;base64,FAKEBASE64';
            readAsDataURL(_file: File) {
                if (this.onloadend) {
                    this.onloadend({ target: { result: this.result } });
                }
            }
        } as any;

        render(
            <ActivityFormModal
                user={mockUser}
                calculateDefaultTimes={mockCalculateDefaultTimes}
                onClose={vi.fn()}
                onFetchSessions={vi.fn()}
            />
        );

        // Remplir les champs obligatoires
        await userEvent.type(screen.getByPlaceholderText("Titre de l'atelier"), 'Atelier Jardinage');
        await userEvent.type(screen.getByPlaceholderText('Description pédagogique'), 'Apprendre à planter');
        await userEvent.type(screen.getByPlaceholderText('Places'), '12');

        // Remplir la deadline — fireEvent.change car c'est un input[type="date"]
        const deadlineInput = document.querySelector('input[name="deadline"]') as HTMLInputElement;
        expect(deadlineInput).toBeInTheDocument(); // vérifie que le champ existe bien
        fireEvent.change(deadlineInput, { target: { value: '2025-06-01' } });
        expect(deadlineInput.value).toBe('2025-06-01');

        // Uploader une image
        const file = new File(['img'], 'jardin.png', { type: 'image/png' });
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        await userEvent.upload(fileInput, file);

        // Soumettre
        await userEvent.click(screen.getByRole('button', { name: /Soumettre/i }));

        await waitFor(() => {
            // 1er appel : upload de l'image
            expect(global.fetch).toHaveBeenCalledWith('/api/upload', expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('FAKEBASE64')
            }));

            // 2ème appel : création de l'activité
            expect(global.fetch).toHaveBeenCalledWith('/api/activities', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('"deadline":"2025-06-01"')
            }));

            // Vérifier que l'URL retournée par /api/upload est bien utilisée
            const activitiesCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
            const body = JSON.parse(activitiesCall[1].body);
            expect(body.image_url).toBe('https://cdn.example.com/jardin.png');
            expect(body.deadline).toBe('2025-06-01');
            expect(body.title).toBe('Atelier Jardinage');
            expect(body.max_participants).toBe(12);
        });
    });
});
