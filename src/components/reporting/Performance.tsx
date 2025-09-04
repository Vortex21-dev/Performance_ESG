import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Award, 
  CheckSquare, 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Download 
} from 'lucide-react';
import { ModuleProps } from '../../types/content';

export const Performance: React.FC<ModuleProps> = ({
  currentOrganization,
  contentModules,
  editingModule,
  editingContent,
  canEdit,
  isSavingContent,
  onEditStart,
  onEditCancel,
  onEditSave,
  onContentChange,
  activePerformanceTab,
  setActivePerformanceTab
}) => {
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [globalScore] = useState(78.5);

  const testESGScores = [
    { category: 'Environnement', score: 82.5, trend: 'up', change: 5.2 },
    { category: 'Social', score: 76.8, trend: 'up', change: 3.1 },
    { category: 'Gouvernance', score: 85.2, trend: 'down', change: -1.5 }
  ];

  const handleUpdateData = () => {
    setIsUpdating(true);
    setTimeout(() => setIsUpdating(false), 2000);
  };

  const handleExportPDF = () => {
    console.log('Exporting to PDF...');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Environnement':
        return <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">🌱</div>;
      case 'Social':
        return <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">👥</div>;
      case 'Gouvernance':
        return <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">⚖️</div>;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 text-gray-400">—</div>;
    }
  };

  const renderPerformanceContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des données de performance...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Performance ESG
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Période 2024</span>
              <button
                onClick={handleUpdateData}
                disabled={isUpdating}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter PDF
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'global', label: 'Score Global ESG', icon: Target },
              { id: 'piliers', label: 'Performance par piliers', icon: Award },
              { id: 'enjeux', label: 'Performance par enjeux', icon: CheckSquare },
              { id: 'criteres', label: 'Performance par critères', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePerformanceTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activePerformanceTab === tab.id
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
      
        {activePerformanceTab === 'global' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Global Score */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Score Global ESG</h2>
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {Math.round(globalScore * 10) / 10}
              </div>
              <p className="text-gray-600">Score Global ESG sur 100</p>
            </div>
          </motion.div>
        )}

        {activePerformanceTab === 'piliers' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Category Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {testESGScores.map((score, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">{score.category}</h4>
                    {getCategoryIcon(score.category)}
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {score.score.toFixed(1)}%
                    </div>
                    <div className="flex items-center">
                      {getTrendIcon(score.trend)}
                      <span className={`ml-1 text-sm font-medium ${
                        score.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {score.change > 0 ? '+' : ''}{score.change}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Métriques Clés</span>
                    </div>
                    
                    {score.category === 'Environnement' && (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>ghgEmissions:</span>
                          <span className="font-medium">17250.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>carbonFootprint:</span>
                          <span className="font-medium">282.00</span>
                        </div>
                      </div>
                    )}

                    {score.category === 'Social' && (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>employeeTurnover:</span>
                          <span className="font-medium">0.15</span>
                        </div>
                        <div className="flex justify-between">
                          <span>productSafety:</span>
                          <span className="font-medium">0.00</span>
                        </div>
                      </div>
                    )}

                    {score.category === 'Gouvernance' && (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>ethicsViolations:</span>
                          <span className="font-medium">0.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>riskManagement:</span>
                          <span className="font-medium">85.2</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activePerformanceTab === 'enjeux' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance par enjeux</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Changement climatique', score: 85, trend: 'up' },
                  { name: 'Biodiversité', score: 72, trend: 'stable' },
                  { name: 'Pollution', score: 78, trend: 'up' },
                  { name: 'Ressources marines', score: 68, trend: 'down' },
                  { name: 'Économie circulaire', score: 74, trend: 'up' },
                  { name: 'Main-d\'œuvre', score: 81, trend: 'up' }
                ].map((enjeu, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{enjeu.name}</h4>
                      {getTrendIcon(enjeu.trend)}
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{enjeu.score}%</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activePerformanceTab === 'criteres' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance par critères</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Émissions directes (Scope 1)', score: 88, category: 'Environnement' },
                  { name: 'Émissions indirectes (Scope 2)', score: 82, category: 'Environnement' },
                  { name: 'Gestion des déchets', score: 75, category: 'Environnement' },
                  { name: 'Consommation d\'eau', score: 79, category: 'Environnement' },
                  { name: 'Santé et sécurité au travail', score: 91, category: 'Social' },
                  { name: 'Formation des employés', score: 76, category: 'Social' },
                  { name: 'Diversité et inclusion', score: 68, category: 'Social' },
                  { name: 'Éthique des affaires', score: 85, category: 'Gouvernance' },
                  { name: 'Gestion des risques', score: 73, category: 'Gouvernance' },
                  { name: 'Transparence', score: 80, category: 'Gouvernance' }
                ].map((critere, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{critere.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        critere.category === 'Environnement' ? 'bg-green-100 text-green-800' :
                        critere.category === 'Social' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {critere.category}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-blue-600">{critere.score}%</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return renderPerformanceContent();
};