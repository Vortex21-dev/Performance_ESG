export interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  description?: string;
  sites?: SiteInfo[];
}

export interface OrganizationInfo extends CompanyInfo {
  businessLines: BusinessLineInfo[];
}

export interface BusinessLineInfo extends CompanyInfo {
  subsidiaries: SubsidiaryInfo[];
}

export interface SubsidiaryInfo extends CompanyInfo {
  sites: SiteInfo[];
}

export interface SiteInfo extends Omit<CompanyInfo, 'website' | 'sites'> {}