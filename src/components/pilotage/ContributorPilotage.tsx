import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Search,
  Send,
  Edit3,
  Save,
  XCircle,
  Loader2,
  Download,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

interface IndicatorValue {
  id: string;
  organization_name: string;
  year: number;
  month: number;
  process_code: string;
  indicator_code: string;
  value: number | null;
  unit: string;
  status: 'draft' | 'submitted' | 'validated' | 'rejected';
  comment?: string;
}

interface Process {
  code: string;
  name: string;
  indicator_codes: string[];
}

interface Indicator {
  code: string;
  name: string;
  unit?: string;
}

interface OrganizationIndicator {
  indicator_code: string;
  indicator_name: string;
  unit?: string;
  process_code: string;
  process_name: string;
}

export const ContributorPilotage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, impersonatedOrganization } = useAuthStore();

  /* ----------  ÉTAT  ---------- */
  const [values, setValues] = useState<IndicatorValue[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [organizationIndicators, setOrganizationIndicators] = useState<OrganizationIndicator[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProcess, setFilterProcess] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProcess, setExpandedProcess] = useState<string | null>(null);
  const [selectedStatCard, setSelectedStatCard] = useState<string | null>(null);

  const currentOrganization = impersonatedOrganization || profile?.organization_name;

  /* ----------  HOOKS  ---------- */
  useEffect(() => {
    if (!profile || profile.role !== 'contributor') {
      navigate('/login');
      return;
    }
    fetchInitialData();
  }, [profile, navigate]);

  useEffect(() => {
    if (currentOrganization) {
      fetchValues(selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth, currentOrganization, organizationIndicators]);

  /* ----------  DATA DE BASE  ---------- */
  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchProcesses(), fetchOrganizationIndicators()]);
    setLoading(false);
  };

  const getMonthName = (m: number) =>
    ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][m - 1];

  const fetchProcesses = async () => {
    const { data } = await supabase.from('processes').select('*').order('name');
    setProcesses(data || []);
  };

  const fetchOrganizationIndicators = async () => {
    const { data: userProcesses } = await supabase
      .from('user_processes')
      .select('process_codes')
      .eq('email', profile?.email)
      .single();
    if (!userProcesses?.process_codes?.length) return;

    const { data: processDetails } = await supabase
      .from('processes')
      .select('code, name, indicator_codes')
      .in('code', userProcesses.process_codes);

    const indicatorCodes = new Set<string>();
    processDetails?.forEach(p => p.indicator_codes?.forEach((c: string) => indicatorCodes.add(c)));

    const { data: indicatorDetails } = await supabase
      .from('indicators')
      .select('*')
      .in('code', Array.from(indicatorCodes));

    const mapped: OrganizationIndicator[] = [];
    processDetails?.forEach(p => {
      p.indicator_codes?.forEach((ic: string) => {
        const ind = indicatorDetails?.find(i => i.code === ic);
        if (ind) mapped.push({ indicator_code: ind.code, indicator_name: ind.name, unit: ind.unit, process_code: p.code, process_name: p.name });
      });
    });

    setOrganizationIndicators(mapped);
    setIndicators(indicatorDetails || []);
  };

  /* ----------  VALEURS (avec entrées vides dynamiques)  ---------- */
  const fetchValues = async (year: number, month: number) => {
    if (!currentOrganization || !organizationIndicators.length) return;
    setLoading(true);

    const { data: userProcesses } = await supabase
      .from('user_processes')
      .select('process_codes')
      .eq('email', profile?.email)
      .single();

    const { data } = await supabase
      .from('indicator_values')
      .select('*')
      .eq('organization_name', currentOrganization)
      .eq('year', year)
      .eq('month', month)
      .in('process_code', userProcesses?.process_codes || []);

    // Fusionner les données existantes avec les “slots” vides
    const enriched: IndicatorValue[] = organizationIndicators.map(orgInd => {
      const existing = (data || []).find(
        v =>
          v.indicator_code === orgInd.indicator_code &&
          v.process_code === orgInd.process_code
      );
      if (existing) return existing;

      // Création d’un placeholder local
      return {
        id: `empty-${orgInd.process_code}-${orgInd.indicator_code}-${year}-${month}`,
        organization_name: currentOrganization,
        year,
        month,
        process_code: orgInd.process_code,
        indicator_code: orgInd.indicator_code,
        unit: orgInd.unit || '',
        value: null,
        status: 'draft',
      };
    });

    setValues(enriched);
    setLoading(false);
  };

  /* ----------  SAISIE / INSERT / UPDATE  ---------- */
  const handleValueChange = async (value: IndicatorValue, newValueStr: string) => {
    const newValue = newValueStr ? parseFloat(newValueStr) : null;
    if (newValue !== null && isNaN(newValue)) {
      toast.error('Veuillez entrer un nombre valide');
      return;
    }

    try {
      // 1) Premier enregistrement : INSERT
      if (value.id.startsWith('empty-')) {
        const { data: inserted, error } = await supabase
          .from('indicator_values')
          .insert({
            organization_name: currentOrganization,
            year: selectedYear,
            month: selectedMonth,
            process_code: value.process_code,
            indicator_code: value.indicator_code,
            value: newValue,
            status: 'draft',
          })
          .select()
          .single();
        if (error) throw error;

        setValues(prev => [...prev.filter(v => v.id !== value.id), inserted]);
      } else {
        // 2) Mise à jour simple
        const { error } = await supabase
          .from('indicator_values')
          .update({ value: newValue, status: 'draft' })
          .eq('id', value.id);
        if (error) throw error;

        setValues(prev =>
          prev.map(v => (v.id === value.id ? { ...v, value: newValue, status: 'draft' } : v))
        );
      }

      setEditingValue(null);
      setTempValue('');
      toast.success('Valeur mise à jour');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleSubmit = async () => {
    const draftValues = values.filter(v => v.status === 'draft' && v.value !== null);
    if (draftValues.length === 0) {
      toast.error('Aucun brouillon à soumettre');
      return;
    }

    try {
      const existingDrafts = draftValues.filter(v => !v.id.startsWith('empty-'));
      if (existingDrafts.length > 0) {
        const { error } = await supabase
          .from('indicator_values')
          .update({ status: 'submitted' })
          .in(
            'id',
            existingDrafts.map(v => v.id)
          );
        if (error) throw error;

        setValues(prev =>
          prev.map(v =>
            existingDrafts.find(dv => dv.id === v.id) ? { ...v, status: 'submitted' } : v
          )
        );
      }
      toast.success(`${draftValues.length} indicateur(s) soumis avec succès`);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la soumission');
    }
  };

  /* ----------  STATS & FILTRES  ---------- */
  const totalIndicators = organizationIndicators.length;
  const filledIndicators = values.filter(v => typeof v.value === 'number').length;
  const progress = totalIndicators ? ((filledIndicators / totalIndicators) * 100).toFixed(2) : 0;

  const stats = {
    total: values.length,
    submitted: values.filter(v => v.status === 'submitted').length,
    validated: values.filter(v => v.status === 'validated').length,
    rejected: values.filter(v => v.status === 'rejected').length,
  };

  const filtered = values.filter(v => {
    if (selectedStatCard === 'all') return true;
    if (selectedStatCard === 'submitted') return v.status === 'submitted';
    if (selectedStatCard === 'validated') return v.status === 'validated';
    if (selectedStatCard === 'rejected') return v.status === 'rejected';
    if (filterStatus !== 'all' && v.status !== filterStatus) return false;
    if (filterProcess !== 'all' && v.process_code !== filterProcess) return false;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      const ind = organizationIndicators.find(i => i.indicator_code === v.indicator_code);
      const proc = processes.find(p => p.code === v.process_code);
      return (
        v.indicator_code.toLowerCase().includes(lower) ||
        v.process_code.toLowerCase().includes(lower) ||
        ind?.indicator_name.toLowerCase().includes(lower) ||
        proc?.name.toLowerCase().includes(lower)
      );
    }
    return true;
  });

  const grouped = filtered.reduce<Record<string, IndicatorValue[]>>((acc, v) => {
    if (!acc[v.process_code]) acc[v.process_code] = [];
    acc[v.process_code].push(v);
    return acc;
  }, {});

  const getStatusColor = (s: string) =>
    s === 'validated' ? 'bg-green-100 text-green-800' : s === 'rejected' ? 'bg-red-100 text-red-800' : s === 'submitted' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800';

  const getStatusLabel = (s: string) =>
    ({ validated: 'Validé', rejected: 'Rejeté', submitted: 'Soumis', draft: 'Brouillon' }[s] || '');

  const getIndicatorName = (c: string) => indicators.find(i => i.code === c)?.name || c;
  const getProcessName = (c: string) => processes.find(p => p.code === c)?.name || c;

  /* ----------  RENDER  ---------- */
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          <ArrowLeft size={16} /> Retour au menu
        </button>

        <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg">
          <img src="/Imade full VSG.jpg" alt="Global ESG Banner" className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Module Pilotage ESG</h1>
        <p className="text-gray-600 mb-6">Collectez vos indicateurs de performance ESG</p>

        {/* Période */}
        <div className="mb-6 flex gap-4 items-center">
          <div>
            <label className="text-sm font-medium">Année</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="block px-3 py-2 border rounded-md"
            >
              {[...Array(10)].map((_, i) => (
                <option key={i} value={new Date().getFullYear() - 2 + i}>
                  {new Date().getFullYear() - 2 + i}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Mois</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="block px-3 py-2 border rounded-md"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Progression */}
        <div className="mb-4 max-w-xs">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progression</span>
            <span>{filledIndicators}/{totalIndicators}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium flex items-center"><Filter className="w-4 h-4 mr-1" /> Statut</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="submitted">Soumis</option>
              <option value="validated">Validé</option>
              <option value="rejected">Rejeté</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium flex items-center"><Filter className="w-4 h-4 mr-1" /> Processus</label>
            <select
              value={filterProcess}
              onChange={e => setFilterProcess(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            >
              <option value="all">Tous</option>
              {processes.map(p => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium flex items-center"><Search className="w-4 h-4 mr-1" /> Rechercher</label>
            <input
              type="text"
              placeholder="Indicateur ou processus..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', count: stats.total, status: 'all', color: 'bg-blue-500', icon: BarChart3 },
            { label: 'Soumis', count: stats.submitted, status: 'submitted', color: 'bg-yellow-500', icon: Clock },
            { label: 'Validés', count: stats.validated, status: 'validated', color: 'bg-green-500', icon: CheckCircle2 },
            { label: 'Rejetés', count: stats.rejected, status: 'rejected', color: 'bg-red-500', icon: XCircle }
          ].map(({ label, count, status, color, icon: Icon }) => (
            <div
              key={status}
              onClick={() => {
                setSelectedStatCard(status === selectedStatCard ? null : status);
                setFilterStatus('all');
              }}
              className={`p-4 rounded-lg shadow-md text-white cursor-pointer transition-transform hover:scale-105 ${color} ${selectedStatCard === status ? 'ring-4 ring-offset-2 ring-blue-600' : ''}`}
            >
              <div className="flex items-center">
                <Icon className="w-6 h-6 mr-3" />
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bouton Soumettre */}
        {values.filter(v => v.status === 'draft' && v.value !== null).length > 0 && (
          <div className="mb-6">
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md"
            >
              <Send size={16} /> Soumettre les brouillons
            </button>
          </div>
        )}

        {/* Affichage par processus */}
        {Object.entries(grouped).map(([processCode, indicators]) => {
          const open = expandedProcess === processCode;
          return (
            <div key={processCode} className="mb-6 border rounded-lg bg-white shadow-sm">
              <div
                onClick={() => setExpandedProcess(open ? null : processCode)}
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50"
              >
                <h3 className="text-lg font-semibold">{getProcessName(processCode)}</h3>
                {open ? <ChevronUp /> : <ChevronDown />}
              </div>
              {open && (
                <div className="px-6 pb-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Indicateur
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Valeur
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Unité
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {indicators.map(v => (
                        <tr key={v.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm">{getIndicatorName(v.indicator_code)}</td>
                          <td className="px-6 py-4 text-sm">
                            {editingValue === v.id ? (
                              <>
                                <input
                                  type="number"
                                  value={tempValue}
                                  onChange={e => setTempValue(e.target.value)}
                                  className="w-20 border rounded px-1"
                                  step="0.01"
                                />
                                <button
                                  onClick={() => handleValueChange(v, tempValue)}
                                  className="ml-2 text-green-600"
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingValue(null);
                                    setTempValue('');
                                  }}
                                  className="ml-1 text-red-600"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            ) : (
                              v.value?.toLocaleString() ?? '-'
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">{v.unit || ''}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(v.status)}`}>
                              {getStatusLabel(v.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {['draft', 'rejected'].includes(v.status) && editingValue !== v.id && (
                              <button
                                onClick={() => {
                                  setEditingValue(v.id);
                                  setTempValue(v.value?.toString() || '');
                                }}
                                className="text-blue-600"
                              >
                                <Edit3 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};