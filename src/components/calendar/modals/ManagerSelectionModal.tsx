import { motion } from "motion/react";
import { User } from "../../../types";
import { X } from "lucide-react";

interface ManagerSelectionModalProps {
  date: Date;
  allUsers: User[];
  onClose: () => void;
  onSelect: (userId: number | null) => void;
}

export default function ManagerSelectionModal({
  date,
  allUsers,
  onClose,
  onSelect,
}: ManagerSelectionModalProps) {
  const civicServices = allUsers.filter((u) => u.role === "civic_service");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
              Responsable Quera Point
            </h3>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">
              {date.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sélectionnez un service civique responsable pour cette journée :
          </p>

          <button
            onClick={() => onSelect(null)}
            className="w-full text-left p-4 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm font-bold text-zinc-500 hover:text-red-500"
          >
            Aucun responsable (Retirer)
          </button>

          <div className="space-y-2">
            {civicServices.map((u) => (
              <button
                key={u.id}
                onClick={() => onSelect(u.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                  {u.profile_picture_url ? (
                    <img
                      src={u.profile_picture_url}
                      alt={`${u.firstname} ${u.lastname}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    `${u.firstname[0]}${u.lastname[0]}`
                  )}
                </div>
                <div>
                  <div className="font-bold text-zinc-900 dark:text-white">
                    {u.firstname} {u.lastname}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                    Service Civique
                  </div>
                </div>
              </button>
            ))}
            {civicServices.length === 0 && (
              <div className="text-center p-4 text-sm text-zinc-500 italic">
                Aucun service civique trouvé.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
