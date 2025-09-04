import React, { useEffect, useState, ChangeEvent } from 'react';
import { Edit3, Save, X, UploadCloud, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface Props {
  currentOrganization: string;
}

export interface OrgDataBusiness {
  vision: string;
  mission: string;
  valeurs: string;
  organe: {
    composition: string;
    independance: string;
    organigramme_url?: string;
  };
  chaine: {
    fournisseurs: string;
    production: string;
    distribution: string;
    clients: string;
  };
  due: {
    processus: string;
    conformite: string;
    audit: string;
  };
}

const defaultData: OrgDataBusiness = {
  vision: 'Être le leader du conseil en développement durable',
  mission: 'Accompagner les entreprises dans leur transformation durable',
  valeurs: 'Excellence, intégrité, innovation, responsabilité',
  organe: {
    composition: '9 membres dont 4 femmes (44%)',
    independance: '6 administrateurs indépendants (67%)',
    organigramme_url: '',
  },
  chaine: {
    fournisseurs: '150+ partenaires',
    production: 'Services conseil',
    distribution: 'Direct client',
    clients: '500+ entreprises',
  },
  due: {
    processus: 'Évaluation systématique des risques ESG',
    conformite: '100% de conformité aux réglementations applicables',
    audit: 'Certification annuelle par organisme tiers',
  },
};

const chaineColors: Record<keyof OrgDataBusiness['chaine'], string> = {
  fournisseurs: 'bg-blue-50 text-blue-800 border-blue-200',
  production: 'bg-green-50 text-green-800 border-green-200',
  distribution: 'bg-purple-50 text-purple-800 border-purple-200',
  clients: 'bg-amber-50 text-amber-800 border-amber-200',
};

export const BusinessModelEngagement: React.FC<Props> = ({ currentOrganization }) => {
  const { user, profile } = useAuthStore();
  const canEdit = ['admin', 'enterprise'].includes(profile?.role ?? '');

  const [data, setData] = useState<OrgDataBusiness>(defaultData);
  const [draft, setDraft] = useState<OrgDataBusiness>(defaultData);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  /* ---------- DATA ---------- */
  const loadData = async () => {
    setLoading(true);
    const { data: row, error } = await supabase
      .from('business_model_engagement')
      .select('data')
      .eq('organization_name', currentOrganization)
      .single();
    if (!error && row) setData({ ...defaultData, ...row.data });
    else {
      await supabase.from('business_model_engagement').insert({
        organization_name: currentOrganization,
        data: defaultData,
        updated_by: user?.email,
      });
      setData(defaultData);
    }
    setLoading(false);
  };

  const saveData = async () => {
    setSaving(true);
    await supabase.from('business_model_engagement').upsert(
      { organization_name: currentOrganization, data: draft, updated_by: user?.email },
      { onConflict: 'organization_name' }
    );
    setData(draft);
    setIsEditing(false);
    setSaving(false);
  };

  /* ---------- IMAGE UPLOAD ---------- */
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const fileName = `${currentOrganization}/organigramme_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('organigrammes').upload(fileName, file, { upsert: true });

    if (error) {
      console.error(error);
    } else {
      const { data: urlData } = supabase.storage.from('organigrammes').getPublicUrl(fileName);
      setDraft({ ...draft, organe: { ...draft.organe, organigramme_url: urlData.publicUrl } });
    }
    setUploading(false);
  };

  /* ---------- IMAGE DELETE ---------- */
  const handleImageDelete = async () => {
    if (!draft.organe.organigramme_url) return;
    try {
      const path = new URL(draft.organe.organigramme_url).pathname.split('/').pop()!;
      const { error } = await supabase.storage.from('organigrammes').remove([path]);
      if (!error) {
        setDraft({ ...draft, organe: { ...draft.organe, organigramme_url: '' } });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOrganization]);

  if (loading) return <p className="p-4 text-gray-500">Chargement…</p>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 lg:p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Business Model & Engagement</h2>
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

      {isEditing ? (
        <div className="space-y-6">
          {/* Vision, mission, valeurs */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vision, missions et valeurs</h3>
            <label className="block text-sm font-medium mb-1">Vision</label>
            <textarea
              value={draft.vision}
              onChange={(e) => setDraft({ ...draft, vision: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <label className="block text-sm font-medium mt-3 mb-1">Mission</label>
            <textarea
              value={draft.mission}
              onChange={(e) => setDraft({ ...draft, mission: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <label className="block text-sm font-medium mt-3 mb-1">Valeurs</label>
            <textarea
              value={draft.valeurs}
              onChange={(e) => setDraft({ ...draft, valeurs: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Organe de direction */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Organe de direction et de surveillance</h3>
            <label className="block text-sm font-medium mb-1">Composition du conseil</label>
            <textarea
              value={draft.organe.composition}
              onChange={(e) => setDraft({ ...draft, organe: { ...draft.organe, composition: e.target.value } })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <label className="block text-sm font-medium mt-3 mb-1">Indépendance</label>
            <textarea
              value={draft.organe.independance}
              onChange={(e) => setDraft({ ...draft, organe: { ...draft.organe, independance: e.target.value } })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg"
            />

            {/* Upload / Delete organigramme */}
            <label className="block text-sm font-medium mt-3 mb-1">Organigramme</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploading && <p className="text-sm text-gray-500 mt-1">Upload en cours…</p>}
            {draft.organe.organigramme_url && (
              <div className="mt-4">
                <img
                  src={draft.organe.organigramme_url}
                  alt="Organigramme"
                  className="rounded-lg border max-h-80 object-contain"
                />
                <button
                  onClick={handleImageDelete}
                  className="mt-2 flex items-center text-sm text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </button>
              </div>
            )}
          </div>

          {/* Chaîne de valeur */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chaîne de valeur</h3>
            {Object.entries(draft.chaine).map(([key, value]) => (
              <div key={key} className="mb-3">
                <label className="block text-sm font-medium mb-1 capitalize">{key}</label>
                <textarea
                  value={value}
                  onChange={(e) =>
                    setDraft({ ...draft, chaine: { ...draft.chaine, [key]: e.target.value } })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            ))}
          </div>

          {/* Due diligence */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Diligence raisonnable et conformité</h3>
            {Object.entries(draft.due).map(([key, value]) => (
              <div key={key} className="mb-3">
                <label className="block text-sm font-medium mb-1">
                  {key === 'processus'
                    ? 'Processus de due diligence'
                    : key === 'conformite'
                    ? 'Conformité réglementaire'
                    : 'Audit externe'}
                </label>
                <textarea
                  value={value}
                  onChange={(e) =>
                    setDraft({ ...draft, due: { ...draft.due, [key]: e.target.value } })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3">
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
        </div>
      ) : (
        <div className="space-y-8">
          {/* Vision, mission, valeurs */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Vision, missions et valeurs</h3>
            <p><strong>Vision :</strong> <span className="text-black">{data.vision}</span></p>
            <p><strong>Mission :</strong> <span className="text-black">{data.mission}</span></p>
            <p><strong>Valeurs :</strong> <span className="text-black">{data.valeurs}</span></p>
          </div>

          {/* Organe de direction */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Organe de direction et de surveillance</h3>
            <p><strong>Composition du conseil :</strong> <span className="text-black">{data.organe.composition}</span></p>
            <p><strong>Indépendance :</strong> <span className="text-black">{data.organe.independance}</span></p>
            {data.organe.organigramme_url && (
              <img
                src={data.organe.organigramme_url}
                alt="Organigramme"
                className="mt-4 rounded-lg border max-h-80 object-contain"
              />
            )}
          </div>

          {/* Chaîne de valeur */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Chaîne de valeur</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(data.chaine).map(([key, val]) => (
                <div
                  key={key}
                  className={`text-center p-4 rounded-lg border ${chaineColors[key as keyof typeof chaineColors]}`}
                >
                  <div className="font-semibold capitalize">{key}</div>
                  <div className="text-sm">{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Due diligence */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Diligence raisonnable et conformité</h3>
            <p><strong>Processus de due diligence :</strong> <span className="text-black">{data.due.processus}</span></p>
            <p><strong>Conformité réglementaire :</strong> <span className="text-black">{data.due.conformite}</span></p>
            <p><strong>Audit externe :</strong> <span className="text-black">{data.due.audit}</span></p>
          </div>
        </div>
      )}
    </motion.div>
  );
};