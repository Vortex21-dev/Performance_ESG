export interface OrganizationESGData {
  organization_name: string;
  sector?: {
    sector_name: string;
    subsector_name?: string;
  };
  standards: {
    codes: string[];
    names: string[];
  };
  issues: {
    codes: string[];
    names: string[];
  };
  criteria: {
    codes: string[];
    names: string[];
  };
  indicators: {
    codes: string[];
    names: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface OrganizationSector {
  organization_name: string;
  sector_name: string;
  subsector_name?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationStandards {
  organization_name: string;
  standard_codes: string[];
  created_at: string;
  updated_at: string;
}

export interface OrganizationIssues {
  organization_name: string;
  issue_codes: string[];
  created_at: string;
  updated_at: string;
}

export interface OrganizationCriteria {
  organization_name: string;
  criteria_codes: string[];
  created_at: string;
  updated_at: string;
}

export interface OrganizationIndicators {
  organization_name: string;
  indicator_codes: string[];
  created_at: string;
  updated_at: string;
}