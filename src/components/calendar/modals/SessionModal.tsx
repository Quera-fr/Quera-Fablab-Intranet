import { motion } from "motion/react";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckCircle,
  Trash2,
  XCircle,
  Info,
} from "lucide-react";
import { User, Session } from "../../../types";
import React, { useState } from "react";
import Select from "react-select";

interface SessionModalProps {
  selectedSession: Session;
  user: User;
  allUsers: User[];
  onClose: () => void;
  onRegister: (sessionId: number) => void;
  onUnregister: (sessionId: number, userId?: number) => void;
  onDeleteSession: (sessionId: number) => void;
  onValidateActivity: (
    activityId: number,
    status: "approved" | "pending",
  ) => void;
  onFetchSessions: () => void;
  showSuccess: (msg: string) => void;
}

const SessionModal = ({
  selectedSession,
  user,
  allUsers,
  onClose,
  onRegister,
  onUnregister,
  onDeleteSession,
  onValidateActivity,
  onFetchSessions,
  showSuccess,
}: SessionModalProps) => {
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  type SelectOption = { value: number; label: string };

  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<
    SelectOption[]
  >([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState<SelectOption[]>(
    [],
  );

  const beneficiaryOptions: SelectOption[] = allUsers
    .filter(
      (u) =>
        u.role === "beneficiary" &&
        !selectedSession.participants.some((p) => p.user_id === u.id),
    )
    .map((u) => ({ value: u.id, label: `${u.firstname} ${u.lastname}` }));

  const volunteerOptions: SelectOption[] = allUsers
    .filter(
      (u) =>
        u.role === "volunteer" &&
        !selectedSession.participants.some((p) => p.user_id === u.id),
    )
    .map((u) => ({ value: u.id, label: `${u.firstname} ${u.lastname}` }));

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-zinc-200 dark:border-zinc-700 overflow-hidden"
      >
        {selectedSession.type === "activity" && selectedSession.image_url && (
          <div className="w-full h-48 sm:h-56 relative shrink-0">
            <img
              src={selectedSession.image_url}
              alt={selectedSession.title || ""}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        )}
        <div className="p-8 overflow-y-auto w-full flex-1">
          <div className="flex justify-between items-start mb-8 gap-4">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-2 block">
                {selectedSession.type === "homework_help"
                  ? "Soutien Scolaire"
                  : selectedSession.type === "room_booking"
                    ? "Réservation"
                    : "Atelier Numérique"}
              </span>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none mb-4 break-words">
                {selectedSession.type === "homework_help"
                  ? "Aide aux devoirs"
                  : selectedSession.type === "room_booking"
                    ? "Réservation du local"
                    : (selectedSession.title ?? "")}
              </h3>
              <div className="space-y-2">
                <p className="text-zinc-500 font-bold text-sm flex items-center gap-2 uppercase tracking-wider break-words">
                  <CalendarIcon
                    size={16}
                    className="text-black dark:text-zinc-400"
                  />{" "}
                  {new Date(selectedSession.start_time).toLocaleDateString(
                    "fr-FR",
                    { weekday: "long", day: "numeric", month: "long" },
                  )}
                </p>
                <p className="text-zinc-500 font-bold text-sm flex items-center gap-2 uppercase tracking-wider">
                  <Clock size={16} className="text-black dark:text-zinc-400" />{" "}
                  {formatTime(selectedSession.start_time)} -{" "}
                  {formatTime(selectedSession.end_time)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <XCircle size={28} className="dark:text-zinc-400" />
            </button>
          </div>

          {selectedSession.type === "activity" &&
            selectedSession.description && (
              <div className="mb-8 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-700">
                <p className="text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed italic">
                  "{selectedSession.description}"
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-zinc-400">
                    <Users
                      size={18}
                      className="text-black dark:text-zinc-400"
                    />{" "}
                    <span>
                      {selectedSession.participants.length} /{" "}
                      {selectedSession.max_participants} places
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-zinc-400">
                    <Clock
                      size={18}
                      className="text-black dark:text-zinc-400"
                    />{" "}
                    Fin:{" "}
                    {new Date(
                      selectedSession.deadline || "",
                    ).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              </div>
            )}

          {selectedSession.type !== "room_booking" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 border-b border-zinc-100 dark:border-zinc-700 pb-4">
                <h4 className="font-black text-zinc-900 dark:text-white uppercase tracking-widest text-xs whitespace-nowrap">
                  Liste d'appel
                </h4>
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  {(user.role === "civic_service" || user.role === "admin") && (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden w-full gap-1 px-1">
                        <Select
                          isMulti
                          closeMenuOnSelect={false}
                          options={beneficiaryOptions}
                          value={selectedBeneficiaries}
                          onChange={(opts) =>
                            setSelectedBeneficiaries(opts as SelectOption[])
                          }
                          placeholder="+ Jeune"
                          classNamePrefix="rs"
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                            control: (base) => ({
                              ...base,
                              background: "transparent",
                              border: "none",
                              boxShadow: "none",
                              minHeight: "unset",
                            }),
                            menu: (base) => ({ ...base, zIndex: 9999 }),
                            multiValue: (base) => ({
                              ...base,
                              backgroundColor: "#000",
                              borderRadius: "9999px",
                            }),
                            multiValueLabel: (base) => ({
                              ...base,
                              color: "#fff",
                              fontSize: "10px",
                              fontWeight: 900,
                            }),
                            multiValueRemove: (base) => ({
                              ...base,
                              color: "#fff",
                              ":hover": {
                                backgroundColor: "#333",
                                borderRadius: "9999px",
                              },
                            }),
                            placeholder: (base) => ({
                              ...base,
                              fontSize: "10px",
                              fontWeight: 900,
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              color: "#71717a",
                            }),
                          }}
                          className="flex-1 text-[10px]"
                        />
                        <button
                          onClick={() => {
                            if (selectedBeneficiaries.length === 0) return;
                            Promise.all(
                              selectedBeneficiaries.map((opt) =>
                                fetch("/api/registrations", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    session_id: selectedSession.id,
                                    user_id: opt.value,
                                    role_at_registration: "beneficiary",
                                  }),
                                }),
                              ),
                            ).then(async (responses) => {
                              const failed = responses.filter((r) => !r.ok);
                              if (failed.length > 0) {
                                const err = await failed[0].json();
                                showSuccess(`Erreur : ${err.error}`);
                                return;
                              }
                              onFetchSessions();
                              showSuccess(
                                `${selectedBeneficiaries.length} jeune(s) inscrit(s) !`,
                              );
                              setSelectedBeneficiaries([]);
                            });
                          }}
                          className="bg-black dark:bg-zinc-700 text-white px-3 py-1 rounded-full text-[10px] font-black hover:bg-zinc-800 shrink-0"
                        >
                        Ajouter
                        </button>
                      </div>

                      <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden w-full gap-1 px-1">
                        <Select
                          isMulti
                          closeMenuOnSelect={false}
                          options={volunteerOptions}
                          value={selectedVolunteers}
                          onChange={(opts) =>
                            setSelectedVolunteers(opts as SelectOption[])
                          }
                          placeholder="+ Bénévole"
                          classNamePrefix="rs"
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                            control: (base) => ({
                              ...base,
                              background: "transparent",
                              border: "none",
                              boxShadow: "none",
                              minHeight: "unset",
                            }),
                            menu: (base) => ({ ...base, zIndex: 9999 }),
                            multiValue: (base) => ({
                              ...base,
                              backgroundColor: "#2563eb",
                              borderRadius: "9999px",
                            }),
                            multiValueLabel: (base) => ({
                              ...base,
                              color: "#fff",
                              fontSize: "10px",
                              fontWeight: 900,
                            }),
                            multiValueRemove: (base) => ({
                              ...base,
                              color: "#fff",
                              ":hover": {
                                backgroundColor: "#1e40af",
                                borderRadius: "9999px",
                              },
                            }),
                            placeholder: (base) => ({
                              ...base,
                              fontSize: "10px",
                              fontWeight: 900,
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              color: "#71717a",
                            }),
                          }}
                          className="flex-1 text-[10px]"
                        />
                        <button
                          onClick={() => {
                            if (selectedVolunteers.length === 0) return;
                            Promise.all(
                              selectedVolunteers.map((opt) =>
                                fetch("/api/registrations", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    session_id: selectedSession.id,
                                    user_id: opt.value,
                                    role_at_registration: "volunteer",
                                  }),
                                }),
                              ),
                            ).then(async (responses) => {
                              const failed = responses.filter((r) => !r.ok);
                              if (failed.length > 0) {
                                const err = await failed[0].json();
                                showSuccess(`Erreur : ${err.error}`);
                                return;
                              }
                              onFetchSessions();
                              showSuccess(
                                `${selectedVolunteers.length} bénévole(s) inscrit(s) !`,
                              );
                              setSelectedVolunteers([]);
                            });
                          }}
                          className="bg-black dark:bg-zinc-700 text-white px-3 py-1 rounded-full text-[10px] font-black hover:bg-zinc-800 shrink-0"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedSession.participants.some(
                    (p) => p.user_id === user.id,
                  ) ? (
                    <button
                      onClick={() => {
                        onUnregister(selectedSession.id);
                        onClose();
                        showSuccess("Inscription annulée !");
                      }}
                      className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline px-2"
                    >
                      Se désister
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onRegister(selectedSession.id);
                        onClose();
                        showSuccess("Inscription confirmée !");
                      }}
                      className="bg-black dark:bg-white dark:text-black text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-lg"
                    >
                      S'inscrire
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-6">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-700 pb-2 mb-3">
                    Bénéficiaires inscrits
                  </h5>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedSession.participants.filter(
                      (p) => p.role_at_registration === "beneficiary",
                    ).length === 0 ? (
                      <p className="text-xs font-medium text-zinc-400 italic py-2">
                        Aucun bénéficiaire
                      </p>
                    ) : (
                      selectedSession.participants
                        .filter((p) => p.role_at_registration === "beneficiary")
                        .map((p) => (
                          <div
                            key={p.user_id}
                            className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                                {p.firstname[0]}
                                {p.lastname[0]}
                              </div>
                              <div>
                                <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                                  {p.firstname} {p.lastname}
                                </p>
                              </div>
                            </div>
                            {(user.role === "admin" ||
                              user.role === "civic_service") && (
                              <button
                                onClick={() => {
                                  onUnregister(selectedSession.id, p.user_id);
                                  showSuccess("Utilisateur retiré !");
                                }}
                                className="text-zinc-300 hover:text-red-500 transition-colors"
                                title="Retirer"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-700 pb-2 mb-3">
                    Bénévoles présents
                  </h5>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedSession.participants.filter(
                      (p) => p.role_at_registration === "volunteer",
                    ).length === 0 ? (
                      <p className="text-xs font-medium text-zinc-400 italic py-2">
                        Aucun bénévole
                      </p>
                    ) : (
                      selectedSession.participants
                        .filter((p) => p.role_at_registration === "volunteer")
                        .map((p) => (
                          <div
                            key={p.user_id}
                            className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black bg-black dark:bg-zinc-600 text-white">
                                {p.firstname[0]}
                                {p.lastname[0]}
                              </div>
                              <div>
                                <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                                  {p.firstname} {p.lastname}
                                </p>
                              </div>
                            </div>
                            {(user.role === "admin" ||
                              user.role === "civic_service") && (
                              <button
                                onClick={() => {
                                  onUnregister(selectedSession.id, p.user_id);
                                  showSuccess("Utilisateur retiré !");
                                }}
                                className="text-zinc-300 hover:text-red-500 transition-colors"
                                title="Retirer"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedSession.type === "room_booking" && (
            <div className="mb-8 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-700">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                Réservé par
              </h5>
              {selectedSession.participants.length > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-black bg-black dark:bg-zinc-600 text-white">
                    {selectedSession.participants[0].firstname[0]}
                    {selectedSession.participants[0].lastname[0]}
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                      {selectedSession.participants[0].firstname}{" "}
                      {selectedSession.participants[0].lastname}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-medium text-zinc-400 italic">
                  Inconnu
                </p>
              )}
            </div>
          )}

          {user.role === "admin" && selectedSession.type === "activity" && (
            <div className="mt-10 pt-8 border-t border-zinc-100 dark:border-zinc-700 flex gap-4">
              {selectedSession.status === "pending" ? (
                <button
                  onClick={() => {
                    onValidateActivity(
                      selectedSession.activity_id!,
                      "approved",
                    );
                    onClose();
                  }}
                  className="flex-1 bg-black dark:bg-white dark:text-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl"
                >
                  <CheckCircle size={20} /> Approuver l'atelier
                </button>
              ) : (
                <button
                  onClick={() => {
                    onValidateActivity(selectedSession.activity_id!, "pending");
                    onClose();
                  }}
                  className="flex-1 border-2 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                >
                  <Clock size={20} /> Suspendre
                </button>
              )}
            </div>
          )}

          {(user.role === "admin" || user.role === "civic_service") && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700 flex justify-end">
              <button
                onClick={() => onDeleteSession(selectedSession.id)}
                className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                <Trash2 size={12} /> Supprimer la session
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SessionModal;
