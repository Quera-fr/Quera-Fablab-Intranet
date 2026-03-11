import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Plus,
  Trash2,
  Users,
  CheckCircle,
  List,
  Printer,
} from "lucide-react";
import { User, Session } from "../../types";

import SessionModal from "./modals/SessionModal";
import ActivityFormModal from "./modals/ActivityFormModal";
import HomeworkFormModal from "./modals/HomeworkFormModal";
import RoomBookingFormModal from "./modals/RoomBookingFormModal";

interface CalendarViewProps {
  user: User;
}

const CalendarView = ({ user }: CalendarViewProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month" | "year">("week");
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddHomework, setShowAddHomework] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null,
  );
  const selectedSession =
    sessions.find((s) => s.id === selectedSessionId) ?? null;
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [formDefaultDate, setFormDefaultDate] = useState<Date | null>(null);

  const [selectedSessionIds, setSelectedSessionIds] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [dragOverTarget, setDragOverTarget] = useState<{
    rowType: string;
    dayIndex: number;
  } | null>(null);
  const draggedSessionRef = useRef<{ id: number; type: string } | null>(null);
  const SESSION_ROW_TYPES = [
    "homework_help",
    "activity",
    "room_booking",
  ] as const;
  const ROW_LABELS: Record<string, string> = {
    homework_help: "Aide aux devoirs",
    activity: "Activités",
    room_booking: "Réservation du local",
  };
  const ROW_STYLES: Record<string, string> = {
    homework_help:
      "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30",
    activity:
      "bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30",
    room_booking:
      "bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30",
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

const handlePrintWeeklyPlan = () => {
    const weekStart = daysInWeek[0];
    const weekEnd = daysInWeek[6];
    
    // Filtrage strict : la semaine en cours ET seulement le type 'homework_help'
    const weekSessions = sessions.filter(s => {
        const sessionDate = new Date(s.start_time);
        return (
            sessionDate >= weekStart && 
            sessionDate <= weekEnd && 
            s.type === 'homework_help'
        );
    });

    const weekFormatted = `${weekStart.toLocaleDateString('fr-FR')} - ${weekEnd.toLocaleDateString('fr-FR')}`;
    const dayNames = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
    const logoUrlWithCacheBust = `/logo.jpg?t=${new Date().getTime()}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { margin: 0; padding: 0; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px 30px; background: white; margin: 0;
        }
        .header { display: flex; justify-content: start; align-items: center; margin : 40px; gap: 80px; }
        .logo { font-size: 20px; font-weight: bold; color: #1f2937; }
        .logo-image { 
            height: 80px; 
            width: 80px; 
            border-radius: 50%;
            object-fit: cover;
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
        }
        .title-section { text-align: bottom; display :flex; gap: 20px}
        h1 { 
            font-size: 25px; font-weight: 700; color: #1f2937; margin-bottom: 15px; 
            letter-spacing: 1px;
        }
        .dates { 
            color: #dce1ea;
        }
        .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; }

        .day-column { 
            border: 2px solid #1f2937; 
            border-radius: 4px; 
            padding: 12px; 
            min-height: 450px;
            background: #ffffff;
        }
        .day-header { 
            font-size: 10px; 
            font-weight: 700; 
            color: #1f2937; 
            text-align: center; 
            padding-bottom: 10px;
            border-bottom: 2px solid #1f2937;
            margin-bottom: 10px;
        }
       
        .empty { 
            color: #9ca3af; 
            font-style: italic; 
            font-size: 10px;
        }
        .participant-name {
            font-size: 10px;
        }

        @media print {
            @page { 
                size: landscape; 
                margin: 0; 
            }
            body { 
                padding: 1.5cm; 
                margin: 0;
            }
            header, footer { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="${logoUrlWithCacheBust}" alt="Logo" class="logo-image">
        <div class="title-section">
            <h1>FICHE DE PRÉSENCE DE LA SEMAINE</h1>
            <h2 class="dates">DU ${weekFormatted}</h2>
        </div>
    </div>

    <div class="grid">
        ${dayNames.map((dayName, index) => {
            const sessionsDuJour = weekSessions.filter(s => new Date(s.start_time).getDay() === index + 1);
            
            const beneficiairesDuJour: any[] = [];
            sessionsDuJour.forEach(s => {
                if (s.participants) {
                    s.participants.forEach(p => {
                        if (p.role === 'beneficiary') {
                            beneficiairesDuJour.push(p);
                        }
                    });
                }
            });

            const uniqueBeneficiaires = Array.from(new Map(beneficiairesDuJour.map(p => [`${p.firstname} ${p.lastname}`, p])).values());

            return `
                <div class="day-column">
                    <div class="day-header">${dayName}</div>
                    <div class="participant-list">
                        ${uniqueBeneficiaires.length > 0 
                            ? uniqueBeneficiaires.map(p => `
                                <div class="participant-item">
                                    <span class="participant-name">${p.firstname} ${p.lastname}</span>
                                </div>
                            `).join('')
                            : '<div class="empty">Aucun bénéficiaire</div>'
                        }
                    </div>
                </div>
            `;
        }).join('')}
    </div>

    <script>
        window.onload = function() {
            setTimeout(() => {
                window.print();
                window.close();
            }, 300);
        };
    </script>
</body>
</html>
        `;

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
    setShowPrintMenu(false);
};


  const formatSessionCard = (s: Session) => {
    const date = new Date(s.start_time).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
    });
    const time = new Date(s.start_time).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = new Date(s.end_time).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const participantCount = s.participants?.length || 0;
    const maxParticipants = s.max_participants || "∞";

    return `
        <div class="session-card">
            <div class="session-header">
                <div class="session-title">${s.title || ROW_LABELS[s.type as keyof typeof ROW_LABELS]}</div>
                <div class="session-time">${time} - ${endTime}</div>
            </div>
            <div class="session-detail">${date} • 👥 ${participantCount}/${maxParticipants}${s.participants && s.participants.length > 0 ? " • " + s.participants.map((p) => `${p.firstname} ${p.lastname}`).join(", ") : ""}</div>
        </div>
        `;
  };

  const fetchSessions = async () => {
    const res = await fetch("/api/sessions");
    setSessions(await res.json());
  };

  const fetchUsers = async () => {
    if (user.role === "admin" || user.role === "civic_service") {
      const res = await fetch("/api/users");
      setAllUsers(await res.json());
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchUsers();
  }, []);

  const daysInWeek = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    start.setDate(diff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    let startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = startDayOfWeek; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    let endDayOfWeek = lastDay.getDay() === 0 ? 6 : lastDay.getDay() - 1;
    for (let i = 1; i < 7 - endDayOfWeek; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }, [currentDate]);

  const monthsInYear = useMemo(() => {
    const year = currentDate.getFullYear();
    return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  }, [currentDate]);

  const handleBatchHomework = async () => {
    const monday = new Date(currentDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);

    await fetch("/api/sessions/homework/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_date: monday.toISOString() }),
    });
    fetchSessions();
  };

  const handleRegister = async (sessionId: number) => {
    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: user.id,
        role_at_registration:
          user.role === "volunteer" || user.role === "adherent"
            ? "volunteer"
            : "beneficiary",
      }),
    });
    if (res.ok) fetchSessions();
    else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handleUnregister = async (
    sessionId: number,
    userId: number = user.id,
  ) => {
    const session = sessions.find((s) => s.id === sessionId);

    if (session?.type === "room_booking") {
      if (confirm("Voulez-vous vraiment annuler cette réservation ?")) {
        await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
        fetchSessions();
      }
      return;
    }

    await fetch("/api/registrations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, user_id: userId }),
    });
    fetchSessions();
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (confirm("Voulez-vous vraiment supprimer cette session ?")) {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      setSelectedSessionId(null);
      fetchSessions();
    }
  };

  const handleMoveSessionToDate = async (
    session: Session,
    targetDate: Date,
  ) => {
    const existing = sessions.find(
      (s) =>
        s.type === session.type &&
        new Date(s.start_time).toDateString() === targetDate.toDateString() &&
        s.id !== session.id,
    );

    if (existing) {
      alert("Une session existe déjà à cette date.");
      return;
    }

    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    const newStart = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      start.getHours(),
      start.getMinutes(),
    );
    const newEnd = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      end.getHours(),
      end.getMinutes(),
    );
    const res = await fetch(`/api/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
      }),
    });
    if (res.ok) {
      showSuccess("Activité déplacée");
      fetchSessions();
    }
  };

  const canDragSessions =
    user.role === "admin" || user.role === "civic_service";

  const canManageRow = (rowType: string) => {
    if (user.role === "admin") return true;
    if (user.role === "civic_service")
      return rowType === "homework_help" || rowType === "activity";
    if (user.role === "adherent") return rowType === "room_booking";
    return false;
  };

  const openFormForRow = (rowType: string, date?: Date) => {
    if (!canManageRow(rowType)) return;
    setFormDefaultDate(date || null);
    if (rowType === "homework_help") {
      setShowAddHomework(true);
    } else if (rowType === "activity") {
      setShowAddActivity(true);
    } else if (rowType === "room_booking") {
      setShowAddRoom(true);
    }
  };

  const calculateDefaultTimes = (defaultHour = 16, defaultMinute = 30) => {
    const today = formDefaultDate || new Date();
    const end = new Date(today);
    today.setHours(defaultHour, defaultMinute, 0, 0);
    end.setHours(
      defaultHour + (defaultMinute === 30 ? 3 : 2),
      defaultMinute === 30 ? 30 : 0,
      0,
      0,
    );
    return {
      start_time: new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16),
      end_time: new Date(end.getTime() - end.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16),
      date: today.toISOString().split("T")[0],
    };
  };

  const handleValidateActivity = async (
    activityId: number,
    status: "approved" | "pending",
  ) => {
    await fetch(`/api/activities/${activityId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchSessions();
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
            Planning
          </h2>
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            {(["week", "month", "year"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === mode ? "bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white" : "text-zinc-500"}`}
              >
                {mode === "week"
                  ? "Semaine"
                  : mode === "month"
                    ? "Mois"
                    : "Année"}
              </button>
            ))}
          </div>
          <div className="flex items-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-1 shadow-sm">
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                if (viewMode === "week") newDate.setDate(newDate.getDate() - 7);
                if (viewMode === "month")
                  newDate.setMonth(newDate.getMonth() - 1);
                if (viewMode === "year")
                  newDate.setFullYear(newDate.getFullYear() - 1);
                setCurrentDate(newDate);
              }}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 font-bold text-xs uppercase tracking-widest text-zinc-500">
              {viewMode === "week" &&
                daysInWeek[0].toLocaleDateString("fr-FR", {
                  month: "short",
                  year: "numeric",
                })}
              {viewMode === "month" &&
                currentDate.toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              {viewMode === "year" && currentDate.getFullYear()}
            </span>
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                if (viewMode === "week") newDate.setDate(newDate.getDate() + 7);
                if (viewMode === "month")
                  newDate.setMonth(newDate.getMonth() + 1);
                if (viewMode === "year")
                  newDate.setFullYear(newDate.getFullYear() + 1);
                setCurrentDate(newDate);
              }}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {(user.role === "admin" || user.role === "civic_service") && (
            <div className="relative">
                        <button onClick={() => { handlePrintWeeklyPlan(); }} className="flex items-center gap-2 bg-zinc-500 dark:bg-zinc-600 text-white px-4 py-2 rounded-xl hover:bg-zinc-600 dark:hover:bg-zinc-500 transition-all font-bold text-xs uppercase tracking-widest shadow-lg">
                            <Printer size={16} /> Imprimer
                        </button>
                    </div>
          )}
          {(user.role === "civic_service" || user.role === "admin") && (
            <button
              onClick={() => setShowAddActivity(true)}
              className="flex items-center gap-2 bg-black dark:bg-white dark:text-black text-white px-4 py-2 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all font-bold text-xs uppercase tracking-widest shadow-lg"
            >
              <Plus size={16} /> Nouvelle Activité
            </button>
          )}
          {(user.role === "admin" || user.role === "civic_service") && (
            <>
              <button
                onClick={handleBatchHomework}
                className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-all font-bold text-xs uppercase tracking-widest shadow-lg"
              >
                <Plus size={16} /> Semaine Type
              </button>
              <button
                onClick={() => setShowAddRoom(true)}
                className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-800 px-4 py-2 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-all font-bold text-xs uppercase tracking-widest shadow-lg"
              >
                <Plus size={16} /> Résa. Local
              </button>
              {isSelectionMode ? (
                <>
                  <button
                    onClick={async () => {
                      if (
                        selectedSessionIds.length > 0 &&
                        confirm(
                          `Supprimer ${selectedSessionIds.length} sessions ?`,
                        )
                      ) {
                        await Promise.all(
                          selectedSessionIds.map((id) =>
                            fetch(`/api/sessions/${id}`, { method: "DELETE" }),
                          ),
                        );
                        setSelectedSessionIds([]);
                        setIsSelectionMode(false);
                        fetchSessions();
                      }
                    }}
                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-all font-bold text-xs uppercase tracking-wider shadow-lg"
                  >
                    <Trash2 size={16} /> Supprimer ({selectedSessionIds.length})
                  </button>
                  <button
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedSessionIds([]);
                    }}
                    className="flex items-center gap-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-4 py-2 rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all font-bold text-xs uppercase tracking-wider"
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all font-bold text-xs uppercase tracking-wider"
                >
                  <List size={16} /> Sél. Multiple
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode + currentDate.toISOString()}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="w-full"
        >
          {viewMode === "week" && (
            <div className="overflow-x-auto">
              <div className="grid gap-2 mb-2 grid-cols-7 w-full">
                {daysInWeek.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`text-center p-3 rounded-2xl border shrink-0 ${
                      day.toDateString() === new Date().toDateString()
                        ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-xl scale-105 z-10"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                    }`}
                  >
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                      {day.toLocaleDateString("fr-FR", { weekday: "short" })}
                    </p>
                    <p className="text-xl font-black">{day.getDate()}</p>
                  </div>
                ))}
              </div>

              {SESSION_ROW_TYPES.map((rowType) => (
                <div key={rowType} className="mb-4">
                  <button
                    type="button"
                    onClick={() => openFormForRow(rowType)}
                    className={`w-full text-left px-4 py-2 rounded-t-xl border-b-0 ${ROW_STYLES[rowType]} border flex items-center justify-between cursor-pointer hover:brightness-95 transition`}
                  >
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
                      {ROW_LABELS[rowType]}
                    </h3>
                  </button>
                  <div
                    className={`grid gap-2 rounded-b-xl border border-t-0 p-2 grid-cols-7 w-full ${ROW_STYLES[rowType]}`}
                    style={{ minHeight: "140px" }}
                  >
                    {daysInWeek.map((day, i) => {
                      const daySessions = sessions
                        .filter(
                          (s) =>
                            new Date(s.start_time).toDateString() ===
                              day.toDateString() && s.type === rowType,
                        )
                        .sort((a, b) =>
                          a.start_time.localeCompare(b.start_time),
                        );
                      return (
                        <div
                          key={`${rowType}-${i}`}
                          className={`group/slot min-h-[120px] flex flex-col gap-1.5 p-2 rounded-lg bg-white/50 dark:bg-black/10 transition-all ${
                            dragOverTarget?.rowType === rowType &&
                            dragOverTarget?.dayIndex === i &&
                            draggedSessionRef.current?.type === rowType
                              ? "ring-2 ring-black dark:ring-white ring-dashed ring-offset-2"
                              : ""
                          }`}
                          onDragOver={(e) => {
                            if (
                              canDragSessions &&
                              draggedSessionRef.current?.type === rowType
                            ) {
                              const isOccupied =
                                daySessions.length > 0 &&
                                daySessions[0].id !==
                                  draggedSessionRef.current?.id;
                              if (!isOccupied) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "move";
                                setDragOverTarget({ rowType, dayIndex: i });
                              }
                            }
                          }}
                          onDragLeave={() => setDragOverTarget(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverTarget(null);
                            if (!canDragSessions || !draggedSessionRef.current)
                              return;
                            const { id, type } = draggedSessionRef.current;
                            if (type !== rowType) return;
                            const session = sessions.find((s) => s.id === id);
                            if (session) handleMoveSessionToDate(session, day);
                            draggedSessionRef.current = null;
                          }}
                        >
                          {daySessions.map((s) => {
                            const isRegistered = s.participants.some(
                              (p) => p.user_id === user.id,
                            );
                            const volunteerCount = s.participants.filter(
                              (p) => p.role_at_registration === "volunteer",
                            ).length;
                            const beneficiaryCount = s.participants.filter(
                              (p) => p.role_at_registration === "beneficiary",
                            ).length;

                            let bgColor = "bg-white";
                            let borderColor = "border-zinc-200";
                            let textColor = "text-zinc-900";

                            if (s.type === "homework_help") {
                              bgColor = "bg-blue-50 dark:bg-blue-900/20";
                              borderColor =
                                "border-blue-200 dark:border-blue-800";
                              textColor = "text-blue-900 dark:text-blue-100";
                            } else if (s.type === "activity") {
                              if (s.status === "approved") {
                                bgColor = "bg-green-50 dark:bg-green-900/20";
                                borderColor =
                                  "border-green-300 dark:border-green-800";
                                textColor =
                                  "text-green-900 dark:text-green-100";
                              } else {
                                bgColor = "bg-zinc-100 dark:bg-zinc-800";
                                borderColor =
                                  "border-zinc-200 dark:border-zinc-700";
                                textColor = "text-zinc-400 dark:text-zinc-500";
                              }
                            } else if (s.type === "room_booking") {
                              bgColor = "bg-amber-50 dark:bg-amber-900/20";
                              borderColor =
                                "border-amber-200 dark:border-amber-800";
                              textColor = "text-amber-900 dark:text-amber-100";
                            }

                            const isSelected = selectedSessionIds.includes(
                              s.id,
                            );

                            return (
                              <motion.div
                                layoutId={`session-${s.id}`}
                                key={s.id}
                                draggable={canDragSessions}
                                onDragStart={(e: DragEvent) => {
                                  const dragEvent = e as DragEvent & {
                                    dataTransfer: DataTransfer;
                                  };
                                  dragEvent.dataTransfer.setData(
                                    "text/plain",
                                    String(s.id),
                                  );
                                  dragEvent.dataTransfer.effectAllowed = "move";
                                  draggedSessionRef.current = {
                                    id: s.id,
                                    type: s.type,
                                  };
                                }}
                                onClick={() => {
                                  if (isSelectionMode) {
                                    setSelectedSessionIds((prev) =>
                                      prev.includes(s.id)
                                        ? prev.filter((id) => id !== s.id)
                                        : [...prev, s.id],
                                    );
                                  } else {
                                    setSelectedSessionId(s.id);
                                  }
                                }}
                                className={`p-3 rounded-xl border-2 ${bgColor} ${borderColor} cursor-pointer hover:shadow-lg transition-all relative group overflow-hidden`}
                              >
                                <div className="flex items-center gap-1 text-[9px] font-black text-zinc-400 mb-1 uppercase tracking-widest">
                                  <Clock size={10} />
                                  {formatTime(s.start_time)}
                                </div>
                                <h4
                                  className={`text-xs font-black uppercase tracking-tight leading-tight ${textColor} line-clamp-2`}
                                >
                                  {s.type === "homework_help"
                                    ? "Aide aux devoirs"
                                    : s.type === "room_booking"
                                      ? "Réservation du local"
                                      : (s.title ?? "")}
                                </h4>
                                {s.type === "activity" && s.image_url && (
                                  <div className="mt-2 w-full h-16 rounded-lg overflow-hidden border border-zinc-100 shadow-sm shrink-0">
                                    <img
                                      src={s.image_url}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="mt-2 flex flex-wrap gap-1">
                                  <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
                                    <Users size={8} />{" "}
                                    {s.type === "room_booking"
                                      ? `Réservé par ${s.participants[0]?.firstname || "?"}`
                                      : `Encadrants ${volunteerCount}/3`}
                                  </span>
                                  {s.type === "homework_help" && (
                                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
                                      <Users size={8} /> Jeunes{" "}
                                      {beneficiaryCount}/15
                                    </span>
                                  )}
                                  {s.type === "activity" && (
                                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
                                      <Users size={8} /> Jeunes{" "}
                                      {beneficiaryCount}/{s.max_participants}
                                    </span>
                                  )}
                                </div>
                                {isRegistered && (
                                  <div className="absolute top-2 right-2 text-black dark:text-white">
                                    <CheckCircle size={14} />
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                          {canManageRow(rowType) &&
                            daySessions.length === 0 && (
                              <button
                                onClick={() => openFormForRow(rowType, day)}
                                className="w-full m-auto h-8 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-all transform hover:scale-105"
                              >
                                <Plus size={16} />
                              </button>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === "month" && (
            <div className="grid grid-cols-7 gap-2">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 py-2"
                >
                  {d}
                </div>
              ))}
              {daysInMonth.map((day, i) => {
                const daySessions = sessions.filter(
                  (s) =>
                    new Date(s.start_time).toDateString() ===
                    day.toDateString(),
                );
                const isCurrentMonth =
                  day.getMonth() === currentDate.getMonth();
                const isToday =
                  day.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={i}
                    className={`min-h-[100px] border rounded-xl p-2 ${isCurrentMonth ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white" : "bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 text-zinc-400"} ${isToday ? "ring-2 ring-black dark:ring-white" : ""}`}
                  >
                    <p
                      className={`text-xs font-black mb-2 ${isToday ? "text-black dark:text-white" : ""}`}
                    >
                      {day.getDate()}
                    </p>
                    <div className="flex flex-col gap-1">
                      {daySessions.slice(0, 3).map((s) => (
                        <div
                          key={s.id}
                          onClick={() => setSelectedSessionId(s.id)}
                          className={`text-[9px] font-bold p-1 rounded cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis ${s.type === "homework_help" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200" : s.type === "room_booking" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200" : s.status === "approved" ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200" : "border border-dashed border-zinc-300 text-zinc-400"}`}
                        >
                          {s.type === "homework_help"
                            ? "Aide devoirs"
                            : s.type === "room_booking"
                              ? "Résa. local"
                              : (s.title ?? "")}
                        </div>
                      ))}
                      {daySessions.length > 3 && (
                        <div className="text-[8px] font-black text-zinc-400 text-center uppercase">
                          +{daySessions.length - 3} autres
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === "year" && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {monthsInYear.map((monthDate, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
                >
                  <h4
                    className="text-sm font-black uppercase tracking-widest mb-4 hover:underline cursor-pointer"
                    onClick={() => {
                      setCurrentDate(monthDate);
                      setViewMode("month");
                    }}
                  >
                    {monthDate.toLocaleDateString("fr-FR", { month: "long" })}
                  </h4>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from(
                      {
                        length: new Date(
                          monthDate.getFullYear(),
                          monthDate.getMonth() + 1,
                          0,
                        ).getDate(),
                      },
                      (_, d) => {
                        const count = sessions.filter(
                          (s) =>
                            new Date(s.start_time).toDateString() ===
                            new Date(
                              monthDate.getFullYear(),
                              monthDate.getMonth(),
                              d + 1,
                            ).toDateString(),
                        ).length;
                        let bg = "bg-zinc-100 dark:bg-zinc-800";
                        if (count === 1) bg = "bg-zinc-300 dark:bg-zinc-600";
                        if (count === 2) bg = "bg-zinc-500 dark:bg-zinc-400";
                        if (count > 2) bg = "bg-black dark:bg-white";
                        return (
                          <div
                            key={d}
                            className={`w-full aspect-square rounded-sm ${bg}`}
                          ></div>
                        );
                      },
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {selectedSession && (
          <SessionModal
            selectedSession={selectedSession}
            user={user}
            allUsers={allUsers}
            onClose={() => setSelectedSessionId(null)}
            onRegister={handleRegister}
            onUnregister={handleUnregister}
            onDeleteSession={handleDeleteSession}
            onValidateActivity={handleValidateActivity}
            onFetchSessions={fetchSessions}
            showSuccess={showSuccess}
          />
        )}
        {showAddActivity && (
          <ActivityFormModal
            user={user}
            calculateDefaultTimes={calculateDefaultTimes}
            onClose={() => setShowAddActivity(false)}
            onFetchSessions={fetchSessions}
          />
        )}
        {showAddHomework && (
          <HomeworkFormModal
            calculateDefaultTimes={calculateDefaultTimes}
            onClose={() => setShowAddHomework(false)}
            onFetchSessions={fetchSessions}
          />
        )}
        {showAddRoom && (
          <RoomBookingFormModal
            user={user}
            calculateDefaultTimes={calculateDefaultTimes}
            onClose={() => setShowAddRoom(false)}
            onFetchSessions={fetchSessions}
          />
        )}
      </AnimatePresence>

      {successMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl z-[60] animate-in fade-in slide-in-from-bottom-8">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
