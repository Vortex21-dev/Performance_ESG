import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Menu, Transition } from '@headlessui/react';
import { LogoutButton } from '../../components/ui/LogoutButton';
import {
  FileText,
  User,
  Building2,
  Info,
  Target,
  AlertCircle,
  Grid3X3,
  Lightbulb,
  BarChart3,
  CheckCircle,
  List,
  ArrowLeft,
  Shield,
  Download,
  Printer,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  PieChart,
  LineChart,
  Leaf,
  Users,
  Globe,
  XCircle,
  AlertTriangle,
  Award,
  Home,
  Settings,
  Eye,
  CheckSquare,
  X,
  ChevronDown,
  Edit,
  Upload,
  UserCircle,
  Edit3,
  Save,
  Calendar,
  MapPin,
  Briefcase
} from 'lucide-react';

// Composants de reporting
import { MotDuDirigeant } from '../../components/reporting/MotDuDirigeant';
import { ProfilOrganisation } from '../../components/reporting/ProfilOrganisation';
import { InformationsGenerales } from '../../components/reporting/InformationsGenerales';
import { BusinessModelEngagement } from '../../components/reporting/BusinessModelEngagement';
import { IRO } from '../../components/reporting/IRO';
import { DoubleMaterialite } from '../../components/reporting/DoubleMaterialite';
import { StrategieReporting } from '../../components/reporting/StrategieReporting';
import { SyntheseESG } from '../../components/reporting/SyntheseESG';
import { Performance } from '../../components/reporting/Performance';
import { EvaluationESG } from '../../components/reporting/EvaluationESG';
import { IndexReporting } from '../../components/reporting/IndexReporting';

