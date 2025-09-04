import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, Grid3X3, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

interface MatrixRow {
  id: number;
  issue_name: string;
  type: 'Env' | 'Soc' | 'Gouv';
  impact: number;
  financial: number;
  created_at?: string;
  updated_at?: string;
}

// Configuration des couleurs par type
const typeColors = {
  Env: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    badgeBg: 'bg-green-500',
    scoreBg: '#dcfce7',
    scoreText: '#166534'
  },
  Soc: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    badgeBg: 'bg-blue-500',
    scoreBg: '#dbeafe',
    scoreText: '#1e40af'
  },
  Gouv: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
    badgeBg: 'bg-purple-500',
    scoreBg: '#f3e8ff',
    scoreText: '#7c3aed'
  }
};

// Service API pour la gestion de la double matérialité
class DoubleMaterialityService {
  async fetchMatrix(organizationName: string): Promise<MatrixRow[]> {
    try {
      const { data, error } = await supabase
        .from('double_materiality_matrix')
        .select('*')
        .eq('organization_name', organizationName)
        .order('type', { ascending: true })
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching matrix:', error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        issue_name: row.issue_name,
        type: row.type,
        impact: row.impact_score,
        financial: row.financial_score,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error('Service error:', error);
      return [];
    }
  }

  async updateMatrix(organizationName: string, row: MatrixRow): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('double_materiality_matrix')
        .upsert({
          organization_name: organizationName,
          id: row.id,
          issue_name: row.issue_name,
          type: row.type,
          impact_score: row.impact,
          financial_score: row.financial,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'organization_name,id'
        });

      return !error;
    } catch (error) {
      console.error('Error updating matrix:', error);
      return false;
    }
  }

  async deleteMatrixRow(organizationName: string, id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('double_materiality_matrix')
        .delete()
        .eq('organization_name', organizationName)
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error deleting matrix row:', error);
      return false;
    }
  }

  async insertMatrixRow(organizationName: string, row: Omit<MatrixRow, 'id' | 'created_at' | 'updated_at'>): Promise<MatrixRow | null> {
    try {
      const { data, error } = await supabase
        .from('double_materiality_matrix')
        .insert({
          organization_name: organizationName,
          issue_name: row.issue_name,
          type: row.type,
          impact_score: row.impact,
          financial_score: row.financial
        })
        .select()
        .single();

      return error ? null : data;
    } catch (error) {
      console.error('Service error:', error);
      return null;
    }
  }

  async getNextId(organizationName: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('double_materiality_matrix')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      if (error) return 1;
      return data && data.length > 0 ? data[0].id + 1 : 1;
    } catch {
      return 1;
    }
  }

  async insertDefaultMatrix(organizationName: string): Promise<MatrixRow[]> {
    const defaultData = [
      { id: 1, issue_name: 'Atténuation du changement climatique', type: 'Env' as const, impact: 4, financial: 1 },
      { id: 2, issue_name: 'Gestion de l\'énergie', type: 'Env' as const, impact: 3, financial: 1 },
      { id: 3, issue_name: 'Adaptation au changement climatique', type: 'Env' as const, impact: 3, financial: 3 },
      { id: 4, issue_name: 'Prélèvement et consommation d\'eau', type: 'Env' as const, impact: 4, financial: 4 },
      { id: 5, issue_name: 'Rejets d\'eau', type: 'Env' as const, impact: 5, financial: 1 },
      { id: 6, issue_name: 'Changement d\'usage des terres', type: 'Env' as const, impact: 5, financial: 1 },
      { id: 7, issue_name: 'Emballages et fin de vie', type: 'Env' as const, impact: 4, financial: 5 },
      { id: 8, issue_name: 'Utilisation d\'ingrédients et matériaux', type: 'Env' as const, impact: 1, financial: 5 },
      { id: 9, issue_name: 'Gestion des déchets', type: 'Env' as const, impact: 4, financial: 1 },
      { id: 10, issue_name: 'Rémunération équitable', type: 'Soc' as const, impact: 2, financial: 4 },
      { id: 11, issue_name: 'Équité salariale', type: 'Soc' as const, impact: 1, financial: 4 },
      { id: 12, issue_name: 'Développement des employés', type: 'Soc' as const, impact: 1, financial: 4 },
      { id: 13, issue_name: 'Travail des enfants', type: 'Soc' as const, impact: 4, financial: 4 },
      { id: 14, issue_name: 'Heures de travail', type: 'Soc' as const, impact: 4, financial: 1 },
      { id: 15, issue_name: 'Travail forcé', type: 'Soc' as const, impact: 1, financial: 3 },
      { id: 16, issue_name: 'Nutrition et santé', type: 'Soc' as const, impact: 1, financial: 5 },
      { id: 17, issue_name: 'Gestion des fournisseurs', type: 'Gouv' as const, impact: 1, financial: 5 },
      { id: 18, issue_name: 'Culture d\'entreprise', type: 'Gouv' as const, impact: 4, financial: 1 }
    ];

    const results: MatrixRow[] = [];
    for (const row of defaultData) {
      try {
        const result = await this.insertMatrixRow(organizationName, row);
        if (result) results.push(result);
      } catch (error) {
        console.warn('Skipping duplicate:', row.id);
      }
    }
    return results;
  }
}

