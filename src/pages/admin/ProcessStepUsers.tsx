import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import ProgressNav from '../../components/ui/ProgressNav';
import SelectionSummary from '../../components/ui/SelectionSummary';
import { FormSection } from '../../components/ui/FormSection';
import { FormInput } from '../../components/ui/FormInput';
import { FormTextarea } from '../../components/ui/FormTextarea';
import { FormSelect } from '../../components/ui/FormSelect';
import { Plus, Trash2, Settings, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Process {
  name: string;
  description: string;
  indicator_codes: string[];
}

export default function ProcessStepUsers() {
  const navigate = useNavigate();
  const { setCurrentStep, selectedIndicators } = useAppContext();

  /* ---------- STATE ---------- */
  const [organisations, setOrganisations] = useState<{ name: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [orgIndicators, setOrgIndicators] = useState<string[]>([]);
  const [newProcesses, setNewProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------- LIFECYCLE ---------- */
  useEffect(() => {
    setCurrentStep(7);
    fetchOrganisations();
  }, []);

  /* ---------- DATA FETCH ---------- */
  const fetchOrganisations = async () => {
    const { data } = await supabase.from('organizations').select('name');
    const list = data || [];
    setOrganisations(list);
    setSelectedOrg(list[0]?.name || '');
    setLoading(false);
  };

  // récupère les indicateurs sauvegardés pour l’org choisie
  const fetchOrgIndicators = async (org: string) => {
    if (!org) return;
    const { data } = await supabase
      .from('organization_indicators')
      .select('indicator_codes')
      .eq('organization_name', org)
      .maybeSingle();
    if (!data?.indicator_codes?.length) {
      setOrgIndicators([]);
      return;
    }
    const { data: indicators } = await supabase
      .from('indicators')
      .select('name')
      .in('code', data.indicator_codes);
    setOrgIndicators(indicators?.map(i => i.name) || []);
  };

  useEffect(() => {
    fetchOrgIndicators(selectedOrg);
  }, [selectedOrg]);

  /* ---------- CRUD PROCESS ---------- */
  const addProcess = () =>
    setNewProcesses([...newProcesses, { name: '', description: '', indicator_codes: [] }]);

  const removeProcess = (idx: number) =>
    setNewProcesses(newProcesses.filter((_, i) => i !== idx));

  const updateProcess = (idx: number, key: keyof Process, val: any) => {
    const list = [...newProcesses];
    list[idx] = { ...list[idx], [key]: val };
    setNewProcesses(list);
  };

  const toggleIndicator = (pIdx: number, ind: string) => {
    const list = [...newProcesses];
    const codes = list[pIdx].indicator_codes;
    list[pIdx].indicator_codes = codes.includes(ind)
      ? codes.filter(c => c !== ind)
      : [...codes, ind];
    setNewProcesses(list);
  };

  const createProcesses = async () => {
    for (const p of newProcesses) {
      if (!p.name) return toast.error('Tous les processus doivent avoir un nom');
      const code = p.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10);
      await supabase.from('processes').insert({
        code,
        name: p.name,
        description: p.description,
        indicator_codes: p.indicator_codes,
        organisation_name: selectedOrg,
      });
    }
    toast.success('Processus créés');
    setNewProcesses([]);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Banner */}
        <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg">
          <img src="/Imade full VSG.jpg" alt="Banner" className="w-full h-32 object-cover" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Étape 7 : Gestion des processus</h1>
        <p className="text-gray-600 mb-6">
          Choisissez une entreprise puis créez les processus liés à ses indicateurs.
        </p>

        <SelectionSummary />

        {/* Choix entreprise */}
     <FormSection icon={<Building2 className="h-5 w-5" />} title="Sélectionner l’entreprise">
  <div className="relative">
    <FormSelect
      label="Entreprise"
      value={selectedOrg}
      onChange={(v) => setSelectedOrg(v)}
      options={organisations.map(o => ({ value: o.name, label: o.name }))}
      className="w-full"
    />
  </div>
</FormSection> 

        {/* Indicateurs disponibles */}
        <FormSection icon={<Settings className="h-5 w-5" />} title={`Indicateurs de ${selectedOrg}`}>
          {orgIndicators.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucun indicateur sauvegardé pour cette entreprise.
            </p>
          ) : (
            <ul className="text-sm space-y-1">
              {orgIndicators.map(i => (
                <li key={i} className="px-2 py-1 bg-gray-100 rounded">
                  {i}
                </li>
              ))}
            </ul>
          )}
        </FormSection>

        {/* Création des processus */}
        <FormSection icon={<Plus className="h-5 w-5" />} title="Créer des processus">
          {newProcesses.map((p, idx) => (
            <div key={idx} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Processus {idx + 1}</h4>
                <button
                  onClick={() => removeProcess(idx)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <FormInput
                label="Nom du processus"
                value={p.name}
                onChange={e => updateProcess(idx, 'name', e.target.value)}
                required
              />
              <FormTextarea
                label="Description"
                value={p.description}
                onChange={e => updateProcess(idx, 'description', e.target.value)}
                rows={2}
              />

              <label className="block text-sm font-medium">Indicateurs à suivre</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {orgIndicators.map(ind => (
                  <label
                    key={ind}
                    className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={p.indicator_codes.includes(ind)}
                      onChange={() => toggleIndicator(idx, ind)}
                      className="mr-2"
                    />
                    {ind}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={addProcess}
              className="flex items-center px-3 py-1.5 border border-dashed border-gray-400 rounded hover:bg-gray-50"
            >
              <Plus className="w-4 h-4 mr-1" /> Ajouter un processus
            </button>

            {newProcesses.length > 0 && (
              <button
                onClick={createProcesses}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Créer {newProcesses.length} processus
              </button>
            )}
          </div>
        </FormSection>

        <ProgressNav
          currentStep={7}
          totalSteps={7}
          nextPath="/admin/dashboard"
          prevPath="/process/company"
          isNextDisabled={false}
        />
      </div>
    </div>
  );
}