
export interface Indicator {
  name: string;
  criteria_name: string;
  description: string;
  unit: string;
  created_at?: string;
  updated_at?: string;
  type?: 'primaire' | 'calculé';
  axe?: 'Environnement' | 'Social' | 'Gouvernance';
  formule?: 'somme' | 'dernier_mois' | 'moyenne' | 'max' | 'min';
  frequence?: 'mensuelle' | 'trimestrielle' | 'annuelle';
}

export interface IndicatorFormData {
  name: string;
  criteria_name: string;
  description: string;
  unit: string;
  type: 'primaire' | 'calculé';
  axe: 'Environnement' | 'Social' | 'Gouvernance';
  formule: 'somme' | 'dernier_mois' | 'moyenne' | 'max' | 'min';
  frequence: 'mensuelle' | 'trimestrielle' | 'annuelle';
}