export const DoubleMaterialite: React.FC<{
  currentOrganization?: string;
  editingModule?: string;
  canEdit?: boolean;
  isSavingContent?: boolean;
  onEditStart?: (module: string) => void;
  onEditCancel?: () => void;
  onEditSave?: () => void;
}> = ({
  currentOrganization,
  editingModule,
  canEdit,
  isSavingContent,
  onEditStart,
  onEditCancel,
  onEditSave
}) => {
  const { user, profile } = useAuthStore();
  const moduleType = 'double_materialite';
  const isEditing = editingModule === moduleType;
  const materialityService = new DoubleMaterialityService();
  
  const canEditModule = canEdit || ['admin', 'enterprise'].includes(profile?.role ?? '');

  const [matrixData, setMatrixData] = useState<MatrixRow[]>([]);
  const [loadingMatrixData, setLoadingMatrixData] = useState(true);
  const [savingRowId, setSavingRowId] = useState<number | null>(null);

  useEffect(() => {
    loadMatrixData();
  }, [currentOrganization]);

  const loadMatrixData = async () => {
    if (!currentOrganization) {
      setLoadingMatrixData(false);
      return;
    }
    
    setLoadingMatrixData(true);
    try {
      const data = await materialityService.fetchMatrix(currentOrganization);
      
      if (data.length === 0) {
        const defaultData = await materialityService.insertDefaultMatrix(currentOrganization);
        setMatrixData(defaultData);
      } else {
        setMatrixData(data);
      }
    } catch (error) {
      console.error('Error loading matrix data:', error);
      setMatrixData([]);
    } finally {
      setLoadingMatrixData(false);
    }
  };

  const handleMatrixDataChange = async (index: number, field: keyof MatrixRow, value: any) => {
    if (!currentOrganization) return;

    const newData = [...matrixData];
    const row = newData[index];
    const updatedRow = { ...row, [field]: value };
    
    newData[index] = updatedRow;
    setMatrixData(newData);
    
    setSavingRowId(row.id);
    try {
      await materialityService.updateMatrix(currentOrganization, updatedRow);
    } catch (error) {
      console.error('Error saving matrix row:', error);
      await loadMatrixData();
    } finally {
      setSavingRowId(null);
    }
  };

  const addMatrixRow = async () => {
    if (!currentOrganization) return;

    const newId = await materialityService.getNextId(currentOrganization);
    const newRow: Omit<MatrixRow, 'id' | 'created_at' | 'updated_at'> = {
      issue_name: 'Nouvel enjeu',
      type: 'Env',
      impact: 3,
      financial: 3
    };

    try {
      const insertedRow = await materialityService.insertMatrixRow(currentOrganization, { ...newRow, id: newId });
      if (insertedRow) {
        setMatrixData([...matrixData, insertedRow]);
      }
    } catch (error) {
      console.error('Error adding matrix row:', error);
    }
  };

  const removeMatrixRow = async (index: number) => {
    if (!currentOrganization) return;

    const rowToDelete = matrixData[index];
    
    try {
      const success = await materialityService.deleteMatrixRow(currentOrganization, rowToDelete.id);
      if (success) {
        const newData = matrixData.filter((_, i) => i !== index);
        setMatrixData(newData);
      }
    } catch (error) {
      console.error('Error removing matrix row:', error);
    }
  };

  const handleEditStart = () => {
    onEditStart?.(moduleType);
  };

  const getTypeLabel = (type: 'Env' | 'Soc' | 'Gouv') => {
    switch(type) {
      case 'Env': return 'Environnement';
      case 'Soc': return 'Social';
      case 'Gouv': return 'Gouvernance';
      default: return type;
    }
  };

  const getTypeColor = (type: 'Env' | 'Soc' | 'Gouv') => {
    return typeColors[type] || typeColors.Env;
  };

  const renderViewModeDisplay = () => (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enjeu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impact Matériel
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impact Financier
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {matrixData.map((row) => {
              const colors = getTypeColor(row.type);
              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`w-8 h-8 ${colors.badgeBg} text-white rounded-full flex items-center justify-center font-bold text-sm`}>
                      {row.id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{row.issue_name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {getTypeLabel(row.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold"
                          style={{
                            backgroundColor: colors.scoreBg,
                            color: colors.scoreText
                          }}>
                      {row.impact}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold"
                          style={{
                            backgroundColor: colors.scoreBg,
                            color: colors.scoreText
                          }}>
                      {row.financial}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMatrix = () => (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enjeu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impact Matériel (1-5)
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impact Financier (1-5)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {matrixData.map((row, index) => {
              const colors = getTypeColor(row.type);
              const isSaving = savingRowId === row.id;
              
              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`w-8 h-8 ${colors.badgeBg} text-white rounded-full flex items-center justify-center font-bold text-sm`}>
                      {row.id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={row.issue_name}
                      onChange={(e) => handleMatrixDataChange(index, 'issue_name', e.target.value)}
                      className="w-full min-w-[200px] px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Nom de l'enjeu"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={row.type}
                      onChange={(e) => handleMatrixDataChange(index, 'type', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="Env">Environnement</option>
                      <option value="Soc">Social</option>
                      <option value="Gouv">Gouvernance</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={row.impact}
                      onChange={(e) => handleMatrixDataChange(index, 'impact', parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={row.financial}
                      onChange={(e) => handleMatrixDataChange(index, 'financial', parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {isSaving && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                      <button
                        onClick={() => removeMatrixRow(index)}
                        className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-red-50"
                        disabled={isSaving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <button
        onClick={addMatrixRow}
        className="flex items-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <Plus className="h-4 w-4 mr-2 text-blue-500" />
        <span className="text-blue-600 font-medium">Ajouter un enjeu</span>
      </button>
    </div>
  );

  if (loadingMatrixData) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Chargement des données de matérialité...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!canEdit && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
          <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-sm font-medium text-blue-800">
            Mode consultation – lecture uniquement
          </span>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-400 to-blue-500">
              <Grid3X3 className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Double Matérialité</h2>
          </div>

          {canEditModule && !isEditing && (
            <button
              onClick={handleEditStart}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Modifier
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-6">
            {!canEditModule && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                  <span className="text-sm font-medium text-amber-800">
                    Seuls les administrateurs et responsables ESG peuvent modifier ce contenu.
                  </span>
                </div>
              </div>
            )}
            
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Instructions</h4>
              <p className="text-sm text-gray-700">
                Évaluez chaque enjeu sur une échelle de 1 à 5 pour l'impact matériel et l'impact financier.
                <br />
                <span className="text-green-600 font-medium">• Vert : Environnement</span> | 
                <span className="text-blue-600 font-medium"> • Bleu : Social</span> | 
                <span className="text-purple-600 font-medium"> • Violet : Gouvernance</span>
              </p>
            </div>

            {renderMatrix()}

            <div className="flex justify-end space-x-3">
              <button
                onClick={onEditCancel}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </button>
              <button
                onClick={() => onEditSave?.()}
                disabled={isSavingContent}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-blue-600 rounded-lg hover:from-green-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingContent ? 'Sauvegarde…' : 'Enregistrer tout'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {renderViewModeDisplay()}
          </div>
        )}
      </motion.div>
    </div> 
  );
};