import React from 'react';
import { useOrganizationESGData } from '../../hooks/useOrganizationESGData';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Award, 
  Target, 
  CheckSquare, 
  BarChart3, 
  Loader2,
  AlertCircle 
} from 'lucide-react';

const ESGDataViewer: React.FC = () => {
  const { profile, impersonatedOrganization } = useAuthStore();
  const { data, loading, error } = useOrganizationESGData();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Chargement des données ESG...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-red-600">{error}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucune donnée ESG configurée
        </h3>
        <p className="text-gray-500">
          Votre organisation n'a pas encore de configuration ESG.
        </p>
      </div>
    );
  }

  const sections = [
    {
      title: 'Secteur d\'activité',
      icon: Building2,
      color: 'bg-blue-500',
      content: data.sector ? (
        <div>
          <p className="font-medium">{data.sector.sector_name}</p>
          {data.sector.subsector_name && (
            <p className="text-sm text-gray-600">{data.sector.subsector_name}</p>
          )}
        </div>
      ) : (
        <p className="text-gray-500">Non défini</p>
      )
    },
    {
      title: 'Normes et Standards',
      icon: Award,
      color: 'bg-purple-500',
      content: data.standards.length > 0 ? (
        <div className="space-y-1">
          {data.standards.map((standard, index) => (
            <span
              key={index}
              className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mr-1 mb-1"
            >
              {standard}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Aucune norme sélectionnée</p>
      )
    },
    {
      title: 'Enjeux ESG',
      icon: Target,
      color: 'bg-green-500',
      content: data.issues.length > 0 ? (
        <div>
          <p className="font-medium mb-2">{data.issues.length} enjeux sélectionnés</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {data.issues.map((issue, index) => (
              <div key={index} className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                {issue}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Aucun enjeu sélectionné</p>
      )
    },
    {
      title: 'Critères d\'évaluation',
      icon: CheckSquare,
      color: 'bg-amber-500',
      content: data.criteria.length > 0 ? (
        <div>
          <p className="font-medium mb-2">{data.criteria.length} critères sélectionnés</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {data.criteria.map((criteria, index) => (
              <div key={index} className="text-sm text-gray-700 bg-amber-50 p-2 rounded">
                {criteria}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Aucun critère sélectionné</p>
      )
    },
    {
      title: 'Indicateurs de performance',
      icon: BarChart3,
      color: 'bg-cyan-500',
      content: data.indicators.length > 0 ? (
        <div>
          <p className="font-medium mb-2">{data.indicators.length} indicateurs sélectionnés</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {data.indicators.map((indicator, index) => (
              <div key={index} className="text-sm text-gray-700 bg-cyan-50 p-2 rounded">
                {indicator}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Aucun indicateur sélectionné</p>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Configuration ESG - {impersonatedOrganization || profile?.organization_name}
        </h2>
        <p className="text-gray-600 mb-6">
          Voici la configuration ESG de votre organisation, définie lors du processus de la configuration initiale.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-lg ${section.color}`}>
                  <section.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900">
                  {section.title}
                </h3>
              </div>
              <div className="text-gray-700">
                {section.content}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ESGDataViewer;