interface ContentModule {
  id?: string;
  module_type: string;
  content: string;
  organization_name: string;
  status: 'draft' | 'published';
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export default function ReportingDashboard() {
  const navigate = useNavigate();
  const { profile, impersonatedOrganization } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('mot_dirigeant');
  const [contentModules, setContentModules] = useState<ContentModule[]>([]);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<Partial<ContentModule>>({});
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // États pour les sous-onglets
  const [activeSyntheseTab, setActiveSyntheseTab] = useState<'performance' | 'tendances' | 'swot'>('performance');
  const [activePerformanceTab, setActivePerformanceTab] = useState<'benchmark' | 'global' | 'piliers' | 'enjeux' | 'criteres'>('benchmark');
  const [activeIndexTab, setActiveIndexTab] = useState<'global' | 'gri' | 'csrd' | 'odd'>('global');
  const [activeStrategyTab, setActiveStrategyTab] = useState<'alignement' | 'strategie' | 'roadmap'>('alignement');
  const [activeAlignementTab, setActiveAlignementTab] = useState<'vision' | 'engagements' | 'enjeux'>('vision');

  const currentOrganization = impersonatedOrganization || profile?.organization_name || '';
  const canEdit = profile?.role === 'enterprise_admin';

  const reportingTabs = [
    { id: 'mot_dirigeant', label: 'Mot du dirigeant', icon: User, component: MotDuDirigeant },
    { id: 'profil_organisation', label: 'Profil de l\'organisation', icon: Building2, component: ProfilOrganisation },
    { id: 'informations_generales', label: 'Informations générales', icon: Info, component: InformationsGenerales },
    { id: 'business_model_engagement', label: 'Business Model & Engagement', icon: Target, component: BusinessModelEngagement },
    { id: 'iro', label: 'IRO', icon: AlertCircle, component: IRO },
    { id: 'double_materialite', label: 'Double Matérialité', icon: Grid3X3, component: DoubleMaterialite },
    { id: 'strategie_reporting', label: 'Stratégie', icon: Lightbulb, component: StrategieReporting },
    { id: 'synthese_esg', label: 'Synthèse ESG', icon: FileText, component: SyntheseESG },
    { id: 'performance', label: 'Performance', icon: BarChart3, component: Performance },
    { id: 'evaluation_esg', label: 'Évaluation ESG', icon: CheckCircle, component: EvaluationESG },
    { id: 'index_reporting', label: 'Index', icon: List, component: IndexReporting }
  ];

  useEffect(() => {
    fetchContentModules();
  }, [currentOrganization]);

  const fetchContentModules = async () => {
    if (!currentOrganization) return;
    
    setIsLoadingContent(true);
    try {
      const { data, error } = await supabase
        .from('content_modules')
        .select('*')
        .eq('organization_name', currentOrganization);

      if (error) throw error;
      setContentModules(data || []);
    } catch (error) {
      console.error('Error fetching content modules:', error);
      toast.error('Erreur lors du chargement du contenu');
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleEditStart = (moduleType: string) => {
    const existingModule = contentModules.find(m => m.module_type === moduleType);
    
    setEditingModule(moduleType);
    setEditingContent({
      module_type: moduleType,
      content: existingModule?.content || '',
      organization_name: currentOrganization,
      status: existingModule?.status || 'draft'
    });
  };

  const handleEditCancel = () => {
    setEditingModule(null);
    setEditingContent({});
  };

  const handleEditSave = async () => {
    if (!editingContent.module_type || !currentOrganization) return;

    setIsSavingContent(true);
    try {
      const existingModule = contentModules.find(m => m.module_type === editingContent.module_type);
      
      if (existingModule) {
        const { error } = await supabase
          .from('content_modules')
          .update({
            content: editingContent.content,
            status: editingContent.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingModule.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('content_modules')
          .insert({
            module_type: editingContent.module_type,
            content: editingContent.content,
            organization_name: currentOrganization,
            status: editingContent.status || 'draft',
            created_by: profile?.id
          });

        if (error) throw error;
      }

      await fetchContentModules();
      setEditingModule(null);
      setEditingContent({});
      toast.success('Contenu sauvegardé avec succès');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleUpdateData = async () => {
    setIsUpdating(true);
    await fetchContentModules();
    setIsUpdating(false);
  };

  const handleContentChange = (content: string) => {
    setEditingContent(prev => ({ ...prev, content }));
  };

  const handleExportPDF = () => {
    console.log('Exporting to PDF...');
    toast.success('Export PDF en cours de préparation');
  };

  const renderTabContent = () => {
    const moduleProps = {
      contentModules,
      editingModule,
      editingContent,
      setEditingContent,
      onEditStart: handleEditStart,
      onEditCancel: handleEditCancel,
      onEditSave: handleEditSave,
      onContentChange: handleContentChange,
      isSavingContent,
      canEdit,
      currentOrganization,
      activeSyntheseTab,
      setActiveSyntheseTab,
      activePerformanceTab,
      setActivePerformanceTab,
      activeIndexTab,
      setActiveIndexTab,
      activeStrategyTab,
      setActiveStrategyTab,
      activeAlignementTab,
      setActiveAlignementTab
    };

    if (isLoadingContent) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Chargement du contenu...</span>
        </div>
      );
    }

    const tab = reportingTabs.find(t => t.id === activeTab);
    if (tab) {
      const Component = tab.component;
      return <Component {...moduleProps} />;
    }

    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez un module</h3>
        <p className="text-gray-600">Choisissez un module dans la liste pour commencer à éditer le contenu.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex-shrink-0`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className={`font-bold text-gray-900 ${sidebarOpen ? 'text-xl' : 'text-sm'}`}>
              {sidebarOpen ? currentOrganization : 'RPT'}
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <nav className="space-y-2">
            {reportingTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const moduleContent = contentModules.find(m => m.module_type === tab.id);
              const hasContent = moduleContent && moduleContent.content && moduleContent.content.trim().length > 0;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${sidebarOpen ? 'mr-3' : ''}`} />
                  {sidebarOpen && (
                    <>
                      <span className="font-medium">{tab.label}</span>
                      {hasContent && (
                        <CheckCircle className="h-4 w-4 ml-auto text-green-500" />
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/enterprise/dashboard')}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">REPORTING ESG</h2>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}