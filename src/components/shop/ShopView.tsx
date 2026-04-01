import { useEffect, useState } from "react";
import { ShopArticle, User } from "../../types";
import ShopItemCard from "./ShopItemCard";
import { Plus, ShoppingBagIcon, UploadIcon } from "lucide-react";

type Props = { user: User };

export default function ShopView({ user }: Props) {
  const [articles, setArticles] = useState<ShopArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [pointsRestants, setPointsRestants] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    points: 1,
    imageFile: null as File | null,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/articles")
      .then((res) => res.json())
      .then(setArticles)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user.role === "beneficiary") {
      fetch("/api/quera-points/totals")
        .then((res) => res.json())
        .then((data) => {
          if (!Array.isArray(data)) {
            console.error("Erreur API /api/quera-points/totals :", data);
            setPointsRestants(null);
            return;
          }
          const found = data.find((row: any) => row.user_id === user.id);
          const validated = found ? found.total_points : 0;
          fetch("/api/quera-points/locked")
            .then((res) => res.json())
            .then((lockedArray) => {
              const lockedRow = Array.isArray(lockedArray)
                ? lockedArray.find((row) => row.user_id === user.id)
                : null;
              const locked = lockedRow ? lockedRow.locked_points : 0;
              setPointsRestants(validated + locked);
            });
        });
    }
  }, [user, articles]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.imageFile) {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, name: form.imageFile?.name }),
        });
        const data = await uploadRes.json();
        await createArticle(data.url);
        setUploading(false);
      };
      reader.readAsDataURL(form.imageFile);
    } else {
      await createArticle(form.image_url);
    }
  };

  const createArticle = async (image_url: string) => {
    await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        image_url,
        points: form.points,
        status: "active",
        created_by_user_id: user.id,
      }),
    });
    setShowForm(false);
    setForm({ title: "", description: "", image_url: "", points: 1, imageFile: null });
    fetch("/api/articles").then((res) => res.json()).then(setArticles);
  };

  if (loading)
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <p className="text-zinc-400 text-sm font-black uppercase tracking-widest">Chargement…</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-350 mx-auto py-8 space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">
          Boutique
        </h2>
        {(user.role === "admin" || user.role === "civic_service") && (
          <button
            className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors font-black text-[10px] uppercase tracking-widest"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus size={14} />
            Nouvel article
          </button>
        )}
      </div>

      {/* Points restants — bénéficiaires */}
      {user.role === "beneficiary" && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 flex items-center gap-4">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full text-xl font-black bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 shrink-0">
            {pointsRestants !== null ? pointsRestants : "…"}
          </span>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-orange-400 block">
              Mes points Quera disponibles
            </span>
            <span className="text-lg font-black text-orange-700 dark:text-orange-300">
              {pointsRestants !== null ? `${pointsRestants} pts` : "Chargement…"}
            </span>
          </div>
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowForm(false)}
        >
          <form
            onSubmit={handleCreate}
            className="flex flex-col gap-4 w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white mb-2">
              Nouvel article
            </h3>

            <div>
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">
                Titre de l'article
              </label>
              <input
                className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="Titre"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">
                Description
              </label>
              <textarea
                className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="Description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">
                Image (URL ou upload)
              </label>
              <input
                className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white mb-2"
                placeholder="URL de l'image"
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <UploadIcon className="w-6 h-6 text-zinc-400 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  {form.imageFile ? form.imageFile.name : "Cliquer pour uploader"}
                </span>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imageFile: e.target.files?.[0] || null }))
                  }
                />
              </label>
            </div>

            <div>
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">
                Coût en pts Quera
              </label>
              <input
                className="w-full border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                type="number"
                min={1}
                placeholder="Points"
                value={form.points}
                onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))}
                required
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                className="flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-black text-white hover:bg-zinc-800 transition-all dark:bg-white dark:text-black dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Envoi…" : "Créer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grille */}
      {articles.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <ShoppingBagIcon size={40} className="text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 text-sm font-black uppercase tracking-widest">
            Aucun article disponible
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {articles.map((article) => (
            <ShopItemCard
              key={article.id}
              article={article}
              user={user}
              pointsRestants={pointsRestants}
              onUpdate={setArticles}
            />
          ))}
        </div>
      )}
    </div>
  );
}
