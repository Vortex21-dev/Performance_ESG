export type UserRole = 'admin' | 'enterprise' | 'contributor' | 'validator';

export interface User {
  email: string;
  nom: string;
  prenom: string;
  fonction: string;
  acces_pilotage?: string;
  acces_evaluation?: string;
  acces_reporting?: string;
  langue?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  numero?: string;
  photo_profil?: string;
  est_bloque: boolean;
  titre?: string;
  entreprise?: string;
  role?: UserRole;
  processes?: string[];
  organization_level?: 'subsidiary' | 'business_line' | 'organization';
  organization_name?: string;
  business_line_name?: string;
  subsidiary_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  email: string;
  role: UserRole;
  organization_level?: 'organization' | 'business_line' | 'subsidiary' | 'site';
  organization_name?: string;
  business_line_name?: string;
  subsidiary_name?: string;
  site_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthError {
  message: string;
}