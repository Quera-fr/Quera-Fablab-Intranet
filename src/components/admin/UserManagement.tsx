import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { User, Role } from '../../types';

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ email: '', lastname: '', firstname: '', role: 'beneficiary' as Role, dob: '', address: '', password: '' });
    const [newUser, setNewUser] = useState({
        email: '',
        lastname: '',
        firstname: '',
        role: 'beneficiary' as Role,
        dob: '',
        address: ''
    });

    const fetchUsers = async () => {
        const res = await fetch('/api/users');
        setUsers(await res.json());
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleAdd = async (e: FormEvent) => {
        e.preventDefault();
        await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser),
        });
        setShowAdd(false);
        fetchUsers();
    };

    const handleEdit = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        const body: Record<string, unknown> = { ...editForm };
        if (!body.password) delete body.password;
        await fetch(`/api/users/${editingUser.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        setEditingUser(null);
        fetchUsers();
    };

    const handleDelete = async (id: number) => {
        if (confirm('Supprimer cet utilisateur ?')) {
            await fetch(`/api/users/${id}`, { method: 'DELETE' });
            fetchUsers();
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (confirm(`Supprimer les ${selectedIds.length} utilisateurs sélectionnés ?`)) {
            await fetch('/api/users/batch', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds }),
            });
            setSelectedIds([]);
            fetchUsers();
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === users.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(users.map(u => u.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Utilisateurs</h2>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-all font-bold text-[10px] uppercase tracking-wider shadow-lg animate-in fade-in slide-in-from-left-4"
                        >
                            <Trash2 size={16} /> Supprimer ({selectedIds.length})
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors font-bold text-sm uppercase tracking-wider"
                >
                    <Plus size={18} /> Ajouter
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200">
                            <th className="p-4 w-10">
                                <input
                                    type="checkbox"
                                    checked={users.length > 0 && selectedIds.length === users.length}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
                                />
                            </th>
                            <th className="p-4 font-bold text-zinc-500 text-[10px] uppercase tracking-widest">Nom</th>
                            <th className="p-4 font-bold text-zinc-500 text-[10px] uppercase tracking-widest">Rôle</th>
                            <th className="p-4 font-bold text-zinc-500 text-[10px] uppercase tracking-widest">Email</th>
                            <th className="p-4 font-bold text-zinc-500 text-[10px] uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className={`border-t border-zinc-100 hover:bg-zinc-50 transition-colors ${selectedIds.includes(u.id) ? 'bg-zinc-50/50' : ''}`}>
                                <td className="p-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(u.id)}
                                        onChange={() => toggleSelect(u.id)}
                                        className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
                                    />
                                </td>
                                <td className="p-4 text-zinc-800 font-bold">{u.firstname} {u.lastname}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-zinc-900 text-white' :
                                        u.role === 'volunteer' ? 'bg-zinc-100 text-zinc-600 border border-zinc-200' :
                                            u.role === 'civic_service' ? 'bg-zinc-200 text-zinc-800' :
                                                'bg-white text-zinc-500 border border-zinc-200'
                                        }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4 text-zinc-500 text-sm font-medium">{u.email}</td>
                                <td className="p-4 flex gap-2 justify-end">
                                    <button onClick={() => { setEditingUser(u); setEditForm({ ...u, password: '' }); }} className="p-2 text-zinc-400 hover:text-black hover:bg-white rounded-lg transition-all" title="Modifier">
                                        <Pencil size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(u.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-white rounded-lg transition-all" title="Supprimer">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {showAdd && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-700"
                        >
                            <h3 className="text-xl font-black mb-6 uppercase tracking-tight text-zinc-900 dark:text-white">Nouvel Utilisateur</h3>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="Prénom" className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" onChange={e => setNewUser({ ...newUser, firstname: e.target.value })} required />
                                    <input placeholder="Nom" className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" onChange={e => setNewUser({ ...newUser, lastname: e.target.value })} required />
                                </div>
                                <input placeholder="Email" type="email" className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                                <select className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" onChange={e => setNewUser({ ...newUser, role: e.target.value as Role })}>
                                    <option value="beneficiary">Bénéficiaire (Collégien/Lycéen)</option>
                                    <option value="volunteer">Bénévole (Encadrant)</option>
                                    <option value="civic_service">Service Civique</option>
                                    <option value="admin">Administrateur</option>
                                    <option value="adherent">Adhérent</option>
                                </select>
                                <input type="date" className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" onChange={e => setNewUser({ ...newUser, dob: e.target.value })} required />
                                <input placeholder="Adresse" className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" onChange={e => setNewUser({ ...newUser, address: e.target.value })} required />
                                <div className="flex gap-3 pt-6">
                                    <button type="button" onClick={() => setShowAdd(false)} className="flex-1 border border-zinc-200 dark:border-zinc-700 py-3 rounded-xl font-bold text-zinc-500">Annuler</button>
                                    <button type="submit" className="flex-1 bg-black text-white py-3 rounded-xl font-bold">Créer</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
                {editingUser && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setEditingUser(null)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-700"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-black mb-6 uppercase tracking-tight text-zinc-900 dark:text-white">Modifier l&apos;utilisateur</h3>
                            <form onSubmit={handleEdit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="Prénom" value={editForm.firstname} className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" onChange={e => setEditForm({ ...editForm, firstname: e.target.value })} required />
                                    <input placeholder="Nom" value={editForm.lastname} className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" onChange={e => setEditForm({ ...editForm, lastname: e.target.value })} required />
                                </div>
                                <input placeholder="Email" type="email" value={editForm.email} className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
                                <select value={editForm.role} className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" onChange={e => setEditForm({ ...editForm, role: e.target.value as Role })}>
                                    <option value="beneficiary">Bénéficiaire (Collégien)</option>
                                    <option value="volunteer">Bénévole (Encadrant)</option>
                                    <option value="civic_service">Service Civique</option>
                                    <option value="admin">Administrateur</option>
                                    <option value="adherent">Adhérent</option>
                                </select>
                                <input type="date" value={editForm.dob} className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" onChange={e => setEditForm({ ...editForm, dob: e.target.value })} required />
                                <input placeholder="Adresse" value={editForm.address} className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" onChange={e => setEditForm({ ...editForm, address: e.target.value })} required />
                                <input placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)" type="password" className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" onChange={e => setEditForm({ ...editForm, password: e.target.value })} />
                                <div className="flex gap-3 pt-6">
                                    <button type="button" onClick={() => setEditingUser(null)} className="flex-1 border border-zinc-200 dark:border-zinc-700 py-3 rounded-xl font-bold text-zinc-500">Annuler</button>
                                    <button type="submit" className="flex-1 bg-black text-white py-3 rounded-xl font-bold">Enregistrer</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserManagement;
