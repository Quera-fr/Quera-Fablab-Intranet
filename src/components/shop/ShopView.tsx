import { useEffect, useState } from "react";
import { ShopArticle, User } from "../../types";
import ShopItemCard from "./ShopItemCard";
import ShopAdmin from "./ShopAdmin";
import { ShoppingBagIcon } from "lucide-react";

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
  const canManageShop = user.role === "admin" || user.role === "civic_service";

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
        <ShopAdmin
          canManageShop={canManageShop}
          showForm={showForm}
          setShowForm={setShowForm}
          uploading={uploading}
          form={form}
          setForm={setForm}
          onSubmit={handleCreate}
        />
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
