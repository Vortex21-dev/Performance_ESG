import React, { useEffect, useState, ChangeEvent } from 'react';
import { Edit3, Save, X, UploadCloud, Trash2, UserCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface Props {
  currentOrganization: string;
}

interface CeoData {
  message: string;
  photo_url?: string;
  signature_url?: string;
}

export const MotDuDirigeant: React.FC<Props> = ({ currentOrganization }) => {
  const { user, profile } = useAuthStore();
  const canEdit = ['admin', 'enterprise'].includes(profile?.role ?? '');

  const [data, setData] = useState<CeoData>({ message: '' });
  const [draft, setDraft] = useState<CeoData>({ message: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<'photo' | 'signature' | null>(null);

  /* ---------- DATA ---------- */
  const fetchData = async () => {
    setLoading(true);
    const { data: row, error } = await supabase
      .from('ceo_messages')
      .select('message, photo_url, signature_url')
      .eq('organization_name', currentOrganization)
      .maybeSingle();

    if (!error && row) {
      setData({
        message: row.message || '',
        photo_url: row.photo_url,
        signature_url: row.signature_url
      });
    } else {
      const defaultMsg = defaultMessage();
      await supabase.from('ceo_messages').upsert({
        organization_name: currentOrganization,
        message: defaultMsg,
        updated_by: user?.email,
      });
      setData({ message: defaultMsg });
    }
    setLoading(false);
  };

  const saveData = async () => {
    setSaving(true);
    await supabase
      .from('ceo_messages')
      .upsert(
        { 
          organization_name: currentOrganization, 
          message: draft.message,
          photo_url: draft.photo_url,
          signature_url: draft.signature_url,
          updated_by: user?.email 
        },
        { onConflict: 'organization_name' }
      );
    setData(draft);
    setIsEditing(false);
    setSaving(false);
  };

  /* ---------- IMAGE HELPERS ---------- */
  const handleUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    field: 'photo_url' | 'signature_url',
    bucket: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field === 'photo_url' ? 'photo' : 'signature');

    const fileName = `${currentOrganization}/${field}_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });

    if (!error) {
      const { data: url } = supabase.storage.from(bucket).getPublicUrl(fileName);
      setDraft({ ...draft, [field]: url.publicUrl });
    }
    setUploading(null);
  };

  const handleDelete = async (field: 'photo_url' | 'signature_url', bucket: string) => {
    const url = draft[field];
    if (!url) return;
    try {
      const path = new URL(url).pathname.split('/').pop()!;
      await supabase.storage.from(bucket).remove([path]);
      setDraft({ ...draft, [field]: '' });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentOrganization]);

  if (loading) return <p className="p-4 text-gray-500">Chargement…</p>;

  const renderImage = (url?: string, label?: string) =>
    url ? (
      <div className="mt-3">
        <img src={url} alt={label} className="max-h-40 rounded-lg border object-contain" />
        {isEditing && (
          <button
            onClick={() =>
              handleDelete(
                label === 'Photo' ? 'photo_url' : 'signature_url',
                label === 'Photo' ? 'ceo_photos' : 'ceo_signatures'
              )
            }
            className="mt-1 flex items-center text-sm text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Supprimer
          </button>
        )}
      </div>
    ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-3 rounded-xl bg-blue-100 mr-4">
            <UserCircle className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mot du dirigeant</h2>
            <p className="text-sm text-gray-600">Message de <strong>{currentOrganization}</strong></p>
          </div>
        </div>

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
        /* ──  MODE ÉDITION  ── */
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <AlertCircle className="inline h-4 w-4 mr-1" />
            Seul l’administrateur peut modifier ce texte.
          </div>

          {/* Message */}
          <textarea
            value={draft.message}
            onChange={(e) => setDraft({ ...draft, message: e.target.value })}
            rows={12}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          /> 

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium mb-1">Photo du dirigeant</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e, 'photo_url', 'ceo_photos')}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploading === 'photo' && <p className="text-xs text-gray-500 mt-1">Upload…</p>}
            {renderImage(draft.photo_url, 'Photo')}
          </div>

          {/* Signature */}
          <div>
            <label className="block text-sm font-medium mb-1">Signature (PNG/JPG)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e, 'signature_url', 'ceo_signatures')}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            {uploading === 'signature' && <p className="text-xs text-gray-500 mt-1">Upload…</p>}
            {renderImage(draft.signature_url, 'Signature')}
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
        /* ──  MODE LECTURE  ── */
        <div className="space-y-4">
          {data.photo_url && (
            <img
              src={data.photo_url}
              alt="Directeur"
              className="w-32 h-32 rounded-full object-cover border-2 border-blue-200"
            />
          )}

          <div className="prose max-w-none text-gray-700 whitespace-pre-line">
            {data.message}
          </div>

          {data.signature_url && (
            <img
              src={data.signature_url}
              alt="Signature"
              className="h-16 object-contain"
            />
          )}

        </div>
      )}
    </motion.div>
  );
};

/* default message */
const defaultMessage = () =>
  `Chers partenaires,

En tant qu’acteur engagé, nous plaçons la responsabilité sociétale au cœur de notre stratégie. Cette année, nous avons franchi de nouvelles étapes : réduction des émissions, inclusion renforcée, gouvernance exemplaire.

Merci à toutes celles et ceux qui rendent cet engagement possible.

Directeur Exécutif`; 