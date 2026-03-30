import { ShopArticle, User } from "../../types";

type Props = {
  article: ShopArticle;
  user: User;
  onUpdate: (articles: ShopArticle[]) => void;
};

export default function ShopItemCard({ article, user, onUpdate }: Props) {
  const canReserve =
    user.role === "beneficiary" &&
    article.status === "active" &&
    !article.reserved_by_user_id;
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
    <div className="border rounded-lg p-4 flex flex-col gap-2">
      {article.image_url && (
        <img
          src={article.image_url}
          alt={article.title}
          className="h-32 object-cover rounded"
        />
      )}
      <h3 className="font-bold">{article.title}</h3>
      <p>{article.description}</p>
      <p className="font-semibold">Coût : {article.points} pts</p>
      <p>
        Statut :{" "}
        {article.status === "active"
          ? "Disponible"
          : article.status === "reserved"
            ? `Réservé par ${article.reserved_firstname ?? ""} ${article.reserved_lastname ?? ""}`
            : article.status === "validated"
              ? "Utilisé"
              : article.status}
      </p>
      {canReserve && (
        <button className="btn btn-primary" onClick={handleReserve}>
          Réserver
        </button>
      )}
      {canValidate && (
        <button className="btn btn-success" onClick={handleValidate}>
          Valider l'utilisation
        </button>
      )}
      {canDelete && (
        <button className="btn btn-danger" onClick={handleDelete}>
          Supprimer
        </button>
      )}
    </div>
  );
}
