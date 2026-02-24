import React, { useEffect, useCallback } from 'react';
import { User, Session } from '../../../types';
// Importe tes icônes ici (Lucide ou autre)

interface SessionModalProps {
    user: User;
    selectedSession: Session;
    allUsers: User[];
    onClose: () => void;
    onFetchSessions: () => void;
    showSuccess: (msg: string) => void;
    onRegister: (sessionId: number) => Promise<void>;
    onUnregister: (sessionId: number, userId?: number) => Promise<void>;
    onDeleteSession: (sessionId: number) => void;
    onValidateActivity: (activityId: number, status: string) => void;
}

const SessionModal: React.FC<SessionModalProps> = ({
    user,
    selectedSession,
    allUsers,
    onClose,
    onFetchSessions,
    showSuccess,
    onRegister,
    onUnregister,
    onDeleteSession,
    onValidateActivity
}) => {
    // --- CORRECTIF : Accessibilité (Touche Échap) ---
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // --- LOGIQUE DE VALIDATION ---
    const isFull = selectedSession.participants.length >= selectedSession.max_participants;
    const isExpired = new Date() > new Date(selectedSession.deadline);
    const isAlreadyRegistered = selectedSession.participants.some(p => p.user_id === user.id);

    // --- CORRECTIF : Gestion propre des erreurs Fetch ---
    const handleManualRegister = async (userId: number) => {
        try {
            const response = await fetch(`/api/sessions/${selectedSession.id}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });

            if (response.ok) {
                showSuccess("Bénéficiaire inscrit !");
                onFetchSessions();
            } else {
                // Ne fait rien ou affiche une erreur, mais n'appelle PAS onFetchSessions
                console.error("Erreur lors de l'inscription");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDirectRegister = async () => {
        try {
            // Simulation du fetch interne à onRegister si nécessaire
            await onRegister(selectedSession.id);
            // Si onRegister ne throw pas d'erreur, on considère que c'est bon
        } catch (error) {
            console.error("Échec inscription");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                
                {/* Image & Header */}
                <div className="relative h-48 sm:h-56">
                    <img src={selectedSession.image_url} alt={selectedSession.title} className="w-full h-full object-cover" />
                    <button onClick={onClose} className="absolute top-4 right-4 p-3 bg-white/20 hover:bg-white/40 rounded-full transition-colors text-white">
                        {/* Icône X */}
                    </button>
                </div>

                <div className="p-8">
                    <h3 className="text-3xl font-black uppercase mb-4">{selectedSession.title}</h3>
                    <p className="italic text-zinc-500 mb-6">{selectedSession.description}</p>

                    <div className="flex justify-between items-center border-b pb-4 mb-6">
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                            Places : {selectedSession.participants.length} / {selectedSession.max_participants}
                        </span>

                        {/* CORRECTIF : Conditions de sécurité sur le bouton --- */}
                        {user.role === 'beneficiary' && !isAlreadyRegistered && (
                            <button 
                                onClick={handleDirectRegister}
                                disabled={isFull || isExpired}
                                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg transition-all
                                    ${(isFull || isExpired) 
                                        ? 'bg-zinc-300 cursor-not-allowed text-zinc-500' 
                                        : 'bg-black text-white hover:bg-zinc-800'}`}
                            >
                                {isFull ? 'Complet' : isExpired ? 'Clôturé' : "S'inscrire"}
                            </button>
                        )}

                        {isAlreadyRegistered && (
                            <button onClick={() => onUnregister(selectedSession.id)} className="text-red-500 text-[10px] font-black uppercase">
                                Se désister
                            </button>
                        )}
                    </div>

                    {/* Section Admin : Inscription manuelle */}
                    {user.role === 'admin' && (
                        <div className="mt-4">
                            <select 
                                id={`manual-reg-ben-${selectedSession.id}`}
                                className="border rounded-md p-1 mr-2 text-sm"
                                onChange={(e) => {/* State local pour gérer l'ID choisi */}}
                            >
                                <option value="">Inscrire un bénéficiaire...</option>
                                {allUsers.map(u => <option key={u.id} value={u.id}>{u.firstname} {u.lastname}</option>)}
                            </select>
                            <button onClick={() => handleManualRegister(1 /* id du state */)} className="font-bold">GO</button>
                        </div>
                    )}
                    
                    {/* Liste des participants */}
                    <div className="mt-4">
                        <h5 className="text-[10px] font-black uppercase text-zinc-400 mb-2">Inscrits</h5>
                        {selectedSession.participants.length === 0 ? (
                            <p className="text-xs italic text-zinc-400">Aucun bénéficiaire</p>
                        ) : (
                            selectedSession.participants.map(p => (
                                <div key={p.user_id} className="flex justify-between py-1 text-sm border-b border-zinc-50">
                                    <span>{p.firstname} {p.lastname}</span>
                                    {user.role === 'admin' && (
                                        <button onClick={() => onUnregister(selectedSession.id, p.user_id)} className="text-red-500 text-xs">Retirer</button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionModal;