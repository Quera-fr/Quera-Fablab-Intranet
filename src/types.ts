export type Role = 'admin' | 'volunteer' | 'civic_service' | 'beneficiary' | 'adherent';

export interface GoldenTicket {
  id: number;
  month: number;
  year: number;
  starts_at: string;
  ends_at: string;
}

export interface User {
  id: number;
  email: string;
  lastname: string;
  firstname: string;
  role: Role;
  dob: string;
  address: string;
  goldenTicket?: GoldenTicket | null;
  profile_picture_url?: string;
}

export interface ProfilePageProps {
  user: User;
  onUpdate: (user: User) => void;
}

export type UserUpdatePayload = Partial<User> & { password?: string };

export interface Activity {
  id: number;
  title: string;
  description: string;
  image_url: string;
  max_participants: number;
  deadline: string;
  status: 'pending' | 'approved';
  created_by: number;
  creator_name?: string;
}

export interface Participant {
  user_id: number;
  role_at_registration: string;
  firstname: string;
  lastname: string;
  role: Role;
  dob?: string;
  address?: string;
  goldenTicket?: GoldenTicket | null;
  profile_picture_url?: string;
}

export interface Session {
  id: number;
  type: 'homework_help' | 'activity' | 'room_booking';
  activity_id: number | null;
  start_time: string;
  end_time: string;
  title?: string;
  image_url?: string;
  description?: string;
  deadline?: string;
  status?: 'pending' | 'approved';
  max_participants?: number;
  participants: Participant[];
}

export interface QueraPointManager {
  date: string;
  user_id: number;
  firstname: string;
  lastname: string;
  role: string;
}

export interface QueraPointsBeneficiarySummary {
  user_id: number;
  firstname: string;
  lastname: string;
  points: number;
}

export interface QueraPointsSummary {
  date: string;
  manager_user_id: number | null;
  total: number;
  remaining: number;
  beneficiaries: QueraPointsBeneficiarySummary[];
}

export interface QueraPointsTotal {
  user_id: number;
  firstname: string;
  lastname: string;
  total_points: number;
}

export type ShopArticleStatus = 'active' | 'reserved' | 'validated';

export type ShopArticle = {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  points: number;
  status: ShopArticleStatus;
  reserved_by_user_id: number | null;
  reserved_at: string | null;
  reserved_firstname?: string;
  reserved_lastname?: string;
};

export interface PointsHistoryDatum {
  period_start: string;
  period_label: string;
  points: number;
  cumulative: number;
}

export interface PointsHistoryResponse {
  total_points: number;
  cumulative_series: PointsHistoryDatum[];
}

export interface PointsHistoryApiResponse {
  user_id: number;
  start_date: string;
  end_date: string;
  total_points: number;
  cumulative_series: PointsHistoryDatum[];
}
