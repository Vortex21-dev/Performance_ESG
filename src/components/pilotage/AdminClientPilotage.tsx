// src/pages/AdminClientPilotage.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft, BarChart3, Building2, Factory, Layers, MapPin, ChevronRight,
  Search, Calendar, Download, Loader2, Home, ChevronDown, ChevronUp,
  List, LayoutGrid, FileText, HelpCircle, Globe, Building, AlertTriangle,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

type ViewType = 'overview' | 'business-lines' | 'subsidiaries' | 'sites' | 'indicators' | 'global';
type Entity = {
  type: 'business-line' | 'subsidiary' | 'site';
  name: string;
};

interface Organization {
  name: string;
  description?: string;
  city: string;
  country: string;
  logo_url?: string;
}

interface BusinessLine {
  name: string;
  location?: string;
  organization_name: string;
}

interface Subsidiary {
  name: string;
  business_line_name: string;
  organization_name: string;
}

interface Site {
  name: string;
  subsidiary_name?: string;
  business_line_name?: string;
  organization_name: string;
  address?: string;
}

interface ConsolidatedIndicatorValue {
  id: string;
  organization_name: string;
  business_line_name: string | null;
  subsidiary_name: string | null;
  indicator_code: string;
  year: number;
  site_names: string[];
  axe: string | null;
  enjeux: string | null;
  normes: string | null;
  critere: string | null;
  indicateur: string | null;
  definition: string | null;
  processus: string | null;
  processus_code: string | null;
  frequence: string | null;
  unite: string | null;
  type: string | null;
  formule: string | null;
  value: number | null;
  valeur_precedente: number | null;
  cible: number | null;
  variation: string | null;
  created_at: string;
  updated_at: string;
}

