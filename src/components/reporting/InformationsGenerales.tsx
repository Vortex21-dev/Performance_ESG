import React, { useEffect, useState } from 'react';
import { Edit3, Save, X, Building2, MapPin, Briefcase, Users, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface Props {
  currentOrganization: string;
}

interface Norm {
  name: string;
  status: string;
  color: string;
}

interface OrgData {
  sectors: string;
  challenges: string;
  type: string;
  entities: string;
  duration: string;
  geo: string;
  governance: {
    ambassadors: string;
    mixity: string;
    training: string;
  };
  methodology: {
    calculation: string;
    reporting: string;
    iro: string;
    verification: string;
    assurance: string;
    cycle: string;
    limits: string;
  };
  supply: string;
  norms: Norm[];
}

const defaultData: OrgData = {
  sectors: 'Services financiers, conseil en stratégie et développement durable',
  challenges: 'Transition énergétique, digitalisation responsable, inclusion sociale',
  type: 'Rapport de durabilité conforme à la directive CSRD',
  entities: 'Vision & Stratégie SA et ses filiales consolidées',
  duration: 'Exercice 2024 (1er janvier au 31 décembre 2024)',
  geo: 'Abidjan et Yamoussoukro (Côte d’Ivoire)',
  governance: {
    ambassadors: '15 ambassadeurs DD répartis dans toutes les directions',
    mixity: '45 % de femmes au sein du comité de direction',
    training: '100 % des dirigeants formés aux enjeux ESG'
  },
  methodology: {
    calculation: 'Méthodes standardisées selon les référentiels GRI et CSRD',
    reporting: 'Collecte trimestrielle, consolidation annuelle',
    iro: 'Matrice impact/probabilité sur 5 niveaux',
    verification: 'Vérification Interne : Audit interne\nVérification Externe : Cabinet spécialisé',
    assurance: 'Assurance modérée : Niveau de confiance raisonnable\nAssurance raisonnable : Niveau de confiance plus élevé',
    cycle: 'Le reporting se réalise chaque année du 1er janvier au 31 décembre.',
    limits: 'Certaines émissions indirectes (Scope 3) sont mal couvertes ou exclues'
  },
  supply: 'Intégration de critères environnementaux dans les appels d’offres. Procédures de sélection des fournisseurs basées sur des critères ESG.',
  norms: [ 
    { name: 'CSRD', status: 'Conforme', color: 'green' },
    { name: 'GRI', status: 'Standards 2021', color: 'blue' },
    { name: 'TCFD', status: 'Aligné', color: 'purple' },
    { name: 'ODD', status: '17 objectifs', color: 'amber' }
  ]
};

const colorMap: Record<string, string> = {
  green: 'bg-green-50 text-green-800 border-green-200',
  blue: 'bg-blue-50 text-blue-800 border-blue-200',
  purple: 'bg-purple-50 text-purple-800 border-purple-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200'
};

export const InformationsGenerales: React.FC<Props> = ({ currentOrganization }) => {
  const { user, profile } = useAuthStore();
  const canEdit = ['admin', 'enterprise'].includes(profile?.role ?? '');

  const [data, setData] = useState<OrgData>(defaultData);
  const [draft, setDraft] = useState<OrgData>(defaultData);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ---------- CHARGEMENT ---------- */
  const loadData = async () => {
    setLoading(true);
    const { data: row, error } = await supabase
      .from('general_infos')
      .select('data')
      .eq('organization_name', currentOrganization)
      .single();
    if (!error && row) {
      setData({ ...defaultData, ...row.data });
    } else {
      await supabase.from('general_infos').insert({
        organization_name: currentOrganization,
        data: defaultData,
        updated_by: user?.email
      });
      setData(defaultData);
    }
    setLoading(false);
  };

  /* ---------- SAUVEGARDE ---------- */
  const saveData = async () => {
    setSaving(true);
    await supabase.from('general_infos').upsert(
      { organization_name: currentOrganization, data: draft, updated_by: user?.email },
      { onConflict: 'organization_name' }
    );
    setData(draft);
    setIsEditing(false);
    setSaving(false);
  };

  useEffect(() => {
    loadData();
  }, [currentOrganization]);

  if (loading) return <p className="p-4 text-gray-500">Chargement…</p>;

  /* ---------- RENDER ---------- */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 lg:p-8"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Informations générales</h2>
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
        /* ---------- MODE ÉDITION ---------- */
        <div className="space-y-6">
          {/* Contexte */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contexte</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secteurs d'activité</label>
            <textarea
              value={draft.sectors}
              onChange={(e) => setDraft({ ...draft, sectors: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Défis principaux</label>
            <textarea
              value={draft.challenges}
              onChange={(e) => setDraft({ ...draft, challenges: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Type de rapport */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Type de rapport</h3>
            <textarea
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Périmètre de déclaration */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Périmètre de déclaration</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entités incluses</label>
            <textarea
              value={draft.entities}
              onChange={(e) => setDraft({ ...draft, entities: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Périmètre géographique</label>
            <textarea
              value={draft.geo}
              onChange={(e) => setDraft({ ...draft, geo: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Gouvernance */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gouvernance</h3>
            {Object.entries(data.governance).map(([key, val]) => (
              <div key={key} className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {key === 'ambassadors' ? 'Réseau des ambassadeurs' : key === 'mixity' ? 'Ratio de mixité' : 'Rémunération des dirigeants'}
                </label>
                <textarea
                  value={draft.governance[key as keyof typeof draft.governance]}
                  onChange={(e) =>
                    setDraft({ ...draft, governance: { ...draft.governance, [key]: e.target.value } })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            ))}
          </div>

{/* Méthodologie */}
<div className="bg-white rounded-lg p-6 shadow-sm border">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthodologie</h3>

  {[
    ['calculation', 'Calcul des indicateurs'],
    ['reporting', 'Reporting'],
    ['iro', 'Cotation des IRO'],
    ['verification', 'Vérification'],
    ['assurance', 'Assurance'],
    ['cycle', 'Cycle de reporting et limites méthodologiques'],
  ].map(([key, label]) => (
    <div key={key} className="mb-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={draft.methodology[key as keyof typeof draft.methodology]}
        onChange={(e) =>
          setDraft({ ...draft, methodology: { ...draft.methodology, [key]: e.target.value } })
        }
        rows={key === 'verification' || key === 'assurance' ? 3 : 2}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>
  ))}
</div>

          {/* Durée de Reporting */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Durée de Reporting</h3>
            <textarea
              value={draft.supply}
              onChange={(e) => setDraft({ ...draft, supply: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Normes */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Déclaration de conformité</h3>
            {draft.norms.map((norm, idx) => (
              <div key={idx} className="flex items-center gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Norme"
                  value={norm.name}
                  onChange={(e) => {
                    const newNorms = [...draft.norms];
                    newNorms[idx].name = e.target.value;
                    setDraft({ ...draft, norms: newNorms });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Statut"
                  value={norm.status}
                  onChange={(e) => {
                    const newNorms = [...draft.norms];
                    newNorms[idx].status = e.target.value;
                    setDraft({ ...draft, norms: newNorms });
                  }}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <select
                  value={norm.color}
                  onChange={(e) => {
                    const newNorms = [...draft.norms];
                    newNorms[idx].color = e.target.value;
                    setDraft({ ...draft, norms: newNorms });
                  }}
                  className="w-28 px-2 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="green">Vert</option>
                  <option value="blue">Bleu</option>
                  <option value="purple">Violet</option>
                  <option value="amber">Amber</option>
                </select>
                <button
                  onClick={() => setDraft({ ...draft, norms: draft.norms.filter((_, i) => i !== idx) })}
                  className="text-red-500 text-sm"
                >
                  Supprimer
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setDraft({
                  ...draft,
                  norms: [...draft.norms, { name: '', status: '', color: 'green' }]
                })
              }
              className="mt-2 text-sm text-blue-600 underline"
            >
              + Ajouter une norme
            </button>
          </div>

          {/* Sauvegarder */}
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
        /* ---------- MODE LECTURE ---------- */
<div className="space-y-8">
  {/* Contexte */}
  <div className="bg-white rounded-lg p-6 shadow-sm border">
    <h3 className="text-xl font-semibold text-gray-900 mb-4">Contexte</h3>
    <p><strong>Secteurs d’activité :</strong> <span className="text-black">{data.sectors}</span></p>
    <p><strong>Défis principaux :</strong> <span className="text-black">{data.challenges}</span></p>
  </div>

  {/* Type de rapport */}
  <div className="bg-white rounded-lg p-6 shadow-sm border">
    <h3 className="text-xl font-semibold text-gray-900 mb-4">Type de rapport</h3>
    <p className="text-black">{data.type}</p>
  </div>

  {/* Périmètre de déclaration */}
  <div className="bg-white rounded-lg p-6 shadow-sm border">
    <h3 className="text-xl font-semibold text-gray-900 mb-4">Périmètre de déclaration</h3>
    <p><strong>Entités incluses :</strong> <span className="text-black">{data.entities}</span></p>
    <p><strong>Périmètre géographique :</strong> <span className="text-black">{data.geo}</span></p>
  </div>

  {/* Durée de reporting */}
  <div className="bg-white rounded-lg p-6 shadow-sm border">
    <h3 className="text-xl font-semibold text-gray-900 mb-4">Durée de reporting</h3>
    <p className="text-black">{data.duration}</p>
  </div>

  {/* Gouvernance */}
  <div className="bg-white rounded-lg p-6 shadow-sm border">
    <h3 className="text-xl font-semibold text-gray-900 mb-4">Gouvernance</h3>
    <p><strong>Réseau des ambassadeurs :</strong> <span className="text-black">{data.governance.ambassadors}</span></p>
    <p><strong>Ratio de mixité :</strong> <span className="text-black">{data.governance.mixity}</span></p>
    <p><strong>Rémunération des dirigeants :</strong> <span className="text-black">{data.governance.training}</span></p>
  </div>

   {/* Déclaration de conformité */}
  <div className="bg-white rounded-lg p-6 shadow-sm border">
    <h3 className="text-xl font-semibold text-gray-900 mb-4">Déclaration de conformité</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {data.norms.map((n) => (
        <div
          key={n.name}
          className={`text-center p-3 rounded-lg border ${colorMap[n.color]}`}
        >
          <div className="font-semibold text-black">{n.name}</div>
          <div className="text-sm text-black">{n.status}</div>
        </div>
      ))}
    </div>
  </div>
</div>
      )}
      
 {/* Méthodologie */}
<div className="bg-white rounded-lg p-6 shadow-sm border">
  <h3 className="text-xl font-semibold text-gray-900 mb-4">Méthodologie</h3>
  <p><strong>Calcul des indicateurs :</strong> <span className="text-black">{data.methodology.calculation}</span></p>
  <p><strong>Reporting :</strong> <span className="text-black">{data.methodology.reporting}</span></p>
  <p><strong>Cotation des IRO :</strong> <span className="text-black">{data.methodology.iro}</span></p>
  <p><strong>Vérification :</strong> <span className="text-black">{data.methodology.verification}</span></p>
  <p><strong>Assurance :</strong> <span className="text-black">{data.methodology.assurance}</span></p>
  <p><strong>Cycle de reporting et limites méthodologiques :</strong> <span className="text-black">{data.methodology.cycle}</span></p>
</div>

 
    </motion.div>
  );
};