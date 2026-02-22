import { useState, ChangeEvent, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Info, Upload, X } from 'lucide-react';
import { User } from '../../../types';

interface ActivityFormModalProps {
    user: User;
    calculateDefaultTimes: () => { start_time: string; end_time: string; date: string };
    onClose: () => void;
    onFetchSessions: () => void;
}

const ActivityFormModal = ({ user, calculateDefaultTimes, onClose, onFetchSessions }: ActivityFormModalProps) => {
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddActivity = async (e: FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);

        let uploadedImageUrl = formData.get('image_url') as string;

        if (selectedImageFile && imagePreview) {
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imagePreview, name: selectedImageFile.name }),
            });
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
                uploadedImageUrl = uploadData.url;
            }
        }

        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            image_url: uploadedImageUrl,
            max_participants: parseInt(formData.get('max_participants') as string),
            deadline: formData.get('deadline'),
            start_time: formData.get('start_time'),
            end_time: formData.get('end_time'),
            created_by: user.id
        };
        await fetch('/api/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        onClose();
        setSelectedImageFile(null);
        setImagePreview(null);
        onFetchSessions();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-700">
                <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter text-zinc-900 dark:text-white">Nouvel Atelier</h3>
                <form onSubmit={handleAddActivity} id="add-activity-form" className="space-y-4">
                    <div className="flex justify-end">
                        <button type="button" onClick={() => {
                            const today = new Date();
                            const end = new Date();
                            end.setHours(end.getHours() + 1);
                            const form = document.getElementById('add-activity-form') as HTMLFormElement;
                            if (form) {
                                (form.elements.namedItem('start_time') as HTMLInputElement).value = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                (form.elements.namedItem('end_time') as HTMLInputElement).value = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                (form.elements.namedItem('deadline') as HTMLInputElement).value = today.toISOString().split('T')[0];
                            }
                        }} className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-700 hover:underline tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">Date du jour</button>
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Titre de l'atelier</label>
                        <input name="title" placeholder="Titre de l'atelier" className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" required />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Description</label>
                        <textarea name="description" placeholder="Description pédagogique" className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl h-24 font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Places</label>
                            <input name="max_participants" type="number" placeholder="Places" className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" required />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Date Limite d'Inscription</label>
                            <input name="deadline" type="date" defaultValue={calculateDefaultTimes().date} className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Image de l'activité</label>
                            <div className="space-y-3">
                                {imagePreview ? (
                                    <div className="relative group rounded-xl overflow-hidden aspect-video border border-zinc-200 dark:border-zinc-700">
                                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedImageFile(null); setImagePreview(null); }}
                                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                        <Upload className="text-zinc-400 mb-2" size={24} />
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Cliquez pour verser</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                    </label>
                                )}
                                <input name="image_url" placeholder="Ou coller une URL d'image" className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Date de Début</label>
                                    <input name="start_time" type="datetime-local" defaultValue={calculateDefaultTimes().start_time} className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" required />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Date de Fin</label>
                                    <input name="end_time" type="datetime-local" defaultValue={calculateDefaultTimes().end_time} className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" required />
                                </div>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
                                <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest flex items-center gap-2">
                                    <Info size={12} /> L'activité sera soumise à validation.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-6">
                        <button type="button" onClick={onClose} className="flex-1 border border-zinc-200 dark:border-zinc-700 py-3 rounded-xl font-black text-zinc-400 uppercase text-xs tracking-widest">Annuler</button>
                        <button type="submit" className="flex-1 bg-black dark:bg-white dark:text-black text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">Soumettre</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ActivityFormModal;
