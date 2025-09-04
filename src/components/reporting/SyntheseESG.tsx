import React, { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Award, 
  RefreshCw, 
  Download 
} from 'lucide-react';
import { ModuleProps } from '../../types/content';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler
);

export const SyntheseESG: React.FC<ModuleProps> = ({
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
  activeSyntheseTab,
  setActiveSyntheseTab
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

  const radarData = {
    labels: ['Environnement', 'Social', 'Gouvernance', 'Innovation', 'Transparence', 'Performance'],
    datasets: [
      {
        label: 'Notre organisation',
        data: [82, 76, 85, 78, 88, 80],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      },
      {
        label: 'Moyenne sectorielle',
        data: [70, 68, 75, 65, 72, 70],
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        borderColor: 'rgba(156, 163, 175, 1)',
        pointBackgroundColor: 'rgba(156, 163, 175, 1)',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  const trendData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [
      {
        label: 'Environnement',
        data: [75, 76, 78, 79, 80, 81, 82, 82, 83, 82, 82, 82.5],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1
      },
      {
        label: 'Social',
        data: [70, 71, 72, 73, 74, 75, 75, 76, 76, 77, 76, 76.8],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1
      },
      {
        label: 'Gouvernance',
        data: [85, 86, 87, 87, 86, 86, 85, 85, 85, 85, 85, 85.2],
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.1
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Évolution des scores ESG par pilier'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  const renderSyntheseContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des données de synthèse...</p>
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
                Synthèse ESG
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
    {/* Performance ESG Dropdown */}
    <Menu as="div" className="relative">
      {({ open }) => (
        <>
          <Menu.Button className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            ['benchmark', 'score', 'piliers'].includes(activeSyntheseTab)
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}>
            <BarChart3 className="h-5 w-5 mr-2" />
            Performance ESG
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`} />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 mt-2 w-80 origin-top-left bg-green-50 border border-green-200 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-2">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setActiveSyntheseTab('benchmark')}
                      className={`${
                        active ? 'bg-green-100' : ''
                      } ${
                        activeSyntheseTab === 'benchmark' ? 'text-green-700 bg-green-100 font-semibold' : 'text-gray-900'
                      } group flex items-center w-full px-4 py-3 text-sm transition-colors hover:bg-green-100`}
                    >
                      <BarChart3 className="h-5 w-5 mr-3 text-green-600" />
                      Benchmark
                    </button>
                  )}
                </Menu.Item> 
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setActiveSyntheseTab('score')}
                      className={`${
                        active ? 'bg-green-100' : ''
                      } ${
                        activeSyntheseTab === 'score' ? 'text-green-700 bg-green-100 font-semibold' : 'text-gray-900'
                      } group flex items-center w-full px-4 py-3 text-sm transition-colors hover:bg-green-100`}
                    >
                      <Award className="h-5 w-5 mr-3 text-green-600" />
                      Score Global ESG
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setActiveSyntheseTab('piliers')}
                      className={`${
                        active ? 'bg-green-100' : ''
                      } ${
                        activeSyntheseTab === 'piliers' ? 'text-green-700 bg-green-100 font-semibold' : 'text-gray-900'
                      } group flex items-center w-full px-4 py-3 text-sm transition-colors hover:bg-green-100`}
                    >
                      <Users className="h-5 w-5 mr-3 text-green-600" />
                      Scores par piliers
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>

    {/* Tendances Dropdown */}
    <Menu as="div" className="relative">
      <Menu.Button className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
        ['graphiques', 'tendances'].includes(activeSyntheseTab)
          ? 'border-green-500 text-green-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}>
        <TrendingUp className="h-5 w-5 mr-2" />
        Tendances
        <ChevronDown className="h-4 w-4 ml-1" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 mt-2 w-80 origin-top-left bg-green-50 border border-green-200 rounded-lg shadow-lg ring-1 ring-green-200 ring-opacity-50 focus:outline-none z-10">
          <div className="py-3 px-2">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setActiveSyntheseTab('graphiques')}
                  className={`${
                    active ? 'bg-green-100' : ''
                  } ${
                    activeSyntheseTab === 'graphiques' ? 'text-green-700 bg-green-100 font-medium' : 'text-gray-800'
                  } group flex items-center w-full px-4 py-3 text-sm rounded-md transition-colors hover:bg-green-100`}
                >
                  <TrendingUp className="h-5 w-5 mr-3 text-green-600" />
                  Graphiques
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setActiveSyntheseTab('tendances')}
                  className={`${
                    active ? 'bg-green-100' : ''
                  } ${
                    activeSyntheseTab === 'tendances' ? 'text-green-700 bg-green-100 font-medium' : 'text-gray-800'
                  } group flex items-center w-full px-4 py-3 text-sm rounded-md transition-colors hover:bg-green-100`}
                >
                  <TrendingDown className="h-5 w-5 mr-3 text-green-600" />
                  Tendances Clés
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>

    {/* Analyse SWOT ESG - Simple tab */}
    <button
      onClick={() => setActiveSyntheseTab('enjeux')}
      className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
        activeSyntheseTab === 'enjeux'
          ? 'border-green-500 text-green-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      <Users className="h-5 w-5 mr-2" />
      Analyse SWOT ESG
    </button>
  </nav>
</div>

{/* Content */}
{activeSyntheseTab === 'benchmark' && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-8"
  >
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Benchmark sectoriel</h3>
      <div className="h-96">
        <Radar data={radarData} options={chartOptions} />
      </div>
    </div>
  </motion.div>
)}

{activeSyntheseTab === 'score' && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-8"
  >
    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8 text-center">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Score Global ESG</h2>
      <div className="text-6xl font-bold text-blue-600 mb-2">
        {Math.round(globalScore * 10) / 10}
      </div>
      <p className="text-gray-600">Score Global ESG sur 100</p>
    </div>
  </motion.div>
)}

{activeSyntheseTab === 'piliers' && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-8"
  >
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
        </div>
      ))}
    </div>
  </motion.div>
)}

{activeSyntheseTab === 'graphiques' && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-8"
  >
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Graphiques de Tendances par Catégorie
      </h3>
      <div className="h-96">
        <Line data={trendData} options={lineChartOptions} />
      </div>
    </div>
  </motion.div>
)}

{activeSyntheseTab === 'tendances' && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-8"
  >
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Tendances Clés ESG
      </h3>
      {/* Contenu spécifique aux tendances clés */}
      <div className="space-y-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Tendance positive</h4>
          <p className="text-green-700">Amélioration continue des performances environnementales</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-lg">
          <h4 className="font-medium text-amber-800 mb-2">Points d'attention</h4>
          <p className="text-amber-700">Surveillance nécessaire des indicateurs sociaux</p>
        </div>
      </div>
    </div>
  </motion.div>
)}

{activeSyntheseTab === 'enjeux' && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-8"
  >
    {/* SWOT Analysis */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Forces */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">Forces</h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span className="text-blue-800">ClimateChange - ghgEmissions (17250.00)</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span className="text-blue-800">WaterMarineResources - waterWithdrawal (1000.00)</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span className="text-blue-800">ClimateChange - carbonFootprint (282.00)</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span className="text-blue-800">WaterMarineResources - waterDischarge (200.00)</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span className="text-blue-800">Pollution - wasteManagement (75.00)</span>
          </li>
        </ul>
      </div>

      {/* Faiblesses */}
      <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
        <h3 className="text-lg font-semibold text-amber-800 mb-4">Faiblesses</h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <span className="text-amber-600 mr-2">•</span>
            <span className="text-amber-800">ConsumersEndUsers - productSafetyIncidents (0.00)</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 mr-2">•</span>
            <span className="text-amber-800">BusinessConduct - ethicsViolations (0.00)</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 mr-2">•</span>
            <span className="text-amber-800">BiodiversityEcosystems - deforestationRisk (0.05)</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 mr-2">•</span>
            <span className="text-amber-800">CircularEconomy - wasteToLandfill (0.10)</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 mr-2">•</span>
            <span className="text-amber-800">OwnWorkforce - employeeTurnover (0.15)</span>
          </li>
        </ul>
      </div>

      {/* Opportunités */}
      <div className="bg-green-50 rounded-xl p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-green-800 mb-4">Opportunités</h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <span className="text-green-600 mr-2">•</span>
            <span className="text-green-800">Opportunité de leadership en matière de réduction des émissions de portée 3.</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">•</span>
            <span className="text-green-800">Potentiel d'amélioration de l'engagement des employés grâce à des initiatives ciblées.</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">•</span>
            <span className="text-green-800">Développement de nouveaux produits ou services durables.</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">•</span>
            <span className="text-green-800">Accroissement de la part de marché grâce à une forte réputation ESG.</span>
          </li>
        </ul>
      </div>

      {/* Menaces */}
      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
        <h3 className="text-lg font-semibold text-red-800 mb-4">Menaces</h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <span className="text-red-600 mr-2">•</span>
            <span className="text-red-800">Risque réglementaire croissant lié aux nouvelles directives CSRD.</span>
          </li>
          <li className="flex items-start">
            <span className="text-red-600 mr-2">•</span>
            <span className="text-red-800">Concurrence accrue sur les marchés à faible empreinte carbone.</span>
          </li>
          <li className="flex items-start">
            <span className="text-red-600 mr-2">•</span>
            <span className="text-red-800">Pénurie de ressources due au changement climatique.</span>
          </li>
          <li className="flex items-start">
            <span className="text-red-600 mr-2">•</span>
            <span className="text-red-800">Risque de réputation lié à la chaîne de valeur.</span>
          </li>
        </ul>
      </div>
    </div>

    {/* Strategic Recommendations */}
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Recommandations Stratégiques</h3>
      <div className="space-y-6">
        <div className="border-l-4 border-blue-500 pl-6">
          <div className="flex items-center mb-2">
            <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm font-medium mr-3">
              Priorité 1
            </span>
            <h4 className="font-semibold text-gray-900">Optimiser la gestion des déchets</h4>
          </div>
          <p className="text-gray-700 mb-2">
            Investir dans des technologies de recyclage avancées et sensibiliser les employés aux pratiques de réduction des déchets.
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Impact attendu:</span> Réduction des coûts, diminution de l'impact environnemental et renforcement de l'image de marque.
          </p>
        </div>

        <div className="border-l-4 border-purple-500 pl-6">
          <div className="flex items-center mb-2">
            <span className="bg-purple-500 text-white px-2 py-1 rounded text-sm font-medium mr-3">
              Priorité 2
            </span>
            <h4 className="font-semibold text-gray-900">RiskManagement: Renforcer l'évaluation des risques ESG</h4>
          </div>
          <p className="text-gray-700 mb-2">
            Intégrer les risques ESG de manière plus proactive dans le cadre de la gestion des risques de l'entreprise.
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Impact attendu:</span> Meilleure résilience face aux défis futurs et identification précoce des opportunités.
          </p>
        </div>
      </div>
    </div>
  </motion.div>
)}
      </div>
    );
  };

  return renderSyntheseContent();
};