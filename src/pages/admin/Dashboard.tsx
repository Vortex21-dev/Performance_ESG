import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Settings, 
  Plus, 
  UserCircle, 
  Edit3,
  Trash2,
  Search,
  Filter,
  Eye,
  Shield,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { LogoutButton } from '../../components/ui/LogoutButton';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { FormTextarea } from '../../components/ui/FormTextarea';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Organization {
  name: string;
  organization_type: 'simple' | 'with_subsidiaries' | 'group';
  description?: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  created_at: string;
  updated_at: string; 
}

interface UserProfile {
  email: string;
  nom: string;
  prenom: string;
  fonction: string;
  role: 'admin' | 'enterprise' | 'contributor' | 'validator';
  organization_name?: string;
  organization_level?: 'organization' | 'business_line' | 'subsidiary' | 'site';
  business_line_name?: string;
  subsidiary_name?: string;
  site_name?: string;
  created_at: string;
  updated_at: string;
}

interface Process {
  code: string;
  name: string;
  description?: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'users'>('overview');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterOrg, setFilterOrg] = useState('all');
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Partial<Organization>>({});
  const [editingUser, setEditingUser] = useState<Partial<UserProfile>>({});
  const [userProcesses, setUserProcesses] = useState<string[]>([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    if (!profile || profile.role !== 'admin') {
      navigate('/login');
    } else {
      fetchData();
    }
  }, [profile, navigate]);

const fetchData = async () => {
  setLoading(true);
  try {
    // 1. Organisations
    const { data: orgsData, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (orgsError) throw orgsError;
    setOrganizations(orgsData || []);

    // 2. Utilisateurs avec rôle depuis profiles
    const [usersRaw, profilesRaw] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('profiles').select('*')
    ]);

    if (usersRaw.error) throw usersRaw.error;
    if (profilesRaw.error) throw profilesRaw.error;

    // Mapping des roles depuis profiles
    const roleMap = new Map(
      (profilesRaw.data || []).map(p => [p.email, p])
    );

    setUsers(
      (usersRaw.data || []).map(u => {
        const profile = roleMap.get(u.email);
        return {
          email: u.email,
          nom: u.nom || '',
          prenom: u.prenom || '',
          fonction: u.fonction || '',
          role: profile?.role || 'contributor', // ← rôle réel depuis profiles
          organization_name: profile?.organization_name || null,
          organization_level: profile?.organization_level || null,
          business_line_name: profile?.business_line_name || null,
          subsidiary_name: profile?.subsidiary_name || null,
          site_name: profile?.site_name || null,
          created_at: u.created_at,
          updated_at: u.updated_at
        };
      })
    );

    // 3. Processus
    const { data: processesData, error: processesError } = await supabase
      .from('processes')
      .select('*')
      .order('name', { ascending: true });

    if (processesError) throw processesError;
    setProcesses(processesData || []);

  } catch (error) {
    console.error('Error fetching data:', error);
    toast.error('Erreur lors du chargement des données');
  } finally {
    setLoading(false);
  }
};
  // Organisation CRUD
  const handleCreateOrganization = () => {
    setSelectedOrganization(null);
    setEditingOrg({
      name: '',
      organization_type: 'simple',
      description: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      email: '',
      website: ''
    });
    setShowEditModal(true);
  };

  const handleEditOrganization = (org: Organization) => {
    setSelectedOrganization(org);
    setEditingOrg(org);
    setShowEditModal(true);
  };

  const handleSaveOrganization = async () => {
    if (!editingOrg.name) return;

    try {
      const orgData = {
        name: editingOrg.name,
        organization_type: editingOrg.organization_type || 'simple',
        description: editingOrg.description || null,
        address: editingOrg.address || '',
        city: editingOrg.city || '',
        country: editingOrg.country || '',
        phone: editingOrg.phone || '',
        email: editingOrg.email || '',
        website: editingOrg.website || null
      };

      if (selectedOrganization) {
        const { error } = await supabase
          .from('organizations')
          .update(orgData)
          .eq('name', selectedOrganization.name);
        if (error) throw error;
        toast.success('Organisation mise à jour avec succès');
      } else {
        const { error } = await supabase.from('organizations').insert(orgData);
        if (error) throw error;
        toast.success('Organisation créée avec succès');
      }

      setShowEditModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving organization:', error);
      toast.error('Erreur lors de la sauvegarde de l\'organisation');
    }
  };

  const handleDeleteOrganization = async (orgName: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette organisation ?')) return;

    try {
      const { error } = await supabase.from('organizations').delete().eq('name', orgName);
      if (error) throw error;
      toast.success('Organisation supprimée avec succès');
      fetchData();
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error('Erreur lors de la suppression de l\'organisation');
    }
  };

  // User CRUD + Process Assignment
  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsCreatingUser(true);
    setEditingUser({
      email: '',
      nom: '',
      prenom: '',
      fonction: '',
      role: 'contributor',
      organization_name: '',
      organization_level: undefined
    });
    setUserProcesses([]);
    setShowUserModal(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsCreatingUser(false);
    setEditingUser(user);
    fetchUserProcesses(user.email);
    setShowUserModal(true);
  };

  const fetchUserProcesses = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('user_processes')
        .select('process_codes')
        .eq('email', email);
      
      if (!error) {
        setUserProcesses(data[0]?.process_codes || []);
      }
    } catch (error) {
      console.error('Error fetching user processes:', error);
    }
  };

