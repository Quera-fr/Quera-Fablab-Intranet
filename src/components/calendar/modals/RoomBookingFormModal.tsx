import { FormEvent } from 'react';
import { motion } from 'motion/react';
import { User } from '../../../types';

interface RoomBookingFormModalProps {
    user: User;
    calculateDefaultTimes: (h: number, m: number) => { start_time: string; end_time: string; date: string };
    onClose: () => void;
    onFetchSessions: () => void;
}

const RoomBookingFormModal = ({ user, calculateDefaultTimes, onClose, onFetchSessions }: RoomBookingFormModalProps) => {
    const handleAddRoom = async (e: FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const data = {
            start_time: formData.get('start_time'),
            end_time: formData.get('end_time'),
            user_id: user.id
        };
        const res = await fetch('/api/sessions/room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            try {
                const err = await res.json();
                alert(err.error || 'Erreur lors de la création de la réservation du local.');
            } catch {
                alert('Erreur lors de la création de la réservation du local.');
            }
            return;
        }
        onClose();
        onFetchSessions();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-700">
                <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter text-zinc-900 dark:text-white">Réservation du local</h3>
                <form onSubmit={handleAddRoom} id="add-room-form" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Date de Début</label>
                            <input name="start_time" type="datetime-local" defaultValue={calculateDefaultTimes(9, 0).start_time} className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" required />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Date de Fin</label>
                            <input name="end_time" type="datetime-local" defaultValue={calculateDefaultTimes(9, 0).end_time} className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" required />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-6">
                        <button type="button" onClick={onClose} className="flex-1 border border-zinc-200 dark:border-zinc-700 py-3 rounded-xl font-black text-zinc-400 uppercase text-xs tracking-widest">Annuler</button>
                        <button type="submit" className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">Créer</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default RoomBookingFormModal;
