import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import { Ticket, TicketX } from "lucide-react";
import { User } from "../../types";

interface GoldenTicketRevealProps {
  user: User;
  isGolden: boolean;
  onClose: () => void;
}

const GOLDEN_COLORS = ["#ed9a26", "#f3ba59", "#f2dc50", "#ffffff"];

function launchConfetti() {
  const endTime = Date.now() + 3000;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: GOLDEN_COLORS,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: GOLDEN_COLORS,
    });
    if (Date.now() < endTime) requestAnimationFrame(frame);
  };

  frame();
}

export default function GoldenTicketReveal({
  user,
  isGolden,
  onClose,
}: GoldenTicketRevealProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const handleFlip = useCallback(() => {
    if (isFlipped) return;
    setIsFlipped(true);
    if (isGolden) setTimeout(() => launchConfetti(), 300);
    setTimeout(() => setShowButton(true), 900);
  }, [isFlipped, isGolden]);

  // Auto-flip après 1.2 s pour l'effet dramatique
  useEffect(() => {
    const t = setTimeout(handleFlip, 1200);
    return () => clearTimeout(t);
  }, [handleFlip]);

  const initials = `${user.firstname[0]}${user.lastname[0]}`.toUpperCase();

  const monthLabel = user.goldenTicket
    ? new Date(user.goldenTicket.year, user.goldenTicket.month - 1)
        .toLocaleString("fr-FR", { month: "long", year: "numeric" })
        .replace(/^\w/, (c) => c.toUpperCase())
    : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-70 p-4 gap-8"
      onClick={() => {
        if (showButton) onClose();
      }}
    >
      {/* Carte FIFA */}
      <motion.div
        initial={{ scale: 0.55, y: 70, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22, delay: 0.1 }}
        className="w-64 h-96 perspective-[1000px] cursor-pointer shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          handleFlip();
        }}
        title="Cliquer pour révéler"
      >
        <div
          className={`relative w-full h-full transition-all duration-700 transform-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* ── FACE AVANT (dos de la carte) ── */}
          <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden border-4 border-amber-400 shadow-2xl shadow-amber-500/30 bg-linear-to-br from-zinc-900 to-black flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-amber-400/10 border-2 border-amber-400/40 flex items-center justify-center">
              <Ticket size={40} className="text-amber-400" />
            </div>
            <span className="text-amber-400/50 text-[10px] font-black uppercase tracking-[0.3em]">
              Quera Fablab
            </span>
          </div>

          {/* ── FACE ARRIÈRE GOLDEN ── */}
          {isGolden && (
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl overflow-hidden border-4 border-amber-300 shadow-2xl shadow-amber-400/50 bg-linear-to-b from-amber-400 via-yellow-300 to-amber-500 flex flex-col items-center p-5 gap-3">
            {/* Reflet brillant */}
            <div className="absolute inset-0 bg-linear-to-br from-white/35 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-linear-to-b from-white/20 to-transparent pointer-events-none" />


            {/* Avatar */}
            <div className="w-24 h-24 rounded-full border-4 border-amber-200 shadow-xl overflow-hidden bg-amber-300 flex items-center justify-center text-amber-900 font-black text-2xl mt-6 shrink-0">
              {user.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={initials}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {/* Nom */}
            <div className="text-center leading-tight">
              <p className="font-black text-amber-900 uppercase tracking-tight text-xl">
                {user.firstname}
              </p>
              <p className="font-black text-amber-900 uppercase tracking-tight text-xl">
                {user.lastname}
              </p>
            </div>

            {/* Badge Golden Ticket */}
            <div className="flex items-center gap-1.5 bg-amber-900/20 border border-amber-800/30 rounded-full px-3 py-1">
              <Ticket size={11} className="text-amber-900" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-900">
                Golden Ticket
              </span>
            </div>

            {/* Validité */}
            {monthLabel && (
              <p className="text-[10px] text-amber-800/70 font-bold uppercase tracking-wider text-center">
                {monthLabel}
              </p>
            )}

            {/* Étoiles déco */}
            <div className="mt-auto text-amber-600/80 text-sm tracking-[0.4em] select-none">
              ★ ★ ★
            </div>
          </div>
          )}

          {/* ── FACE ARRIÈRE NON-GOLDEN ── */}
          {!isGolden && (
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl overflow-hidden border-4 border-zinc-600 shadow-2xl bg-linear-to-b from-zinc-800 via-zinc-900 to-zinc-950 flex flex-col items-center p-5 gap-3">

            {/* Avatar grisé */}
            <div className="w-24 h-24 rounded-full border-4 border-zinc-600 shadow-xl overflow-hidden bg-zinc-700 flex items-center justify-center text-zinc-400 font-black text-2xl mt-6 shrink-0 grayscale">
              {user.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={initials}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {/* Nom */}
            <div className="text-center leading-tight">
              <p className="font-black text-zinc-300 uppercase tracking-tight text-xl">
                {user.firstname}
              </p>
              <p className="font-black text-zinc-300 uppercase tracking-tight text-xl">
                {user.lastname}
              </p>
            </div>

            {/* Badge négatif */}
            <div className="flex items-center gap-1.5 bg-zinc-700/60 border border-zinc-600 rounded-full px-3 py-1">
              <TicketX size={11} className="text-zinc-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Pas de Golden Ticket
              </span>
            </div>

            <p className="text-[10px] text-zinc-500 text-center leading-relaxed px-2">
              Continue à participer pour
              <br />décrocher le Golden Ticket !
            </p>

            {/* Étoiles grisées */}
            <div className="mt-auto text-zinc-700 text-sm tracking-[0.4em] select-none">
              ★ ★ ★
            </div>
          </div>
          )}
        </div>
      </motion.div>

      {/* Bouton CTA — apparaît après le flip */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className={`active:scale-95 font-black uppercase tracking-widest text-sm px-10 py-3 rounded-2xl transition-all ${
              isGolden
                ? "bg-amber-400 hover:bg-amber-500 text-amber-900 shadow-lg shadow-amber-500/30"
                : "bg-zinc-700 hover:bg-zinc-600 text-zinc-200"
            }`}
          >
            {isGolden ? "Super !" : "Compris"}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