const handleSaveUser = async () => {
  if (!editingUser.email || !editingUser.nom || !editingUser.prenom) {
    toast.error('Veuillez remplir tous les champs obligatoires');
    return;
  }

  try {
    // 1. Mise à jour de la table `users`
    const userData = {
      email: editingUser.email,
      nom: editingUser.nom,
      prenom: editingUser.prenom,
      fonction: editingUser.fonction || ''
    };

    if (isCreatingUser) {
      const { error } = await supabase.from('users').insert(userData);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('email', selectedUser!.email);
      if (error) throw error;
    }

    // 2. Mise à jour de la table `profiles`
    const profileData = {
      email: editingUser.email,
      role: editingUser.role || 'contributor',
      organization_name: editingUser.organization_name || null,
      organization_level: editingUser.organization_level || null,
      business_line_name: editingUser.business_line_name || null,
      subsidiary_name: editingUser.subsidiary_name || null,
      site_name: editingUser.site_name || null
    };

    await supabase.from('profiles').upsert(profileData, { onConflict: 'email' });

    // 3. Gestion des processus
    if (userProcesses.length > 0) {
      await supabase
        .from('user_processes')
        .upsert({ email: editingUser.email, process_codes: userProcesses });
    } else {
      await supabase.from('user_processes').delete().eq('email', editingUser.email);
    }

    toast.success(isCreatingUser ? 'Utilisateur créé avec succès' : 'Utilisateur mis à jour avec succès');
    setShowUserModal(false);
    fetchData();
  } catch (error) {
    console.error('Error saving user:', error);
    toast.error('Erreur lors de la sauvegarde de l\'utilisateur');
  }
};

  const handleDeleteUser = async (email: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      await supabase.from('users').delete().eq('email', email);
      await supabase.from('user_processes').delete().eq('email', email);
      toast.success('Utilisateur supprimé avec succès');
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleAccessOrganization = (orgName: string) => {
    const { setImpersonatedOrganization } = useAuthStore.getState();
    setImpersonatedOrganization(orgName);
    navigate('/enterprise/dashboard');
  };

  // Filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fonction.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesOrg = filterOrg === 'all' || user.organization_name === filterOrg;
    
    return matchesSearch && matchesRole && matchesOrg;
  });

  // Helper functions
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-blue-100 text-blue-800';
      case 'contributor': return 'bg-green-100 text-green-800';
      case 'validator': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'enterprise': return 'Admin Client';
      case 'contributor': return 'Contributeur';
      case 'validator': return 'Validateur';
      default: return role;
    }
  };

  const getOrgTypeLabel = (type: string) => {
    switch (type) {
      case 'simple': return 'Simple';
      case 'with_subsidiaries': return 'Avec filiales';
      case 'group': return 'Groupe';
      default: return type;
    }
  };

  // Stats
  const stats = [
    {
      name: 'Organisations',
      value: organizations.length.toString(),
      icon: Building2,
      changeType: 'positive',
      color: 'bg-blue-500'
    },
    {
      name: 'Utilisateurs actifs',
      value: users.length.toString(),
      icon: Users,
      changeType: 'positive',
      color: 'bg-green-500'
    },
    {
      name: 'Administrateurs',
      value: users.filter(u => u.role === 'admin').length.toString(),
      icon: Shield,
      changeType: 'positive',
      color: 'bg-purple-500'
    },
    {
      name: 'Contributeurs',
      value: users.filter(u => u.role === 'contributor').length.toString(),
      icon: UserCircle,
      changeType: 'positive',
      color: 'bg-amber-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div className="sm:flex-auto">
            <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg">
              <img
                src="/Imade full VSG.jpg"
                alt="Global ESG Banner"
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <UserCircle className="h-16 w-16 text-green-600" />
                <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1">
                  <Shield className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user?.prenom} {user?.nom}
                  </h1>
                  <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">
                    Administrateur
                  </span>
                </div>
                <p className="text-lg text-gray-600 mt-1">Tableau de bord administrateur</p>
              </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4 flex items-center">
            <button
              onClick={() => navigate('/process/sectors')}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle configuration
            </button>
            <LogoutButton />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
              { id: 'organizations', label: 'Organisations', icon: Building2 },
              { id: 'users', label: 'Utilisateurs', icon: Users }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
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

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Statistics */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative overflow-hidden rounded-xl bg-white px-4 pt-5 pb-12 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <dt>
                      <div className={`absolute rounded-lg p-3 ${stat.color}`}>
                        <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.name}</p>
                    </dt>
                    <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                      <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {stat.change}
                      </p>
                    </dd>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Actions rapides</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setActiveTab('organizations')}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left group"
                  >
                    <Building2 className="h-8 w-8 text-gray-400 group-hover:text-green-600 mb-3" />
                    <h3 className="font-medium text-gray-900 group-hover:text-green-900">Gérer les organisations</h3>
                    <p className="text-sm text-gray-500 mt-1">Voir et modifier les profils d'organisations</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                  >
                    <Users className="h-8 w-8 text-gray-400 group-hover:text-blue-600 mb-3" />
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-900">Gérer les utilisateurs</h3>
                    <p className="text-sm text-gray-500 mt-1">Administrer les comptes utilisateurs</p>
                  </button>
                  <button 
                    onClick={() => navigate('/process/sectors')}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                  >
                    <Settings className="h-8 w-8 text-gray-400 group-hover:text-purple-600 mb-3" />
                    <h3 className="font-medium text-gray-900 group-hover:text-purple-900">Configuration ESG</h3>
                    <p className="text-sm text-gray-500 mt-1">Créer une nouvelle configuration</p>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'organizations' && (
            <motion.div
              key="organizations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white shadow-sm rounded-xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Organisations</h2>
                  <button
                    onClick={handleCreateOrganization}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une organisation
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-6">
                    {organizations.map((org) => (
                      <div key={org.name} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Building2 className="h-6 w-6 text-blue-600" />
                              <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                org.organization_type === 'simple' ? 'bg-green-100 text-green-800' :
                                org.organization_type === 'with_subsidiaries' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {getOrgTypeLabel(org.organization_type)}
                              </span>
                            </div>
                            {org.description && (
                              <p className="text-gray-600 mb-3">{org.description}</p>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{org.address}, {org.city}, {org.country}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{org.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{org.email}</span>
                              </div>
                              {org.website && (
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  <span>{org.website}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleAccessOrganization(org.name)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Accéder à l'espace entreprise"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditOrganization(org)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrganization(org.name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white shadow-sm rounded-xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Utilisateurs</h2>
                  <button
                    onClick={handleCreateUser}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un utilisateur
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                      />
                    </div>
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Tous les rôles</option>
                      <option value="admin">Administrateur</option>
                      <option value="enterprise">Admin Client</option>
                      <option value="contributor">Contributeur</option>
                      <option value="validator">Validateur</option>
                    </select>
                    <select
                      value={filterOrg}
                      onChange={(e) => setFilterOrg(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Toutes les organisations</option>
                      {organizations.map(org => (
                        <option key={org.name} value={org.name}>{org.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {filteredUsers.map((user) => (
                      <div key={user.email} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <UserCircle className="h-12 w-12 text-gray-400" />
                              <div className={`absolute -bottom-1 -right-1 rounded-full p-1 ${
                                user.role === 'admin' ? 'bg-purple-500' :
                                user.role === 'enterprise' ? 'bg-blue-500' :
                                user.role === 'contributor' ? 'bg-green-500' :
                                'bg-amber-500'
                              }`}>
                                <Shield className="h-3 w-3 text-white" />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">
                                  {user.prenom} {user.nom}
                                </h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                                  {getRoleLabel(user.role)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              <p className="text-sm text-gray-500">{user.fonction}</p>
                              {user.organization_name && (
                                <p className="text-xs text-gray-400">{user.organization_name}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.email)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Organization Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)} />
              <div className="inline-block align-middle bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all my-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="text-xl leading-6 font-semibold text-gray-900 mb-6">
                        {selectedOrganization ? 'Modifier' : 'Créer'} l'organisation
                      </h3>
                      <div className="space-y-6">
                        <FormInput
                          label="Nom"
                          value={editingOrg.name || ''}
                          onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                          required
                        />
                        <FormSelect
                          label="Type"
                          value={editingOrg.organization_type || 'simple'}
                          onChange={(value) => setEditingOrg({ ...editingOrg, organization_type: value as any })}
                          options={[
                            { value: 'simple', label: 'Simple' },
                            { value: 'with_subsidiaries', label: 'Avec filiales' },
                            { value: 'group', label: 'Groupe' }
                          ]}
                        />
                        <FormTextarea
                          label="Description"
                          value={editingOrg.description || ''}
                          onChange={(e) => setEditingOrg({ ...editingOrg, description: e.target.value })}
                          rows={3}
                        />
                        <FormInput
                          label="Adresse"
                          value={editingOrg.address || ''}
                          onChange={(e) => setEditingOrg({ ...editingOrg, address: e.target.value })}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormInput
                            label="Ville"
                            value={editingOrg.city || ''}
                            onChange={(e) => setEditingOrg({ ...editingOrg, city: e.target.value })}
                          />
                          <FormInput
                            label="Pays"
                            value={editingOrg.country || ''}
                            onChange={(e) => setEditingOrg({ ...editingOrg, country: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormInput
                            label="Téléphone"
                            value={editingOrg.phone || ''}
                            onChange={(e) => setEditingOrg({ ...editingOrg, phone: e.target.value })}
                          />
                          <FormInput
                            label="Email"
                            type="email"
                            value={editingOrg.email || ''}
                            onChange={(e) => setEditingOrg({ ...editingOrg, email: e.target.value })}
                          />
                        </div>
                        <FormInput
                          label="Site web"
                          value={editingOrg.website || ''}
                          onChange={(e) => setEditingOrg({ ...editingOrg, website: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3">
                  <button
                    onClick={handleSaveOrganization}
                    className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    {selectedOrganization ? 'Sauvegarder' : 'Créer'}
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowUserModal(false)} />
              <div className="inline-block align-middle bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all my-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="text-xl leading-6 font-semibold text-gray-900 mb-6">
                        {isCreatingUser ? 'Créer' : 'Modifier'} l'utilisateur
                      </h3>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormInput
                            label="Prénom"
                            value={editingUser.prenom || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, prenom: e.target.value })}
                            required
                          />
                          <FormInput
                            label="Nom"
                            value={editingUser.nom || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, nom: e.target.value })}
                            required
                          />
                        </div>
                        <FormInput
                          label="Email"
                          type="email"
                          value={editingUser.email || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                          disabled={!isCreatingUser}
                          required
                        />
                        <FormInput
                          label="Fonction"
                          value={editingUser.fonction || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, fonction: e.target.value })}
                        />
                        <FormSelect
                          label="Rôle"
                          value={editingUser.role || 'contributor'}
                          onChange={(value) => setEditingUser({ ...editingUser, role: value as any })}
                          options={[
                            { value: 'admin', label: 'Administrateur' },
                            { value: 'enterprise', label: 'Admin Client' },
                            { value: 'contributor', label: 'Contributeur' },
                            { value: 'validator', label: 'Validateur' }
                          ]}
                          required
                        />
                        <FormSelect
                          label="Organisation"
                          value={editingUser.organization_name || ''}
                          onChange={(value) => setEditingUser({ ...editingUser, organization_name: value })}
                          options={[
                            { value: '', label: 'Aucune organisation' },
                            ...organizations.map(org => ({ value: org.name, label: org.name }))
                          ]}
                        />
                        <FormSelect
                          label="Niveau organisationnel"
                          value={editingUser.organization_level || ''}
                          onChange={(value) => setEditingUser({ ...editingUser, organization_level: value as any })}
                          options={[
                            { value: '', label: 'Aucun niveau' },
                            { value: 'organization', label: 'Organisation' },
                            { value: 'business_line', label: 'Ligne d\'affaires' },
                            { value: 'subsidiary', label: 'Filiale' },
                            { value: 'site', label: 'Site' }
                          ]}
                        />

                        {/* Process Assignment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Processus associés
                          </label>
                          <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                            {processes.map((process) => (
                              <label key={process.code} className="flex items-center space-x-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={userProcesses.includes(process.code)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setUserProcesses([...userProcesses, process.code]);
                                    } else {
                                      setUserProcesses(userProcesses.filter(p => p !== process.code));
                                    }
                                  }}
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm text-gray-700">{process.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3">
                  <button
                    onClick={handleSaveUser}
                    className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    {isCreatingUser ? 'Créer' : 'Sauvegarder'}
                  </button>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}