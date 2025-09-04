import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Target,
  Zap,
  Droplets,
  Leaf,
  Users,
  Building2,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Pie
} from 'recharts';
import toast from 'react-hot-toast';

interface IndicatorData {
  organization_name: string;
  business_line_name?: string;
  subsidiary_name?: string;
  indicator_code: string;
  indicator_name: string;
  unit: string;
  axe: string;
  process_name: string;
  year: number;
  month: number;
  value: number;
  target_value?: number;
  previous_year_value?: number;
}

interface ChartData {
  name: string;
  value: number;
  target?: number;
  previous?: number;
  color?: string;
}

interface ESGScoreData {
  axe: string;
  score: number;
  target: number;
  indicators: number;
}

const COLORS = {
  primary: '#10B981',
  secondary: '#3B82F6', 
  accent: '#8B5CF6',
  warning: '#F59E0B',
  danger: '#EF4444',
  success: '#059669',
  info: '#0EA5E9'
};

const CHART_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', 
  '#EF4444', '#06B6D4', '#84CC16', '#F97316'
];

export const VisualizationDashboard: React.FC = () => {
  const { profile, impersonatedOrganization } = useAuthStore();
  
  const [data, setData] = useState<IndicatorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedAxe, setSelectedAxe] = useState('all');
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'comparison' | 'performance'>('overview');

  const currentOrganization = impersonatedOrganization || profile?.organization_name;
  const isContributor = profile?.role === 'contributor';

  useEffect(() => {
    if (currentOrganization) {
      fetchVisualizationData();
    }
  }, [currentOrganization, selectedYear]);

  const fetchVisualizationData = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      
      // Fetch consolidated indicator values with metadata
      const { data: indicatorData, error } = await supabase
        .from('consolidated_indicator_values')
        .select(`
          organization_name,
          business_line_name,
          subsidiary_name,
          indicator_code,
          indicateur:indicator_name,
          unite:unit,
          axe,
          processus:process_name,
          year,
          janvier, fevrier, mars, avril, mai, juin,
          juillet, aout, septembre, octobre, novembre, decembre,
          valeur_cible:target_value,
          valeur_precedente:previous_year_value
        `)
        .eq('organization_name', currentOrganization)
        .eq('year', selectedYear);

      if (error) throw error;

      // Transform data for visualization
      const transformedData: IndicatorData[] = [];
      
      indicatorData?.forEach(row => {
        const months = [
          'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
          'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
        ];
        
        months.forEach((month, index) => {
          const value = row[month];
          if (value !== null && value !== undefined) {
            transformedData.push({
              organization_name: row.organization_name,
              business_line_name: row.business_line_name,
              subsidiary_name: row.subsidiary_name,
              indicator_code: row.indicator_code,
              indicator_name: row.indicator_name || row.indicator_code,
              unit: row.unit || '',
              axe: row.axe || 'Non défini',
              process_name: row.process_name || 'Non défini',
              year: row.year,
              month: index + 1,
              value: Number(value),
              target_value: row.target_value ? Number(row.target_value) : undefined,
              previous_year_value: row.previous_year_value ? Number(row.previous_year_value) : undefined
            });
          }
        });
      });

      setData(transformedData);
    } catch (error) {
      console.error('Error fetching visualization data:', error);
      toast.error('Erreur lors du chargement des données de visualisation');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVisualizationData();
    setRefreshing(false);
    toast.success('Données actualisées');
  };

  // Filter data based on selected filters
  const filteredData = data.filter(item => {
    if (selectedAxe !== 'all' && item.axe !== selectedAxe) return false;
    return true;
  });

  // Prepare data for different chart types
  const getESGScoreData = (): ESGScoreData[] => {
    const axes = ['Environnement', 'Social', 'Gouvernance'];
    
    return axes.map(axe => {
      const axeData = filteredData.filter(item => item.axe === axe);
      const totalValue = axeData.reduce((sum, item) => sum + item.value, 0);
      const totalTarget = axeData.reduce((sum, item) => sum + (item.target_value || 0), 0);
      const score = totalTarget > 0 ? (totalValue / totalTarget) * 100 : 0;
      
      return {
        axe,
        score: Math.round(score * 10) / 10,
        target: 100,
        indicators: axeData.length
      };
    });
  };

  const getMonthlyTrendData = () => {
    const months = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
    ];
    
    return months.map((month, index) => {
      const monthData = filteredData.filter(item => item.month === index + 1);
      const envData = monthData.filter(item => item.axe === 'Environnement');
      const socData = monthData.filter(item => item.axe === 'Social');
      const gouvData = monthData.filter(item => item.axe === 'Gouvernance');
      
      return {
        month,
        Environnement: envData.reduce((sum, item) => sum + item.value, 0),
        Social: socData.reduce((sum, item) => sum + item.value, 0),
        Gouvernance: gouvData.reduce((sum, item) => sum + item.value, 0)
      };
    });
  };

  const getTopIndicatorsData = () => {
    const indicatorGroups = filteredData.reduce((acc, item) => {
      const key = item.indicator_code;
      if (!acc[key]) {
        acc[key] = {
          name: item.indicator_name,
          code: item.indicator_code,
          unit: item.unit,
          axe: item.axe,
          totalValue: 0,
          targetValue: item.target_value || 0,
          count: 0
        };
      }
      acc[key].totalValue += item.value;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(indicatorGroups)
      .map((group: any) => ({
        name: group.name,
        value: Math.round(group.totalValue),
        target: group.targetValue,
        performance: group.targetValue > 0 ? Math.round((group.totalValue / group.targetValue) * 100) : 0,
        axe: group.axe
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  const getPerformanceDistribution = () => {
    const ranges = [
      { name: 'Excellent (≥90%)', min: 90, max: 100, color: COLORS.success },
      { name: 'Bon (70-89%)', min: 70, max: 89, color: COLORS.primary },
      { name: 'Moyen (50-69%)', min: 50, max: 69, color: COLORS.warning },
      { name: 'Faible (<50%)', min: 0, max: 49, color: COLORS.danger }
    ];

    return ranges.map(range => {
      const count = filteredData.filter(item => {
        if (!item.target_value) return false;
        const performance = (item.value / item.target_value) * 100;
        return performance >= range.min && performance <= range.max;
      }).length;

      return {
        name: range.name,
        value: count,
        color: range.color
      };
    });
  };

  const getAxeIcon = (axe: string) => {
    switch (axe) {
      case 'Environnement': return <Leaf className="h-5 w-5" />;
      case 'Social': return <Users className="h-5 w-5" />;
      case 'Gouvernance': return <Building2 className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getAxeColor = (axe: string) => {
    switch (axe) {
      case 'Environnement': return 'text-green-600';
      case 'Social': return 'text-blue-600';
      case 'Gouvernance': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const renderOverviewCharts = () => {
    const esgScores = getESGScoreData();
    const monthlyTrends = getMonthlyTrendData();
    const topIndicators = getTopIndicatorsData();
    const performanceDistribution = getPerformanceDistribution();

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ESG Scores Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scores ESG par Pilier</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={esgScores}>
              <PolarGrid />
              <PolarAngleAxis dataKey="axe" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Score"
                dataKey="score"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Radar
                name="Cible"
                dataKey="target"
                stroke={COLORS.warning}
                fill="transparent"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution Mensuelle par Axe</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [value.toLocaleString(), '']}
                labelFormatter={(label) => `Mois: ${label}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="Environnement"
                stackId="1"
                stroke={COLORS.success}
                fill={COLORS.success}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="Social"
                stackId="1"
                stroke={COLORS.secondary}
                fill={COLORS.secondary}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="Gouvernance"
                stackId="1"
                stroke={COLORS.accent}
                fill={COLORS.accent}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Indicateurs</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topIndicators} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  value.toLocaleString(), 
                  name === 'value' ? 'Valeur' : name === 'target' ? 'Cible' : name
                ]}
              />
              <Legend />
              <Bar dataKey="value" fill={COLORS.primary} name="Valeur Actuelle" />
              <Bar dataKey="target" fill={COLORS.warning} name="Valeur Cible" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Performance Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution des Performances</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={performanceDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
              >
                {performanceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    );
  };

  const renderTrendsCharts = () => {
    const monthlyTrends = getMonthlyTrendData();
    
    // Calculate year-over-year comparison
    const yearOverYearData = filteredData
      .filter(item => item.previous_year_value)
      .map(item => ({
        name: item.indicator_name,
        current: item.value,
        previous: item.previous_year_value!,
        variation: ((item.value - item.previous_year_value!) / item.previous_year_value!) * 100,
        axe: item.axe
      }))
      .sort((a, b) => Math.abs(b.variation) - Math.abs(a.variation))
      .slice(0, 15);

    return (
      <div className="space-y-8">
        {/* Monthly Evolution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution Mensuelle Détaillée</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [value.toLocaleString(), '']}
                labelFormatter={(label) => `Mois: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Environnement"
                stroke={COLORS.success}
                strokeWidth={3}
                dot={{ fill: COLORS.success, strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Social"
                stroke={COLORS.secondary}
                strokeWidth={3}
                dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Gouvernance"
                stroke={COLORS.accent}
                strokeWidth={3}
                dot={{ fill: COLORS.accent, strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Year over Year Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparaison Année sur Année</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={yearOverYearData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  value.toLocaleString(), 
                  name === 'current' ? `${selectedYear}` : `${selectedYear - 1}`
                ]}
              />
              <Legend />
              <Bar dataKey="previous" fill={COLORS.info} name={`${selectedYear - 1}`} />
              <Bar dataKey="current" fill={COLORS.primary} name={`${selectedYear}`} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    );
  };

  const renderComparisonCharts = () => {
    const esgScores = getESGScoreData();
    
    // Process comparison data
    const processData = filteredData.reduce((acc, item) => {
      if (!acc[item.process_name]) {
        acc[item.process_name] = {
          name: item.process_name,
          totalValue: 0,
          count: 0,
          indicators: new Set()
        };
      }
      acc[item.process_name].totalValue += item.value;
      acc[item.process_name].count += 1;
      acc[item.process_name].indicators.add(item.indicator_code);
      return acc;
    }, {} as Record<string, any>);

    const processChartData = Object.values(processData)
      .map((process: any) => ({
        name: process.name,
        value: Math.round(process.totalValue),
        average: Math.round(process.totalValue / process.count),
        indicators: process.indicators.size
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return (
      <div className="space-y-8">
        {/* ESG Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparaison des Piliers ESG</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {esgScores.map((score, index) => (
              <div key={score.axe} className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                  score.axe === 'Environnement' ? 'bg-green-100' :
                  score.axe === 'Social' ? 'bg-blue-100' :
                  'bg-purple-100'
                }`}>
                  <div className={`${getAxeColor(score.axe)}`}>
                    {getAxeIcon(score.axe)}
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900">{score.axe}</h4>
                <p className="text-3xl font-bold text-gray-900 mt-2">{score.score}%</p>
                <p className="text-sm text-gray-600">{score.indicators} indicateurs</p>
                
                {/* Progress bar */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      score.score >= 90 ? 'bg-green-500' :
                      score.score >= 70 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(score.score, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={esgScores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="axe" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value: number) => [`${value}%`, 'Score']} />
              <Bar dataKey="score" fill={COLORS.primary} />
              <Bar dataKey="target" fill={COLORS.warning} fillOpacity={0.3} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Process Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance par Processus</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={processChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  value.toLocaleString(), 
                  name === 'value' ? 'Valeur Totale' : 
                  name === 'average' ? 'Moyenne' : 'Indicateurs'
                ]}
              />
              <Legend />
              <Bar dataKey="value" fill={COLORS.primary} name="Valeur Totale" />
              <Bar dataKey="average" fill={COLORS.accent} name="Moyenne" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    );
  };

  const renderPerformanceCharts = () => {
    const performanceDistribution = getPerformanceDistribution();
    
    // Calculate performance metrics
    const totalIndicators = filteredData.length;
    const indicatorsWithTargets = filteredData.filter(item => item.target_value).length;
    const averagePerformance = filteredData
      .filter(item => item.target_value)
      .reduce((sum, item) => sum + ((item.value / item.target_value!) * 100), 0) / indicatorsWithTargets || 0;

    return (
      <div className="space-y-8">
        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {[
            {
              title: 'Performance Moyenne',
              value: `${averagePerformance.toFixed(1)}%`,
              icon: Target,
              color: 'bg-blue-500',
              description: 'Moyenne de tous les indicateurs'
            },
            {
              title: 'Indicateurs Suivis',
              value: totalIndicators.toString(),
              icon: BarChart3,
              color: 'bg-green-500',
              description: 'Total des indicateurs collectés'
            },
            {
              title: 'Avec Objectifs',
              value: indicatorsWithTargets.toString(),
              icon: CheckCircle,
              color: 'bg-purple-500',
              description: 'Indicateurs avec cibles définies'
            },
            {
              title: 'Taux d\'Atteinte',
              value: `${((performanceDistribution.find(p => p.name.includes('Excellent'))?.value || 0) / totalIndicators * 100).toFixed(1)}%`,
              icon: TrendingUp,
              color: 'bg-amber-500',
              description: 'Indicateurs excellents (≥90%)'
            }
          ].map((metric, index) => (
            <div key={metric.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${metric.color}`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <p className="text-xs text-gray-500">{metric.description}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Performance Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des Niveaux de Performance</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={performanceDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Indicateurs']} />
              </RechartsPieChart>
            </ResponsiveContainer>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Légende</h4>
              {performanceDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const uniqueAxes = [...new Set(data.map(item => item.axe))];
  const years = [selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des visualisations...</p>
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
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
              <PieChart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Visualisations des Données</h2>
              <p className="text-gray-600">Analyse graphique des performances ESG - {currentOrganization}</p>
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
              onClick={() => toast.success('Export en cours de préparation')}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Année
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map(year => (
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
              value={selectedAxe}
              onChange={(e) => setSelectedAxe(e.target.value)}
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
              <Eye className="h-4 w-4 inline mr-1" />
              Vue
            </label>
            <select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="overview">Vue d'ensemble</option>
              <option value="trends">Tendances</option>
              <option value="comparison">Comparaisons</option>
              <option value="performance">Performance</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {selectedView === 'overview' && renderOverviewCharts()}
          {selectedView === 'trends' && renderTrendsCharts()}
          {selectedView === 'comparison' && renderComparisonCharts()}
          {selectedView === 'performance' && renderPerformanceCharts()}
        </motion.div>
      </AnimatePresence>

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
              Mode consultation - Visualisations en lecture seule pour l'analyse des performances
            </span>
          </div>
        </motion.div>
      )}

      {/* Data Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé des Données</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{data.length}</p>
            <p className="text-sm text-gray-600">Points de données</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{uniqueAxes.length}</p>
            <p className="text-sm text-gray-600">Axes ESG</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {[...new Set(data.map(item => item.indicator_code))].length}
            </p>
            <p className="text-sm text-gray-600">Indicateurs uniques</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">
              {[...new Set(data.map(item => item.process_name))].length}
            </p>
            <p className="text-sm text-gray-600">Processus actifs</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};