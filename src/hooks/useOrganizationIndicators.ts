import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface OrganizationESGData {
  sector?: {
    sector_name: string;
    subsector_name?: string;
  };
  standards: string[];
  issues: string[];
  criteria: string[];
  indicators: string[];
}

export function useOrganizationESGData() {
  const [data, setData] = useState<OrganizationESGData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, impersonatedOrganization } = useAuthStore();

  /**
   * Récupère toutes les données ESG d'une organisation donnée
   */
  const fetchESGData = async (organizationName?: string) => {
    if (!organizationName) return;

    try {
      setLoading(true);
      setError(null);

      /* ---------- Secteur / Sous-secteur ---------- */
      const { data: sectorData } = await supabase
        .from('organization_sectors')
        .select('sector_name, subsector_name')
        .eq('organization_name', organizationName)
        .maybeSingle();

      /* ---------- Normes ---------- */
      const { data: standardsData } = await supabase
        .from('organization_standards')
        .select('standard_codes')
        .eq('organization_name', organizationName)
        .maybeSingle();

      let standardNames: string[] = [];
      if (standardsData?.standard_codes?.length) {
        const { data: standards } = await supabase
          .from('standards')
          .select('code, name')
          .in('code', standardsData.standard_codes);
        standardNames = standards?.map(s => s.name) || [];
      }

      /* ---------- Enjeux ---------- */
      const { data: issuesData } = await supabase
        .from('organization_issues')
        .select('issue_codes')
        .eq('organization_name', organizationName)
        .maybeSingle();

      let issueNames: string[] = [];
      if (issuesData?.issue_codes?.length) {
        const { data: issues } = await supabase
          .from('issues')
          .select('code, name')
          .in('code', issuesData.issue_codes);
        issueNames = issues?.map(i => i.name) || [];
      }

      /* ---------- Critères ---------- */
      const { data: criteriaData } = await supabase
        .from('organization_criteria')
        .select('criteria_codes')
        .eq('organization_name', organizationName)
        .maybeSingle();

      let criteriaNames: string[] = [];
      if (criteriaData?.criteria_codes?.length) {
        const { data: criteria } = await supabase
          .from('criteria')
          .select('code, name')
          .in('code', criteriaData.criteria_codes);
        criteriaNames = criteria?.map(c => c.name) || [];
      }

      /* ---------- Indicateurs ---------- */
      const { data: indicatorsData } = await supabase
        .from('organization_indicators')
        .select('indicator_codes')
        .eq('organization_name', organizationName)
        .maybeSingle();

      let indicatorNames: string[] = [];
      if (indicatorsData?.indicator_codes?.length) {
        const { data: indicators } = await supabase
          .from('indicators')
          .select('code, name')
          .in('code', indicatorsData.indicator_codes);
        indicatorNames = indicators?.map(i => i.name) || [];
      }

      setData({
        sector: sectorData || undefined,
        standards: standardNames,
        issues: issueNames,
        criteria: criteriaNames,
        indicators: indicatorNames,
      });
    } catch (err) {
      console.error('Error fetching ESG data:', err);
      setError('Erreur lors du chargement des données ESG');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sauvegarde (upsert) toutes les données ESG pour une organisation
   */
  const saveESGData = async (
    organizationName: string,
    esgData: {
      selectedSector?: string;
      selectedSubsector?: string;
      selectedStandards: string[];
      selectedIssues: string[];
      selectedCriteria: string[];
      selectedIndicators: string[];
    }
  ) => {
    try {
      /* ----- Secteur / Sous-secteur ----- */
      if (esgData.selectedSector) {
        await supabase
          .from('organization_sectors')
          .upsert({
            organization_name: organizationName,
            sector_name: esgData.selectedSector,
            subsector_name: esgData.selectedSubsector || null,
          });
      }

      /* ----- Normes → codes ----- */
      if (esgData.selectedStandards.length) {
        const { data: standardsData } = await supabase
          .from('standards')
          .select('code')
          .in('name', esgData.selectedStandards);
        const codes = standardsData?.map(s => s.code) || [];
        await supabase
          .from('organization_standards')
          .upsert({ organization_name: organizationName, standard_codes: codes });
      }

      /* ----- Enjeux → codes ----- */
      if (esgData.selectedIssues.length) {
        const { data: issuesData } = await supabase
          .from('issues')
          .select('code')
          .in('name', esgData.selectedIssues);
        const codes = issuesData?.map(i => i.code) || [];
        await supabase
          .from('organization_issues')
          .upsert({ organization_name: organizationName, issue_codes: codes });
      }

      /* ----- Critères → codes ----- */
      if (esgData.selectedCriteria.length) {
        const { data: criteriaData } = await supabase
          .from('criteria')
          .select('code')
          .in('name', esgData.selectedCriteria);
        const codes = criteriaData?.map(c => c.code) || [];
        await supabase
          .from('organization_criteria')
          .upsert({ organization_name: organizationName, criteria_codes: codes });
      }

      /* ----- Indicateurs → codes ----- */
      if (esgData.selectedIndicators.length) {
        const { data: indicatorsData } = await supabase
          .from('indicators')
          .select('code')
          .in('name', esgData.selectedIndicators);
        const codes = indicatorsData?.map(i => i.code) || [];
        await supabase
          .from('organization_indicators')
          .upsert({ organization_name: organizationName, indicator_codes: codes });
      }

      return true;
    } catch (error) {
      console.error('Error saving ESG data:', error);
      throw error;
    }
  };

  /**
   * Re-fetch automatique quand l'organisation change
   */
  useEffect(() => {
    const org = impersonatedOrganization || profile?.organization_name;
    if (org) fetchESGData(org);
  }, [profile?.organization_name, impersonatedOrganization]);

  return {
    data,
    loading,
    error,
    fetchESGData,
    saveESGData,
    refetch: () => {
      const org = impersonatedOrganization || profile?.organization_name;
      if (org) fetchESGData(org);
    },
  };
}
