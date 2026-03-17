import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { QueraPointsSummary } from "../../../types";

type PresentBeneficiary = {
  user_id: number;
  firstname: string;
  lastname: string;
};

interface QueraPointsModalProps {
  date: Date;
  managerUserId: number;
  presentBeneficiaries: PresentBeneficiary[];
  onClose: () => void;
}

const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function QueraPointsModal({
  date,
  managerUserId,
  presentBeneficiaries,
  onClose,
}: QueraPointsModalProps) {
  const dateKey = useMemo(() => toDateKey(date), [date]);
  const [summary, setSummary] = useState<QueraPointsSummary | null>(null);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<
    number | ""
  >("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedPresent = useMemo(() => {
    return [...presentBeneficiaries].sort((a, b) => {
      const ln = a.lastname.localeCompare(b.lastname, "fr");
      if (ln !== 0) return ln;
      return a.firstname.localeCompare(b.firstname, "fr");
    });
  }, [presentBeneficiaries]);

  const selectedCurrentPoints =
    selectedBeneficiaryId === ""
      ? 0
      : summary?.beneficiaries.find((b) => b.user_id === selectedBeneficiaryId)
          ?.points ?? 0;

  const fetchSummary = async () => {
    const res = await fetch(
      `/api/quera-points?date=${encodeURIComponent(dateKey)}&manager_user_id=${encodeURIComponent(String(managerUserId))}`,
    );
    if (!res.ok) return;
    setSummary(await res.json());
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, managerUserId]);

  const submitDelta = async (delta: number) => {
    if (selectedBeneficiaryId === "") return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/quera-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey,
          manager_user_id: managerUserId,
          beneficiary_user_id: selectedBeneficiaryId,
          delta,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Erreur");
        return;
      }
      await fetchSummary();
    } finally {
      setIsSubmitting(false);
    }
  };

  const remaining = summary?.remaining ?? 0;
  const canAdd = selectedBeneficiaryId !== "" && remaining > 0 && !isSubmitting;
  const canRemove =
    selectedBeneficiaryId !== "" && selectedCurrentPoints > 0 && !isSubmitting;

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
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
              Quera Points
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

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Budget du jour
              </div>
              <div className="text-sm font-bold text-zinc-900 dark:text-white">
                {summary ? `${summary.total}/5 utilisés` : "Chargement..."}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Restant
              </div>
              <div className="text-2xl font-black text-orange-500">
                {summary ? summary.remaining : "—"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Bénéficiaire présent aujourd&apos;hui
            </label>
            <select
              value={selectedBeneficiaryId}
              onChange={(e) =>
                setSelectedBeneficiaryId(
                  e.target.value ? Number(e.target.value) : "",
                )
              }
              className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-sm"
            >
              <option value="">Sélectionner…</option>
              {sortedPresent.map((b) => (
                <option key={b.user_id} value={b.user_id}>
                  {b.firstname} {b.lastname}
                </option>
              ))}
            </select>
            {sortedPresent.length === 0 && (
              <div className="text-sm text-zinc-500 italic">
                Aucun bénéficiaire inscrit à une session aujourd&apos;hui.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => submitDelta(+1)}
              disabled={!canAdd}
              className="px-4 py-3 rounded-2xl bg-orange-500 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white disabled:text-zinc-500 font-black uppercase tracking-widest text-xs transition-colors"
            >
              +1 point
            </button>
            <button
              type="button"
              onClick={() => submitDelta(-1)}
              disabled={!canRemove}
              className="px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 font-black uppercase tracking-widest text-xs text-zinc-900 dark:text-white transition-colors"
            >
              -1 point
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Récap aujourd&apos;hui
              </div>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {(summary?.beneficiaries ?? []).length === 0 && (
                <div className="p-4 text-sm text-zinc-500 italic">
                  Aucun point attribué pour l&apos;instant.
                </div>
              )}
              {(summary?.beneficiaries ?? []).map((b) => (
                <div
                  key={b.user_id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="font-bold text-zinc-900 dark:text-white">
                    {b.firstname} {b.lastname}
                  </div>
                  <div className="font-black text-orange-500">{b.points}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

