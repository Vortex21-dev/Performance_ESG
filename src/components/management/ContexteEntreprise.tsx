import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Save, 
  UserCircle,
  Building2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

interface SwotInputs {
  strengthInput: string;
  weaknessInput: string;
  opportunityInput: string;
  threatInput: string;
}

export const ContexteEntreprise: React.FC = () => {
  const { profile, user, impersonatedOrganization } = useAuthStore();
  
  const [swotData, setSwotData] = useState<SwotData>({
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: []
  });

  const [swotInputs, setSwotInputs] = useState<SwotInputs>({
    strengthInput: '',
    weaknessInput: '',
    opportunityInput: '',
    threatInput: ''
  });

  const [swotLoading, setSwotLoading] = useState(true);
  const [swotSaving, setSwotSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const currentOrganization = impersonatedOrganization || profile?.organization_name;
  const isAdmin = profile?.role === 'admin';
  const isEnterprise = profile?.role === 'enterprise';
  const isContributor = profile?.role === 'contributor';
  const isValidator = profile?.role === 'validator';
  const canEditSwot = isAdmin || isEnterprise;
  const isReadOnly = isContributor || isValidator;

  const swotSections = [
    {
      key: 'strengths' as const,
      title: 'Forces',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      inputKey: 'strengthInput' as const,
      placeholder: 'Ex: Équipe expérimentée...'
    },
    {
      key: 'weaknesses' as const,
      title: 'Faiblesses',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      inputKey: 'weaknessInput' as const,
      placeholder: 'Ex: Manque de ressources...'
    },
    {
      key: 'opportunities' as const,
      title: 'Opportunités',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      inputKey: 'opportunityInput' as const,
      placeholder: 'Ex: Nouveau marché...'
    },
    {
      key: 'threats' as const,
      title: 'Menaces',
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      inputKey: 'threatInput' as const,
      placeholder: 'Ex: Concurrence accrue...'
    }
  ];

  useEffect(() => {
    fetchSwotData();
  }, [currentOrganization]);

  const fetchSwotData = async () => {
    if (!currentOrganization) {
      setSwotLoading(false);
      return;
    }

    try {
      setSwotLoading(true);
      const { data, error } = await supabase
        .from('swot_analysis')
        .select('*')
        .eq('organization_name', currentOrganization)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && Array.isArray(data)) {
        const groupedData: SwotData = {
          strengths: data.filter(item => item.type === 'strength').map(item => item.description),
          weaknesses: data.filter(item => item.type === 'weakness').map(item => item.description),
          opportunities: data.filter(item => item.type === 'opportunity').map(item => item.description),
          threats: data.filter(item => item.type === 'threat').map(item => item.description)
        };
        setSwotData(groupedData);
      } else {
        setSwotData({
          strengths: [],
          weaknesses: [],
          opportunities: [],
          threats: []
        });
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error in fetchSwotData:', error);
      toast.error('Erreur lors du chargement des données SWOT');
      setSwotData({
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: []
      });
    } finally {
      setSwotLoading(false);
    }
  };

  const saveSwotData = async () => {
    if (!currentOrganization) {
      toast.error('Organisation non définie');
      return;
    }

    try {
      setSwotSaving(true);
      const { error: deleteError } = await supabase
        .from('swot_analysis')
        .delete()
        .eq('organization_name', currentOrganization);

      if (deleteError) throw deleteError;

      const dataToInsert: Array<{
        organization_name: string;
        type: string;
        description: string;
      }> = [];

      Object.entries(swotData).forEach(([type, items]) => {
        items.forEach(item => {
          if (item.trim()) {
            let dbType;
            switch (type) {
              case 'strengths':
                dbType = 'strength';
                break;
              case 'weaknesses':
                dbType = 'weakness';
                break;
              case 'opportunities':
                dbType = 'opportunity';
                break;
              case 'threats':
                dbType = 'threat';
                break;
              default:
                dbType = type.slice(0, -1); // fallback
            }
            dataToInsert.push({
              organization_name: currentOrganization,
              type: dbType,
              description: item.trim()
            });
          }
        });
      });

      if (dataToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('swot_analysis')
          .insert(dataToInsert);

        if (insertError) throw insertError;
      }

      toast.success('Analyse SWOT sauvegardée avec succès');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving SWOT data:', error);
      toast.error('Erreur lors de la sauvegarde de l\'analyse SWOT');
    } finally {
      setSwotSaving(false);
    }
  };

  const handleSwotInputChange = (type: keyof SwotInputs, value: string) => {
    setSwotInputs(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const addSwotItem = (type: 'strengths' | 'weaknesses' | 'opportunities' | 'threats') => {
    const inputMap = {
      strengths: 'strengthInput',
      weaknesses: 'weaknessInput',
      opportunities: 'opportunityInput',
      threats: 'threatInput'
    };
    
    const inputKey = inputMap[type] as keyof SwotInputs;
    const inputValue = swotInputs[inputKey]?.trim();

    if (!inputValue) {
      toast.error('Veuillez saisir une valeur');
      return;
    }

    if (swotData[type].includes(inputValue)) {
      toast.error('Cet élément existe déjà');
      return;
    }

    setSwotData(prev => ({
      ...prev,
      [type]: [...prev[type], inputValue]
    }));

    setSwotInputs(prev => ({
      ...prev,
      [inputKey]: ''
    }));

    setHasUnsavedChanges(true);
    toast.success('Élément ajouté');
  };

  const removeSwotItem = (type: 'strengths' | 'weaknesses' | 'opportunities' | 'threats', index: number) => {
    setSwotData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
    setHasUnsavedChanges(true);
    toast.success('Élément supprimé');
  };

  if (swotLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <UserCircle className="h-12 w-12 text-green-600" />
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                <Building2 className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-gray-900">
                  SWOT - {currentOrganization}
                </h1>
                {hasUnsavedChanges && (
                  <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                    Non sauvegardé
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {user?.prenom} {user?.nom}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          {canEditSwot && (
            <button
              onClick={saveSwotData}
              disabled={swotSaving || !hasUnsavedChanges}
              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors ${
                hasUnsavedChanges && !swotSaving
                  ? 'text-white bg-green-600 hover:bg-green-700'
                  : 'text-gray-400 bg-gray-200 cursor-not-allowed'
              }`}
            >
              {swotSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Analyse SWOT */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Analyse SWOT
          </h2>
          <p className="text-sm text-gray-600">
            Forces, faiblesses, opportunités et menaces de votre organisation
          </p>
        </div>

        {isReadOnly && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-xs font-medium text-blue-800">
                Mode lecture seule
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {swotSections.map((section, index) => (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border ${section.borderColor} rounded-lg ${section.bgColor} p-4`}
            >
              <div className="flex items-center mb-3">
                <section.icon className={`h-5 w-5 ${section.color} mr-2`} />
                <h3 className="text-base font-semibold text-gray-900">
                  {section.title}
                </h3>
                <span className="ml-auto px-1.5 py-0.5 text-xs font-medium bg-white rounded-full text-gray-600">
                  {swotData[section.key].length}
                </span>
              </div>

              {canEditSwot && (
                <div className="mb-3">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={swotInputs[section.inputKey]}
                      onChange={(e) => handleSwotInputChange(section.inputKey, e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addSwotItem(section.key);
                        }
                      }}
                      placeholder={section.placeholder}
                      className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-xs"
                    />
                    <button
                      onClick={() => addSwotItem(section.key)}
                      disabled={!swotInputs[section.inputKey].trim()}
                      className={`px-2 py-1 rounded-md text-xs transition-colors ${
                        swotInputs[section.inputKey].trim()
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {swotData[section.key].length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <section.icon className={`h-6 w-6 ${section.color} mx-auto mb-1 opacity-50`} />
                    <p className="text-xs">Aucun élément</p>
                  </div>
                ) : (
                  swotData[section.key].map((item, itemIndex) => (
                    <motion.div
                      key={itemIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-start justify-between p-2 bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start gap-1.5 flex-1">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 ${
                          section.key === 'strengths' ? 'bg-green-500' :
                          section.key === 'weaknesses' ? 'bg-red-500' :
                          section.key === 'opportunities' ? 'bg-blue-500' :
                          'bg-orange-500'
                        }`}></span>
                        <span className="text-xs text-gray-900 flex-1">{item}</span>
                      </div>
                      {canEditSwot && (
                        <button
                          onClick={() => removeSwotItem(section.key, itemIndex)}
                          className="ml-1 p-0.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Résumé compact */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-sm font-medium text-gray-900">Résumé</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-gray-600">
              <span>F: {swotData.strengths.length}</span>
              <span>Fa: {swotData.weaknesses.length}</span>
              <span>O: {swotData.opportunities.length}</span>
              <span>M: {swotData.threats.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};