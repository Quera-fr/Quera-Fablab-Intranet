import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  List,
  LogOut,
  Moon,
  Settings,
  Sun,
  Users
} from 'lucide-react';
import { User } from './types';


import Logo from './components/ui/Logo';
import LoginPage from './components/auth/LoginPage';
import UserManagement from './components/admin/UserManagement';
import ProfileModal from './components/profile/ProfileModal';
import CalendarView from './components/calendar/CalendarView';
import MyRegistrationsView from './components/registrations/MyRegistrationsView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'planning' | 'users' | 'my_registrations'>('planning');
  const [showProfile, setShowProfile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [testUsers, setTestUsers] = useState<User[]>([]);
  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/users').then(res => res.json()).then(setTestUsers);
    }
  }, [user]);

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-20 md:w-72'} bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col sticky top-0 h-screen transition-all duration-300 z-40 shrink-0 overflow-hidden`}>
        <div className={`p-4 flex flex-col gap-4 grow ${isSidebarCollapsed ? 'items-center' : 'md:items-start md:p-6'}`}>
          <div className={`flex items-center w-full mb-8 ${isSidebarCollapsed ? 'flex-col gap-4' : 'justify-between'}`}>
            <div className={`flex items-center gap-3 overflow-hidden ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
              <Logo className="w-12 h-12 shadow-xl ring-4 ring-zinc-50 dark:ring-zinc-800 shrink-0" onClick={() => setActiveTab('planning')} />
              {!isSidebarCollapsed && (
                <div className="hidden md:block overflow-hidden transition-all duration-300">
                  <h1 className="font-black text-zinc-900 dark:text-white uppercase tracking-tighter text-lg leading-none truncate">Quera Fablab</h1>
                  <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-1">Intranet</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`hidden md:flex p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400 ${isSidebarCollapsed ? 'mx-auto' : ''}`}
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          <nav className={`flex flex-col gap-2 w-full ${isSidebarCollapsed ? 'items-center' : ''}`}>
            <button
              onClick={() => setActiveTab('planning')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'planning' ? 'bg-black text-white shadow-xl dark:bg-white dark:text-black' : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                } ${isSidebarCollapsed ? 'justify-center px-0 w-12' : 'w-full'}`}
              title="Planning"
            >
              <CalendarIcon size={18} className="shrink-0" /> {!isSidebarCollapsed && <span className="hidden md:inline">Planning</span>}
            </button>
            <button
              onClick={() => setActiveTab('my_registrations')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'my_registrations' ? 'bg-black text-white shadow-xl dark:bg-white dark:text-black' : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                } ${isSidebarCollapsed ? 'justify-center px-0 w-12' : 'w-full'}`}
              title="Mes Inscriptions"
            >
              <List size={18} className="shrink-0" /> {!isSidebarCollapsed && <span className="hidden md:inline">Mes Inscriptions</span>}
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-black text-white shadow-xl dark:bg-white dark:text-black' : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  } ${isSidebarCollapsed ? 'justify-center px-0 w-12' : 'w-full'}`}
                title="Utilisateurs"
              >
                <Users size={18} className="shrink-0" /> {!isSidebarCollapsed && <span className="hidden md:inline">Utilisateurs</span>}
              </button>
            )}
          </nav>

          <div className="mt-auto w-full space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            {user.role === 'admin' && !isSidebarCollapsed && (
              <div className="hidden md:block px-2">
                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-2">Simuler un rôle</p>
                <select
                  title="Switch User"
                  className="bg-zinc-50 dark:bg-zinc-950 w-full text-[10px] uppercase font-black px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none"
                  onChange={(e) => {
                    const u = testUsers.find(u => u.id === parseInt(e.target.value));
                    if (u) setUser(u);
                  }}
                >
                  <option value="">SWITCH</option>
                  {testUsers.map(u => <option key={u.id} value={u.id}>{u.firstname} ({u.role})</option>)}
                </select>
              </div>
            )}

            <div className={`flex flex-col md:flex-row items-center gap-2 px-2 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              {!isSidebarCollapsed && (
                <div className="hidden md:flex items-center gap-3 px-2 py-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 grow overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-[10px] font-black text-white shrink-0">
                    {user.firstname[0]}{user.lastname[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate">{user.firstname} {user.lastname}</p>
                    <p className="text-[8px] text-zinc-400 uppercase font-black tracking-widest truncate">{user.role}</p>
                  </div>
                </div>
              )}
              {isSidebarCollapsed && (
                <div className="md:flex hidden w-10 h-10 rounded-full bg-black items-center justify-center text-[10px] font-black text-white shrink-0 mx-auto">
                  {user.firstname[0]}{user.lastname[0]}
                </div>
              )}
              <div className="md:hidden">
                <button onClick={() => setShowProfile(true)} className="p-3 text-zinc-400 hover:text-black dark:hover:text-white transition-all"><Settings size={20} /></button>
              </div>
            </div>

            <div className={`flex items-center transition-all ${isSidebarCollapsed ? 'flex-col gap-1 items-center' : 'flex-col md:flex-row justify-between gap-1 px-2'}`}>
              <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col gap-1' : 'gap-1'}`}>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-3 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all"
                  title="Mode Sombre"
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button
                  onClick={() => setShowProfile(true)}
                  className={`${isSidebarCollapsed ? 'flex' : 'hidden md:block'} p-3 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all`}
                  title="Profil"
                >
                  <Settings size={20} />
                </button>
              </div>
              <button
                onClick={() => setUser(null)}
                className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                title="Déconnexion"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-[1600px] mx-auto p-4 md:p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'planning' ? (
                <motion.div
                  key="planning"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <CalendarView user={user} />
                </motion.div>
              ) : activeTab === 'users' ? (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <UserManagement />
                </motion.div>
              ) : (
                <motion.div
                  key="my_registrations"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <MyRegistrationsView user={user} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <ProfileModal user={user} onClose={() => setShowProfile(false)} onUpdate={setUser} />
        )}
      </AnimatePresence>
    </div>
  );
}
