import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PointsHistoryDatum } from "../../types";
import { goldenClasses } from "../../utils/goldenTicket";

interface ProfilePointsChartProps {
  isGolden: boolean;
  pointsLoading: boolean;
  pointsError: string | null;
  pointsHistory: PointsHistoryDatum[];
  totalPoints: number;
}

export default function ProfilePointsChart({
  isGolden,
  pointsLoading,
  pointsError,
  pointsHistory,
  totalPoints,
}: ProfilePointsChartProps) {
  return (
    <div
      className={`rounded-3xl p-6 md:p-8 border shadow-sm min-h-[400px] ${
        isGolden
          ? "bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/10 dark:to-zinc-900 border-amber-200 dark:border-amber-800"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3
            className={`text-xl font-black uppercase tracking-tight mb-2 ${
              isGolden ? goldenClasses.name : "text-zinc-900 dark:text-white"
            }`}
          >
            Evolution des points
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
            Cumul des points obtenus sur les 3 derniers mois.
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400">
            Total 3 mois
          </p>
          <p className="text-2xl font-black text-zinc-900 dark:text-white">
            {totalPoints}
            <span className="text-base ml-1 text-zinc-400">pts</span>
          </p>
        </div>
      </div>

      <div className="h-[280px] w-full rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-3">
        {pointsLoading ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
            Chargement de l&apos;historique...
          </div>
        ) : pointsError ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-red-500 text-center px-4">
            {pointsError}
          </div>
        ) : pointsHistory.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-400 text-center px-4">
            Aucune donnée de points sur les 3 derniers mois.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pointsHistory} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" opacity={0.25} />
              <XAxis
                dataKey="period_label"
                tick={{ fontSize: 11, fill: "#71717a" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#71717a" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ stroke: "#f97316", strokeOpacity: 0.2 }}
                formatter={(value) => [`${Number(value ?? 0)} pts`, "Cumul"]}
                labelFormatter={(label) => `Semaine du ${label}`}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#f97316"
                strokeWidth={3}
                fill="url(#pointsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {isGolden && (
        <p className="mt-5 text-xs text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
          Golden Ticket actif: cette mise en avant reste visible sur votre profil et vos ateliers.
        </p>
      )}
    </div>
  );
}
