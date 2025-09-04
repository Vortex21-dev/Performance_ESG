import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { 
  Building2, 
  Edit3, 
  Save, 
  X, 
  ImageIcon, 
  Trash, 
  AlertTriangle 
} from 'lucide-react';
import { FormInput } from '../ui/FormInput';
import { FormTextarea } from '../ui/FormTextarea';
import toast from 'react-hot-toast';

interface ContentModule {
  id: string;
  organization_name: string;
  module_type: 'organigramme';
  sub_type?: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface OrganisationStructureProps {
  subTab: string;
}

export const OrganisationStructure: React.FC<OrganisationStructureProps> = ({ subTab }) => {
  const { profile, impersonatedOrganization } = useAuthStore();
  
  const [contentModules, setContentModules] = useState<ContentModule[]>([]);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<Partial<ContentModule>>({});
  const [moduleImages, setModuleImages] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState(true);

  const currentOrganization = impersonatedOrganization || profile?.organization_name;
  const isAdmin = profile?.role === 'admin';
  const isEnterprise = profile?.role === 'enterprise';
  const canEdit = isAdmin || isEnterprise;

  useEffect(() => {
    fetchContentModules();
    loadModuleImages();
  }, [currentOrganization, subTab]);

  const fetchContentModules = async () => {
    if (!currentOrganization) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_modules')
        .select('*')
        .eq('organization_name', currentOrganization)
        .eq('module_type', 'organigramme')
        .eq('sub_type', subTab);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setContentModules(data || []);
    } catch (error) {
      console.error('Error fetching content modules:', error);
      toast.error('Erreur lors du chargement du contenu');
    } finally {
      setLoading(false);
    }
  };

  const loadModuleImages = async () => {
    if (!currentOrganization) return;

    const moduleKey = `organigramme_${subTab}`;
    const images = await getModuleImages('organigramme', subTab);
    setModuleImages({ [moduleKey]: images });
  };

  const getModuleImages = async (moduleType: string, subType?: string): Promise<string[]> => {
    if (!currentOrganization) return [];

    try {
      const sanitizedOrganization = sanitizeForStorage(currentOrganization);
      const sanitizedModuleType = sanitizeForStorage(moduleType);
      const sanitizedSubType = subType ? sanitizeForStorage(subType) : '';
      
      const folderPath = `${sanitizedOrganization}/${sanitizedModuleType}${sanitizedSubType ? `_${sanitizedSubType}` : ''}`;
      
      const { data: files, error } = await supabase
        .storage
        .from('ImagesManagement')
        .list(folderPath);

      if (error) throw error;

      if (!files || files.length === 0) return [];

      const imageUrls = files.map(file => {
        const { data: { publicUrl } } = supabase
          .storage
          .from('ImagesManagement')
          .getPublicUrl(`${folderPath}/${file.name}`);
        
        return publicUrl;
      });

      return imageUrls;
    } catch (error) {
      console.error('Error loading module images:', error);
      return [];
    }
  };

  const sanitizeForStorage = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleEditModule = () => {
    const moduleKey = `organigramme_${subTab}`;
    const existingModule = contentModules.find(m => 
      m.module_type === 'organigramme' && m.sub_type === subTab
    );
    
    if (existingModule) {
      setEditingContent(existingModule);
    } else {
      setEditingContent({
        module_type: 'organigramme',
        sub_type: subTab,
        title: subTab,
        content: '',
        organization_name: currentOrganization
      });
    }
    setEditingModule(moduleKey);
  };

