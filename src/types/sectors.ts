export interface Sector {
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Subsector {
  name: string;
  sector_name: string;
  created_at: string;
  updated_at: string;
}

export interface SectorFormData {
  name: string;
}

export interface SubsectorFormData {
  name: string;
  sector_name: string;
}