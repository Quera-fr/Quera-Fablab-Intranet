import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Pencil, Ticket } from "lucide-react";
import { User, Role, QueraPointsTotal } from "../../types";
import { isGoldenTicketActive, goldenClasses } from "../../utils/goldenTicket";
import { GoldenTicket } from "../../types";

interface UserManagementProps {
  currentUser: User;
}

const UserManagement = ({ currentUser }: UserManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [pointsTotals, setPointsTotals] = useState<Map<number, number>>(
    new Map(),
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    email: "",
    lastname: "",
    firstname: "",
    role: "beneficiary" as Role,
    dob: "",
    address: "",
    password: "",
  });
  const [newUser, setNewUser] = useState({
    email: "",
    lastname: "",
    firstname: "",
    role: "beneficiary" as Role,
    dob: "",
    address: "",
  });
  const [activeGoldenTicket, setActiveGoldenTicket] = useState<(GoldenTicket & { beneficiary_user_id: number; firstname: string; lastname: string }) | null>(null);
  const [showGoldenTicketModal, setShowGoldenTicketModal] = useState(false);
  const [goldenMonth, setGoldenMonth] = useState(new Date().getMonth() + 1);
  const [goldenYear, setGoldenYear] = useState(new Date().getFullYear());
  const [goldenTargetId, setGoldenTargetId] = useState<number | null>(null);

  const fetchUsers = async () => {
    const [usersRes, ticketRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/golden-tickets/active"),
    ]);
    const rawUsers: User[] = await usersRes.json();
    const ticket = ticketRes.ok ? await ticketRes.json() : null;
    const enriched = rawUsers.map((u) => ({
      ...u,
      goldenTicket: ticket && ticket.beneficiary_user_id === u.id ? ticket : null,
    }));
    setUsers(enriched);
    setActiveGoldenTicket(ticket);
  };

  const fetchPointsTotals = async () => {
    const res = await fetch("/api/quera-points/totals");
    if (!res.ok) return;
    const data: QueraPointsTotal[] = await res.json();
    const map = new Map<number, number>();
    data.forEach((t) => map.set(t.user_id, t.total_points));
    setPointsTotals(map);
  };

  const fetchActiveGoldenTicket = async () => {
    const res = await fetch("/api/golden-tickets/active");
    if (res.ok) setActiveGoldenTicket(await res.json());
  };

  useEffect(() => {
    fetchUsers();
    fetchPointsTotals();
    fetchActiveGoldenTicket();
  }, []);

  const isAdminOrCivic =
    currentUser.role === "admin" || currentUser.role === "civic_service";
  const isAdmin = currentUser.role === "admin";

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setEditingUser(null);
    fetchUsers();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Supprimer cet utilisateur ?")) {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      fetchUsers();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      confirm(`Supprimer les ${selectedIds.length} utilisateurs sélectionnés ?`)
    ) {
      await fetch("/api/users/batch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
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
      setSelectedIds(users.map((u) => u.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };



  const handleAssignGoldenTicket = async () => {
    if (!goldenTargetId) return;
    await fetch("/api/golden-tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        beneficiary_user_id: goldenTargetId,
        assigned_by_user_id: currentUser.id,
        month: goldenMonth,
        year: goldenYear,
      }),
    });
    setShowGoldenTicketModal(false);
    setGoldenTargetId(null);
    fetchActiveGoldenTicket();
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
            Utilisateurs
          </h2>
          {isAdmin && selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-all font-bold text-[10px] uppercase tracking-wider shadow-lg animate-in fade-in slide-in-from-left-4"
            >
              <Trash2 size={16} /> Supprimer ({selectedIds.length})
            </button>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors font-bold text-sm uppercase tracking-wider"
          >
            <Plus size={18} /> Ajouter
          </button>
        )}
        {isAdminOrCivic && (
          <button
            onClick={() => setShowGoldenTicketModal(true)}
            className="flex items-center gap-2 bg-amber-400 text-white px-4 py-2 rounded-xl hover:bg-amber-500 transition-colors font-bold text-sm uppercase tracking-wider"
          >
            <Ticket size={18} /> Golden Ticket
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
              {isAdmin && (
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      users.length > 0 && selectedIds.length === users.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
                  />
                </th>
              )}
              <th className="p-4 font-bold text-zinc-500 text-[10px] uppercase tracking-widest">
                Nom
              </th>
              <th className="p-4 font-bold text-zinc-500 text-[10px] uppercase tracking-widest">
                Rôle
              </th>
              <th className="p-4 font-bold text-zinc-500 text-[10px] uppercase tracking-widest">
                Email
              </th>
              {isAdminOrCivic && (
                <th className="p-4 font-bold text-zinc-500 text-[10px] uppercase tracking-widest text-center">
                  Pts Quera
                </th>
              )}
              {isAdmin && (
                <th className="p-4 font-bold text-zinc-500 text-[10px] uppercase tracking-widest text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className={`border-t transition-colors ${
                  isGoldenTicketActive(u)
                    ? `${goldenClasses.tableRow} hover:bg-amber-100/40 dark:hover:bg-amber-900/20`
                    : `border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${selectedIds.includes(u.id) ? "bg-zinc-50/50 dark:bg-zinc-800/30" : ""}`
                }`}
              >
                {isAdmin && (
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(u.id)}
                      onChange={() => toggleSelect(u.id)}
                      className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
                    />
                  </td>
                )}
                <td className="p-4 text-zinc-800 dark:text-white font-bold">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isGoldenTicketActive(u)
                          ? goldenClasses.avatar
                          : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
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
                    <span
                      className={`font-bold ${
                        isGoldenTicketActive(u)
                          ? goldenClasses.name
                          : "text-zinc-800 dark:text-white"
                      }`}
                    >
                      {u.firstname} {u.lastname}
                    </span>
                    {isGoldenTicketActive(u) && (
                      <Ticket size={14} className="text-amber-500 shrink-0" />
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      isGoldenTicketActive(u) && u.role === "beneficiary"
                        ? goldenClasses.badge
                        : u.role === "admin"
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                          : u.role === "volunteer"
                            ? "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                            : u.role === "civic_service"
                              ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
                              : "bg-white text-zinc-500 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                  {u.email}
                </td>
                {isAdminOrCivic && (
                  <td className="p-4 text-center">
                    {u.role === "beneficiary" ? (
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black ${
                          (pointsTotals.get(u.id) ?? 0) > 0
                            ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                            : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                        }`}
                      >
                        {pointsTotals.get(u.id) ?? 0}
                      </span>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-700 text-sm">
                        —
                      </span>
                    )}
                  </td>
                )}

                {isAdmin && (
                  <td className="p-4 flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setEditForm({ ...u, password: "" });
                      }}
                      className="p-2 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all"
                      title="Modifier"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="p-2 text-zinc-400 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isAdmin && showAdd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-700"
            >
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight text-zinc-900 dark:text-white">
                Nouvel Utilisateur
              </h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Prénom"
                    className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    onChange={(e) =>
                      setNewUser({ ...newUser, firstname: e.target.value })
                    }
                    required
                  />
                  <input
                    placeholder="Nom"
                    className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    onChange={(e) =>
                      setNewUser({ ...newUser, lastname: e.target.value })
                    }
                    required
                  />
                </div>
                <input
                  placeholder="Email"
                  type="email"
                  className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  required
                />
                <select
                  className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value as Role })
                  }
                >
                  <option value="beneficiary">
                    Bénéficiaire (Collégien/Lycéen)
                  </option>
                  <option value="volunteer">Bénévole (Encadrant)</option>
                  <option value="civic_service">Service Civique</option>
                  <option value="admin">Administrateur</option>
                  <option value="adherent">Adhérent</option>
                </select>
                <input
                  type="date"
                  className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  onChange={(e) =>
                    setNewUser({ ...newUser, dob: e.target.value })
                  }
                  required
                />
                <input
                  placeholder="Adresse"
                  className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  onChange={(e) =>
                    setNewUser({ ...newUser, address: e.target.value })
                  }
                  required
                />
                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 border border-zinc-200 dark:border-zinc-700 py-3 rounded-xl font-bold text-zinc-500"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-black text-white py-3 rounded-xl font-bold"
                  >
                    Créer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {isAdmin && editingUser && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setEditingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight text-zinc-900 dark:text-white">
                Modifier l&apos;utilisateur
              </h3>
              <form onSubmit={handleEdit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Prénom"
                    value={editForm.firstname}
                    className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    onChange={(e) =>
                      setEditForm({ ...editForm, firstname: e.target.value })
                    }
                    required
                  />
                  <input
                    placeholder="Nom"
                    value={editForm.lastname}
                    className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    onChange={(e) =>
                      setEditForm({ ...editForm, lastname: e.target.value })
                    }
                    required
                  />
                </div>
                <input
                  placeholder="Email"
                  type="email"
                  value={editForm.email}
                  className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  required
                />
                <select
                  value={editForm.role}
                  className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  onChange={(e) =>
                    setEditForm({ ...editForm, role: e.target.value as Role })
                  }
                >
                  <option value="beneficiary">Bénéficiaire (Collégien)</option>
                  <option value="volunteer">Bénévole (Encadrant)</option>
                  <option value="civic_service">Service Civique</option>
                  <option value="admin">Administrateur</option>
                  <option value="adherent">Adhérent</option>
                </select>
                <input
                  type="date"
                  value={editForm.dob}
                  className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  onChange={(e) =>
                    setEditForm({ ...editForm, dob: e.target.value })
                  }
                  required
                />
                <input
                  placeholder="Adresse"
                  value={editForm.address}
                  className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  required
                />
                <input
                  placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)"
                  type="password"
                  className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                />
                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 border border-zinc-200 dark:border-zinc-700 py-3 rounded-xl font-bold text-zinc-500"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-black text-white py-3 rounded-xl font-bold"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {isAdminOrCivic && showGoldenTicketModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-amber-300 dark:border-amber-700"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center">
                  <Ticket size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                  Golden Ticket
                </h3>
              </div>
              {activeGoldenTicket && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mb-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
                  Ticket actif: {activeGoldenTicket.firstname}{" "}
                  {activeGoldenTicket.lastname} —{" "}
                  {String(activeGoldenTicket.month).padStart(2, "0")}/
                  {activeGoldenTicket.year}
                </p>
              )}
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 mb-1 block">
                    Bénéficiaire
                  </label>
                  <select
                    className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    value={goldenTargetId ?? ""}
                    onChange={(e) => setGoldenTargetId(Number(e.target.value))}
                  >
                    <option value="">Sélectionner...</option>
                    {users
                      .filter((u) => u.role === "beneficiary")
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.firstname} {u.lastname}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-1 block">
                      Mois
                    </label>
                    <select
                      className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      value={goldenMonth}
                      onChange={(e) => setGoldenMonth(Number(e.target.value))}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2000, i).toLocaleString("fr-FR", {
                            month: "long",
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-1 block">
                      Année
                    </label>
                    <input
                      type="number"
                      min={2024}
                      max={2030}
                      value={goldenYear}
                      className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl w-full font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      onChange={(e) => setGoldenYear(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowGoldenTicketModal(false)}
                    className="flex-1 border border-zinc-200 dark:border-zinc-700 py-3 rounded-xl font-bold text-zinc-500"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAssignGoldenTicket}
                    disabled={!goldenTargetId}
                    className="flex-1 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors"
                  >
                    Attribuer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
