import React, { useEffect, useState } from 'react';
import { Edit3, Save, X, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface Props { currentOrganization: string; }

/* -------------------------------------------------
   Typage
--------------------------------------------------*/
interface SWOTItem { label: string; }
interface SWOTData {
  forces: SWOTItem[];
  faiblesses: SWOTItem[];
  opportunites: SWOTItem[];
  menaces: SWOTItem[];
}
interface IROData {
  impactsPositifs: string[];
  impactsNegatifs: string[];
  risques: Array<{ label: string; niveau: string; color: string }>;
}
interface GlobalData { iro: IROData; swot: SWOTData; }

/* -------------------------------------------------
   Composant principal
--------------------------------------------------*/
export const IRO: React.FC<Props> = ({ currentOrganization }) => {
  const { user, profile } = useAuthStore();
  const canEdit = ['admin', 'enterprise'].includes(profile?.role ?? '');

  const [data, setData] = useState<GlobalData>(defaultGlobalData());
  const [draft, setDraft] = useState<GlobalData>(defaultGlobalData());
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ---------- DATA ---------- */
  const fetchData = async () => {
    setLoading(true);
    const { data: row, error } = await supabase
      .from('iro_data')
      .select('payload')
      .eq('organization_name', currentOrganization)
      .maybeSingle();

    if (!error && row?.payload) {
      // fusion défensive
      setData({
        iro: {
          impactsPositifs: row.payload.iro?.impactsPositifs || [],
          impactsNegatifs: row.payload.iro?.impactsNegatifs || [],
          risques: row.payload.iro?.risques || [],
        },
        swot: {
          forces: row.payload.swot?.forces || [],
          faiblesses: row.payload.swot?.faiblesses || [],
          opportunites: row.payload.swot?.opportunites || [],
          menaces: row.payload.swot?.menaces || [],
        },
      });
    } else {
      await supabase.from('iro_data').upsert({
        organization_name: currentOrganization,
        payload: defaultGlobalData(),
        updated_by: user?.email,
      }, { onConflict: 'organization_name' });
      setData(defaultGlobalData());
    }
    setLoading(false);
  };

  const saveData = async () => {
    setSaving(true);
    await supabase
      .from('iro_data')
      .upsert(
        { organization_name: currentOrganization, payload: draft, updated_by: user?.email },
        { onConflict: 'organization_name' }
      );
    setData(draft);
    setIsEditing(false);
    setSaving(false);
  };

  useEffect(() => { fetchData(); }, [currentOrganization]);
  if (loading) return <p className="p-4 text-gray-500">Chargement…</p>;

  /* ---------- RENDER ---------- */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          IRO & SWOT (Impacts, Risques, Opportunités + SWOT)
        </h2>
        {canEdit && !isEditing && (
          <button
            onClick={() => { setDraft(data); setIsEditing(true); }}
            className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            <Edit3 className="h-4 w-4 mr-2" /> Modifier
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <AlertCircle className="inline h-4 w-4 mr-1" />
            Seuls les administrateurs peuvent modifier ce contenu.
          </div>

          <ImpactsEditor draft={draft} setDraft={setDraft} />
          <RisquesEditor draft={draft} setDraft={setDraft} />
          <SwotEditor draft={draft} setDraft={setDraft} />

          <div className="flex justify-end space-x-3">
            <button onClick={() => setIsEditing(false)} className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
              <X className="h-4 w-4 mr-2" /> Annuler
            </button>
            <button onClick={saveData} disabled={saving} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
              <Save className="h-4 w-4 mr-2" /> {saving ? 'Sauvegarde…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <ImpactsDisplay data={data.iro} />
          <RisquesDisplay data={data.iro} />
          <SwotDisplay swot={data.swot} />
        </div>
      )}
    </motion.div>
  );
};

/* -------------------------------------------------
   DISPLAY MODE
--------------------------------------------------*/
const ImpactsDisplay: React.FC<{ data: IROData }> = ({ data }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Impacts matériels</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-medium text-green-800 mb-2">Impacts positifs</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          {(data.impactsPositifs || []).map((i, k) => <li key={k}>• {i}</li>)}
        </ul>
      </div>
      <div>
        <h4 className="font-medium text-red-800 mb-2">Impacts négatifs</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          {(data.impactsNegatifs || []).map((i, k) => <li key={k}>• {i}</li>)}
        </ul>
      </div>
    </div>
  </div>
);

const RisquesDisplay: React.FC<{ data: IROData }> = ({ data }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Risques ESG</h3>
    <div className="space-y-3">
      {(data.risques || []).map((r, k) => (
        <div key={k} className={`flex items-center justify-between p-3 bg-${r.color}-50 rounded-lg`}>
          <span className={`font-medium text-${r.color}-800`}>{r.label}</span>
          <span className={`text-sm bg-${r.color}-200 text-${r.color}-800 px-2 py-1 rounded`}>{r.niveau}</span>
        </div>
      ))}
    </div>
  </div>
);

const SwotDisplay: React.FC<{ swot: SWOTData }> = ({ swot }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyse SWOT</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[
        { key: 'forces', label: 'Forces', color: 'green' },
        { key: 'faiblesses', label: 'Faiblesses', color: 'red' },
        { key: 'opportunites', label: 'Opportunités', color: 'blue' },
        { key: 'menaces', label: 'Menaces', color: 'orange' },
      ].map(({ key, label, color }) => (
        <div key={key}>
          <h4 className={`font-medium text-${color}-800 mb-2`}>{label}</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {(swot[key as keyof SWOTData] || []).map((item, idx) => (
              <li key={idx}>• {item.label}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
);

/* -------------------------------------------------
   EDITORS avec +/- items
--------------------------------------------------*/
const ImpactsEditor: React.FC<{
  draft: GlobalData;
  setDraft: (updater: (d: GlobalData) => GlobalData) => void;
}> = ({ draft, setDraft }) => {
  const add = (list: 'impactsPositifs' | 'impactsNegatifs') =>
    setDraft(prev => ({
      ...prev,
      iro: { ...prev.iro, [list]: [...(prev.iro[list] || []), ''] },
    }));
  const remove = (list: 'impactsPositifs' | 'impactsNegatifs', idx: number) =>
    setDraft(prev => ({
      ...prev,
      iro: { ...prev.iro, [list]: (prev.iro[list] || []).filter((_, i) => i !== idx) },
    }));
  const update = (list: 'impactsPositifs' | 'impactsNegatifs', idx: number, val: string) =>
    setDraft(prev => ({
      ...prev,
      iro: { ...prev.iro, [list]: (prev.iro[list] || []).map((v, i) => (i === idx ? val : v)) },
    }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Impacts matériels</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(['impactsPositifs', 'impactsNegatifs'] as const).map(type => (
          <div key={type}>
            <h4 className={`font-medium ${type === 'impactsPositifs' ? 'text-green-800' : 'text-red-800'} mb-2 flex justify-between`}>
              {type === 'impactsPositifs' ? 'Impacts positifs' : 'Impacts négatifs'}
              <button onClick={() => add(type)} className="text-blue-600 hover:text-blue-800">
                <Plus size={16} />
              </button>
            </h4>
            {(draft.iro[type] || []).map((i, k) => (
              <div key={k} className="flex items-center gap-2 mb-2">
                <input
                  value={i}
                  onChange={e => update(type, k, e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
                <button onClick={() => remove(type, k)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const RisquesEditor: React.FC<{
  draft: GlobalData;
  setDraft: (updater: (d: GlobalData) => GlobalData) => void;
}> = ({ draft, setDraft }) => {
  const add = () =>
    setDraft(prev => ({
      ...prev,
      iro: {
        ...prev.iro,
        risques: [...(prev.iro.risques || []), { label: '', niveau: 'Moyen', color: 'amber' }],
      },
    }));
  const remove = (idx: number) =>
    setDraft(prev => ({
      ...prev,
      iro: { ...prev.iro, risques: (prev.iro.risques || []).filter((_, i) => i !== idx) },
    }));
  const update = (idx: number, field: keyof IROData['risques'][0], val: string) =>
    setDraft(prev => ({
      ...prev,
      iro: {
        ...prev.iro,
        risques: (prev.iro.risques || []).map((r, i) => (i === idx ? { ...r, [field]: val } : r)),
      },
    }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Risques ESG</h3>
      {(draft.iro.risques || []).map((r, k) => (
        <div key={k} className="flex items-center gap-3">
          <input
            value={r.label}
            onChange={e => update(k, 'label', e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <select
            value={r.niveau}
            onChange={e => update(k, 'niveau', e.target.value)}
            className="p-2 border rounded"
          >
            <option>Élevé</option>
            <option>Moyen</option>
            <option>Faible</option>
          </select>
          <button onClick={() => remove(k)} className="text-red-500 hover:text-red-700">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
      >
        <Plus size={14} className="mr-1" /> Ajouter un risque
      </button>
    </div>
  );
};

const SwotEditor: React.FC<{
  draft: GlobalData;
  setDraft: (updater: (d: GlobalData) => GlobalData) => void;
}> = ({ draft, setDraft }) => {
  const categories: { key: keyof SWOTData; label: string; color: string }[] = [
    { key: 'forces', label: 'Forces', color: 'green' },
    { key: 'faiblesses', label: 'Faiblesses', color: 'red' },
    { key: 'opportunites', label: 'Opportunités', color: 'blue' },
    { key: 'menaces', label: 'Menaces', color: 'orange' },
  ];

  const add = (key: keyof SWOTData) =>
    setDraft(prev => ({
      ...prev,
      swot: { ...prev.swot, [key]: [...(prev.swot[key] || []), { label: '' }] },
    }));
  const remove = (key: keyof SWOTData, idx: number) =>
    setDraft(prev => ({
      ...prev,
      swot: { ...prev.swot, [key]: (prev.swot[key] || []).filter((_, i) => i !== idx) },
    }));
  const update = (key: keyof SWOTData, idx: number, val: string) =>
    setDraft(prev => ({
      ...prev,
      swot: {
        ...prev.swot,
        [key]: (prev.swot[key] || []).map((item, i) => (i === idx ? { label: val } : item)),
      },
    }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Analyse SWOT</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map(({ key, label, color }) => (
          <div key={key}>
            <h4 className={`font-medium text-${color}-800 mb-2 flex justify-between`}>
              {label}
              <button onClick={() => add(key)} className="text-blue-600 hover:text-blue-800">
                <Plus size={16} />
              </button>
            </h4>
            {(draft.swot[key] || []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  value={item.label}
                  onChange={e => update(key, idx, e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
                <button onClick={() => remove(key, idx)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------
   DEFAULT DATA
--------------------------------------------------*/
const defaultGlobalData = (): GlobalData => ({
  iro: {
    impactsPositifs: [],
    impactsNegatifs: [],
    risques: [],
  },
  swot: {
    forces: [],
    faiblesses: [],
    opportunites: [],
    menaces: [],
  },
});