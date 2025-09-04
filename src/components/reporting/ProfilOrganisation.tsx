import React, { useEffect, useState } from 'react';
import {
  Edit3,
  Save,
  X,
  Building2,
  MapPin,
  Briefcase,
  Users,
  Globe,
  Link
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface Props {
  currentOrganization: string;
}

type OrgInfo = {
  name: string;
  activity: string;
  sites: string;
  legalForm: string;
  capital: string;
  markets: string;
  supplyChain: string;
  alliances: string;
};

const defaultOrgInfo: OrgInfo = {
  name: 'VISION & STRATEGIE GROUPE',
  activity: 'Audit, accompagnement et formation en RSE et transition durable',
  sites: 'Abidjan et Yamoussoukro, Côte d’Ivoire',
  legalForm: 'SARL',
  capital: '10 000 000 FCFA',
  markets: 'Côte d’Ivoire et sous-région',
  supplyChain:
    'Chaîne d’approvisionnement étendue et diversifiée – levier stratégique et facteur de risque à maîtriser.',
  alliances: 'Partenaires ESG : Materiality Reporting France, FORETHIX Luxembourg'
};

export const ProfilOrganisation: React.FC<Props> = ({ currentOrganization }) => {
  const { user, profile } = useAuthStore();

  const [infos, setInfos] = useState<OrgInfo>(defaultOrgInfo);
  const [draft, setDraft] = useState<OrgInfo>(defaultOrgInfo);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const canEdit = ['admin', 'enterprise'].includes(profile?.role ?? '');

  /* ---------- CHARGEMENT ---------- */
  const loadInfos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('org_profiles')
      .select('infos')
      .eq('organization_name', currentOrganization)
      .single();

    if (!error && data) {
      setInfos({ ...defaultOrgInfo, ...data.infos });
    } else {
      await supabase.from('org_profiles').insert({
        organization_name: currentOrganization,
        infos: defaultOrgInfo,
        updated_by: user?.email
      });
      setInfos(defaultOrgInfo);
    }
    setLoading(false);
  };

  /* ---------- SAUVEGARDE ---------- */
  const saveInfos = async () => {
    setSaving(true);
    await supabase
      .from('org_profiles')
      .upsert(
        {
          organization_name: currentOrganization,
          infos: draft,
          updated_by: user?.email
        },
        { onConflict: 'organization_name' }
      );
    setInfos(draft);
    setIsEditing(false);
    setSaving(false);
  };

  useEffect(() => {
    loadInfos();
  }, [currentOrganization]);

  if (loading) return <p className="p-4 text-gray-500">Chargement…</p>;

  const fields: (keyof OrgInfo)[] = [
    'name',
    'activity',
    'sites',
    'legalForm',
    'capital',
    'markets',
    'supplyChain',
    'alliances'
  ];

  const labels: Record<keyof OrgInfo, string> = {
    name: 'Nom de l’organisation',
    activity: 'Activités, produits et services',
    sites: 'Sites et localisation',
    legalForm: 'Forme juridique',
    capital: 'Capital',
    markets: 'Marchés desservis',
    supplyChain: 'Chaîne d’approvisionnement',
    alliances: 'Alliances stratégiques'
  };

  const icons: Record<keyof OrgInfo, React.ElementType> = {
    name: Users,
    activity: Briefcase,
    sites: MapPin,
    legalForm: Building2,
    capital: Users,
    markets: Globe,
    supplyChain: Link,
    alliances: Link
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Profil de l’organisation</h2>
        {canEdit && !isEditing && (
          <button
            onClick={() => {
              setDraft(infos);
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {fields.map((key) => {
              const Icon = icons[key];
              return (
                <div key={key}>
                  <label className="flex items-center text-base font-bold text-gray-900 mb-1">
                    <Icon className="h-5 w-5 mr-2 text-gray-500" />
                    {labels[key]}
                  </label>
                  <textarea
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                    rows={key === 'supplyChain' || key === 'alliances' ? 3 : 2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                  />
                </div>
              );
            })}
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
              onClick={saveInfos}
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {fields.map((key) => {
              const Icon = icons[key];
              return (
                <div key={key}>
                  <div className="flex items-center text-base font-bold text-gray-900 mb-1">
                    <Icon className="h-5 w-5 mr-2 text-gray-500" />
                    {labels[key]}
                  </div>
                  <p className="text-black whitespace-pre-line">{infos[key]}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};