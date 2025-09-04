import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { 
  Handshake, 
  Plus, 
  Edit3, 
  Save, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StakeholderExpectation {
  texte: string;
  prise_en_compte: string;
}

interface Stakeholder {
  id?: string;
  organization_name: string;
  type: 'interne' | 'externe';
  groupe: string;
  pp: string;
  type_relations: 'direct_avec_contrat' | 'direct_sans_contrat' | 'indirect';
  degre_influence: string;
  mode_dialogue: string;
  attentes: StakeholderExpectation[];
}

// Composant optimisé pour l'édition d'une attente
const ExpectationEdit = memo(({
  attente,
  expIndex,
  onChange,
  onRemove
}: {
  attente: StakeholderExpectation;
  expIndex: number;
  onChange: (expIndex: number, field: keyof StakeholderExpectation, value: string) => void;
  onRemove: (expIndex: number) => void;
}) => {
  const handleTexteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(expIndex, 'texte', e.target.value);
  }, [expIndex, onChange]);

  const handlePriseEnCompteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(expIndex, 'prise_en_compte', e.target.value);
  }, [expIndex, onChange]);

  const handleRemove = useCallback(() => {
    onRemove(expIndex);
  }, [expIndex, onRemove]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 rounded-lg p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Attente</label>
        <input
          type="text"
          value={attente.texte}
          onChange={handleTexteChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          placeholder="Décrivez l'attente..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Prise en compte</label>
        <input
          type="text"
          value={attente.prise_en_compte}
          onChange={handlePriseEnCompteChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          placeholder="Comment cette attente est prise en compte..."
        />
      </div>
      <div className="md:col-span-2 flex justify-end">
        <button
          onClick={handleRemove}
          className="text-red-600 hover:text-red-900 text-sm"
        >
          Supprimer cette attente
        </button>
      </div>
    </div>
  );
});

ExpectationEdit.displayName = 'ExpectationEdit';

