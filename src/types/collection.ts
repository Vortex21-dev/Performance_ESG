export interface CollectionPeriod {
  id: string;
  organization_name: string;
  year: number;
  period_type: 'month' | 'quarter' | 'year';
  period_number: number;
  start_date: string;
  end_date: string;
  status: 'open' | 'closed';
}

export interface IndicatorValue {
  id: string;
  period_id: string;
  organization_name: string;
  business_line_key?: string;
  subsidiary_key?: string;
  site_key?: string;
  process_code: string;
  indicator_code: string;
  value: number | null;
  status: 'draft' | 'submitted' | 'validated' | 'rejected';
  comment?: string;
  submitted_by?: string;
  submitted_at?: string;
  validated_by?: string;
  validated_at?: string;
}

export interface ValueHistory {
  id: string;
  indicator_value_id: string;
  old_value: number | null;
  new_value: number | null;
  changed_by: string;
  change_type: 'create' | 'update' | 'submit' | 'validate' | 'reject';
  comment?: string;
  created_at: string;
}