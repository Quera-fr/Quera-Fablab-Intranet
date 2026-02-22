import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { XCircle } from 'lucide-react';
import { User } from '../../types';

interface ProfileModalProps {
    user: User;
    onClose: () => void;
    onUpdate: (user: User) => void;
}

const ProfileModal = ({ user, onClose, onUpdate }: ProfileModalProps) => {
    const [formData, setFormData] = useState({ ...user, password: '' });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const res = await fetch(`/api/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        if (res.ok) {
            onUpdate({ ...user, ...formData });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-200"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black uppercase tracking-tight">Mon Profil</h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors"><XCircle size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-zinc-500 mb-1 block">Prénom</label>
                            <input value={formData.firstname} className="border border-zinc-200 p-3 rounded-xl w-full font-medium" onChange={e => setFormData({ ...formData, firstname: e.target.value })} required />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-zinc-500 mb-1 block">Nom</label>
                            <input value={formData.lastname} className="border border-zinc-200 p-3 rounded-xl w-full font-medium" onChange={e => setFormData({ ...formData, lastname: e.target.value })} required />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 mb-1 block">Email</label>
                        <input value={formData.email} type="email" className="border border-zinc-200 p-3 rounded-xl w-full font-medium" onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 mb-1 block">Date de naissance</label>
                        <input value={formData.dob} type="date" className="border border-zinc-200 p-3 rounded-xl w-full font-medium" onChange={e => setFormData({ ...formData, dob: e.target.value })} required />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 mb-1 block">Adresse</label>
                        <input value={formData.address} className="border border-zinc-200 p-3 rounded-xl w-full font-medium" onChange={e => setFormData({ ...formData, address: e.target.value })} required />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 mb-1 block">Nouveau mot de passe (optionnel)</label>
                        <input type="password" placeholder="Laisser vide pour ne pas changer" className="border border-zinc-200 p-3 rounded-xl w-full font-medium" onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                    <div className="flex gap-3 pt-6">
                        <button type="button" onClick={onClose} className="flex-1 border border-zinc-200 py-3 rounded-xl font-bold text-zinc-500">Annuler</button>
                        <button type="submit" className="flex-1 bg-black text-white py-3 rounded-xl font-bold">Mettre à jour</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ProfileModal;
