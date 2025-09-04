import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Download, 
  Filter, 
  Search, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Eye,
  FileText,
  Table
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface DashboardData {
  organization_name: string;
  process_code: string;
  indicator_code: string;
  year: number;
  axe: string;
  enjeux: string;
  normes: string;
  criteres: string;
  processus: string;
  indicateur: string;
  unite: string;
  frequence: string;
  type: string;
  formule: string;
  janvier: number;
  fevrier: number;
  mars: number;
  avril: number;
  mai: number;
  juin: number;
  juillet: number;
  aout: number;
  septembre: number;
  octobre: number;
  novembre: number;
  decembre: number;
  valeur_cible: number;
  variation: number;
  performance: number;
  valeur_moyenne: number;
  last_updated: string;
}

interface FilterState {
  year: number;
  axe: string;
  processus: string;
  search: string;
}

export const DashboardTab: React.FC = () => {
  const { profile, impersonatedOrganization } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    year: new Date().getFullYear(),
    axe: 'all',
    processus: 'all',
    search: ''
  });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof DashboardData | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  const currentOrganization = impersonatedOrganization || profile?.organization_name;
  const isContributor = profile?.role === 'contributor';

  const months = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
  ];

  const monthLabels = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
  ];

  useEffect(() => {
    if (currentOrganization) {
      fetchDashboardData();
    }
  }, [currentOrganization, filters.year]);

  const fetchDashboardData = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      
      // First refresh the materialized view to ensure latest data
      await supabase.rpc('refresh_dashboard_performance_view');
      
      const { data, error } = await supabase
        .from('dashboard_performance_view')
        .select('*')
        .eq('organization_name', currentOrganization)
        .eq('year', filters.year)
        .order('process_code', { ascending: true })
        .order('indicator_code', { ascending: true });

      if (error) throw error;
      setDashboardData(data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erreur lors du chargement des données du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success('Données actualisées');
  };

  const handleSort = (key: keyof DashboardData) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const exportData = filteredAndSortedData.map(row => ({
        Axe: row.axe,
        Enjeux: row.enjeux,
        Normes: row.normes,
        Critères: row.criteres,
        'Code Processus': row.process_code,
        Indicateur: row.indicateur,
        Unité: row.unite,
        Fréquence: row.frequence,
        Type: row.type,
        Formule: row.formule,
        Janvier: row.janvier,
        Février: row.fevrier,
        Mars: row.mars,
        Avril: row.avril,
        Mai: row.mai,
        Juin: row.juin,
        Juillet: row.juillet,
        Août: row.aout,
        Septembre: row.septembre,
        Octobre: row.octobre,
        Novembre: row.novembre,
        Décembre: row.decembre,
        'Valeur Cible': row.valeur_cible,
        'Variation (%)': row.variation,
        'Performance (%)': row.performance
      }));

      // Create CSV content
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `dashboard_performance_${currentOrganization}_${filters.year}.csv`);
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

  // Filter and sort data
  const filteredAndSortedData = React.useMemo(() => {
    let filtered = dashboardData.filter(row => {
      const matchesAxe = filters.axe === 'all' || row.axe === filters.axe;
      const matchesProcessus = filters.processus === 'all' || row.process_code === filters.processus;
      const matchesSearch = !filters.search || 
        row.indicateur.toLowerCase().includes(filters.search.toLowerCase()) ||
        row.process_code.toLowerCase().includes(filters.search.toLowerCase()) ||
        row.processus.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesAxe && matchesProcessus && matchesSearch;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [dashboardData, filters, sortConfig]);

  const getPerformanceColor = (performance: number | null) => {
    if (performance === null || performance === undefined) return 'text-gray-500';
    if (performance >= 90) return 'text-green-600';
    if (performance >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (performance: number | null) => {
    if (performance === null || performance === undefined) return <AlertCircle className="h-4 w-4" />;
    if (performance >= 90) return <CheckCircle className="h-4 w-4" />;
    if (performance >= 70) return <Target className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const getVariationDisplay = (variation: number | null) => {
    if (variation === null || variation === undefined) return '-';
    const sign = variation >= 0 ? '+' : '';
    return `${sign}${variation.toFixed(1)}%`;
  };

  const getVariationColor = (variation: number | null) => {
    if (variation === null || variation === undefined) return 'text-gray-500';
    if (variation > 0) return 'text-green-600';
    if (variation < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getVariationIcon = (variation: number | null) => {
    if (variation === null || variation === undefined) return null;
    if (variation > 0) return <TrendingUp className="h-3 w-3" />;
    if (variation < 0) return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  // Get unique values for filters
  const uniqueAxes = [...new Set(dashboardData.map(row => row.axe))].filter(Boolean);
  const uniqueProcessus = [...new Set(dashboardData.map(row => row.processus))].filter(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Tableau de Bord Performance</h2>
              <p className="text-gray-600">Vue d'ensemble des indicateurs ESG - {currentOrganization}</p>
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
              <Calendar className="h-4 w-4 inline mr-1" />
              Année
            </label>
            <select
              value={filters.year}
              onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les axes</option>
              {uniqueAxes.map(axe => (
                <option key={axe} value={axe}>{axe}</option>
              ))}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les processus</option>
              {uniqueProcessus.map(processus => (
                <option key={processus} value={processus}>{processus}</option>
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
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {[
          {
            title: 'Total Indicateurs',
            value: filteredAndSortedData.length,
            icon: BarChart3,
            color: 'bg-blue-500'
          },
          {
            title: 'Performance Moyenne',
            value: `${(filteredAndSortedData.reduce((sum, row) => sum + (row.performance || 0), 0) / filteredAndSortedData.length || 0).toFixed(1)}%`,
            icon: Target,
            color: 'bg-green-500'
          },
          {
            title: 'Objectifs Atteints',
            value: filteredAndSortedData.filter(row => (row.performance || 0) >= 100).length,
            icon: CheckCircle,
            color: 'bg-emerald-500'
          },
          {
            title: 'Alertes',
            value: filteredAndSortedData.filter(row => (row.performance || 0) < 70).length,
            icon: AlertCircle,
            color: 'bg-red-500'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Dashboard Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Données de Performance {filters.year}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Table className="h-4 w-4" />
              {filteredAndSortedData.length} indicateurs
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { key: 'axe', label: 'Axe' },
                  { key: 'enjeux', label: 'Enjeux' },
                  { key: 'normes', label: 'Normes' },
                  { key: 'criteres', label: 'Critères' },
                  { key: 'process_code', label: 'Code Processus' },
                  { key: 'indicateur', label: 'Indicateur' },
                  { key: 'unite', label: 'Unité' },
                  { key: 'frequence', label: 'Fréquence' },
                  { key: 'type', label: 'Type' },
                  { key: 'formule', label: 'Formule' }
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key as keyof DashboardData)}
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
                    onClick={() => handleSort(months[index] as keyof DashboardData)}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    {month}
                  </th>
                ))}
                
                {[
                  { key: 'valeur_cible', label: 'Cible' },
                  { key: 'variation', label: 'Variation' },
                  { key: 'performance', label: 'Performance' }
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key as keyof DashboardData)}
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
                {filteredAndSortedData.map((row, index) => (
                  <motion.tr
                    key={`${row.process_code}-${row.indicator_code}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Core columns */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.axe === 'Environnement' ? 'bg-green-100 text-green-800' :
                        row.axe === 'Social' ? 'bg-blue-100 text-blue-800' :
                        row.axe === 'Gouvernance' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {row.axe}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={row.enjeux}>
                      {row.enjeux}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={row.normes}>
                      {row.normes}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={row.criteres}>
                      {row.criteres}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {row.process_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs" title={row.indicateur}>
                      <div className="font-medium truncate">{row.indicateur}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.unite || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.frequence || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.type || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.formule || '-'}</td>
                    
                    {/* Monthly values */}
                    {months.map((month) => (
                      <td key={month} className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        <span className={`font-medium ${
                          row[month as keyof DashboardData] ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {row[month as keyof DashboardData] ? 
                            Number(row[month as keyof DashboardData]).toLocaleString() : 
                            '-'
                          }
                        </span>
                      </td>
                    ))}
                    
                    {/* Target, Variation, Performance */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {row.valeur_cible ? row.valeur_cible.toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className={`flex items-center justify-center gap-1 ${getVariationColor(row.variation)}`}>
                        {getVariationIcon(row.variation)}
                        <span className="font-medium">{getVariationDisplay(row.variation)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className={`flex items-center justify-center gap-1 ${getPerformanceColor(row.performance)}`}>
                        {getPerformanceIcon(row.performance)}
                        <span className="font-bold">
                          {row.performance ? `${row.performance.toFixed(1)}%` : '-'}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredAndSortedData.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée trouvée</h3>
            <p className="text-gray-500">
              {filters.search ? 
                "Aucun indicateur ne correspond à votre recherche." :
                `Aucune donnée disponible pour l'année ${filters.year}.`
              }
            </p>
          </div>
        )}
      </motion.div>

      {/* Performance Summary */}
      {filteredAndSortedData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé de Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Environnement', 'Social', 'Gouvernance'].map(axe => {
              const axeData = filteredAndSortedData.filter(row => row.axe === axe);
              const avgPerformance = axeData.length > 0 ? 
                axeData.reduce((sum, row) => sum + (row.performance || 0), 0) / axeData.length : 0;
              
              return (
                <div key={axe} className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                    axe === 'Environnement' ? 'bg-green-100' :
                    axe === 'Social' ? 'bg-blue-100' :
                    'bg-purple-100'
                  }`}>
                    <span className={`text-2xl ${
                      axe === 'Environnement' ? 'text-green-600' :
                      axe === 'Social' ? 'text-blue-600' :
                      'text-purple-600'
                    }`}>
                      {axe === 'Environnement' ? '🌱' : axe === 'Social' ? '👥' : '⚖️'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900">{axe}</h4>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {avgPerformance.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">{axeData.length} indicateurs</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Read-only notice for contributors */}
      {isContributor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <Eye className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800">
              Mode consultation - Vous visualisez les données de performance en lecture seule
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};  