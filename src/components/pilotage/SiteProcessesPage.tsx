import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Factory, Layers, FileText, Loader2, AlertTriangle, MapPin, Building2, ChevronRight,
  BarChart3, Target, Settings, Users, LayoutGrid, List, Calendar, Search, ChevronUp, ChevronDown, HelpCircle,
  CheckCircle, TrendingUp, Eye
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface SiteGlobalIndicatorValue {
  id: string;
  site_name: string;
  year: number;
  code: string;
  axe_energetique: string | null;
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
  janvier: number | null;
  fevrier: number | null;
  mars: number | null;
  avril: number | null;
  mai: number | null;
  juin: number | null;
  juillet: number | null;
  aout: number | null;
  septembre: number | null;
  octobre: number | null;
  novembre: number | null;
  decembre: number | null;
}

interface Processus {
  code: string;
  name: string;
  description: string | null;
}

interface Site {
  name: string;
  address: string;
  city: string;
  country: string;
  business_line_name: string | null;
  subsidiary_name: string | null;
  organization_name: string;
}

const SiteProcessesPage: React.FC = () => {
  const navigate = useNavigate();
  const { siteName } = useParams<{ siteName: string }>();
  const { profile } = useAuthStore();
  const [site, setSite] = useState<Site | null>(null);
  const [processus, setProcessus] = useState<Processus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [siteUsers, setSiteUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'process' | 'global'>('global');
  const [siteGlobalIndicators, setSiteGlobalIndicators] = useState<SiteGlobalIndicatorValue[]>([]);
  const [isLoadingIndicators, setIsLoadingIndicators] = useState(false);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  useEffect(() => {
    if (siteName) {
      fetchSiteData();
    }
  }, [siteName]);

  useEffect(() => {
    if (site) {
      fetchSiteUsers();
    }
  }, [site]);

  useEffect(() => {
    if (siteUsers.length > 0) {
      fetchSiteProcessus();
    }
  }, [siteUsers]);

  useEffect(() => {
    if (viewMode === 'global' && siteName) {
      fetchSiteGlobalIndicators();
    }
  }, [viewMode, siteName, yearFilter]);

  const fetchSiteData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('name', siteName)
        .single();

      if (error) throw error;
      setSite(data);
    } catch (err: any) {
      setError('Erreur lors du chargement des données du site');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSiteUsers = async () => {
    try {
      if (!site?.organization_name) return;
      const { data } = await supabase
        .from('profiles')
        .select('email')
        .eq('organization_name', site.organization_name)
        .eq('site_name', siteName)
        .eq('role', 'contributeur');
      setSiteUsers(data?.map(user => user.email) || []);
    } catch {
      // silent
    }
  };

  const fetchSiteProcessus = async () => {
    try {
      if (siteUsers.length === 0) return;

      const { data: userProcessusData } = await supabase
        .from('user_processus')
        .select('processus_code')
        .in('email', siteUsers);

      if (!userProcessusData?.length) {
        setProcessus([]);
        return;
      }

      const codes = [...new Set(userProcessusData.map(u => u.processus_code))];
      const { data } = await supabase
        .from('processus')
        .select('*')
        .in('code', codes)
        .order('name');

      setProcessus(data || []);
    } catch {
      // silent
    }
  };

  const fetchSiteGlobalIndicators = async () => {
    if (!siteName) return;
    setIsLoadingIndicators(true);
    try {
      const { data: siteProcessesData } = await supabase
        .from('site_processes')
        .select('processus_code')
        .eq('site_name', siteName)
        .eq('is_active', true);

      if (!siteProcessesData?.length) {
        setSiteGlobalIndicators([]);
        return;
      }

      const codes = siteProcessesData.map(s => s.processus_code);
      const { data } = await supabase
        .from('site_global_indicator_values_simple')
        .select('*')
        .eq('site_name', siteName)
        .eq('year', yearFilter)
        .in('processus_code', codes)
        .order('code');

      setSiteGlobalIndicators(data || []);
    } finally {
      setIsLoadingIndicators(false);
    }
  };

  const handleProcessusClick = (processusCode: string) => {
    navigate(`/site/${siteName}/process/${processusCode}`);
  };

  const handleBack = () => {
    navigate('/admin-client-pilotage');
  };

  const toggleRowExpansion = (indicatorCode: string) => {
    setExpandedRows(prev =>
      prev.includes(indicatorCode)
        ? prev.filter(code => code !== indicatorCode)
        : [...prev, indicatorCode]
    );
  };

  const filteredIndicators = siteGlobalIndicators.filter(indicator => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      (indicator.indicateur && indicator.indicateur.toLowerCase().includes(searchLower)) ||
      indicator.code.toLowerCase().includes(searchLower) ||
      (indicator.definition && indicator.definition.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-8 flex items-center justify-center">
        <div className="bg-gray-800 p-6 rounded-xl">
          <AlertTriangle className="w-8 h-8 text-red-400 mb-4" />
          <p className="text-red-300">{error}</p>
          <button
            onClick={handleBack}
            className="mt-4 flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="bg-gray-800/30 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {site?.name}
                </h1>
                <p className="text-gray-400 text-sm">{site?.address}, {site?.city}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('process')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md ${viewMode === 'process' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
              >
                <List className="w-4 h-4" />
                <span>Processus</span>
              </button>
              <button
                onClick={() => setViewMode('global')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md ${viewMode === 'global' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Globale</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-2">
            {viewMode === 'process' ? 'Processus du site' : 'Indicateurs du site'}
          </h2>
          <p className="text-gray-400">
            {viewMode === 'process' ? "Sélectionnez un processus pour accéder à ses détails." : "Vue globale des indicateurs de performance."}
          </p>
        </motion.div>

        {viewMode === 'process' ? (
          processus.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processus.map((proc, index) => (
                <motion.div
                  key={`${proc.code}-${index}`}
                  whileHover={{ y: -4 }}
                  onClick={() => handleProcessusClick(proc.code)}
                  className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 cursor-pointer hover:border-purple-500 transition-all"
                >
                  <h3 className="text-lg font-bold mb-2">{proc.name}</h3>
                  {proc.description && <p className="text-sm text-gray-400 mb-4">{proc.description}</p>}
                  <div className="flex justify-between items-center">
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">{proc.code}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucun processus associé à ce site</p>
            </div>
          )
        ) : (
          <motion.div className="bg-gray-800/50 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="w-6 h-6 text-purple-400 mr-3" />
                  <h2 className="text-xl font-semibold">Indicateurs de performance</h2>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(parseInt(e.target.value))}
                    className="px-3 py-1 bg-gray-700 rounded"
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-1 bg-gray-700 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="p-6">
              {isLoadingIndicators ? (
                <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>
              ) : filteredIndicators.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Aucun indicateur trouvé</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Code</th>
                        <th className="px-4 py-2 text-left">Indicateur</th>
                        <th className="px-4 py-2 text-left">Processus</th>
                        <th className="px-4 py-2 text-left">Valeur</th>
                        <th className="px-4 py-2 text-left">Cible</th>
                        <th className="px-4 py-2 text-left">Variation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIndicators.map(indicator => (
                        <tr key={indicator.code} className="hover:bg-gray-700/50">
                          <td className="px-4 py-2 font-mono text-sm">{indicator.code}</td>
                          <td className="px-4 py-2">{indicator.indicateur}</td>
                          <td className="px-4 py-2">{indicator.processus}</td>
                          <td className="px-4 py-2 font-semibold">{indicator.value ?? '-'}</td>
                          <td className="px-4 py-2">{indicator.cible ?? '-'}</td>
                          <td className="px-4 py-2">{indicator.variation ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SiteProcessesPage;