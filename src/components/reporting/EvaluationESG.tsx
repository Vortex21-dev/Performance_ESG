import React, { useEffect, useState, ChangeEvent } from 'react';
import { Edit3, Save, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface Props {
  currentOrganization: string;
}

interface EsgData {
  msci: string;
  sustainalytics: number;
  cdp: string;
  history: { year: string; msci: string; sustainalytics: number; cdp: string }[];
}

export const EvaluationESG: React.FC<Props> = ({ currentOrganization }) => {
  const { user, profile } = useAuthStore();
  const canEdit = ['admin', 'enterprise'].includes(profile?.role ?? '');

  const [data, setData] = useState<EsgData>({
    msci: 'A-',
    sustainalytics: 72,
    cdp: 'B+',
    history: [
      { year: '2022', msci: 'B', sustainalytics: 65, cdp: 'B' },
      { year: '2023', msci: 'A-', sustainalytics: 68, cdp: 'B+' },
      { year: '2024', msci: 'A-', sustainalytics: 72, cdp: 'B+' },
    ],
  });

  const [draft, setDraft] = useState<EsgData>(data);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ---------- DATA ---------- */
  const fetchData = async () => {
    setLoading(true);
    const { data: row, error } = await supabase
      .from('esg_ratings')
      .select('msci, sustainalytics, cdp, history')
      .eq('organization_name', currentOrganization)
      .maybeSingle();

    if (!error && row) {
      setData(row);
    } else {
      await supabase.from('esg_ratings').upsert({
        organization_name: currentOrganization,
        ...data,
        updated_by: user?.email,
      }, { onConflict: 'organization_name' });
    }
    setLoading(false);
  };

  const saveData = async () => {
    setSaving(true);
    await supabase
      .from('esg_ratings')
      .upsert(
        {
          organization_name: currentOrganization,
          ...draft,
          updated_by: user?.email,
        },
        { onConflict: 'organization_name' }
      );
    setData(draft);
    setIsEditing(false);
    setSaving(false);
  };

  useEffect(() => {
    fetchData();
  }, [currentOrganization]);

  if (loading) return <p className="p-4 text-gray-500">Chargement…</p>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Évaluation ESG</h2>

        {canEdit && !isEditing && (
          <button
            onClick={() => {
              setDraft(data);
              setIsEditing(true);
            }}
            className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Modifier
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border">
        {isEditing && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
            <AlertCircle className="inline h-4 w-4 mr-1" />
            Seul l’administrateur peut modifier ces données.
          </div>
        )}

        {/* Évolution des notations */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">Évolution des notations</h4>
          {isEditing ? (
            <div className="space-y-2">
              {draft.history.map((h, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <input
                    className="w-16 px-2 py-1 border rounded"
                    value={h.year}
                    onChange={(e) => {
                      const updated = [...draft.history];
                      updated[idx].year = e.target.value;
                      setDraft({ ...draft, history: updated });
                    }}
                  />
                  <input
                    className="w-20 px-2 py-1 border rounded"
                    value={h.msci}
                    onChange={(e) => {
                      const updated = [...draft.history];
                      updated[idx].msci = e.target.value;
                      setDraft({ ...draft, history: updated });
                    }}
                  />
                  <input
                    className="w-20 px-2 py-1 border rounded"
                    type="number"
                    value={h.sustainalytics}
                    onChange={(e) => {
                      const updated = [...draft.history];
                      updated[idx].sustainalytics = +e.target.value;
                      setDraft({ ...draft, history: updated });
                    }}
                  />
                  <input
                    className="w-20 px-2 py-1 border rounded"
                    value={h.cdp}
                    onChange={(e) => {
                      const updated = [...draft.history];
                      updated[idx].cdp = e.target.value;
                      setDraft({ ...draft, history: updated });
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {data.history.map((h) => (
                <div key={h.year} className="flex items-center">
                  <span className="text-sm w-12">{h.year}</span>
                  <span className="text-sm font-medium ml-4">
                    {h.msci} / {h.sustainalytics} / {h.cdp}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Évaluation et notation ESG */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Évaluation et notation ESG
        </h3>

        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <input
                className="text-2xl font-bold text-green-600 w-full bg-transparent text-center"
                value={draft.msci}
                onChange={(e) => setDraft({ ...draft, msci: e.target.value })}
              />
              <div className="font-medium text-green-800">MSCI ESG Rating</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <input
                type="number"
                className="text-2xl font-bold text-blue-600 w-full bg-transparent text-center"
                value={draft.sustainalytics}
                onChange={(e) =>
                  setDraft({ ...draft, sustainalytics: +e.target.value })
                }
              />
              <div className="font-medium text-blue-800">Sustainalytics</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <input
                className="text-2xl font-bold text-purple-600 w-full bg-transparent text-center"
                value={draft.cdp}
                onChange={(e) => setDraft({ ...draft, cdp: e.target.value })}
              />
              <div className="font-medium text-purple-800">CDP Climate</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{data.msci}</div>
              <div className="font-medium text-green-800">MSCI ESG Rating</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.sustainalytics}/100</div>
              <div className="font-medium text-blue-800">Sustainalytics</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{data.cdp}</div>
              <div className="font-medium text-purple-800">CDP Climate</div>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </button>
            <button
              onClick={saveData}
              disabled={saving}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Sauvegarde…' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};