export const AdminClientPilotage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [view, setView] = useState<ViewType>('overview');
  const [entity, setEntity] = useState<Entity | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isComplex, setIsComplex] = useState(false);
  const [viewMode, setViewMode] = useState<'sites' | 'global'>('sites');
  const [expandedSections, setExpandedSections] = useState({
    businessLines: true,
    subsidiaries: true,
    sites: true
  });
  const [selectedBusinessLine, setSelectedBusinessLine] = useState<string | null>(null);
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<string | null>(null);
  const [consolidatedIndicators, setConsolidatedIndicators] = useState<ConsolidatedIndicatorValue[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthlyValues, setMonthlyValues] = useState<Record<string, Record<number, number | null>>>({});

  const orgName = profile?.organization_name;
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  useEffect(() => {
    if (!orgName) return;
    fetchOrganizationData();
  }, [orgName]);

  useEffect(() => {
    if (viewMode === 'global' && organization) {
      fetchConsolidatedIndicators();
    }
  }, [viewMode, organization, year]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('name', orgName)
        .single();
      if (orgError) throw orgError;
      setOrganization(orgData);

      const { data: businessLinesData } = await supabase
        .from('business_lines')
        .select('*')
        .eq('organization_name', orgName);
      setBusinessLines(businessLinesData || []);

      const { data: subsidiariesData } = await supabase
        .from('subsidiaries')
        .select('*')
        .eq('organization_name', orgName);
      setSubsidiaries(subsidiariesData || []);

      const { data: sitesData } = await supabase
        .from('sites')
        .select('*')
        .eq('organization_name', orgName);
      setSites(sitesData || []);

      setIsComplex((businessLinesData && businessLinesData.length > 0) || (subsidiariesData && subsidiariesData.length > 0));
    } catch (err: any) {
      console.error('Error fetching organization data:', err);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsolidatedIndicators = async () => {
    if (!organization) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consolidated_indicator_values')
        .select('*')
        .eq('organization_name', organization.name)
        .eq('year', year)
        .order('indicator_code');
      if (error) throw error;
      setConsolidatedIndicators(data || []);
    } catch (err) {
      console.error('Error fetching consolidated indicators:', err);
      toast.error('Erreur de chargement des indicateurs');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyValues = async (indicatorCode: string) => {
    if (!organization) return;
    const { data, error } = await supabase
      .from('indicator_values')
      .select('month, value')
      .eq('organization_name', organization.name)
      .eq('indicator_code', indicatorCode)
      .eq('year', year);

    if (error) {
      console.error('Erreur lors de la récupération des valeurs mensuelles:', error);
      return;
    }

    const valuesByMonth: Record<number, number | null> = {};
    for (let i = 1; i <= 12; i++) valuesByMonth[i] = null;
    data.forEach(({ month, value }) => {
      valuesByMonth[month] = value;
    });

    setMonthlyValues(prev => ({ ...prev, [indicatorCode]: valuesByMonth }));
  };

  const toggleRowExpansion = (indicatorCode: string) => {
    setExpandedRows(prev =>
      prev.includes(indicatorCode)
        ? prev.filter(code => code !== indicatorCode)
        : [...prev, indicatorCode]
    );
    if (!expandedRows.includes(indicatorCode)) {
      fetchMonthlyValues(indicatorCode);
    }
  };

  const filteredConsolidatedIndicators = consolidatedIndicators.filter(indicator => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      (indicator.indicateur && indicator.indicateur.toLowerCase().includes(searchLower)) ||
      indicator.indicator_code.toLowerCase().includes(searchLower) ||
      (indicator.definition && indicator.definition.toLowerCase().includes(searchLower))
    );
  });

  const renderOverview = () => (
    <div className="space-y-8">
      {/* ... (reste du code inchangé) ... */}
    </div>
  );

  const renderTable = () => (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      {/* ... (reste du code inchangé) ... */}
    </div>
  );

  const Card = ({ icon, title, count, onClick }: any) => (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow hover:shadow-lg cursor-pointer flex items-center justify-between transition"
    >
      <div>
        <div className="text-blue-600 mb-2">{icon}</div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-gray-500">{count} éléments</p>
      </div>
      <ChevronRight className="text-gray-400" />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center max-w-md text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-6"
          >
            <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent"></div>
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Chargement de votre organisation</h2>
          <p className="text-gray-400">Nous préparons votre espace de pilotage...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-x-hidden">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 -right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Header */}
        <header className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Tableau de bord</span>
            </button>
            
            {organization && (
              <div className="flex items-center space-x-3 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm">
                {organization.logo_url ? (
                  <img src={organization.logo_url} alt="Logo" className="w-8 h-8 object-contain rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white">
                    <Building2 className="w-4 h-4" />
                  </div>
                )}
                <span className="font-medium text-gray-200">{organization.name}</span>
              </div>
            )}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                Pilotage Organisationnel
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Naviguez à travers votre organisation et accédez aux tableaux de bord.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto relative"
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher une business line, filiale ou site..."
              className="block w-full pl-12 pr-4 py-3 border border-gray-700 rounded-xl bg-gray-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all duration-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </motion.div>
        </header>

        {view === 'overview' ? (
          <>
            <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg shadow-sm border border-gray-700 p-1 max-w-max mb-6">
              <button
                onClick={() => setViewMode('sites')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${viewMode === 'sites' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
                <span>Par Site</span>
              </button>
              <button
                onClick={() => setViewMode('global')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${viewMode === 'global' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Vue Globale</span>
              </button>
            </div>

            {viewMode === 'global' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-700 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-700 bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg mr-4">
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Vue Globale Consolidée</h2>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="pl-10 pr-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                      >
                        {years.map(y => (
                          <option key={y} value={y} className="bg-gray-800">{y}</option>
                        ))}
                      </select>
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />

                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                    </div>
                  ) : filteredConsolidatedIndicators.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Aucun indicateur trouvé</h3>
                      <p className="text-gray-400 max-w-md mx-auto">
                        {searchQuery
                          ? "Aucun indicateur ne correspond à votre recherche."
                          : `Aucun indicateur consolidé pour l'année ${year}.`}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Axe</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Enjeux</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Normes</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Critère</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Code</th>
                            <th className="px-7 py-4 text-left text-xs font-medium text-gray-400 uppercase">Indicateur</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Processus</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Fréquence</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Unité</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Formule</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Valeur {year - 1}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Valeur {year}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Cible</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Variation</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Performance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Sites</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Détails</th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                          {filteredConsolidatedIndicators.map((indicator) => {
                            const isExpanded = expandedRows.includes(indicator.indicator_code);

                            return (
                              <React.Fragment key={indicator.id}>
                                <tr className="hover:bg-gray-700/50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{indicator.axe || '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{indicator.enjeux || '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{indicator.normes || '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{indicator.critere || '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-400">{indicator.indicator_code}</td>
                                  <td className="px-7 py-4 text-sm">
                                    <div className="font-semibold text-white">{indicator.indicateur || indicator.indicator_code}</div>
                                    {indicator.definition && <p className="text-xs text-gray-400 mt-1 max-w-xs truncate">{indicator.definition}</p>}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{indicator.processus || '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{indicator.frequence || 'Mensuelle'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{indicator.unite || '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{indicator.type || '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{indicator.formule || '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{indicator.valeur_precedente ?? '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{indicator.value ?? '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{indicator.cible ?? '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{indicator.variation ?? '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{indicator.variation ?? '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    <div className="flex flex-wrap gap-1">
                                      {indicator.site_names?.slice(0, 2).map((site, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded text-xs bg-blue-600/30 text-blue-300">{site}</span>
                                      ))}
                                      {indicator.site_names?.length > 2 && (
                                        <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">+{indicator.site_names.length - 2}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    <button
                                      onClick={() => toggleRowExpansion(indicator.indicator_code)}
                                      className="flex items-center space-x-1 text-purple-400 hover:text-purple-300"
                                    >
                                      <span>Détails</span>
                                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                  </td>
                                </tr>

                                {isExpanded && (
                                  <tr className="bg-gray-900/50">
                                    <td colSpan={18} className="p-4">
                                      <div className="overflow-x-auto bg-gray-800 rounded-lg p-4">
                                        <table className="min-w-full divide-y divide-gray-700">
                                          <thead className="bg-gray-700/50">
                                            <tr>
                                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Mois</th>
                                              {months.map(month => (
                                                <th key={month} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{month}</th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody className="bg-gray-800 divide-y divide-gray-700">
                                            <tr>
                                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">Valeur {year}</td>
                                              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                                <td key={month} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                  {monthlyValues[indicator.indicator_code]?.[month] ?? '-'}
                                                </td>
                                              ))}
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="mt-8 mx-6 mb-6 bg-gray-800 border-l-4 border-purple-500 p-4 rounded-lg">
                  <div className="flex">
                    <HelpCircle className="h-5 w-5 text-purple-400 flex-shrink-0" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-purple-300">Vue consolidée des indicateurs</h3>
                      <p className="mt-2 text-sm text-gray-400">
                        Cette vue présente les indicateurs consolidés au niveau organisationnel, agrégés selon la structure de votre organisation.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}; 