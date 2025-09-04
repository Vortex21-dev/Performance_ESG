import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  UserCircle,
  Edit3,
  Plus,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserProfile {
  email: string;
  nom: string;
  prenom: string;
  fonction: string;
  role: 'contributor' | 'validator';
  organization_name?: string;
  organization_level?: string;
  business_line_name?: string;
  subsidiary_name?: string;
  site_name?: string;
  processes?: string[];
}

interface Process {
  code: string;
  name: string;
}

export const UsersManagement: React.FC = () => {
  const { profile, impersonatedOrganization } = useAuthStore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allProcesses, setAllProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<UserProfile>>({});
  const [userProcesses, setUserProcesses] = useState<string[]>([]);

  const currentOrg = impersonatedOrganization || profile?.organization_name;
  const allowedRoles: UserProfile['role'][] = ['contributor', 'validator'];

  /* ------------------------------------------
     Traduction rôle
  ------------------------------------------ */
  const translateRole = (r: string) =>
    r === 'contributor' ? 'contributeur' : 'validateur';

  /* ------------------------------------------
     Chargement des données
  ------------------------------------------ */
  useEffect(() => {
    if (!currentOrg) return;
    fetchUsers();
    fetchProcesses();
  }, [currentOrg]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          email,
          role,
          organization_level,
          organization_name,
          business_line_name,
          subsidiary_name,
          site_name,
          user:users!profiles_email_fkey (
            nom,
            prenom,
            fonction
          ),
          user_processes (
            process_codes
          )
        `
        )
        .eq('organization_name', currentOrg)
        .in('role', allowedRoles);

      if (error) throw error;

      const users: UserProfile[] = (data || []).map((p: any) => ({
        email: p.email,
        nom: p.user?.nom || '',
        prenom: p.user?.prenom || '',
        fonction: p.user?.fonction || '',
        role: p.role || 'contributor',
        organization_name: p.organization_name,
        organization_level: p.organization_level,
        business_line_name: p.business_line_name,
        subsidiary_name: p.subsidiary_name,
        site_name: p.site_name,
        processes: p.user_processes?.process_codes || [],
      }));
      setUsers(users);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProcesses = async () => {
    const { data } = await supabase.from('processes').select('*');
    setAllProcesses(data || []);
  };

  /* ------------------------------------------
     Modal
  ------------------------------------------ */
  const openModal = (user?: UserProfile) => {
    setEditingUser(user || { role: 'contributor' });
    setUserProcesses(user?.processes || []);
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser.email || !editingUser.nom || !editingUser.prenom) {
      toast.error('Tous les champs sont requis');
      return;
    }

    try {
      // 1. Créer / mettre à jour Auth
      const { error: authErr } = await supabase.auth.signUp({
        email: editingUser.email,
        password: 'TempPassword123!',
        options: { emailRedirectTo: `${window.location.origin}/set-password` },
      });
      if (authErr && authErr.message !== 'User already registered') throw authErr;

      // 2. Upsert users
      await supabase.from('users').upsert({
        email: editingUser.email,
        nom: editingUser.nom,
        prenom: editingUser.prenom,
        fonction: editingUser.fonction || '',
      });

      // 3. Upsert profiles
      await supabase.from('profiles').upsert({
        email: editingUser.email,
        role: editingUser.role!,
        organization_name: currentOrg,
        organization_level: editingUser.organization_level || null,
      });

      // 4. Upsert user_processes
      if (userProcesses.length) {
        await supabase
          .from('user_processes')
          .upsert({ email: editingUser.email, process_codes: userProcesses });
      } else {
        await supabase
          .from('user_processes')
          .delete()
          .eq('email', editingUser.email);
      }

      toast.success('Utilisateur créé / mis à jour');
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  /* ------------------------------------------
     Rendu
  ------------------------------------------ */
  const filteredUsers = users.filter((u) =>
    (u.nom + ' ' + u.prenom + ' ' + u.email + ' ' + u.fonction)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (r: string) =>
    r === 'contributor'
      ? 'bg-green-100 text-green-800'
      : 'bg-amber-100 text-amber-800';

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Utilisateurs - {currentOrg}
            </h1>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition"
          >
            <Plus className="h-4 w-4" />
            Créer utilisateur
          </button>
        </div>

        {/* Filtre */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 text-gray-400 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, email ou fonction…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <motion.div className="grid gap-4">
            {filteredUsers.map((u) => (
              <motion.div
                key={u.email}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition"
              >
                <div className="flex items-center gap-4">
                  <UserCircle className="h-10 w-10 text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {u.prenom} {u.nom}
                    </p>
                    <p className="text-sm text-gray-600">{u.email}</p>
                    <p className="text-xs text-gray-500">{u.fonction}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${getRoleColor(
                      u.role
                    )}`}
                  >
                    {translateRole(u.role)}
                  </span>
                  <button
                    onClick={() => openModal(u)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Edit3 className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                {editingUser.email ? 'Modifier' : 'Créer'} un utilisateur
              </h2>

              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                  disabled={!!editingUser.email}
                />
                <input
                  type="text"
                  placeholder="Nom"
                  value={editingUser.nom}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, nom: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Prénom"
                  value={editingUser.prenom}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, prenom: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Fonction"
                  value={editingUser.fonction}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, fonction: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      role: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {allowedRoles.map((r) => (
                    <option key={r} value={r}>
                      {translateRole(r)}
                    </option>
                  ))}
                </select>

                {/* Attribution des processus */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Processus</h3>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-2">
                    {allProcesses.map((p) => (
                      <label key={p.code} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={userProcesses.includes(p.code)}
                          onChange={(e) =>
                            setUserProcesses((prev) =>
                              e.target.checked
                                ? [...prev, p.code]
                                : prev.filter((c) => c !== p.code)
                            )
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveUser}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600"
                >
                  Sauvegarder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};