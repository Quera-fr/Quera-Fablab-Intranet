import { FormEvent } from 'react';
import { motion } from 'motion/react';

interface HomeworkFormModalProps {
    calculateDefaultTimes: (h: number, m: number) => { start_time: string; end_time: string; date: string };
    onClose: () => void;
    onFetchSessions: () => void;
}

const HomeworkFormModal = ({ calculateDefaultTimes, onClose, onFetchSessions }: HomeworkFormModalProps) => {
    const handleAddHomework = async (e: FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const data = {
            start_time: formData.get('start_time'),
            end_time: formData.get('end_time'),
        };
        await fetch('/api/sessions/homework', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        onClose();
        onFetchSessions();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-700">
                <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter text-zinc-900 dark:text-white">Nouvelle Permanence</h3>
                <form onSubmit={handleAddHomework} id="add-homework-form" className="space-y-4">
                    <div className="flex justify-end">
                        <button type="button" onClick={() => {
                            const today = new Date();
                            const end = new Date();
                            today.setHours(16, 30, 0, 0); // Default to 16h30
                            end.setHours(20, 0, 0, 0); // Default to 20h00
                            const form = document.getElementById('add-homework-form') as HTMLFormElement;
                            if (form) {
                                (form.elements.namedItem('start_time') as HTMLInputElement).value = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                (form.elements.namedItem('end_time') as HTMLInputElement).value = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                            }
                        }} className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-700 hover:underline tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">Date du jour</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Date de Début</label>
                            <input name="start_time" type="datetime-local" defaultValue={calculateDefaultTimes(16, 30).start_time} className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" required />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Date de Fin</label>
                            <input name="end_time" type="datetime-local" defaultValue={calculateDefaultTimes(16, 30).end_time} className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" required />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-6">
                        <button type="button" onClick={onClose} className="flex-1 border border-zinc-200 dark:border-zinc-700 py-3 rounded-xl font-black text-zinc-400 uppercase text-xs tracking-widest">Annuler</button>
                        <button type="submit" className="flex-1 bg-black dark:bg-white dark:text-black text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">Créer</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default HomeworkFormModal;
