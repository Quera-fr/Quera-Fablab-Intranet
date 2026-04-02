import { useEffect, useState } from "react";
import LiquidEther from "../../../components/LiquidEther";

interface GoldenAmbientBackgroundProps {
  active: boolean;
}

export default function GoldenAmbientBackground({
  active,
}: GoldenAmbientBackgroundProps) {
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mobileQuery = window.matchMedia("(max-width: 1024px)");
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const updateFromQueries = () => {
      setIsNarrowScreen(mobileQuery.matches);
      setPrefersReducedMotion(reducedMotionQuery.matches);
    };

    updateFromQueries();
    mobileQuery.addEventListener("change", updateFromQueries);
    reducedMotionQuery.addEventListener("change", updateFromQueries);

    return () => {
      mobileQuery.removeEventListener("change", updateFromQueries);
      reducedMotionQuery.removeEventListener("change", updateFromQueries);
    };
  }, []);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
      <LiquidEther
        colors={["#ed9a26", "#f3ba59", "#f2dc50"]}
        resolution={prefersReducedMotion ? 0.2 : isNarrowScreen ? 0.24 : 0.32}
        mouseForce={prefersReducedMotion ? 8 : isNarrowScreen ? 11 : 16}
        cursorSize={isNarrowScreen ? 72 : 88}
        autoSpeed={prefersReducedMotion ? 0.18 : 0.35}
        autoIntensity={prefersReducedMotion ? 1.05 : isNarrowScreen ? 1.35 : 1.8}
        className="w-full h-full opacity-55 dark:opacity-35"
      />
      <div className="absolute inset-0 bg-linear-to-b from-amber-50/70 via-transparent to-zinc-50/80 dark:from-amber-950/10 dark:to-zinc-950/75" />
    </div>
  );
}
