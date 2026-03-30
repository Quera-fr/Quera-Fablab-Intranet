import { useEffect, useState } from "react";
import { ShopArticle, User } from "../../types";
import ShopItemCard from "./ShopItemCard";

type Props = { user: User };

export default function ShopView({ user }: Props) {
  const [articles, setArticles] = useState<ShopArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
    fetch("/api/articles")
      .then((res) => res.json())
      .then(setArticles);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Boutique</h2>
      {(user.role === "admin" || user.role === "civic_service") && (
        <>
          <button className="btn btn-primary mb-4" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Annuler" : "Nouvel article"}
          </button>
          {showForm && (
            <form onSubmit={handleCreate} className="mb-4 flex flex-col gap-2 max-w-md">
              <input
                className="input"
                placeholder="Titre"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
              <textarea
                className="input"
                placeholder="Description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
              <input
                className="input"
                placeholder="URL image (ou uploader ci-dessous)"
                value={form.image_url}
                onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
              />
              <input
                className="input"
                type="file"
                accept="image/*"
                onChange={e => setForm(f => ({ ...f, imageFile: e.target.files?.[0] || null }))}
              />
              <input
                className="input"
                type="number"
                min={1}
                placeholder="Points"
                value={form.points}
                onChange={e => setForm(f => ({ ...f, points: Number(e.target.value) }))}
                required
              />
              <button className="btn btn-success" type="submit" disabled={uploading}>
                {uploading ? "Envoi..." : "Créer"}
              </button>
            </form>
          )}
        </>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <ShopItemCard key={article.id} article={article} user={user} onUpdate={setArticles} />
        ))}
      </div>
    </div>
  );
}