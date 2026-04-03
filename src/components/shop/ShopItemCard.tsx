import { Dispatch, SetStateAction } from "react";
import { Package } from "lucide-react";
import { ShopArticle, User } from "../../types";

type Props = {
  article: ShopArticle;
  user: User;
  onUpdate: Dispatch<SetStateAction<ShopArticle[]>>;
  pointsRestants: number | null;
};

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; cls: string }> = {
    active: {
      label: "Disponible",
      cls: "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    },
    reserved: {
      label: "Reserve",
      cls: "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    },
    validated: {
      label: "Utilise",
      cls: "bg-zinc-100 text-zinc-500 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    },
  };

  const conf = configs[status] ?? {
    label: status,
    cls: "bg-zinc-100 text-zinc-500 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${conf.cls}`}
    >
      {conf.label}
    </span>
  );
}

export default function ShopItemCard({ article, user, pointsRestants, onUpdate }: Props) {
  const canReserve =
    user.role === "beneficiary" &&
    article.status === "active" &&
    !article.reserved_by_user_id &&
    pointsRestants !== null &&
    pointsRestants >= article.points;
  const notEnoughPoints =
    user.role === "beneficiary" &&
    article.status === "active" &&
    !article.reserved_by_user_id &&
    (pointsRestants === null || pointsRestants < article.points);
  const canValidate =
    (user.role === "admin" || user.role === "civic_service") &&
    article.status === "reserved";
  const canDelete = user.role === "admin" || user.role === "civic_service";

  const handleReserve = async () => {
    await fetch(`/api/articles/${article.id}/reserve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
    });
    fetch("/api/articles")
      .then((res) => res.json())
      .then(onUpdate);
  };

  const handleValidate = async () => {
    await fetch(`/api/articles/${article.id}/validate`, { method: "PATCH" });
    fetch("/api/articles")
      .then((res) => res.json())
      .then(onUpdate);
  };

  const handleDelete = async () => {
    if (!window.confirm("Supprimer cet article ?")) return;
    await fetch(`/api/articles/${article.id}`, { method: "DELETE" });
    fetch("/api/articles")
      .then((res) => res.json())
      .then(onUpdate);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col hover:shadow-md transition-all">
      {article.image_url ? (
        <img
          src={article.image_url}
          alt={article.title}
          className="w-full h-44 object-cover"
        />
      ) : (
        <div className="w-full h-44 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Package size={40} className="text-zinc-300 dark:text-zinc-600" />
        </div>
      )}

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1">
              Article
            </span>
            <h3 className="text-base font-black uppercase tracking-tighter text-zinc-900 dark:text-white leading-tight">
              {article.title}
            </h3>
          </div>
          <span className="inline-flex items-center justify-center min-w-8 h-8 rounded-full px-2.5 text-sm font-black bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 shrink-0">
            {article.points}
          </span>
        </div>

        {article.description && (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">
            {article.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={article.status} />
          {(article.status === "reserved" || article.status === "validated") &&
            (article.reserved_firstname || article.reserved_lastname) && (
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                {article.reserved_firstname} {article.reserved_lastname}
              </span>
            )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
            Cout :
          </span>
          <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-300">
            {article.points} pts Quera
          </span>
        </div>

        <div className="flex flex-col gap-2 mt-auto">
      {canReserve && (
          <button
            className="w-full px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-black text-white hover:bg-zinc-800 transition-all dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            onClick={handleReserve}
          >
            Reserver
          </button>
      )}
          {notEnoughPoints && (
            <button
              disabled
              className="w-full px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600"
            >
              Points insuffisants
            </button>
          )}
      {canValidate && (
            <button
              className="w-full px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-green-600 text-white hover:bg-green-700 transition-all"
              onClick={handleValidate}
            >
              Valider l'utilisation
            </button>
      )}
      {canDelete && (
            <button
              className="w-full px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-700 dark:hover:text-white"
              onClick={handleDelete}
            >
              Supprimer
            </button>
      )}
      {article.status === "reserved" && article.reserved_by_user_id === user.id && (
            <button
              className="w-full px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-all border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-600 dark:hover:text-white"
              onClick={async () => {
                await fetch(`/api/articles/${article.id}/cancel`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ user_id: user.id }),
                });
                onUpdate((prev: ShopArticle[]) =>
                  prev.map((a) =>
                    a.id === article.id
                      ? { ...a, reserved_by_user_id: null, status: "active" }
                      : a
                  )
                );
              }}
            >
              Annuler la reservation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
