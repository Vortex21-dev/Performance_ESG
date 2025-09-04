import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useOrganizationLogo } from '../../hooks/useOrganizationLogo';
import { motion } from 'framer-motion';
import {
  Building2,
  BarChart as ChartBar,
  ClipboardList,
  Settings2,
  Upload,
  Edit3,
  X,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { LogoutButton } from '../../components/ui/LogoutButton';
import toast from 'react-hot-toast';

const modules = [
  {
    name: 'Pilotage',
    description: 'Suivez et pilotez vos indicateurs ESG en temps réel',
    icon: ChartBar,
    path: '/enterprise/collection',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Gestion',
    description: 'Gérez votre configuration ESG, équipes et permissions',
    icon: Settings2,
    path: '/enterprise/management',
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Reporting',
    description: 'Générez des rapports ESG certifiés et conformes',
    icon: ClipboardList,
    path: '/enterprise/reporting',
    color: 'from-green-500 to-emerald-500',
  },
];

export function EnterpriseDashboard() {
  const navigate = useNavigate();
  const { profile, user, impersonatedOrganization, setImpersonatedOrganization } = useAuthStore();
  const { logoUrl, uploadLogo, removeLogo } = useOrganizationLogo();
  const [editingLogo, setEditingLogo] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const isEnterprise = profile?.role === 'enterprise';
  const isContributor = profile?.role === 'contributor';
  const isValidator = profile?.role === 'validator';
  const hasAccess = isEnterprise || isContributor || isValidator || (isAdmin && impersonatedOrganization);

  if (!profile || !hasAccess) {
    navigate('/login');
    return null;
  }

  const orgName = impersonatedOrganization || profile.organization_name;

  const handleBackToAdmin = () => {
    setImpersonatedOrganization(null);
    navigate('/admin/dashboard');
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await uploadLogo(file);
      toast.success('Logo enregistré');
    } catch (err: any) {
      toast.error(err.message || 'Erreur upload');
    } finally {
      setUploading(false);
      setEditingLogo(false);
    }
  };

  const onRemove = async () => {
    try {
      await removeLogo();
      toast.success('Logo supprimé');
    } catch (err: any) {
      toast.error(err.message || 'Erreur suppression');
    }
    setEditingLogo(false);
  };

  const getDisplayRole = () => {
    if (isAdmin && impersonatedOrganization) return 'Administrateur Système';
    if (isAdmin) return 'Administrateur';
    if (isEnterprise) return 'Responsable ESG';
    if (isContributor) return 'Contributeur';
    if (isValidator) return 'Validateur';
    return user?.fonction || 'Utilisateur';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        {/* Bannière */}
        <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg w-full">
          <img src="/Imade full VSG.jpg" alt="ESG Banner" className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Logo persistent */}
              <div className="relative">
                {logoUrl ? (
                  <div className="relative group">
                    <img
                      src={logoUrl}
                      alt={`${orgName} Logo`}
                      className="h-16 w-16 object-contain rounded-lg border border-gray-200"
                    />
                    {(isAdmin || isEnterprise) && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center">
                        <button onClick={() => setEditingLogo(true)} className="text-white">
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    {(isAdmin || isEnterprise) ? (
                      <button onClick={() => setEditingLogo(true)} className="text-gray-400 hover:text-gray-600">
                        <Upload className="h-6 w-6" />
                      </button>
                    ) : (
                      <Building2 className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Infos */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{orgName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">Dashboard Premium</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-green-600 font-medium">Connecté</span>
                </div>
              </div>
            </div>

            {/* User */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {user?.prenom} {user?.nom}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    {getDisplayRole()}
                  </span>
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>

          {/* Mode admin */}
          {isAdmin && impersonatedOrganization && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-amber-600 mr-2" />
                  <span className="text-sm font-medium text-amber-800">
                    Mode Administrateur - Accès à : {impersonatedOrganization}
                  </span>
                </div>
                <button
                  onClick={handleBackToAdmin}
                  className="flex items-center px-3 py-1 text-sm font-medium text-amber-700 bg-amber-100 rounded-md hover:bg-amber-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Retour Admin
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modules */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {modules.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate(m.path)}
              className="cursor-pointer relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border-2 border-gray-200 shadow-lg hover:border-green-500 transition-all"
            >
              <div className={`inline-flex rounded-xl bg-gradient-to-r ${m.color} p-4 mb-4`}>
                <m.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{m.name}</h3>
              <p className="text-sm text-gray-600">{m.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Modal logo */}
        {editingLogo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Gérer le logo</h3>

              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo actuel"
                  className="h-20 w-20 object-contain mx-auto mb-4 border rounded"
                />
              )}

              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="mb-4 w-full"
              />

              {logoUrl && (
                <button
                  onClick={onRemove}
                  className="w-full mb-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                >
                  Supprimer le logo
                </button>
              )}

              <button
                onClick={() => setEditingLogo(false)}
                className="w-full px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Fermer
              </button>

              {uploading && <p className="text-sm text-center mt-2">Upload en cours…</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}