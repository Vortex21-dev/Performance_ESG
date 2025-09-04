import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { 
  Users, 
  Building2, 
  Settings, 
  CheckCircle,
  ArrowLeft,
  Shield,
  Lightbulb,
  Crown,
  Leaf,
  ClipboardList,
  Handshake
} from 'lucide-react';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { FormSection } from '../../components/ui/FormSection';
import { FormTextarea } from '../../components/ui/FormTextarea';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface User {
  prenom: string;
}

interface UserProfile {
  email: string;
  nom: string;
  prenom: string;
  fonction: string;
  role: string;
  organization_name?: string;
  organization_level?: string;
  business_line_name?: string;
  subsidiary_name?: string;
  site_name?: string;
  processes: string[];
  created_at: string;
  updated_at: string;
}

interface Process {
  id: string;
  name: string;
  code: string;
}

interface ContentModule {
  id: string;
  organization_name: string;
  module_type: string;
  sub_type?: string;
  title: string;
  content: string;
}

interface Stakeholder {
  groupe: string;
  pp: string;
  type: 'interne' | 'externe';
  type_relations: string;
  degre_influence: string;
  mode_dialogue: string;
  attentes: string[];
  organization_name: string;
}

import { LogoutButton } from '../../components/ui/LogoutButton';

// Import des composants de gestion
import { ContexteEntreprise } from '../../components/management/ContexteEntreprise';
import { PartiesPrenantes } from '../../components/management/PartiesPrenantes';
import { OrganisationStructure } from '../../components/management/OrganisationStructure';
import { Strategie } from '../../components/management/Strategie';
import { RoadMapDD } from '../../components/management/RoadMapDD';
import { UsersManagement } from '../../components/management/UsersManagement';
import { PolitiqueDurabilite} from '../../components/management/PolitiqueDurabilite';

