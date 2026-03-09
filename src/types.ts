export type Role = 'admin' | 'volunteer' | 'civic_service' | 'beneficiary' | 'adherent';

export interface User {
  id: number;
  email: string;
  lastname: string;
  firstname: string;
  role: Role;
  dob: string;
  address: string;
}

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
