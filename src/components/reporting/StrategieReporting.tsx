import React, { useEffect, useState, ChangeEvent } from 'react';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import {
  Target,
  ChevronDown,
  Eye,
  CheckSquare,
  AlertTriangle,
  Award,
  LineChart,
  Edit,
  FileText,
  Trash2,
  UploadCloud,
  Download,
  Save,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface Props {
  currentOrganization: string;
}

type TabName =
  | 'vision'
  | 'engagements'
  | 'enjeux'
  | 'strategie'
  | 'roadmap';

interface Content {
  content: string;
  image_url?: string;
  pdf_url?: string;
}

export const StrategieReporting: React.FC<Props> = ({ currentOrganization }) => {
  const { user, profile } = useAuthStore();
  const canEdit = ['admin', 'enterprise'].includes(profile?.role ?? '');

  const [activeTab, setActiveTab] = useState<TabName>('vision');
  const [data, setData] = useState<Record<TabName, Content>>({
    vision: { content: '' },
    engagements: { content: '' },
    enjeux: { content: '' },
    strategie: { content: '' },
    roadmap: { content: '' },
  });
  const [draft, setDraft] = useState<Record<TabName, Content>>({
    vision: { content: '' },
    engagements: { content: '' },
    enjeux: { content: '' },
    strategie: { content: '' },
    roadmap: { content: '' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<false | 'image' | 'pdf'>(false);
  const [isEditing, setIsEditing] = useState(false);

  /* ---------- DATA ---------- */
  const loadAll = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('strategy_contents')
      .select('*')
      .eq('organization_name', currentOrganization);

    if (!error && rows) {
      const map: Record<TabName, Content> = {
        vision: { content: '' },
        engagements: { content: '' },
        enjeux: { content: '' },
        strategie: { content: '' },
        roadmap: { content: '' },
      };
      rows.forEach((r) => {
        map[r.tab_name as TabName] = {
          content: r.content || '',
          image_url: r.image_url || undefined,
          pdf_url: r.pdf_url || undefined,
        };
      });
      setData(map);
      setDraft(map);
    }
    setLoading(false);
  };

  const save = async (tab: TabName) => {
    setSaving(true);
    await supabase
      .from('strategy_contents')
      .upsert(
        {
          organization_name: currentOrganization,
          tab_name: tab,
          content: draft[tab].content,
          image_url: draft[tab].image_url || null,
          pdf_url: draft[tab].pdf_url || null,
          updated_by: user?.email,
        },
        { onConflict: 'organization_name, tab_name' }
      );
    setData({ ...data, [tab]: draft[tab] });
    setSaving(false);
    setIsEditing(false);
  };

  /* ---------- UPLOAD / DELETE ---------- */
  const handleUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    tab: TabName,
    type: 'image' | 'pdf'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(type);

    const bucket = type === 'image' ? 'strategy_images' : 'strategy_pdfs';
    const ext = file.name.split('.').pop();
    const path = `${currentOrganization}/${tab}_${type}_${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
    });
    if (!error) {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const key = type === 'image' ? 'image_url' : 'pdf_url';
      setDraft({ ...draft, [tab]: { ...draft[tab], [key]: urlData.publicUrl } });
    }
    setUploading(false);
  };

  const handleDelete = async (tab: TabName, type: 'image' | 'pdf') => {
    const key = type === 'image' ? 'image_url' : 'pdf_url';
    const url = draft[tab][key];
    if (!url) return;

    const path = new URL(url).pathname.split('/').pop()!;
    await supabase.storage
      .from(type === 'image' ? 'strategy_images' : 'strategy_pdfs')
      .remove([path]);
    setDraft({ ...draft, [tab]: { ...draft[tab], [key]: undefined } });
  };

  useEffect(() => {
    loadAll();
  }, [currentOrganization]);

  if (loading) return <p className="p-4 text-gray-500">Chargement…</p>;

  /* ---------- TABS CONFIG ---------- */
  const tabs: Record<TabName, { icon: JSX.Element; label: string }> = {
    vision: { icon: <Eye className="h-5 w-5" />, label: 'Vision DD' },
    engagements: { icon: <CheckSquare className="h-5 w-5" />, label: 'Engagements DD' },
    enjeux: { icon: <AlertTriangle className="h-5 w-5" />, label: 'Enjeux DD' },
    strategie: { icon: <Award className="h-5 w-5" />, label: 'Stratégie DD' },
    roadmap: { icon: <LineChart className="h-5 w-5" />, label: 'Road Map DD' },
  };

  /* ---------- DEFAULT CONTENT ---------- */
  const defaultContent: Record<TabName, Content> = {
    vision: {
      content:
        'Vision DD\n\nNotre vision est d’intégrer pleinement les enjeux ESG dans la stratégie globale de ' +
        currentOrganization +
        ', garantissant une croissance durable, responsable et inclusive.',
      image_url: undefined,
      pdf_url: undefined,
    },
    engagements: {
      content:
        'Engagements DD\n\nNous nous engageons à réduire nos émissions de 30 % d’ici 2030, à promouvoir la diversité et à garantir une gouvernance éthique.',
      image_url: undefined,
      pdf_url: undefined,
    },
    enjeux: {
      content:
        'Enjeux DD\n\nLes principaux enjeux identifiés concernent la transition énergétique, la gestion responsable des ressources et l’inclusion sociale.',
      image_url: undefined,
      pdf_url: undefined,
    },
    strategie: {
      content:
        'Stratégie DD\n\nNotre stratégie repose sur des objectifs SMART, une gouvernance robuste et des indicateurs de performance clairs.',
      image_url: undefined,
      pdf_url: undefined,
    },
    roadmap: {
      content:
        'Road Map DD\n\nCalendrier de mise en œuvre 2024-2030 avec jalons trimestriels et revues annuelles.',
      image_url: undefined,
      pdf_url: undefined,
    },
  };

  /* ---------- RENDER ---------- */
  return (
    <div className="p-6 lg:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Stratégie</h2>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {/* Dropdown wrapper */}
          <Menu as="div" className="relative">
            <Menu.Button
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                ['vision', 'engagements', 'enjeux'].includes(activeTab)
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Target className="h-5 w-5 mr-2" />
              Alignement stratégique DD
              <ChevronDown className="h-4 w-4 ml-1" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 mt-2 w-64 origin-top-left bg-white border border-gray-200 rounded-lg shadow-lg focus:outline-none z-10">
                {(['vision', 'engagements', 'enjeux'] as TabName[]).map((t) => (
                  <Menu.Item key={t}>
                    {({ active }) => (
                      <button
                        onClick={() => setActiveTab(t)}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } ${
                          activeTab === t ? 'bg-gray-100 font-medium' : ''
                        } flex items-center w-full px-4 py-2 text-sm text-gray-700 rounded-md`}
                      >
                        {tabs[t].icon}
                        <span className="ml-3">{tabs[t].label}</span>
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>

          {(['strategie', 'roadmap'] as TabName[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === t
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tabs[t].icon}
              <span className="ml-2">{tabs[t].label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        {isEditing ? (
          /* ---------- MODE ÉDITION ---------- */
          <div className="p-6 space-y-6">
            <h3 className="text-xl font-bold text-gray-900">
              Modifier {tabs[activeTab].label}
            </h3>

            {/* Text */}
            <label className="block text-sm font-medium text-gray-700">Contenu</label>
            <textarea
              value={draft[activeTab].content}
              onChange={(e) =>
                setDraft({ ...draft, [activeTab]: { ...draft[activeTab], content: e.target.value } })
              }
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />

            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Image (JPG/PNG)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload(e, activeTab, 'image')}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploading === 'image' && <p className="text-xs text-gray-500 mt-1">Upload…</p>}
              {draft[activeTab].image_url && (
                <div className="mt-2">
                  <img
                    src={draft[activeTab].image_url}
                    alt=""
                    className="max-h-60 rounded-lg border object-contain"
                  />
                  <button
                    onClick={() => handleDelete(activeTab, 'image')}
                    className="mt-1 flex items-center text-sm text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>

            {/* PDF upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => handleUpload(e, activeTab, 'pdf')}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {uploading === 'pdf' && <p className="text-xs text-gray-500 mt-1">Upload…</p>}
              {draft[activeTab].pdf_url && (
                <div className="mt-2 flex items-center space-x-3">
                  <a
                    href={draft[activeTab].pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Voir le PDF
                  </a>
                  <button
                    onClick={() => handleDelete(activeTab, 'pdf')}
                    className="flex items-center text-sm text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={() => save(activeTab)}
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
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{tabs[activeTab].label}</h3>
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </button>
              )}
            </div>

            {/* Core content */}
            <div className="prose max-w-none text-gray-700 whitespace-pre-line">
              {data[activeTab].content || defaultContent[activeTab].content}
            </div>

            {/* Image */}
            {data[activeTab].image_url && (
              <div className="mt-4">
                <img
                  src={data[activeTab].image_url}
                  alt={`${tabs[activeTab].label} illustration`}
                  className="max-h-72 w-auto rounded-lg border object-contain"
                />
              </div>
            )}

            {/* PDF */}
            {data[activeTab].pdf_url && (
              <div className="mt-4">
                <a
                  href={data[activeTab].pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Consulter le PDF
                </a>
              </div>
            )}

            {/* Placeholder when nothing is configured */}
            {!data[activeTab].content &&
              !data[activeTab].image_url &&
              !data[activeTab].pdf_url && (
                <div className="text-center py-10">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    Ce module n’a pas encore été configuré.
                  </p>
                </div>
              )}
          </div>
        )}
      </motion.div>
    </div>
  );
};