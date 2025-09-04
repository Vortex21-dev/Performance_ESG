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
  XCircle,
  Loader2,
  Download,
  ArrowLeft,
  MessageSquare
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
  submitted_by?: string;
  submitted_at?: string;
  validated_by?: string;
  validated_at?: string;
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

export const ValidatorPilotage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, impersonatedOrganization } = useAuthStore();

  const [values, setValues] = useState<IndicatorValue[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [organizationIndicators, setOrganizationIndicators] = useState<OrganizationIndicator[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('submitted');
  const [filterProcess, setFilterProcess] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [validationComment, setValidationComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [validationAction, setValidationAction] = useState<'approve' | 'reject' | null>(null);
  const [expandedProcess, setExpandedProcess] = useState<string | null>(null);
  const [selectedStatCard, setSelectedStatCard] = useState<string | null>(null);
  const [selectedValueId, setSelectedValueId] = useState<string | null>(null);

  const currentOrganization = impersonatedOrganization || profile?.organization_name;

  /* ---------- DATA ---------- */
  useEffect(() => {
    if (!profile || profile.role !== 'validator') {
      navigate('/login');
      return;
    }
    fetchInitialData();
  }, [profile, navigate]);

  useEffect(() => {
    if (selectedYear && selectedMonth && currentOrganization) {
      fetchValues(selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth, currentOrganization]);

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

  const fetchValues = async (year: number, month: number) => {
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
      .in('process_code', userProcesses?.process_codes || [])
      .in('status', ['draft', 'submitted', 'validated', 'rejected']);

    setValues(data || []);
    setLoading(false);
  };

  /* ---------- VALIDATION ---------- */
  const handleValidationClick = (action: 'approve' | 'reject', valueId?: string) => {
    const targetValues = valueId 
      ? values.filter(v => v.id === valueId && v.status === 'submitted')
      : values.filter(v => v.status === 'submitted');
      
    if (!targetValues.length) {
      toast.error(valueId ? 'Aucune valeur soumise sélectionnée' : 'Aucune valeur à valider');
      return;
    }
    
    setValidationAction(action);
    setSelectedValueId(valueId || null);
    setShowCommentModal(true);
  };

  const handleValidate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const valuesToValidate = selectedValueId 
      ? values.filter(v => v.id === selectedValueId && v.status === 'submitted')
      : values.filter(v => v.status === 'submitted');

    for (const value of valuesToValidate) {
      await supabase
        .from('indicator_values')
        .update({
          status: validationAction === 'approve' ? 'validated' : 'rejected',
          validated_by: user?.email,
          validated_at: new Date().toISOString(),
          comment: validationComment || null,
        })
        .eq('id', value.id);
    }

    setValues(prevValues =>
      prevValues.map(item =>
        valuesToValidate.some(v => v.id === item.id)
          ? {
              ...item,
              status: validationAction === 'approve' ? 'validated' : 'rejected',
              validated_by: user?.email,
              validated_at: new Date().toISOString(),
              comment: validationComment || item.comment,
            }
          : item
      )
    );

    setValidationComment('');
    setShowCommentModal(false);
    setValidationAction(null);
    setSelectedValueId(null);
    
    toast.success(`${valuesToValidate.length} valeur(s) ${validationAction === 'approve' ? 'validée(s)' : 'rejetée(s)'}`);
  };

  /* ---------- FILTER & GROUP ---------- */

  // Génère toutes les données nécessaires (valeurs existantes + indicateurs sans valeurs)
  const getAllRequiredData = () => {
    if (!currentOrganization || !profile?.email) return [];

    return organizationIndicators.map(orgIndicator => {
      const existingValue = values.find(
        v => v.indicator_code === orgIndicator.indicator_code && 
             v.process_code === orgIndicator.process_code
      );

      if (existingValue) {
        return existingValue;
      }

      // Créer une entrée vide avec statut 'draft' pour afficher tous les indicateurs
      return {
        id: `empty-${orgIndicator.process_code}-${orgIndicator.indicator_code}-${selectedYear}-${selectedMonth}`,
        organization_name: currentOrganization,
        year: selectedYear,
        month: selectedMonth,
        process_code: orgIndicator.process_code,
        indicator_code: orgIndicator.indicator_code,
        value: null,
        unit: orgIndicator.unit || '',
        status: 'draft' as const,
        comment: undefined,
        submitted_by: undefined,
        submitted_at: undefined,
        validated_by: undefined,
        validated_at: undefined,
      };
    });
  };

  const allRequiredData = getAllRequiredData();

  const filteredData = allRequiredData.filter(v => {
    if (selectedStatCard === 'submitted') return v.status === 'submitted';
    if (selectedStatCard === 'validated') return v.status === 'validated';
    if (selectedStatCard === 'rejected') return v.status === 'rejected';
    if (filterStatus !== 'all' && v.status !== filterStatus) return false;
    if (filterProcess !== 'all' && v.process_code !== filterProcess) return false;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      const orgInd = organizationIndicators.find(i => i.indicator_code === v.indicator_code);
      return (
        v.indicator_code.toLowerCase().includes(lower) ||
        v.process_code.toLowerCase().includes(lower) ||
        orgInd?.indicator_name.toLowerCase().includes(lower) ||
        orgInd?.process_name.toLowerCase().includes(lower)
      );
    }
    return true;
  });

  const grouped = filteredData.reduce<Record<string, IndicatorValue[]>>((acc, v) => {
    if (!acc[v.process_code]) acc[v.process_code] = [];
    acc[v.process_code].push(v);
    return acc;
  }, {});

  const getStatusColor = (s: string) =>
    s === 'validated' ? 'bg-green-100 text-green-800' :
    s === 'rejected' ? 'bg-red-100 text-red-800' :
    s === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
    'bg-gray-100 text-gray-800';

  const getStatusLabel = (s: string) => ({ validated: 'Validé', rejected: 'Rejeté', submitted: 'Soumis', draft: 'Brouillon' }[s] || '');
  const getIndicatorName = (c: string) => indicators.find(i => i.code === c)?.name || c;
  const getProcessName = (c: string) => processes.find(p => p.code === c)?.name || c;

  /* ---------- RENDER ---------- */
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
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          <ArrowLeft size={16} /> Retour au menu
        </button>

        {/* Banner */}
        <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg">
          <img src="/Imade full VSG.jpg" alt="Global ESG Banner" className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Module Pilotage ESG</h1>
        <p className="text-gray-600 mb-6">Validez ou rejetez les valeurs soumises</p>

        {/* Période + Export */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm font-medium">Année</label>
              <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="block px-3 py-2 border rounded-md">
                {[...Array(10)].map((_, i) => <option key={i} value={new Date().getFullYear() - 2 + i}>{new Date().getFullYear() - 2 + i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Mois</label>
              <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="block px-3 py-2 border rounded-md">
                {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>)}
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md"><Download size={16} /> Excel</button>
              <button className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md"><Download size={16} /> PDF</button>
            </div>
          </div>
        </div>

        {/* Progress Bar (small) */}
        <div className="mb-4 max-w-xs">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progression</span>
            <span>{allRequiredData.filter(v => v.status === 'submitted').length} / {allRequiredData.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-yellow-600 h-1.5 rounded-full" style={{ width: `${(allRequiredData.filter(v => v.status === 'submitted').length / allRequiredData.length) * 100 || 0}%` }}></div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium flex items-center"><Filter className="w-4 h-4 mr-1" /> Statut</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md">
              <option value="submitted">Soumis</option>
              <option value="validated">Validés</option>
              <option value="rejected">Rejetés</option>
              <option value="draft">Brouillons</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium flex items-center"><Filter className="w-4 h-4 mr-1" /> Processus</label>
            <select value={filterProcess} onChange={e => setFilterProcess(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md">
              <option value="all">Tous</option>
              {processes.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium flex items-center"><Search className="w-4 h-4 mr-1" /> Rechercher</label>
            <input type="text" placeholder="Indicateur ou processus..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', count: allRequiredData.length, status: 'all', color: 'bg-blue-500', icon: BarChart3 },
            { label: 'Soumis', count: allRequiredData.filter(v => v.status === 'submitted').length, status: 'submitted', color: 'bg-yellow-500', icon: Clock },
            { label: 'Validés', count: allRequiredData.filter(v => v.status === 'validated').length, status: 'validated', color: 'bg-green-500', icon: CheckCircle2 },
            { label: 'Rejetés', count: allRequiredData.filter(v => v.status === 'rejected').length, status: 'rejected', color: 'bg-red-500', icon: XCircle }
          ].map(({ label, count, status, color, icon: Icon }) => (
            <div
              key={status}
              onClick={() => {
                setSelectedStatCard(status === selectedStatCard ? null : status);
                setFilterStatus(status === 'all' ? 'submitted' : status);
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

        {/* Validation Global */}
        {allRequiredData.filter(v => v.status === 'submitted').length > 0 && (
          <div className="mb-6 flex gap-4">
            <button onClick={() => handleValidationClick('approve')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md">
              <CheckCircle2 size={16} /> Valider tout
            </button>
            <button onClick={() => handleValidationClick('reject')} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md">
              <XCircle size={16} /> Rejeter tout
            </button>
          </div>
        )}

        {/* Grouped by Process */}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Indicateur</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valeur</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unité</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commentaire</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {indicators.map(v => (
                        <tr key={v.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm">{getIndicatorName(v.indicator_code)}</td>
                          <td className="px-6 py-4 text-sm">{v.value?.toLocaleString() ?? '-'}</td>
                          <td className="px-6 py-4 text-sm">{organizationIndicators.find(i => i.indicator_code === v.indicator_code)?.unit || ''}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(v.status)}`}>{getStatusLabel(v.status)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-pre-wrap">
                            {v.comment ? <span className="text-sm text-gray-500">{v.comment}</span> : '-'}
                          </td>
                          <td className="px-6 py-4 flex space-x-2">
                            {v.status === 'submitted' && (
                              <>
                                <button 
                                  onClick={() => handleValidationClick('approve', v.id)} 
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <CheckCircle2 size={16} title="Valider" />
                                </button>
                                <button 
                                  onClick={() => handleValidationClick('reject', v.id)} 
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <XCircle size={16} title="Rejeter" />
                                </button>
                              </>
                            )}
                            {v.comment && <MessageSquare className="text-amber-600" size={16} title={v.comment} />}
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

        {/* Modal validation */}
        {showCommentModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white max-w-lg w-full rounded-lg shadow-xl p-6">
              <h3 className="text-lg font-medium mb-4">
                {selectedValueId 
                  ? `${validationAction === 'approve' ? 'Valider' : 'Rejeter'} l'indicateur`
                  : `${validationAction === 'approve' ? 'Valider' : 'Rejeter'} toutes les données`}
              </h3>
              <textarea
                value={validationComment}
                onChange={(e) => setValidationComment(e.target.value)}
                rows={3}
                className="w-full border rounded p-2"
                placeholder={`Commentaire ${validationAction === 'reject' ? '(obligatoire)' : '(optionnel)'}`}
              />
              <div className="flex justify-end mt-4 space-x-2">
                <button onClick={() => {
                  setShowCommentModal(false);
                  setSelectedValueId(null);
                }} className="px-4 py-2 border rounded">Annuler</button>
                <button onClick={handleValidate} className={`px-4 py-2 rounded text-white ${validationAction === 'approve' ? 'bg-green-600' : 'bg-red-600'}`}>
                  {validationAction === 'approve' ? 'Valider' : 'Rejeter'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};