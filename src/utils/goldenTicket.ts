import { User } from '../types';

export function isGoldenTicketActive(user: { goldenTicket?: { starts_at: string; ends_at: string } | null }): boolean {
  if (!user.goldenTicket) return false;
  const today = new Date().toISOString().split('T')[0];
  return user.goldenTicket.starts_at <= today && user.goldenTicket.ends_at >= today;
}

export const goldenClasses = {
  tableRow: 'bg-amber-50/60 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700/40',
  avatar: 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white ring-2 ring-amber-300 dark:ring-amber-500',
  badge: 'bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-600',
  card: 'ring-2 ring-amber-400 dark:ring-amber-500 bg-amber-50/40 dark:bg-amber-900/10',
  sidebar : 'bg-gradient-to-t from-amber-400 from-0% via-white via-85% to-white dark:from-amber-900 dark:via-zinc-950 dark:to-zinc-950',
  name: 'text-amber-700 dark:text-amber-300',
  icons: 'text-black dark:text-white dark:hover:text-white hover:text-black',
};

/** Clé localStorage pour éviter de rejouer l'animation plusieurs fois dans le mois */
export function goldenTicketAnimationKey(userId: number, year: number, month: number): string {
  return `golden-ticket-shown:${userId}:${year}-${String(month).padStart(2, '0')}`;
}