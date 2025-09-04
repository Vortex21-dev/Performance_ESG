import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { DashboardTab } from '../../components/pilotage/DashboardTab';
import { ContributorPilotage } from '../../components/pilotage/ContributorPilotage';
import { ValidatorPilotage } from '../../components/pilotage/ValidatorPilotage';
import { AdminClientPilotage } from '../../components/pilotage/AdminClientPilotage';
import { MultiSiteAdminDashboard } from '../../components/pilotage/MultiSiteAdminDashboard';
import { VisualizationDashboard } from '../../components/pilotage/VisualizationDashboard';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Table, Eye, Building2, PieChart } from 'lucide-react';

export default function PilotageDashboard() {
  const { profile, impersonatedOrganization } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeView, setActiveView] = useState(searchParams.get('view') || 'dashboard');

  // Vérifier les permissions d'accès
  const isAdmin = profile?.role === 'admin';
  const isEnterprise = profile?.role === 'enterprise';
  const isContributor = profile?.role === 'contributor';
  const isValidator = profile?.role === 'validator';
  
  // Permettre l'accès aux rôles autorisés
  const hasAccess = isEnterprise || isContributor || isValidator || (isAdmin && impersonatedOrganization);

  if (!profile || !hasAccess) {
    return <Navigate to="/login" replace />;
  }

  // Update URL when view changes
  const handleViewChange = (view: string) => {
    setActiveView(view);
    setSearchParams({ view });
  };

  // Routage selon le rôle
  if (isContributor) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Module Pilotage ESG</h1>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleViewChange('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeView === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Tableau de Bord</span>
              </button>
              <button
                onClick={() => handleViewChange('collection')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeView === 'collection' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Table className="w-4 h-4" />
                <span>Collecte</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeView === 'dashboard' ? <DashboardTab /> : <ContributorPilotage />}
          </motion.div>
        </div>
      </div>
    );
  }
   
  if (isValidator) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */} 
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Module Pilotage ESG</h1>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleViewChange('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeView === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Tableau de Bord</span>
              </button>
              <button
                onClick={() => handleViewChange('validation')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeView === 'validation' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Validation</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeView === 'dashboard' ? <DashboardTab /> : <ValidatorPilotage />}
          </motion.div>
        </div>
      </div>
    );
  }
  
  if (isEnterprise || (isAdmin && impersonatedOrganization)) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Module Pilotage ESG</h1>
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleViewChange('dashboard')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  activeView === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Tableau de Bord</span>
              </button>
              {/*<button
                onClick={() => handleViewChange('pilotage')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  activeView === 'pilotage' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Table className="w-4 h-4" />
                 <span>Pilotage</span>
              </button>*/}
              <button
                onClick={() => handleViewChange('multisites')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  activeView === 'multisites' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Multi-Sites</span>
              </button>
              <button
                onClick={() => handleViewChange('visualizations')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  activeView === 'visualizations' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <PieChart className="w-4 h-4" />
                <span>Visualisations</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeView === 'dashboard' && <DashboardTab />}
            {activeView === 'pilotage' && <AdminClientPilotage />}
            {activeView === 'multisites' && <MultiSiteAdminDashboard />}
            {activeView === 'visualizations' && <VisualizationDashboard />}
          </motion.div>
        </div>
      </div>
    );
  }

  // Fallback - ne devrait jamais arriver
  return <Navigate to="/enterprise/dashboard" replace />;
}  