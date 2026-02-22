import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { User } from '../../types';
import Logo from '../ui/Logo';

interface LoginPageProps {
    onLogin: (user: User) => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
    const [email, setEmail] = useState('admin@assoc.fr');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (res.ok) {
            const user = await res.json();
            onLogin(user);
        } else {
            setError('Identifiants incorrects');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-100 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-200"
            >
                <div className="flex flex-col items-center mb-8">
                    <Logo className="w-20 h-20 mb-4 shadow-xl" />
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase text-center">Intranet - Quera Fablab</h1>
                    <p className="text-zinc-500 text-[10px] text-center uppercase font-bold tracking-widest mt-1">
                        Accompagnement à la scolarité<br />& acculturation numérique
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all font-medium"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all font-medium"
                            required
                        />
                    </div>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-red-500 text-xs font-bold"
                        >
                            {error}
                        </motion.p>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg active:scale-95 uppercase tracking-widest text-sm"
                    >
                        Se connecter
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-zinc-100 text-[10px] text-zinc-400 text-center font-bold uppercase tracking-widest">
                    <p>Admin: admin@assoc.fr / admin123</p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
