import React, { useEffect, useState, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Globe, FileText, Shield, Target, Upload, Download, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface Props {
  currentOrganization: string;
}

type IndexTab = 'global' | 'gri' | 'csrd' | 'odd';

interface IndexFile {
  file_url: string;
  file_name: string;
  updated_at: string;
}

export const IndexReporting: React.FC<Props> = ({ currentOrganization }) => {
  const { user, profile } = useAuthStore();
  const canEdit = ['admin', 'enterprise'].includes(profile?.role ?? '');

  const [activeTab, setActiveTab] = useState<IndexTab>('global');
  const [files, setFiles] = useState<Record<IndexTab, IndexFile | null>>({
    global: null,
    gri: null,
    csrd: null,
    odd: null,
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ---------- DATA ---------- */
  const loadFiles = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('index_files')
      .select('file_url, file_name, updated_at, index_type')
      .eq('organization_name', currentOrganization);

    if (!error && rows) {
      const map: Record<IndexTab, IndexFile | null> = {
        global: null,
        gri: null,
        csrd: null,
        odd: null,
      };
      rows.forEach((r) => {
        map[r.index_type as IndexTab] = {
          file_url: r.file_url,
          file_name: r.file_name,
          updated_at: r.updated_at,
        };
      });
      setFiles(map);
    }
    setLoading(false);
  };

  const uploadFile = async (e: ChangeEvent<HTMLInputElement>, type: IndexTab) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = file.name.split('.').pop();
    const path = `${currentOrganization}/index_${type}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('index_excels')
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('index_excels').getPublicUrl(path);
      await supabase.from('index_files').upsert(
        {
          organization_name: currentOrganization,
          index_type: type,
          file_url: urlData.publicUrl,
          file_name: file.name,
          updated_by: user?.email,
        },
        { onConflict: 'organization_name, index_type' }
      );
      await loadFiles();
    }
    setUploading(false);
  };

  const deleteFile = async (type: IndexTab) => {
    const url = files[type]?.file_url;
    if (!url) return;
    const path = new URL(url).pathname.split('/').pop()!;

    await supabase.storage.from('index_excels').remove([path]);
    await supabase.from('index_files').delete().match({ organization_name: currentOrganization, index_type: type });
    await loadFiles();
  };

  useEffect(() => {
    loadFiles();
  }, [currentOrganization]);

  if (loading) return <p className="p-4 text-gray-500">Chargement…</p>;

  const tabConfig = [
    { key: 'global', label: 'Index Global', icon: Globe },
    { key: 'gri', label: 'Index GRI', icon: FileText },
    { key: 'csrd', label: 'Index CSRD', icon: Shield },
    { key: 'odd', label: 'Index ODD', icon: Target },
  ] as { key: IndexTab; label: string; icon: React.ElementType }[];

  return (
    <div className="p-6 lg:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Index</h2>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabConfig.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tabConfig.find((t) => t.key === activeTab)?.label}
          </h3>
          {canEdit && !files[activeTab] && (
            <label className="cursor-pointer flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
              <Upload className="h-4 w-4 mr-2" />
              Ajouter Excel
              <input
                type="file"
                accept=".xls,.xlsx"
                onChange={(e) => uploadFile(e, activeTab)}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* File display */}
        {files[activeTab] ? (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{files[activeTab]?.file_name}</p>
                <p className="text-xs text-gray-500">
                  Mis à jour le {new Date(files[activeTab]?.updated_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <a
                  href={files[activeTab]?.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Télécharger
                </a>
                {canEdit && (
                  <button
                    onClick={() => deleteFile(activeTab)}
                    className="flex items-center px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              Aucun fichier Excel n’a été ajouté pour {tabConfig.find((t) => t.key === activeTab)?.label}.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};