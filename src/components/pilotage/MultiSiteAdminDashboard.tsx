import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Factory,
  Layers,
  MapPin,
  ChevronRight,
  Search,
  Calendar,
  Download,
  Loader2,
  Home,
  ChevronDown,
  ChevronUp,
  List,
  LayoutGrid,
  FileText,
  HelpCircle,
  Globe,
  Building,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Filter,
  RefreshCw,
  Eye,
  Users,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

type ViewType = 'overview' | 'sites' | 'consolidated';

interface Organization {
  name: string;
  description?: string;
  city: string;
  country: string;
  logo_url?: string;
  organization_type: 'simple' | 'with_subsidiaries' | 'group';
}

interface Site {
  name: string;
  subsidiary_name?: string;
  business_line_name?: string;
  organization_name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
}

interface SitePerformance {
  site_name: string;
  organization_name: string;
  business_line_name?: string;
  subsidiary_name?: string;
  address?: string;
  city?: string;
  country?: string;
  total_indicators: number;
  filled_indicators: number;
  completion_rate: number;
  avg_performance: number;
  last_updated: string;
  active_processes: number;
}

interface ConsolidatedIndicator {
  id: string;
  organization_name: string;
  business_line_name?: string;
  subsidiary_name?: string;
  indicator_code: string;
  year: number;
  site_names: string[];
  axe?: string;
  issue_name?: string;
  standard_name?: string;
  criteria_name?: string;
  indicator_name?: string;
  process_name?: string;
  unit?: string;
  type?: string;
  formule?: string;
  frequence?: string;
  janvier?: number;
  fevrier?: number;
  mars?: number;
  avril?: number;
  mai?: number;
  juin?: number;
  juillet?: number;
  aout?: number;
  septembre?: number;
  octobre?: number;
  novembre?: number;
  decembre?: number;
  valeur_totale?: number;
  valeur_cible?: number;
  valeur_precedente?: number;
  variation?: number;
  performance?: number;
  last_updated: string;
}