  const handleSaveModule = async () => {
    if (!editingContent.module_type || !currentOrganization) return;

    try {
      const moduleData = {
        organization_name: currentOrganization,
        module_type: editingContent.module_type,
        sub_type: editingContent.sub_type || null,
        title: editingContent.title || '',
        content: editingContent.content || ''
      };

      const { data, error } = await supabase
        .from('content_modules')
        .upsert(moduleData, {
          onConflict: 'organization_name,module_type,sub_type'
        })
        .select()
        .single();

      if (error) throw error;

      setContentModules(prev => {
        const filtered = prev.filter(m => 
          !(m.module_type === editingContent.module_type && m.sub_type === editingContent.sub_type)
        );
        return [...filtered, data];
      });

      toast.success('Module sauvegardé avec succès');
      setEditingModule(null);
      setEditingContent({});
    } catch (error) {
      console.error('Error saving module:', error);
      toast.error('Erreur lors de la sauvegarde du module');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentOrganization || !editingModule) return;

    try {
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
      
      const sanitizedOrganization = sanitizeForStorage(currentOrganization);
      const sanitizedModuleType = sanitizeForStorage('organigramme');
      const sanitizedSubType = sanitizeForStorage(subTab);
      
      const filePath = `${sanitizedOrganization}/${sanitizedModuleType}_${sanitizedSubType}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ImagesManagement')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('ImagesManagement')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      setModuleImages(prev => ({
        ...prev,
        [editingModule]: [...(prev[editingModule] || []), urlData.publicUrl]
      }));

      toast.success('Image ajoutée avec succès');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erreur lors de l\'upload de l\'image');
    }
  };

  const handleRemoveImage = async (imageUrl: string, index: number) => {
    if (!editingModule || !moduleImages[editingModule] || !currentOrganization) return;

    try {
      const urlParts = imageUrl.split('/');
      const bucketName = 'ImagesManagement';
      const bucketIndex = urlParts.indexOf(bucketName);
      
      if (bucketIndex === -1 || bucketIndex >= urlParts.length - 1) {
        throw new Error('Invalid image URL format');
      }

      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (deleteError) throw deleteError;

      setModuleImages(prev => ({
        ...prev,
        [editingModule]: prev[editingModule]?.filter((_, i) => i !== index) || []
      }));

      toast.success('Image supprimée avec succès');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Erreur lors de la suppression de l\'image');
    }
  };

  const getModuleContent = () => {
    return contentModules.find(m => 
      m.module_type === 'organigramme' && m.sub_type === subTab
    );
  };

  const getModuleImagesForView = (): string[] => {
    const moduleKey = `organigramme_${subTab}`;
    return moduleImages[moduleKey] || [];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Chargement du contenu...</span>
      </div>
    );
  }

  const content = getModuleContent();
  const images = getModuleImagesForView();
  const moduleKey = `organigramme_${subTab}`;
  const isEditing = editingModule === moduleKey;

  return (
    <div className="space-y-6">
      {!canEdit && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800">
              Mode consultation - Vous pouvez consulter le contenu mais pas le modifier
            </span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            {subTab}
          </h2>
          {canEdit && !isEditing && (
            <button
              onClick={handleEditModule}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Modifier
            </button>
          )}
        </div>

        {isEditing && canEdit ? (
          <div className="space-y-6">
            <FormInput
              label="Titre"
              value={editingContent.title || ''}
              onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })}
            />
            
            <FormTextarea
              label="Contenu"
              value={editingContent.content || ''}
              onChange={(e) => setEditingContent({ ...editingContent, content: e.target.value })}
              rows={8}
              placeholder="Saisissez le contenu de ce module..."
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images
              </label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Ajouter une image
                  </label>
                </div>
                
                {moduleImages[moduleKey] && moduleImages[moduleKey].length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {moduleImages[moduleKey].map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => handleRemoveImage(image, index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditingModule(null);
                  setEditingContent({});
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4 mr-2 inline" />
                Annuler
              </button>
              <button
                onClick={handleSaveModule}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="h-4 w-4 mr-2 inline" />
                Sauvegarder
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {!content?.content && images.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun contenu disponible
                </h3>
                <p className="text-gray-500">
                  Ce module n'a pas encore été configuré.
                </p>
              </div>
            ) : (
              <>
                {content?.content && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Contenu</h4>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{content.content}</p>
                    </div>
                  </div>
                )}
                
                {images.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Images</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Image ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};