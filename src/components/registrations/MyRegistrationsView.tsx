import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import { User, Session } from '../../types';

interface MyRegistrationsViewProps {
    user: User;
}

const MyRegistrationsView = ({ user }: MyRegistrationsViewProps) => {
    const [sessions, setSessions] = useState<Session[]>([]);

    useEffect(() => {
        fetch('/api/sessions').then(res => res.json()).then(setSessions);
    }, []);

    const mySessions = sessions
        .filter(s => s.participants.some(p => p.user_id === user.id))
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const regularSessions = mySessions.filter(s => s.type !== 'room_booking');
    const roomBookings = mySessions.filter(s => s.type === 'room_booking');

    const handleUnregister = async (sessionId: number) => {
        const session = sessions.find(s => s.id === sessionId);

        if (session?.type === 'room_booking') {
            if (confirm("Voulez-vous vraiment annuler cette réservation ?")) {
                await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
                fetch('/api/sessions').then(res => res.json()).then(setSessions);
            }
            return;
        }

        await fetch('/api/registrations', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, user_id: user.id }),
        });
        fetch('/api/sessions').then(res => res.json()).then(setSessions);
    };

    const SessionCard = ({ s }: { s: Session }) => {

        const role = s.participants.find(p => p.user_id === user.id)?.role_at_registration;

        return (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:shadow-lg transition-all">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1 block">
                        {s.type === 'homework_help' ? 'Soutien Scolaire' : s.type === 'room_booking' ? 'Réservation' : 'Atelier Numérique'}
                    </span>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter mb-2">
                        {s.type === 'homework_help' ? 'Aide aux devoirs' : s.type === 'room_booking' ? 'Réservation du local' : s.title}
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        <p className="text-zinc-500 font-bold text-xs flex items-center gap-2 uppercase tracking-wider">
                            <CalendarIcon size={14} className="text-black dark:text-zinc-400" /> {new Date(s.start_time).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <p className="text-zinc-500 font-bold text-xs flex items-center gap-2 uppercase tracking-wider">
                            <Clock size={14} className="text-black dark:text-zinc-400" /> {new Date(s.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(s.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 items-center shrink-0">
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Bénévoles</span>
                            <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded-lg text-[10px] font-black">
                                {s.participants.filter(p => p.role_at_registration === 'volunteer').length}/3
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Inscrits</span>
                            <div className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200 px-2 py-0.5 rounded-lg text-[10px] font-black">
                                {s.participants.filter(p => p.role_at_registration === 'beneficiary').length}/15
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleUnregister(s.id);
                    }}
                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
                >
                    {s.type === 'room_booking' ? 'Annuler la réservation' : 'Se désinscrire'}
                </button>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-12">
            <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 text-zinc-900 dark:text-white">Mes inscriptions</h2>
                <div className="flex flex-col gap-4">
                    {regularSessions.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                            <p className="text-zinc-400 text-sm font-black uppercase tracking-widest">Aucune inscription pour le moment</p>
                        </div>
                    ) : (
                        regularSessions.map(s => <div key={s.id}><SessionCard s={s} /></div>)
                    )}
                </div>
            </div>

            <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 text-zinc-900 dark:text-white">Mes réservations de local</h2>
                <div className="flex flex-col gap-4">
                    {roomBookings.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                            <p className="text-zinc-400 text-sm font-black uppercase tracking-widest">Aucune réservation pour le moment</p>
                        </div>
                    ) : (
                        roomBookings.map(s => <div key={s.id}><SessionCard s={s} /></div>)
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyRegistrationsView;
