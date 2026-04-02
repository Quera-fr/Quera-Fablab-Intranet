import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ProfileMonthlyHistoryDatum, ProfileMonthlyPointsResponse } from "../../types";
import { goldenClasses } from "../../utils/goldenTicket";

interface ProfilePointsChartProps {
  isGolden: boolean;
  pointsLoading: boolean;
  pointsError: string | null;
  monthlySummary: ProfileMonthlyPointsResponse | null;
  monthlyHistory: ProfileMonthlyHistoryDatum[];
}

export default function ProfilePointsChart({
  isGolden,
  pointsLoading,
  pointsError,
  monthlySummary,
  monthlyHistory,
}: ProfilePointsChartProps) {
  const pointsHistory = monthlySummary?.daily_series ?? [];
  const totalPoints = monthlySummary?.points_actuels ?? 0;

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
            Evolution des points sur le mois en cours. Survolez un jour pour voir le detail.
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400">
            Points actuels
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
            Aucune donnee de points sur le mois selectionne.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pointsHistory} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" opacity={0.25} />
              <XAxis
                dataKey="day_label"
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
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const point = payload[0].payload as {
                    cumulative: number;
                    earned: number;
                    used: number;
                    penalties: number;
                    net: number;
                  };
                  return (
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 shadow-xl text-xs">
                      <p className="font-black text-zinc-900 dark:text-white mb-1">{label}</p>
                      <p className="text-zinc-700 dark:text-zinc-300">Points actuels: {point.cumulative} pts</p>
                      <p className="text-emerald-600">Gagnes: {point.earned} pts</p>
                      <p className="text-blue-600">Utilises boutique: {point.used} pts</p>
                      <p className="text-red-600">Penalites: {point.penalties} pts</p>
                      <p className="text-zinc-600 dark:text-zinc-400">Net jour: {point.net} pts</p>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                name="Points actuels"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ r: 3, strokeWidth: 0, fill: "#f97316" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-5">
        <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400 mb-2">
          Mois precedents
        </h4>
        <div className="h-[180px] w-full rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/60 p-3">
          {monthlyHistory.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-400 text-center px-4">
              Aucune courbe disponible pour les mois precedents.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyHistory} margin={{ top: 8, right: 14, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" opacity={0.2} />
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
                  formatter={(value, name) => [`${Number(value ?? 0)} pts`, String(name)]}
                />
                <Line type="monotone" dataKey="points_actuels" name="Points actuels" stroke="#f97316" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {isGolden && (
        <p className="mt-5 text-xs text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
          Golden Ticket actif: cette mise en avant reste visible sur votre profil et vos ateliers.
        </p>
      )}
    </div>
  );
}
