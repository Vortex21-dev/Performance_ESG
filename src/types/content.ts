export interface ContentModule {
  id: string;
  organization_name: string;
  module_type: ModuleType;
  sub_type?: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type ModuleType = 
  | 'mot_dirigeant'
  | 'profil_organisation'
  | 'informations_generales'
  | 'business_model_engagement'
  | 'iro'
  | 'double_materialite'
  | 'strategie_reporting'
  | 'synthese_esg'
  | 'performance'
  | 'evaluation_esg'
  | 'index_reporting'
  | 'organigramme'
  | 'strategie'
  | 'outils_dirigeants'
  | 'politique_durabilite';

export interface ModuleProps {
  currentOrganization: string;
  contentModules: ContentModule[];
  editingModule: string | null;
  editingContent: Partial<ContentModule>;
  canEdit: boolean;
  isSavingContent: boolean;
  onEditStart: (moduleType: ModuleType) => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onContentChange: (field: keyof ContentModule, value: string) => void;
  // Optional props for specific modules
  activeSyntheseTab?: string;
  setActiveSyntheseTab?: (tab: string) => void;
  activePerformanceTab?: string;
  setActivePerformanceTab?: (tab: string) => void;
  activeStrategyTab?: string;
  setActiveStrategyTab?: (tab: string) => void;
  activeAlignementTab?: string;
  setActiveAlignementTab?: (tab: string) => void;
  activeIndexTab?: string;
  setActiveIndexTab?: (tab: string) => void;
}