export const MultiSiteAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile, impersonatedOrganization } = useAuthStore();
  
  const [view, setView] = useState<ViewType>('overview');
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [sitePerformances, setSitePerformances] = useState<SitePerformance[]>([]);
  const [consolidatedIndicators, setConsolidatedIndicators] = useState<ConsolidatedIndicator[]>([]);
  
  // Filters
  const [filters, setFilters] = useState({
    axe: 'all',
    processus: 'all',
    site: 'all',
    performance: 'all'
  });
  
  // UI states
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  const currentOrganization = impersonatedOrganization || profile?.organization_name;
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  const months = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
  ];
  const monthLabels = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
  ];

  useEffect(() => {
    if (!currentOrganization) return;
    fetchOrganizationData();
  }, [currentOrganization]);

  useEffect(() => {
    if (view === 'sites' && organization) {
      fetchSitePerformances();
    } else if (view === 'consolidated' && organization) {
      fetchConsolidatedIndicators();
    }
  }, [view, organization, year]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      
      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('name', currentOrganization)
        .single();
      
      if (orgError) throw orgError;
      setOrganization(orgData);

      // Fetch all sites
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('*')
        .eq('organization_name', currentOrganization)
        .order('name');
      
      if (sitesError) throw sitesError;
      setSites(sitesData || []);
      
    } catch (err: any) {
      console.error('Error fetching organization data:', err);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchSitePerformances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_performance_summary')
        .select('*')
        .eq('organization_name', currentOrganization)
        .order('completion_rate', { ascending: false });
      
      if (error) throw error;
      setSitePerformances(data || []);
    } catch (err) {
      console.error('Error fetching site performances:', err);
      toast.error('Erreur lors du chargement des performances des sites');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsolidatedIndicators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consolidated_indicator_values')
        .select('*')
        .eq('organization_name', currentOrganization)
        .eq('year', year)
        .order('indicator_code');
      
      if (error) throw error;
      setConsolidatedIndicators(data || []);
    } catch (err) {
      console.error('Error fetching consolidated indicators:', err);
      toast.error('Erreur lors du chargement des indicateurs consolidés');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Refresh materialized views if they exist
    try {
      await supabase.rpc('refresh_consolidated_views');
    } catch (err) {
      console.log('No materialized views to refresh');
    }
    
    // Refetch current view data
    if (view === 'sites') {
      await fetchSitePerformances();
    } else if (view === 'consolidated') {
      await fetchConsolidatedIndicators();
    } else {
      await fetchOrganizationData();
    }
    
    setRefreshing(false);
    toast.success('Données actualisées');
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      let exportData: any[] = [];
      let filename = '';

      if (view === 'sites') {
        exportData = filteredSitePerformances.map(site => ({
          'Site': site.site_name,
          'Filière': site.business_line_name || '-',
          'Filiale': site.subsidiary_name || '-',
          'Ville': site.city || '-',
          'Pays': site.country || '-',
          'Indicateurs Total': site.total_indicators,
          'Indicateurs Remplis': site.filled_indicators,
          'Taux Completion (%)': site.completion_rate,
          'Performance Moyenne (%)': site.avg_performance,
          'Processus Actifs': site.active_processes,
          'Dernière MAJ': new Date(site.last_updated).toLocaleDateString('fr-FR')
        }));
        filename = `sites_performance_${currentOrganization}_${year}`;
      } else if (view === 'consolidated') {
        exportData = filteredConsolidatedIndicators.map(indicator => ({
          'Axe': indicator.axe || '-',
          'Enjeux': indicator.issue_name || '-',
          'Normes': indicator.standard_name || '-',
          'Critères': indicator.criteria_name || '-',
          'Code Indicateur': indicator.indicator_code,
          'Indicateur': indicator.indicator_name || '-',
          'Unité': indicator.unit || '-',
          'Fréquence': indicator.frequence || '-',
          'Type': indicator.type || '-',
          'Formule': indicator.formule || '-',
          'Janvier': indicator.janvier || 0,
          'Février': indicator.fevrier || 0,
          'Mars': indicator.mars || 0,
          'Avril': indicator.avril || 0,
          'Mai': indicator.mai || 0,
          'Juin': indicator.juin || 0,
          'Juillet': indicator.juillet || 0,
          'Août': indicator.aout || 0,
          'Septembre': indicator.septembre || 0,
          'Octobre': indicator.octobre || 0,
          'Novembre': indicator.novembre || 0,
          'Décembre': indicator.decembre || 0,
          'Valeur Cible': indicator.valeur_cible || '-',
          'Variation (%)': indicator.variation || '-',
          'Performance (%)': indicator.performance || '-',
          'Sites': indicator.site_names?.join(', ') || '-'
        }));
        filename = `consolidated_indicators_${currentOrganization}_${year}`;
      }

      // Create CSV content
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => `"${row[header] || ''}"`).join(',')
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Export ${format.toUpperCase()} généré avec succès`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const handleSiteClick = (siteName: string) => {
    navigate(`/site/${siteName}`);
  };

  const toggleRowExpansion = (indicatorCode: string) => {
    setExpandedRows(prev =>
      prev.includes(indicatorCode)
        ? prev.filter(code => code !== indicatorCode)
        : [...prev, indicatorCode]
    );
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter data based on current filters
  const filteredSitePerformances = sitePerformances.filter(site => {
    const matchesSearch = !search || 
      site.site_name.toLowerCase().includes(search.toLowerCase()) ||
      (site.city && site.city.toLowerCase().includes(search.toLowerCase())) ||
      (site.business_line_name && site.business_line_name.toLowerCase().includes(search.toLowerCase()));
    
    const matchesSite = filters.site === 'all' || site.site_name === filters.site;
    const matchesPerformance = filters.performance === 'all' || 
      (filters.performance === 'high' && site.avg_performance >= 80) ||
      (filters.performance === 'medium' && site.avg_performance >= 60 && site.avg_performance < 80) ||
      (filters.performance === 'low' && site.avg_performance < 60);
    
    return matchesSearch && matchesSite && matchesPerformance;
  });

  const filteredConsolidatedIndicators = consolidatedIndicators.filter(indicator => {
    const matchesSearch = !search || 
      (indicator.indicator_name && indicator.indicator_name.toLowerCase().includes(search.toLowerCase())) ||
      indicator.indicator_code.toLowerCase().includes(search.toLowerCase()) ||
      (indicator.process_name && indicator.process_name.toLowerCase().includes(search.toLowerCase()));
    
    const matchesAxe = filters.axe === 'all' || indicator.axe === filters.axe;
    const matchesProcessus = filters.processus === 'all' || indicator.process_name === filters.processus;
    
    return matchesSearch && matchesAxe && matchesProcessus;
  });

  const getPerformanceColor = (performance: number | null) => {
    if (performance === null || performance === undefined) return 'text-gray-500';
    if (performance >= 90) return 'text-green-600';
    if (performance >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (performance: number | null) => {
    if (performance === null || performance === undefined) return <AlertTriangle className="h-4 w-4" />;
    if (performance >= 90) return <CheckCircle className="h-4 w-4" />;
    if (performance >= 70) return <Target className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Organization Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {organization?.logo_url ? (
              <img
                src={organization.logo_url}
                alt={`${organization.name} Logo`}
                className="h-16 w-16 object-contain rounded-lg border border-gray-200"
              />
            ) : (
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{organization?.name}</h1>
              <p className="text-gray-600 mt-1">{organization?.city}, {organization?.country}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {sites.length} sites
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Administration Multi-Sites
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600">Dernière mise à jour</div>
            <div className="text-lg font-semibold text-gray-900">
              {new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: 'Sites Actifs',
            value: sites.length,
            icon: Factory,
            color: 'bg-blue-500',
            change: '+2 ce mois'
          },
          {
            title: 'Taux Completion Moyen',
            value: `${(sitePerformances.reduce((sum, site) => sum + site.completion_rate, 0) / sitePerformances.length || 0).toFixed(1)}%`,
            icon: CheckCircle,
            color: 'bg-green-500',
            change: '+5.2% vs mois dernier'
          },
          {
            title: 'Performance Globale',
            value: `${(sitePerformances.reduce((sum, site) => sum + site.avg_performance, 0) / sitePerformances.length || 0).toFixed(1)}%`,
            icon: Target,
            color: 'bg-purple-500',
            change: '+1.8% vs mois dernier'
          },
          {
            title: 'Processus Actifs',
            value: sitePerformances.reduce((sum, site) => sum + site.active_processes, 0),
            icon: Settings,
            color: 'bg-amber-500',
            change: 'Stable'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.change}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => setView('sites')}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-8 text-white cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Tableaux de Bord par Site</h3>
              <p className="text-blue-100">Visualisez les performances individuelles de chaque site</p>
            </div>
            <Factory className="h-12 w-12 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => setView('consolidated')}
          className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-8 text-white cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Vue Consolidée Globale</h3>
              <p className="text-purple-100">Analyse consolidée de tous les indicateurs</p>
            </div>
            <Globe className="h-12 w-12 text-purple-200" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderSitesView = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500">
              <Factory className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Performance par Site</h2>
              <p className="text-gray-600">Vue détaillée des performances de chaque site</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="h-4 w-4 inline mr-1" />
              Recherche
            </label>
            <input
              type="text"
              placeholder="Nom du site, ville..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="h-4 w-4 inline mr-1" />
              Site
            </label>
            <select
              value={filters.site}
              onChange={(e) => setFilters(prev => ({ ...prev, site: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les sites</option>
              {sites.map(site => (
                <option key={site.name} value={site.name}>{site.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Target className="h-4 w-4 inline mr-1" />
              Performance
            </label>
            <select
              value={filters.performance}
              onChange={(e) => setFilters(prev => ({ ...prev, performance: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Toutes performances</option>
              <option value="high">Élevée (≥80%)</option>
              <option value="medium">Moyenne (60-80%)</option>
              <option value="low">Faible (&lt;60%)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Année
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSitePerformances.map((site, index) => (
          <motion.div
            key={site.site_name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleSiteClick(site.site_name)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Factory className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{site.site_name}</h3>
                  <p className="text-sm text-gray-600">{site.city}, {site.country}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completion</span>
                <span className={`font-semibold ${getCompletionColor(site.completion_rate)}`}>
                  {site.completion_rate.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Performance</span>
                <div className={`flex items-center gap-1 ${getPerformanceColor(site.avg_performance)}`}>
                  {getPerformanceIcon(site.avg_performance)}
                  <span className="font-semibold">
                    {site.avg_performance ? `${site.avg_performance.toFixed(1)}%` : '-'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Indicateurs</span>
                <span className="font-semibold text-gray-900">
                  {site.filled_indicators}/{site.total_indicators}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Processus</span>
                <span className="font-semibold text-gray-900">{site.active_processes}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progression</span>
                <span>{site.completion_rate.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    site.completion_rate >= 90 ? 'bg-green-500' :
                    site.completion_rate >= 70 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${site.completion_rate}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredSitePerformances.length === 0 && (
        <div className="text-center py-12">
          <Factory className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun site trouvé</h3>
          <p className="text-gray-500">
            {search ? 
              "Aucun site ne correspond à votre recherche." :
              "Aucun site configuré pour cette organisation."
            }
          </p>
        </div>
      )}
    </motion.div>
  );

  const renderConsolidatedView = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-500">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Vue Consolidée Globale</h2>
              <p className="text-gray-600">Indicateurs consolidés de tous les sites - {year}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Année
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="h-4 w-4 inline mr-1" />
              Axe ESG
            </label>
            <select
              value={filters.axe}
              onChange={(e) => setFilters(prev => ({ ...prev, axe: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">Tous les axes</option>
              <option value="Environnement">Environnement</option>
              <option value="Social">Social</option>
              <option value="Gouvernance">Gouvernance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="h-4 w-4 inline mr-1" />
              Processus
            </label>
            <select
              value={filters.processus}
              onChange={(e) => setFilters(prev => ({ ...prev, processus: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">Tous les processus</option>
              {[...new Set(consolidatedIndicators.map(i => i.process_name).filter(Boolean))].map(process => (
                <option key={process} value={process}>{process}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="h-4 w-4 inline mr-1" />
              Recherche
            </label>
            <input
              type="text"
              placeholder="Rechercher un indicateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Consolidated Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Indicateurs Consolidés {year}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BarChart3 className="h-4 w-4" />
              {filteredConsolidatedIndicators.length} indicateurs
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { key: 'axe', label: 'Axe' },
                  { key: 'issue_name', label: 'Enjeux' },
                  { key: 'standard_name', label: 'Normes' },
                  { key: 'criteria_name', label: 'Critères' },
                  { key: 'indicator_code', label: 'Code' },
                  { key: 'indicator_name', label: 'Indicateur' },
                  { key: 'unit', label: 'Unité' },
                  { key: 'frequence', label: 'Fréquence' },
                  { key: 'type', label: 'Type' },
                  { key: 'formule', label: 'Formule' }
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      {sortConfig.key === key && (
                        sortConfig.direction === 'asc' ? 
                        <TrendingUp className="h-3 w-3" /> : 
                        <TrendingDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                ))}
                
                {/* Monthly columns */}
                {monthLabels.map((month, index) => (
                  <th
                    key={month}
                    onClick={() => handleSort(months[index])}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    {month}
                  </th>
                ))}
                
                {[
                  { key: 'valeur_cible', label: 'Cible' },
                  { key: 'variation', label: 'Variation' },
                  { key: 'performance', label: 'Performance' },
                  { key: 'site_names', label: 'Sites' }
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      {label}
                      {sortConfig.key === key && (
                        sortConfig.direction === 'asc' ? 
                        <TrendingUp className="h-3 w-3" /> : 
                        <TrendingDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {filteredConsolidatedIndicators.map((indicator, index) => (
                  <React.Fragment key={indicator.indicator_code}>
                    <motion.tr
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Core columns */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          indicator.axe === 'Environnement' ? 'bg-green-100 text-green-800' :
                          indicator.axe === 'Social' ? 'bg-blue-100 text-blue-800' :
                          indicator.axe === 'Gouvernance' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {indicator.axe || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={indicator.issue_name}>
                        {indicator.issue_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={indicator.standard_name}>
                        {indicator.standard_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={indicator.criteria_name}>
                        {indicator.criteria_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {indicator.indicator_code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs" title={indicator.indicator_name}>
                        <div className="font-medium truncate">{indicator.indicator_name || indicator.indicator_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{indicator.unit || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{indicator.frequence || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{indicator.type || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{indicator.formule || '-'}</td>
                      
                      {/* Monthly values */}
                      {months.map((month) => (
                        <td key={month} className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          <span className={`font-medium ${
                            indicator[month as keyof ConsolidatedIndicator] ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {indicator[month as keyof ConsolidatedIndicator] ? 
                              Number(indicator[month as keyof ConsolidatedIndicator]).toLocaleString() : 
                              '-'
                            }
                          </span>
                        </td>
                      ))}
                      
                      {/* Target, Variation, Performance */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {indicator.valeur_cible ? indicator.valeur_cible.toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className={`flex items-center justify-center gap-1 ${
                          indicator.variation && indicator.variation > 0 ? 'text-green-600' :
                          indicator.variation && indicator.variation < 0 ? 'text-red-600' :
                          'text-gray-500'
                        }`}>
                          {indicator.variation && indicator.variation > 0 && <TrendingUp className="h-3 w-3" />}
                          {indicator.variation && indicator.variation < 0 && <TrendingDown className="h-3 w-3" />}
                          <span className="font-medium">
                            {indicator.variation ? `${indicator.variation > 0 ? '+' : ''}${indicator.variation.toFixed(1)}%` : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className={`flex items-center justify-center gap-1 ${getPerformanceColor(indicator.performance)}`}>
                          {getPerformanceIcon(indicator.performance)}
                          <span className="font-bold">
                            {indicator.performance ? `${indicator.performance.toFixed(1)}%` : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {indicator.site_names?.slice(0, 2).map((site, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {site}
                            </span>
                          ))}
                          {indicator.site_names && indicator.site_names.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                              +{indicator.site_names.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  </React.Fragment>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredConsolidatedIndicators.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée consolidée</h3>
            <p className="text-gray-500">
              {search ? 
                "Aucun indicateur ne correspond à votre recherche." :
                `Aucune donnée consolidée disponible pour l'année ${year}.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Consolidation Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-1">Méthodes de Consolidation</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Somme :</strong> Addition de toutes les valeurs mensuelles de tous les sites</p>
              <p><strong>Dernier mois :</strong> Valeur du mois le plus récent uniquement</p>
              <p><strong>Moyenne :</strong> Moyenne arithmétique des valeurs de tous les sites</p>
              <p><strong>Max/Min :</strong> Valeur maximale ou minimale parmi tous les sites</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading && view === 'overview') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de l'administration multi-sites...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        {/* Navigation Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/enterprise/dashboard')}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Administration Multi-Sites</h1>
                <p className="text-gray-600 mt-1">Pilotage centralisé des performances ESG</p>
              </div>
            </div>

            {/* View Selector */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('overview')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  view === 'overview' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Vue d'ensemble</span>
              </button>
              <button
                onClick={() => setView('sites')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  view === 'sites' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Factory className="w-4 h-4" />
                <span>Par Site</span>
              </button>
              <button
                onClick={() => setView('consolidated')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  view === 'consolidated' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Consolidée</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'overview' && renderOverview()}
            {view === 'sites' && renderSitesView()}
            {view === 'consolidated' && renderConsolidatedView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};