// Composant optimisé pour l'édition d'une partie prenante
const StakeholderEditForm = memo(({
  type,
  index,
  item,
  onRemove,
  onChange,
  onExpectationChange,
  onAddExpectation,
  onRemoveExpectation
}: {
  type: 'internes' | 'externes';
  index: number;
  item: Stakeholder;
  onRemove: () => void;
  onChange: (field: keyof Stakeholder, value: any) => void;
  onExpectationChange: (expIndex: number, field: keyof StakeholderExpectation, value: string) => void;
  onAddExpectation: () => void;
  onRemoveExpectation: (expIndex: number) => void;
}) => {
  const handlePpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange('pp', e.target.value);
  }, [onChange]);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange('type', e.target.value);
  }, [onChange]);

  const handleTypeRelationsChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange('type_relations', e.target.value);
  }, [onChange]);

  const handleDegreInfluenceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange('degre_influence', e.target.value);
  }, [onChange]);

  const handleModeDialogueChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange('mode_dialogue', e.target.value);
  }, [onChange]);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Partie Prenante</label>
          <input
            type="text"
            value={item.pp}
            onChange={handlePpChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Nom de la partie prenante..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={item.type}
            onChange={handleTypeChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="interne">Interne</option>
            <option value="externe">Externe</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de relations</label>
          <select
            value={item.type_relations}
            onChange={handleTypeRelationsChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="direct_avec_contrat">Direct avec contrat</option>
            <option value="direct_sans_contrat">Direct sans contrat</option>
            <option value="indirect">Indirect</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Degré d'influence</label>
          <select
            value={item.degre_influence}
            onChange={handleDegreInfluenceChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="1">1 - Faible</option>
            <option value="2">2 - Moyen</option>
            <option value="3">3 - Fort</option>
            <option value="4">4 - Très fort</option>
            <option value="5">5 - Extrême</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mode de dialogue</label>
          <select
            value={item.mode_dialogue}
            onChange={handleModeDialogueChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="1">1 - Information</option>
            <option value="2">2 - Information</option>
            <option value="3">3 - Concertation/Consultation</option>
            <option value="4">4 - Implication</option>
            <option value="5">5 - Implication</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={onRemove}
            className="w-full py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Supprimer cette PP
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Attentes</label>
        <div className="space-y-4">
          {item.attentes?.map((attente, expIndex) => (
            <ExpectationEdit
              key={`exp-${expIndex}`}
              attente={attente}
              expIndex={expIndex}
              onChange={onExpectationChange}
              onRemove={onRemoveExpectation}
            />
          ))}
          <button
            onClick={onAddExpectation}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter une attente
          </button>
        </div>
      </div>
    </div>
  );
});

StakeholderEditForm.displayName = 'StakeholderEditForm';

export const PartiesPrenantes: React.FC = () => {
  const { profile, impersonatedOrganization } = useAuthStore();
  
  const [stakeholders, setStakeholders] = useState<{
    internes: Stakeholder[];
    externes: Stakeholder[];
  }>({
    internes: [],
    externes: []
  });
  
  const [editingStakeholderGroup, setEditingStakeholderGroup] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'view'>('view');
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(true);

  const currentOrganization = impersonatedOrganization || profile?.organization_name;
  const isAdmin = profile?.role === 'admin';
  const isEnterprise = profile?.role === 'enterprise';
  const canEdit = isAdmin || isEnterprise;

  useEffect(() => {
    fetchStakeholders();
  }, [currentOrganization]);

  const fetchStakeholders = async () => {
    if (!currentOrganization) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*')
        .eq('organization_name', currentOrganization);

      if (error) throw error;

      const internes = data?.filter(item => item.type === 'interne') || [];
      const externes = data?.filter(item => item.type === 'externe') || [];

      setStakeholders({
        internes,
        externes
      });
    } catch (error) {
      console.error('Error fetching stakeholders:', error);
      toast.error('Erreur lors du chargement des parties prenantes');
    } finally {
      setLoading(false);
    }
  };

  const saveStakeholders = async () => {
    if (!currentOrganization) return;

    try {
      const { error: deleteError } = await supabase
        .from('stakeholders')
        .delete()
        .eq('organization_name', currentOrganization);

      if (deleteError) throw deleteError;

      const allStakeholders = [
        ...stakeholders.internes.map(item => ({
          ...item,
          organization_name: currentOrganization,
          type: 'interne'
        })),
        ...stakeholders.externes.map(item => ({
          ...item,
          organization_name: currentOrganization,
          type: 'externe'
        }))
      ];

      // Nettoyer les données pour correspondre au schéma
      const cleanedStakeholders = allStakeholders.map(item => ({
        organization_name: item.organization_name,
        type: item.type,
        groupe: item.groupe,
        pp: item.pp,
        type_relations: item.type_relations,
        degre_influence: item.degre_influence,
        mode_dialogue: item.mode_dialogue,
        attentes: item.attentes || []
      }));

      if (cleanedStakeholders.length > 0) {
        const { error: insertError } = await supabase
          .from('stakeholders')
          .insert(cleanedStakeholders);

        if (insertError) throw insertError;
      }

      toast.success('Parties prenantes sauvegardées avec succès');
      setViewMode('view');
      setEditingStakeholderGroup(null);
      fetchStakeholders();
    } catch (error) {
      console.error('Error saving stakeholders:', error);
      toast.error('Erreur lors de la sauvegarde des parties prenantes');
    }
  };

  const handleStakeholderChange = useCallback((
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
  }, []);

  const addStakeholder = useCallback((type: 'internes' | 'externes', groupe: string) => {
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
  }, [currentOrganization]);

  const removeStakeholder = useCallback((type: 'internes' | 'externes', index: number) => {
    setStakeholders(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  }, []);

  const addExpectation = useCallback((type: 'internes' | 'externes', index: number) => {
    setStakeholders(prev => {
      const updated = [...prev[type]];
      updated[index] = {
        ...updated[index],
        attentes: [...(updated[index].attentes || []), { texte: '', prise_en_compte: '' }]
      };
      return {
        ...prev,
        [type]: updated
      };
    });
  }, []);

  const removeExpectation = useCallback((type: 'internes' | 'externes', index: number, expIndex: number) => {
    setStakeholders(prev => {
      const updated = [...prev[type]];
      updated[index] = {
        ...updated[index],
        attentes: updated[index].attentes.filter((_, i) => i !== expIndex)
      };
      return {
        ...prev,
        [type]: updated
      };
    });
  }, []);

  const handleExpectationChange = useCallback((
    type: 'internes' | 'externes', 
    index: number, 
    expIndex: number, 
    field: keyof StakeholderExpectation, 
    value: string
  ) => {
    setStakeholders(prev => {
      const updated = [...prev[type]];
      const updatedAttentes = [...updated[index].attentes];
      updatedAttentes[expIndex] = {
        ...updatedAttentes[expIndex],
        [field]: value
      };
      updated[index] = {
        ...updated[index],
        attentes: updatedAttentes
      };
      return {
        ...prev,
        [type]: updated
      };
    });
  }, []);

  const getRelationsTypeLabel = useCallback((type: Stakeholder['type_relations']) => {
    switch (type) {
      case 'direct_avec_contrat': return 'Direct avec contrat';
      case 'direct_sans_contrat': return 'Direct sans contrat';
      case 'indirect': return 'Indirect';
      default: return type;
    }
  }, []);

  const getInfluenceLevelLabel = useCallback((level: string) => {
    switch (level) {
      case '1': return '1 - Faible';
      case '2': return '2 - Moyen';
      case '3': return '3 - Fort';
      case '4': return '4 - Très fort';
      case '5': return '5 - Extrême';
      default: return level;
    }
  }, []);

  const getDialogueModeLabel = useCallback((mode: string) => {
    switch (mode) {
      case '1': return '1 - Information';
      case '2': return '2 - Information';
      case '3': return '3 - Concertation/Consultation';
      case '4': return '4 - Implication';
      case '5': return '5 - Implication';
      default: return mode;
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Chargement des parties prenantes...</span>
      </div>
    );
  }

  if (viewMode === 'view') {
    const allStakeholders = [...stakeholders.internes, ...stakeholders.externes];
    const groupes = Array.from(new Set(allStakeholders.map(s => s.groupe)));

    return (
      <div className="space-y-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Parties Prenantes</h3>
          
          {!canEdit && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">
                  Mode consultation - Vous pouvez consulter les parties prenantes mais pas les modifier
                </span>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            {groupes.length === 0 ? (
              <div className="text-center py-8">
                <Handshake className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune partie prenante définie
                </h3>
                <p className="text-gray-500 mb-4">
                  Ajoutez des groupes de parties prenantes pour commencer.
                </p>
                
                {canEdit && (
                  <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Nom du nouveau groupe"
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        if (newGroupName.trim()) {
                          addStakeholder('internes', newGroupName.trim());
                          setNewGroupName('');
                          toast.success('Groupe ajouté avec succès');
                        }
                      }}
                      disabled={!newGroupName.trim()}
                      className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Ajouter un groupe
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {groupes.map(groupe => {
                  const groupeStakeholders = allStakeholders.filter(s => s.groupe === groupe);
                  return (
                    <div key={groupe} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">{groupe}</h4>
                        {canEdit && (
                          <button
                            onClick={() => {
                              setViewMode('edit');
                              setEditingStakeholderGroup(groupe);
                            }}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Modifier
                          </button>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PP</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relations</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Influence</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dialogue</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attentes</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {groupeStakeholders.map((item, index) => (
                              <tr key={`${groupe}-${index}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="border border-gray-200 bg-gray-50 rounded-md px-3 py-2">
                                    {item.pp}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="border border-gray-200 bg-gray-50 rounded-md px-3 py-2">
                                    {item.type === 'interne' ? 'Interne' : 'Externe'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="border border-gray-200 bg-gray-50 rounded-md px-3 py-2">
                                    {getRelationsTypeLabel(item.type_relations)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="border border-gray-200 bg-gray-50 rounded-md px-3 py-2">
                                    {getInfluenceLevelLabel(item.degre_influence)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="border border-gray-200 bg-gray-50 rounded-md px-3 py-2">
                                    {getDialogueModeLabel(item.mode_dialogue)}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-2">
                                    {item.attentes?.length > 0 ? (
                                      item.attentes.map((attente, expIndex) => (
                                        <div key={`${groupe}-${index}-exp-${expIndex}`} className="space-y-1">
                                          <div className="flex-1 border border-gray-200 bg-gray-50 rounded-md px-3 py-2">
                                            <p className="font-medium">Attente:</p>
                                            <p>{attente.texte}</p>
                                          </div>
                                          <div className="flex-1 border border-gray-200 bg-gray-50 rounded-md px-3 py-2">
                                            <p className="font-medium">Prise en compte:</p>
                                            <p>{attente.prise_en_compte || 'Non spécifié'}</p>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-gray-500 italic">Aucune attente définie</p>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {canEdit && groupes.length > 0 && (
            <div className="flex items-center gap-2 mt-6">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nom du nouveau groupe"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              />
              <button
                onClick={() => {
                  if (newGroupName.trim()) {
                    addStakeholder('internes', newGroupName.trim());
                    setNewGroupName('');
                    toast.success('Groupe ajouté avec succès');
                  }
                }}
                disabled={!newGroupName.trim()}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-5 w-5 mr-2" />
                Ajouter un groupe
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mode édition
  return (
    <div className="space-y-8">
      {editingStakeholderGroup && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Édition du groupe: {editingStakeholderGroup}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const newName = prompt("Nouveau nom pour ce groupe:", editingStakeholderGroup);
                  if (newName && newName.trim()) {
                    setStakeholders(prev => ({
                      internes: prev.internes.map(s => 
                        s.groupe === editingStakeholderGroup ? { ...s, groupe: newName.trim() } : s
                      ),
                      externes: prev.externes.map(s => 
                        s.groupe === editingStakeholderGroup ? { ...s, groupe: newName.trim() } : s
                      )
                    }));
                    setEditingStakeholderGroup(newName.trim());
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Renommer
              </button>
              <button
                onClick={() => {
                  if (confirm(`Supprimer le groupe ${editingStakeholderGroup} et toutes ses parties prenantes ?`)) {
                    setStakeholders(prev => ({
                      internes: prev.internes.filter(s => s.groupe !== editingStakeholderGroup),
                      externes: prev.externes.filter(s => s.groupe !== editingStakeholderGroup)
                    }));
                    setEditingStakeholderGroup(null);
                    setViewMode('view');
                  }
                }}
                className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Supprimer
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {stakeholders.internes
              .filter(s => s.groupe === editingStakeholderGroup)
              .map((item, index) => {
                const actualIndex = stakeholders.internes.findIndex(s => s === item);
                return (
                  <StakeholderEditForm 
                    key={`interne-${actualIndex}-${item.id || actualIndex}`}
                    type="internes"
                    index={actualIndex}
                    item={item}
                    onRemove={() => removeStakeholder('internes', actualIndex)}
                    onChange={(field, value) => handleStakeholderChange('internes', actualIndex, field, value)}
                    onExpectationChange={(expIndex, field, value) => handleExpectationChange('internes', actualIndex, expIndex, field, value)}
                    onAddExpectation={() => addExpectation('internes', actualIndex)}
                    onRemoveExpectation={(expIndex) => removeExpectation('internes', actualIndex, expIndex)}
                  />
                );
              })}
            
            {stakeholders.externes
              .filter(s => s.groupe === editingStakeholderGroup)
              .map((item, index) => {
                const actualIndex = stakeholders.externes.findIndex(s => s === item);
                return (
                  <StakeholderEditForm 
                    key={`externe-${actualIndex}-${item.id || actualIndex}`}
                    type="externes"
                    index={actualIndex}
                    item={item}
                    onRemove={() => removeStakeholder('externes', actualIndex)}
                    onChange={(field, value) => handleStakeholderChange('externes', actualIndex, field, value)}
                    onExpectationChange={(expIndex, field, value) => handleExpectationChange('externes', actualIndex, expIndex, field, value)}
                    onAddExpectation={() => addExpectation('externes', actualIndex)}
                    onRemoveExpectation={(expIndex) => removeExpectation('externes', actualIndex, expIndex)}
                  />
                );
              })}

            <div className="flex justify-between">
              <button
                onClick={() => {
                  addStakeholder('internes', editingStakeholderGroup);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une partie prenante
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button
          onClick={() => {
            setViewMode('view');
            setEditingStakeholderGroup(null);
          }}
          className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          onClick={saveStakeholders}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
        >
          <Save className="h-5 w-5 mr-2" />
          Enregistrer les modifications
        </button>
      </div>
    </div>
  );
};