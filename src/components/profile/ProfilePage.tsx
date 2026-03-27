import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Mail, Calendar, MapPin, Ticket } from "lucide-react";
import { User } from "../../types";
import { isGoldenTicketActive, goldenClasses } from "../../utils/goldenTicket";

interface ProfilePageProps {
  user: User;
  onUpdate: (user: User) => void;
}

export default function ProfilePage({ user, onUpdate }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user, password: "" });
  const [isSaving, setIsSaving] = useState(false);
  const isGolden = isGoldenTicketActive(user);

  useEffect(() => {
    setFormData({ ...user, password: "" });
  }, [user]);

  const updateProfile = async (
  updatedData: Partial<User> & { password?: string },
  closeEditAfterSave = true,
) => {
  setIsSaving(true);
  try {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });

    if (res.ok) {
      onUpdate({ ...user, ...updatedData });
      if (closeEditAfterSave) {
        setIsEditing(false);
      }
    }
  } catch (error) {
    console.error("Failed to update profile:", error);
  } finally {
    setIsSaving(false);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  await updateProfile(formData);
};

  const PRESET_AVATARS = [
    "/avatars/avatar1.jpg",
    "/avatars/avatar2.jpg",
    "/avatars/avatar3.jpg",
    "/avatars/avatar4.jpg",
    "/avatars/avatar5.jpg",
  ];

  const avatarToDisplay = isEditing
    ? formData.profile_picture_url
    : user.profile_picture_url;

  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-[calc(100vh-120px)]">
      {/* Left Column - 1/3 */}
      <div
        className={`bg-white dark:bg-zinc-900 rounded-3xl p-8 border shadow-sm relative overflow-hidden group ${
          isGolden
            ? "border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 via-white to-white dark:from-amber-950/20 dark:via-zinc-900 dark:to-zinc-900"
            : "border-zinc-200 dark:border-zinc-800"
        }`}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Avatar Section */}
          <div
            className={`relative group/avatar ${
              isEditing ? "cursor-pointer" : "cursor-default"
            } ${
              isGolden
                ? "border-amber-100 dark:border-amber-700"
                : "bg-black dark:bg-white text-white dark:text-black border-zinc-50 dark:border-zinc-800"
            }`}
          >
            <div className="w-32 h-32 rounded-full flex items-center justify-center text-3xl font-black overflow-hidden border-4 shadow-xl">
              {avatarToDisplay ? (
                <img
                  src={avatarToDisplay}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {user.firstname[0]}
                  {user.lastname[0]}
                </span>
              )}
            </div>

            {isEditing && (
              <div className="absolute inset-0 flex flex-wrap gap-1 items-center justify-center bg-black/60 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity p-2">
                {PRESET_AVATARS.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`avatar ${i + 1}`}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, profile_picture_url: url }))
                    }
                    className="w-9 h-9 rounded-full object-cover cursor-pointer hover:ring-2 ring-white transition-all"
                  />
                ))}
              </div>
            )}
          </div>

          {/* User Basic Info */}
          <div className="text-center">
            <h2
              className={`text-2xl font-black uppercase tracking-tight ${
                isGolden ? goldenClasses.name : "text-zinc-900 dark:text-white"
              }`}
            >
              {user.firstname} {user.lastname}
            </h2>

            {/* Badges Container */}
            <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
              <div
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                  isGolden
                    ? goldenClasses.badge
                    : "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                }`}
              >
                {user.role}
              </div>

              {isGolden && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full  bg-amber-100 border border-amber-300 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 dark:border-amber-600 text-[10px] font-black uppercase tracking-widest">
                  <Ticket size={12} />
                  Golden Ticket
                </div>
              )}
            </div>
          </div>

          {/* Info List */}
          {!isEditing ? (
            <div className="w-full space-y-4 pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                <Mail size={16} />
                <span className="text-sm font-medium truncate">
                  {user.email}
                </span>
              </div>
              <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                <Calendar size={16} />
                <span className="text-sm font-medium">
                  {new Date(user.dob).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                <MapPin size={16} />
                <span className="text-sm font-medium">{user.address}</span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="w-full mt-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                Modifier le profil
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-full space-y-4 pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">
                    Prénom
                  </label>
                  <input
                    value={formData.firstname}
                    onChange={(e) =>
                      setFormData({ ...formData, firstname: e.target.value })
                    }
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-400 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">
                    Nom
                  </label>
                  <input
                    value={formData.lastname}
                    onChange={(e) =>
                      setFormData({ ...formData, lastname: e.target.value })
                    }
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-400 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) =>
                    setFormData({ ...formData, dob: e.target.value })
                  }
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">
                  Adresse
                </label>
                <input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  placeholder="Laisser vide pour garder l'actuel"
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ ...user, password: "" });
                  }}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  {isSaving ? "Enregistrement..." : <>Enregistrer</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Column - 2/3 */}
      <div
        className={`rounded-3xl p-8 border shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center ${
          isGolden
            ? "bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/10 dark:to-zinc-900 border-amber-200 dark:border-amber-800"
            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        }`}
      >
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 font-black text-2xl ring-8 ${
            isGolden
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-500 dark:text-amber-300 ring-amber-100/80 dark:ring-amber-900/20"
              : "bg-zinc-50 dark:bg-zinc-950 text-zinc-300 dark:text-zinc-700 ring-zinc-50/50 dark:ring-zinc-900/50"
          }`}
        >
          ?
        </div>
        <h3
          className={`text-xl font-black uppercase tracking-tight mb-2 ${
            isGolden ? goldenClasses.name : "text-zinc-900 dark:text-white"
          }`}
        >
          {isGolden ? "Golden Ticket actif" : "Espace à venir"}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
          {isGolden
            ? "Votre profil bénéficie actuellement du Golden Ticket du mois. Cette mise en avant doit rester visible sur votre profil et dans les ateliers où vous êtes inscrit."
            : "Cet espace sera bientôt dédié à vos inscriptions, vos points et votre historique d&apos;activités."}
        </p>
      </div>
    </div>
  );
}
