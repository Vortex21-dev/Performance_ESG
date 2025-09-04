import React, { useState } from 'react';
import { Edit3, Save, X, Grid3X3 } from 'lucide-react';
import { FormTextarea } from '../ui/FormTextarea';
import { ModuleProps } from '../../types/content';

export const DoubleMaterialite: React.FC<ModuleProps> = ({
  currentOrganization,
  contentModules,
  editingModule,
  editingContent,
  canEdit,
  isSavingContent,
  onEditStart,
  onEditCancel,
  onEditSave,
  onContentChange
}) => {
  const moduleType = 'double_materialite';
  const isEditing = editingModule === moduleType;
  const content = contentModules.find(m => m.module_type === moduleType);

  // Données du tableau détaillé
  const [matrixData, setMatrixData] = useState<{ impact: number; financial: number }[]>([
    { impact: 1, financial: 1 },
    { impact: 2, financial: 2 },
    { impact: 3, financial: 3 },
    { impact: 4, financial: 4 },
    { impact: 5, financial: 5 },
    { impact: 6, financial: 6 },
    { impact: 7, financial: 7 },
    { impact: 8, financial: 8 },
    { impact: 9, financial: 9 },
    { impact: 10, financial: 10 },
    { impact: 11, financial: 11 },
    { impact: 12, financial: 12 },
    { impact: 13, financial: 13 },
    { impact: 14, financial: 14 },
    { impact: 15, financial: 15 },
    { impact: 16, financial: 16 },
    { impact: 17, financial: 17 },
    { impact: 18, financial: 18 },
  ]);

  const handleMatrixChange = (index: number, impact: number, financial: number) => {
    const newData = [...matrixData];
    newData[index] = { impact, financial };
    setMatrixData(newData);
  };

  const renderMatrix = () => (
    <div className="grid grid-cols-2 gap-4">
      {matrixData.map((data, index) => (
        <div key={index} className="flex items-center justify-between">
          <span>{index + 1}</span>
          <input
            type="number"
            value={data.impact}
            onChange={(e) => handleMatrixChange(index, parseInt(e.target.value), data.financial)}
            className="w-16 text-center"
          />
          <input
            type="number"
            value={data.financial}
            onChange={(e) => handleMatrixChange(index, data.impact, parseInt(e.target.value))}
            className="w-16 text-center"
          />
        </div>
      ))}
    </div>
  );

  const renderChart = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3>Impact Matérialité</h3>
        <div className="flex items-center space-x-2">
          {matrixData.map((data, index) => (
            <div key={index} className="flex-1 bg-red-500" style={{ height: `${(data.impact / 18) * 100}%` }}></div>
          ))}
        </div>
      </div>
      <div>
        <h3>Financial Matérialité</h3>
        <div className="flex items-center space-x-2">
          {matrixData.map((data, index) => (
            <div key={index} className="flex-1 bg-gray-800" style={{ height: `${(data.financial / 18) * 100}%` }}></div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-cyan-500">
              <Grid3X3 className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Double Matérialité</h2>
          </div>
          {canEdit && !isEditing && (
            <button
              onClick={() => onEditStart(moduleType)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Modifier
            </button>
          )}
        </div>

        {isEditing && canEdit ? (
          <div className="space-y-6">
            <FormTextarea
              label="Analyse de Double Matérialité"
              value={editingContent.content || ''}
              onChange={(e) => onContentChange('content', e.target.value)}
              rows={20}
              placeholder="Décrivez votre analyse de double matérialité..."
            />
            {renderMatrix()}
            <div className="flex justify-end space-x-3">
              <button
                onClick={onEditCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </button>
              <button
                onClick={onEditSave}
                disabled={isSavingContent}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSavingContent ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2 inline" />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="prose max-w-none">
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {content?.content || 'Aucun contenu disponible'}
              </p>
            </div>
            {renderChart()}
          </div>
        )}
      </div>
    </div>
  );
}; 