export const ManagementDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile, impersonatedOrganization, setImpersonatedOrganization } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'management' | 'users'>('management');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [contentModules, setContentModules] = useState<ContentModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [stakeholders, setStakeholders] = useState<{
    internes: Stakeholder[];
    externes: Stakeholder[];
  }>({ internes: [], externes: [] });
  const [viewingModule, setViewingModule] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editingSubTab, setEditingSubTab] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<any>({});
  const [activeSubTab, setActiveSubTab] = useState<Record<string, string>>({});

  const managementModules = [
    {
      id: 'contexte_entreprise',
      title: 'CONTEXTE DE L\'ENTREPRISE',
      description: 'Analyse SWOT et contexte opérationnel',
      icon: ClipboardList,
      color: 'bg-indigo-500',
      subTabs: ['Analyse SWOT'],
      component: ContexteEntreprise
    },
    {
       id: 'politique_durabilite',
      title: 'Politique de Durabilité',
      description: 'Engagements et politiques ESG',
      icon: Leaf,
      color: 'bg-emerald-500',
       subTabs: ['Politique Durabilite'],
      component: PolitiqueDurabilite
    },
    {
      id: 'organigramme',
      title: 'ORGANISATION ET STRUCTURE DD',
      description: 'Structure organisationnelle et développement durable',
      icon: Building2,
      color: 'bg-blue-500',
      subTabs: ['Organigramme DD', 'Arborescence DD'],
      component: OrganisationStructure,
      restricted: ['contributor', 'validator']
    },
    {
      id: 'strategie',
      title: 'Stratégie',
      description: 'Vision, mission et stratégie d\'entreprise',
      icon: Lightbulb,
      color: 'bg-purple-500',
      subTabs: ['Vision DD', 'Stratégie DD'],
      component: Strategie,
      restricted: ['contributor', 'validator']
    },
    {
      id: 'outils_dirigeants',
      title: 'Road map DD',
      description: 'Feuille de route développement durable',
      icon: Crown,
      color: 'bg-amber-500',
      component: RoadMapDD,
      restricted: ['contributor', 'validator']
    },
    {
     id: 'parties_prenantes',
      title: 'PARTIES PRENANTES',
      description: 'Identification et gestion des parties prenantes',
      icon: Handshake,
      color: 'bg-blue-500',
      subTabs: ['Parties Prenantes'],
      component: PartiesPrenantes
    }
  ];

  const currentOrganization = impersonatedOrganization || profile?.organization_name;
  const isAdmin = profile?.role === 'admin';
  const isEnterprise = profile?.role === 'enterprise';
  const isContributor = profile?.role === 'contributor';
  const isValidator = profile?.role === 'validator';
  const canEdit = isAdmin || isEnterprise;
  const canView = isEnterprise || isContributor || isValidator || (isAdmin && impersonatedOrganization);

  useEffect(() => {
    const hasAccess = isEnterprise || isContributor || isValidator || (isAdmin && impersonatedOrganization);
    
    if (!profile || !hasAccess) {
      if (isAdmin && !impersonatedOrganization) {
        navigate('/admin/dashboard');
      } else {
        navigate('/login');
      }
      return;
    }
    fetchData();
  }, [profile, navigate, impersonatedOrganization]);

  const fetchData = async () => {
    if (!currentOrganization) return;
    
    setLoading(true);
    try {
      // Fetch organization users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          profiles (
            role,
            organization_level,
            organization_name,
            business_line_name,
            subsidiary_name,
            site_name
          )
        `)
        .eq('profiles.organization_name', currentOrganization);

      if (usersError) throw usersError;

      // Fetch user processes
      const userEmails = usersData?.map(u => u.email) || [];
      const { data: userProcessesData, error: processesError } = await supabase
        .from('user_processes')
        .select('email, process_codes')
        .in('email', userEmails);

      if (processesError) throw processesError;

      // Transform users data
      const transformedUsers: UserProfile[] = (usersData || []).map(user => {
        const userProfile = user.profiles?.[0] || {};
        const userProcesses = userProcessesData?.find(up => up.email === user.email);
        return {
          email: user.email,
          nom: user.nom || '',
          prenom: user.prenom || '',
          fonction: user.fonction || '',
          role: userProfile.role || '',
          organization_name: userProfile.organization_name,
          organization_level: userProfile.organization_level,
          business_line_name: userProfile.business_line_name,
          subsidiary_name: userProfile.subsidiary_name,
          site_name: userProfile.site_name,
          processes: userProcesses?.process_codes || [],
          created_at: user.created_at,
          updated_at: user.updated_at
        };
      });

      setUsers(transformedUsers);

      // Fetch processes
      const { data: processesData, error: processesError2 } = await supabase
        .from('processes')
        .select('*');

      if (processesError2) throw processesError2;
      setProcesses(processesData || []);

      // Fetch content modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('content_modules')
        .select('*')
        .eq('organization_name', currentOrganization);

      if (modulesError && modulesError.code !== 'PGRST116') {
        console.error('Error fetching modules:', modulesError);
      } else {
        setContentModules(modulesData || []);
      }

      // Fetch stakeholders
      await fetchStakeholders();

      await fetchSwotData();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchStakeholders = async () => {
    // Implementation for fetching stakeholders
  };

  const fetchSwotData = async () => {
    // Implementation for fetching SWOT data
  };

  const handleViewModule = (moduleType: string) => {
    setViewingModule(moduleType);
    // Set the first subTab as active by default when viewing a module with subTabs
    const module = managementModules.find(m => m.id === moduleType);
    if (module?.subTabs) {
      setActiveSubTab(prev => ({
        ...prev,
        [moduleType]: module.subTabs[0]
      }));
    }
  };

  const handleSaveModule = async () => {
    if (!editingContent.module_type || !currentOrganization) return;

    try {
      const moduleData = {
        organization_name: currentOrganization,
        module_type: editingContent.module_type,
        sub_type: editingContent.sub_type || null,
        title: editingContent.title || '',
        content: editingContent.content || ''
      };

      const { data, error } = await supabase
        .from('content_modules')
        .upsert(moduleData, {
          onConflict: 'organization_name,module_type,sub_type'
        })
        .select()
        .single();

      if (error) throw error;

      setContentModules(prev => {
        const filtered = prev.filter(m => 
          !(m.module_type === editingContent.module_type && 
            ((m.sub_type === null && editingContent.sub_type === null) || 
             (m.sub_type === editingContent.sub_type)))
        );
        return [...filtered, data];
      });

      toast.success('Module sauvegardé avec succès');
      setEditingModule(null);
      setEditingSubTab(null);
      setEditingContent({});
    } catch (error) {
      console.error('Error saving module:', error);
      toast.error('Erreur lors de la sauvegarde du module');
    }
  };

  const handleStakeholderChange = (
    type: 'internes' | 'externes', 
    index: number, 
    field: keyof Stakeholder, 
    value: any
  ) => {
    setStakeholders(prev => {
      const updated = [...prev[type]];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return {
        ...prev,
        [type]: updated
      };
    });
  };

  const addStakeholder = (type: 'internes' | 'externes', groupe: string) => {
    setStakeholders(prev => {
      const newStakeholder: Stakeholder = {
        groupe,
        pp: '',
        type: type === 'internes' ? 'interne' : 'externe',
        type_relations: 'direct_avec_contrat',
        degre_influence: '1',
        mode_dialogue: '1',
        attentes: [],
        organization_name: currentOrganization || ''
      };
      return {
        ...prev,
        [type]: [...prev[type], newStakeholder]
      };
    });
  };

  const renderModuleCard = (module: any) => {
    return (
      <div 
        key={module.id} 
        onClick={() => handleViewModule(module.id)}
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${module.color}`}>
              <module.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
              <p className="text-sm text-gray-600">{module.description}</p>
              {module.subTabs && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {module.subTabs.map((subTab: string, index: number) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                    >
                      {subTab}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleBackToAdmin = () => {
    setImpersonatedOrganization(null);
    navigate('/admin/dashboard');
  };

  const renderModuleContent = (moduleId: string) => {
    const module = managementModules.find(m => m.id === moduleId);
    if (!module) return null;

    // Gestion spéciale pour les modules avec sous-onglets
    if (module.subTabs) {
      const currentSubTab = activeSubTab[moduleId] || module.subTabs[0];
      
      if (moduleId === 'contexte_entreprise' && currentSubTab === 'Analyse SWOT') {
        return <ContexteEntreprise />;
      }
      
      if (moduleId === 'parties_prenantes' && currentSubTab === 'Parties Prenantes') {
        return <PartiesPrenantes />;
      }
      
      if (moduleId === 'organigramme') {
        return <OrganisationStructure subTab={currentSubTab} />;
      }
      if (moduleId === 'politique_durabilite') {
        return <PolitiqueDurabilite subTab={currentSubTab} />;
      }
      
      if (moduleId === 'strategie') {
       return <Strategie subTab={currentSubTab} />;
      }
    }
    
    // Modules sans sous-onglets
    if (moduleId === 'outils_dirigeants') {
      return <RoadMapDD />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        {/* VSG Banner */}
        <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg">
          <img
            src="/Imade full VSG.jpg"
            alt="Global ESG Banner"
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        </div>

        {/* Header */}
        <div className="mb-8">
          {isAdmin && impersonatedOrganization && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-amber-600 mr-2" />
                  <span className="text-sm font-medium text-amber-800">
                    Mode Administrateur - Accès à l'organisation : {impersonatedOrganization}
                  </span>
                </div>
                <button
                  onClick={handleBackToAdmin}
                  className="flex items-center px-3 py-1 text-sm font-medium text-amber-700 bg-amber-100 rounded-md hover:bg-amber-200 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Retour Admin
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 mb-4">
            {!isAdmin && (
              <button
                onClick={() => navigate('/enterprise/dashboard')}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Module de Gestion</h1>
              <p className="text-lg text-gray-600 mt-1">
                Configuration ESG et gestion des utilisateurs - {currentOrganization}
              </p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <LogoutButton />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('management')}
              className={`flex items-center py-3 px-1 border-b-2 font-medium text-base transition-colors ${
                activeTab === 'management'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="h-5 w-5 mr-2" />
              Modules de Gestion
            </button>
            {(profile?.role === 'enterprise' || isAdmin) && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center py-3 px-1 border-b-2 font-medium text-base transition-colors ${
                  activeTab === 'users'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-5 w-5 mr-2" />
                Utilisateurs & Rôles
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'management' && (
            <motion.div
              key="management"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <FormSection
                title="Modules de Gestion Organisationnelle"
                icon={<Settings className="h-5 w-5 text-gray-600" />}
              >
                {!canView && (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Accès restreint
                    </h3>
                    <p className="text-gray-500">
                      Vous n'avez pas les permissions nécessaires pour accéder à cette section.
                    </p>
                  </div>
                )}
                {canView && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {managementModules.map(renderModuleCard)}
                </div>
                )}
              </FormSection>
            </motion.div>
          )}

          {activeTab === 'users' && (profile?.role === 'enterprise' || isAdmin) && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <UsersManagement />
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Module Modal */}
        {viewingModule && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setViewingModule(null)} />
              <div className="inline-block align-middle bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all my-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl leading-6 font-semibold text-gray-900">
                      {managementModules.find(m => m.id === viewingModule)?.title}
                    </h3>
                    <button
                      onClick={() => setViewingModule(null)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <ArrowLeft className="h-6 w-6" />
                    </button>
                  </div>
                  
                  {(() => {
                    const module = managementModules.find(m => m.id === viewingModule);
                    
                    if (module?.subTabs) {
                      const currentSubTab = activeSubTab[viewingModule] || module.subTabs[0];
                      
                      return (
                        <div className="space-y-6">
                          {/* Onglets */}
                          <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8">
                              {module.subTabs.map((subTab) => (
                                <button
                                  key={subTab}
                                  onClick={() => setActiveSubTab(prev => ({ ...prev, [viewingModule]: subTab }))}
                                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    currentSubTab === subTab
                                      ? 'border-green-500 text-green-600'
                                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                  }`}
                                >
                                  {subTab}
                                </button>
                              ))}
                            </nav>
                          </div>
                          
                          {/* Contenu de l'onglet actif */}
                          <div className="space-y-4">
                            {renderModuleContent(viewingModule)}
                          </div>
                        </div>
                      );
                    }
                    
                    // Module sans sous-onglets
                    return renderModuleContent(viewingModule);
                  })()}
                </div>
                
                <div className="bg-gray-50 px-6 py-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setViewingModule(null)}
                    className="inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};