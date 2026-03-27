import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  List,
  LogOut,
  Moon,
  Sun,
  Users,
  UserRound,
} from "lucide-react";
import { User } from "./types";
import {
  isGoldenTicketActive,
  goldenClasses,
  goldenTicketAnimationKey,
} from "./utils/goldenTicket";

import Logo from "./components/ui/Logo";
import LoginPage from "./components/auth/LoginPage";
import UserManagement from "./components/admin/UserManagement";
import ProfilePage from "./components/profile/ProfilePage";
import CalendarView from "./components/calendar/CalendarView";
import MyRegistrationsView from "./components/registrations/MyRegistrationsView";
import ProfileModal from "./components/profile/ProfileModal";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<
    "planning" | "civic_calendar" | "users" | "my_registrations" | "profile"
  >("planning");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [showGoldenTicketAnimation, setShowGoldenTicketAnimation] =
    useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const [testUsers, setTestUsers] = useState<User[]>([]);
  useEffect(() => {
    if (user?.role === "admin") {
      fetch("/api/users")
        .then((res) => res.json())
        .then(setTestUsers);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !isGoldenTicketActive(user) || !user.goldenTicket) return;
    const key = goldenTicketAnimationKey(
      user.id,
      user.goldenTicket.year,
      user.goldenTicket.month,
    );
    if (!localStorage.getItem(key)) {
      setShowGoldenTicketAnimation(true);
      localStorage.setItem(key, "1");
    }
  }, [user]);

  const [authScreen, setAuthScreen] = useState<"public" | "login">("public");

  if (!user && authScreen === "login") {
    return <LoginPage onLogin={setUser} />;
  }

  if (!user && authScreen === "public") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
        <main className="max-w-[1600px] mx-auto p-4 md:p-8">
          <CalendarView
            user={null}
            readOnly
            onLoginClick={() => setAuthScreen("login")}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      {/* Sidebar */}
      <aside
        className={`${isSidebarCollapsed ? "w-20" : "w-20 md:w-72"} ${user && isGoldenTicketActive(user) ? goldenClasses.sidebar : "bg-white text-black"} dark:bg-zinc-900 border-r dark:text-white border-zinc-200 dark:border-zinc-800 flex flex-col sticky top-0 h-screen transition-all duration-300 z-40 shrink-0 overflow-hidden`}
      >
        <div
          className={`p-4 flex flex-col gap-4 grow ${isSidebarCollapsed ? "items-center" : "md:items-start md:p-6"}`}
        >
          <div
            className={`flex items-center w-full mb-8 ${isSidebarCollapsed ? "flex-col gap-4" : "justify-between"}`}
          >
            <div
              className={`flex items-center gap-3 overflow-hidden ${isSidebarCollapsed ? "justify-center w-full" : ""}`}
            >
              <Logo
                className="w-12 h-12 shadow-xl ring-4 ring-zinc-50 dark:ring-zinc-800 shrink-0"
                onClick={() => setActiveTab("planning")}
              />
              {!isSidebarCollapsed && (
                <div className="hidden md:block overflow-hidden transition-all duration-300">
                  <h1 className="font-black text-zinc-900 dark:text-white uppercase tracking-tighter text-lg leading-none truncate">
                    Quera Fablab
                  </h1>
                  <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-1">
                    Intranet
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`hidden md:flex p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400 ${isSidebarCollapsed ? "mx-auto" : ""}`}
            >
              {isSidebarCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>
          </div>

          <nav
            className={`flex flex-col gap-2 w-full ${isSidebarCollapsed ? "items-center" : ""}`}
          >
            <button
              onClick={() => setActiveTab("planning")}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === "planning"
                  ? "bg-black text-white shadow-xl dark:bg-white dark:text-black"
                  : "text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              } ${isSidebarCollapsed ? "justify-center px-0 w-12" : "w-full"}`}
              title="Planning"
            >
              <CalendarIcon size={18} className="shrink-0" />{" "}
              {!isSidebarCollapsed && (
                <span className="hidden md:inline">Planning</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("my_registrations")}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === "my_registrations"
                  ? "bg-black text-white shadow-xl dark:bg-white dark:text-black"
                  : "text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              } ${isSidebarCollapsed ? "justify-center px-0 w-12" : "w-full"}`}
              title="Mes Inscriptions"
            >
              <List size={18} className="shrink-0" />{" "}
              {!isSidebarCollapsed && (
                <span className="hidden md:inline">Mes Inscriptions</span>
              )}
            </button>
            {user && (user.role === "admin" || user.role === "civic_service") && (
              <button
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === "users"
                    ? "bg-black text-white shadow-xl dark:bg-white dark:text-black"
                    : "text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                } ${isSidebarCollapsed ? "justify-center px-0 w-12" : "w-full"}`}
                title="Utilisateurs"
              >
                <Users size={18} className="shrink-0" />{" "}
                {!isSidebarCollapsed && (
                  <span className="hidden md:inline">Utilisateurs</span>
                )}
              </button>
            )}
          </nav>

          <div className="mt-auto w-full space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            {user && user.role === "admin" && !isSidebarCollapsed && (
              <div className="hidden md:block px-2">
                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-2">
                  Simuler un rôle
                </p>
                <select
                  title="Switch User"
                  className="bg-zinc-50 dark:bg-zinc-950 w-full text-[10px] uppercase font-black px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none"
                  onChange={(e) => {
                    const u = testUsers.find(
                      (u) => u.id === parseInt(e.target.value),
                    );
                    if (u) setUser(u);
                  }}
                >
                  <option value="">SWITCH</option>
                  {testUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstname} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div
              className={`flex flex-col md:flex-row items-center gap-2 px-2 ${isSidebarCollapsed ? "justify-center" : ""}`}
            >
              {!isSidebarCollapsed && user && (
                <div
                  className={`hidden md:flex items-center gap-3 px-2 py-3 ${user && isGoldenTicketActive(user) ? goldenClasses.card : "bg-black text-white"} bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 grow overflow-hidden`}
                >
                  {/* Avatar expanded */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 `}
                  >
                    {user.profile_picture_url ? (
                      <img
                        src={user.profile_picture_url}
                        alt={`${user.firstname} ${user.lastname}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      `${user.firstname[0]}${user.lastname[0]}`
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate">
                      {user.firstname} {user.lastname}
                    </p>
                    <p className="text-[8px] text-zinc-400 uppercase font-black tracking-widest truncate">
                      {user.role}
                    </p>
                  </div>
                </div>
              )}
              {/* Avatar collapsed */}
              {isSidebarCollapsed && user && (
                <div
                  className={`md:flex hidden w-10 h-10 rounded-full items-center justify-center text-[10px] font-black text-white shrink-0 mx-auto ${
                    user && isGoldenTicketActive(user)
                      ? goldenClasses.avatar
                      : "bg-black"
                  }`}
                >
                  {user.profile_picture_url ? (
                    <img
                      src={user.profile_picture_url}
                      alt={`${user.firstname} ${user.lastname}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    `${user.firstname[0]}${user.lastname[0]}`
                  )}
                </div>
              )}
              <div className="md:hidden">
                <button
                  onClick={() => setActiveTab("profile")}
                  className="p-3 text-zinc-400 hover:text-black dark:hover:text-white transition-all"
                >
                  <UserRound size={20} />
                </button>
              </div>
            </div>

            <div
              className={`flex items-center transition-all ${isSidebarCollapsed ? "flex-col gap-1 items-center" : "flex-col md:flex-row justify-between gap-1 px-2"}`}
            >
              <div
                className={`flex items-center ${isSidebarCollapsed ? "flex-col gap-1" : "gap-1"}`}
              >
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`p-3 ${user && isGoldenTicketActive(user) ? goldenClasses.icons : "text-zinc-400 hover:text-black"} dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all`}
                  title="Mode Sombre"
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`${isSidebarCollapsed ? "flex" : "hidden md:block"} p-3 ${user && isGoldenTicketActive(user) ? goldenClasses.icons : "text-zinc-400 hover:text-black"} dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all`}
                  title="Profil"
                >
                  <UserRound size={20} />
                </button>
              </div>
              <button
                onClick={() => {
                  setUser(null);
                  setAuthScreen("public");
                }}
                className={`p-3 ${user && isGoldenTicketActive(user) ? goldenClasses.icons : "text-zinc-400"} hover:text-red-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all`}
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
              {activeTab === "planning" ? (
                <motion.div
                  key="planning"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  <CalendarView user={user} />
                </motion.div>
              ) : activeTab === "civic_calendar" ? (
                <motion.div
                  key="civic_calendar"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* For now this shows the same calendar; later you can pass special props for Service Civique */}
                  <CalendarView user={user} />
                </motion.div>
              ) : activeTab === "users" && user ? (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <UserManagement currentUser={user} />
                </motion.div>
              ) : activeTab === "profile" && user ? (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ProfilePage user={user} onUpdate={setUser} />
                </motion.div>
              ) : activeTab === "my_registrations" && user ? (
                <motion.div
                  key="my_registrations"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <MyRegistrationsView user={user} />
                </motion.div>
              ) : null }
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && user && (
          <ProfileModal
            user={user}
            onClose={() => setShowProfile(false)}
            onUpdate={setUser}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGoldenTicketAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4"
            onClick={() => setShowGoldenTicketAnimation(false)}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1,
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border-2 border-amber-400 p-10 max-w-sm w-full text-center"
            >
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-6xl mb-4 select-none"
              >
                🎟️
              </motion.div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-amber-500 mb-2">
                Golden Ticket !
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm mb-6">
                Tu as obtenu un Golden Ticket
                <br />
                les 3 prochains mois !<br />
                Félicitations !
              </p>
              <button
                onClick={() => setShowGoldenTicketAnimation(false)}
                className="bg-amber-400 hover:bg-amber-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-wider transition-colors"
              >
                Super !
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
