import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useOrganizationESGData } from '../../hooks/useOrganizationESGData';
import { supabase } from '../../lib/supabase';
import { FormSection } from '../../components/ui/FormSection';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { FormTextarea } from '../../components/ui/FormTextarea';
import ProgressNav from '../../components/ui/ProgressNav';
import SelectionSummary from '../../components/ui/SelectionSummary';
import { Building2, Plus, Trash2, Users, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrganizationData {
  name: string;
  type: 'simple' | 'with_subsidiaries' | 'group';
  description: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
}

interface BusinessLineData {
  name: string;
  description: string;
}

interface SubsidiaryData {
  name: string;
  businessLineName?: string;
  description: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
}

interface SiteData {
  name: string;
  businessLineName?: string;
  subsidiaryName?: string;
  description: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
}

const ProcessStepCompany: React.FC = () => {
  const navigate = useNavigate();
  const { 
    setCurrentStep, 
    setOrganizationCreated,
    selectedSector,
    selectedSubsector,
    selectedStandards,
    selectedIssues,
    selectedCriteria,
    selectedIndicators
  } = useAppContext();
  const { saveESGData } = useOrganizationESGData();
  const [loading, setLoading] = useState(false);

  // Organization data
  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    name: '',
    type: 'simple',
    description: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    website: ''
  });

  // Business lines (only for groups)
  const [businessLines, setBusinessLines] = useState<BusinessLineData[]>([]);

  // Subsidiaries (for with_subsidiaries and group types)
  const [subsidiaries, setSubsidiaries] = useState<SubsidiaryData[]>([]);

  // Sites
  const [sites, setSites] = useState<SiteData[]>([]);

  useEffect(() => {
    setCurrentStep(6);
  }, [setCurrentStep]);

  // Reset dependent data when organization type changes
  useEffect(() => {
    if (organizationData.type === 'simple') {
      setBusinessLines([]);
      setSubsidiaries([]);
    } else if (organizationData.type === 'with_subsidiaries') {
      setBusinessLines([]);
      // Keep subsidiaries but remove business line references
      setSubsidiaries(prev => prev.map(sub => ({ ...sub, businessLineName: undefined })));
    }
    // For 'group' type, keep all data
  }, [organizationData.type]);

  const addBusinessLine = () => {
    setBusinessLines([...businessLines, { name: '', description: '' }]);
  };

  const removeBusinessLine = (index: number) => {
    const newBusinessLines = businessLines.filter((_, i) => i !== index);
    setBusinessLines(newBusinessLines);
    
    // Remove references to this business line from subsidiaries
    const removedBusinessLine = businessLines[index];
    setSubsidiaries(prev => prev.map(sub => 
      sub.businessLineName === removedBusinessLine.name 
        ? { ...sub, businessLineName: undefined }
        : sub
    ));
  };

  const updateBusinessLine = (index: number, field: keyof BusinessLineData, value: string) => {
    const newBusinessLines = [...businessLines];
    const oldName = newBusinessLines[index].name;
    newBusinessLines[index] = { ...newBusinessLines[index], [field]: value };
    setBusinessLines(newBusinessLines);

    // Update references in subsidiaries if name changed
    if (field === 'name' && oldName) {
      setSubsidiaries(prev => prev.map(sub => 
        sub.businessLineName === oldName 
          ? { ...sub, businessLineName: value }
          : sub
      ));
    }
  };

  const addSubsidiary = () => {
    setSubsidiaries([...subsidiaries, {
      name: '',
      businessLineName: organizationData.type === 'group' ? '' : undefined,
      description: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      email: '',
      website: ''
    }]);
  };

  const removeSubsidiary = (index: number) => {
    const newSubsidiaries = subsidiaries.filter((_, i) => i !== index);
    setSubsidiaries(newSubsidiaries);
    
    // Remove references to this subsidiary from sites
    const removedSubsidiary = subsidiaries[index];
    setSites(prev => prev.map(site => 
      site.subsidiaryName === removedSubsidiary.name 
        ? { ...site, subsidiaryName: undefined }
        : site
    ));
  };

  const updateSubsidiary = (index: number, field: keyof SubsidiaryData, value: string) => {
    const newSubsidiaries = [...subsidiaries];
    const oldName = newSubsidiaries[index].name;
    newSubsidiaries[index] = { ...newSubsidiaries[index], [field]: value };
    setSubsidiaries(newSubsidiaries);

    // Update references in sites if name changed
    if (field === 'name' && oldName) {
      setSites(prev => prev.map(site => 
        site.subsidiaryName === oldName 
          ? { ...site, subsidiaryName: value }
          : site
      ));
    }
  };

  const addSite = () => {
    setSites([...sites, {
      name: '',
      businessLineName: organizationData.type === 'group' ? '' : undefined,
      subsidiaryName: organizationData.type !== 'simple' ? '' : undefined,
      description: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      email: ''
    }]);
  };

  const removeSite = (index: number) => {
    setSites(sites.filter((_, i) => i !== index));
  };

  const updateSite = (index: number, field: keyof SiteData, value: string) => {
    const newSites = [...sites];
    newSites[index] = { ...newSites[index], [field]: value };
    setSites(newSites);
  };

  const validateForm = (): boolean => {
    // Validate organization
    if (!organizationData.name || !organizationData.address || !organizationData.city || 
        !organizationData.country || !organizationData.phone || !organizationData.email) {
      toast.error('Veuillez remplir tous les champs obligatoires de l\'organisation');
      return false;
    }

    // Validate business lines for groups
    if (organizationData.type === 'group') {
      if (businessLines.length === 0) {
        toast.error('Les groupes doivent avoir au moins une filière');
        return false;
      }
      for (const bl of businessLines) {
        if (!bl.name) {
          toast.error('Toutes les filières doivent avoir un nom');
          return false;
        }
      }
    }

    // Validate subsidiaries for with_subsidiaries and group types
    if (organizationData.type === 'with_subsidiaries' || organizationData.type === 'group') {
      if (subsidiaries.length === 0) {
        toast.error('Ce type d\'organisation doit avoir au moins une filiale');
        return false;
      }
      for (const sub of subsidiaries) {
        if (!sub.name || !sub.address || !sub.city || !sub.country || !sub.phone || !sub.email) {
          toast.error('Toutes les filiales doivent avoir leurs champs obligatoires remplis');
          return false;
        }
        if (organizationData.type === 'group' && !sub.businessLineName) {
          toast.error('Les filiales des groupes doivent être associées à une filière');
          return false;
        }
      }
    }

    // Validate sites
    if (sites.length === 0) {
      toast.error('L\'organisation doit avoir au moins un site');
      return false;
    }
    for (const site of sites) {
      if (!site.name || !site.address || !site.city || !site.country || !site.phone || !site.email) {
        toast.error('Tous les sites doivent avoir leurs champs obligatoires remplis');
        return false;
      }
      if (organizationData.type === 'with_subsidiaries' && !site.subsidiaryName) {
        toast.error('Les sites des entreprises avec filiales doivent être associés à une filiale');
        return false;
      }
      if (organizationData.type === 'group' && (!site.businessLineName || !site.subsidiaryName)) {
        toast.error('Les sites des groupes doivent être associés à une filière et une filiale');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 1. Create organization
      const { error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationData.name,
          organization_type: organizationData.type,
          description: organizationData.description,
          address: organizationData.address,
          city: organizationData.city,
          country: organizationData.country,
          phone: organizationData.phone,
          email: organizationData.email,
          website: organizationData.website
        });

      if (orgError) throw orgError;

      // 2. Create business lines (only for groups)
      if (organizationData.type === 'group' && businessLines.length > 0) {
        const { error: blError } = await supabase
          .from('business_lines')
          .insert(
            businessLines.map(bl => ({
              name: bl.name,
              organization_name: organizationData.name,
              description: bl.description
            }))
          );

        if (blError) throw blError;
      }

      // 3. Create subsidiaries (for with_subsidiaries and group types)
      if ((organizationData.type === 'with_subsidiaries' || organizationData.type === 'group') && subsidiaries.length > 0) {
        const { error: subError } = await supabase
          .from('subsidiaries')
          .insert(
            subsidiaries.map(sub => ({
              name: sub.name,
              organization_name: organizationData.name,
              business_line_name: sub.businessLineName || null,
              description: sub.description,
              address: sub.address,
              city: sub.city,
              country: sub.country,
              phone: sub.phone,
              email: sub.email,
              website: sub.website
            }))
          );

        if (subError) throw subError;
      }

      // 4. Create sites
      if (sites.length > 0) {
        const { error: siteError } = await supabase
          .from('sites')
          .insert(
            sites.map(site => ({
              name: site.name,
              organization_name: organizationData.name,
              business_line_name: site.businessLineName || null,
              subsidiary_name: site.subsidiaryName || null,
              description: site.description,
              address: site.address,
              city: site.city,
              country: site.country,
              phone: site.phone,
              email: site.email
            }))
          );

        if (siteError) throw siteError;
      }

      // 5. Sauvegarder les données ESG pour l'organisation
      if (selectedSector) {
        try {
          await saveESGData(organizationData.name, {
            selectedSector,
            selectedSubsector: selectedSubsector || undefined,
            selectedStandards,
            selectedIssues,
            selectedCriteria,
            selectedIndicators
          });
          console.log('Données ESG sauvegardées pour l\'organisation:', organizationData.name);
        } catch (esgError) {
          console.error('Erreur lors de la sauvegarde des données ESG:', esgError);
          // Ne pas bloquer le processus si la sauvegarde ESG échoue
          toast.error('Organisation créée mais erreur lors de la sauvegarde des données ESG');
        }
      }

      toast.success('Organisation créée avec succès');
      setOrganizationCreated(true);
      navigate('/process/users');
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Erreur lors de la création de l\'organisation');
    } finally {
      setLoading(false);
    }
  };

  const getOrganizationTypeOptions = () => [
    { value: 'simple', label: 'Entreprise simple (sans filiales)' },
    { value: 'with_subsidiaries', label: 'Entreprise avec filiales' },
    { value: 'group', label: 'Groupe (avec filières et filiales)' }
  ];

  const getBusinessLineOptions = () => 
    businessLines.map(bl => ({ value: bl.name, label: bl.name }));

  const getSubsidiaryOptions = () => 
    subsidiaries.map(sub => ({ value: sub.name, label: sub.name }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* VSG Banner */}
        <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg">
          <img
            src="/Imade full VSG.jpg"
            alt="Global ESG Banner"
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Étape 6 : Configuration de l'Organisation
          </h1>
          <p className="text-gray-600 mt-2">
            Configurez votre structure organisationnelle selon vos besoins.
          </p>
        </div>

        <SelectionSummary />

        <div className="space-y-8">
          {/* Organization Information */}
          <FormSection
            title="Informations de l'Organisation"
            icon={<Building2 className="h-5 w-5 text-gray-600" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Nom de l'organisation"
                value={organizationData.name}
                onChange={(e) => setOrganizationData({ ...organizationData, name: e.target.value })}
                required
              />
              
              <FormSelect
                label="Type d'organisation"
                value={organizationData.type}
                onChange={(value) => setOrganizationData({ ...organizationData, type: value as any })}
                options={getOrganizationTypeOptions()}
                required
              />

              <FormInput
                label="Adresse"
                value={organizationData.address}
                onChange={(e) => setOrganizationData({ ...organizationData, address: e.target.value })}
                required
              />

              <FormInput
                label="Ville"
                value={organizationData.city}
                onChange={(e) => setOrganizationData({ ...organizationData, city: e.target.value })}
                required
              />

              <FormInput
                label="Pays"
                value={organizationData.country}
                onChange={(e) => setOrganizationData({ ...organizationData, country: e.target.value })}
                required
              />

              <FormInput
                label="Téléphone"
                value={organizationData.phone}
                onChange={(e) => setOrganizationData({ ...organizationData, phone: e.target.value })}
                required
              />

              <FormInput
                label="Email"
                type="email"
                value={organizationData.email}
                onChange={(e) => setOrganizationData({ ...organizationData, email: e.target.value })}
                required
              />

              <FormInput
                label="Site web"
                value={organizationData.website}
                onChange={(e) => setOrganizationData({ ...organizationData, website: e.target.value })}
              />
            </div>

            <FormTextarea
              label="Description"
              value={organizationData.description}
              onChange={(e) => setOrganizationData({ ...organizationData, description: e.target.value })}
              rows={3}
            />
          </FormSection>

          {/* Business Lines (only for groups) */}
          {organizationData.type === 'group' && (
            <FormSection
              title="Filières d'Activité"
              icon={<Users className="h-5 w-5 text-gray-600" />}
            >
              <div className="space-y-4">
                {businessLines.map((businessLine, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Filière {index + 1}</h4>
                      <button
                        onClick={() => removeBusinessLine(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Nom de la filière"
                        value={businessLine.name}
                        onChange={(e) => updateBusinessLine(index, 'name', e.target.value)}
                        required
                      />
                      <FormTextarea
                        label="Description"
                        value={businessLine.description}
                        onChange={(e) => updateBusinessLine(index, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={addBusinessLine}
                  className="flex items-center px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une filière
                </button>
              </div>
            </FormSection>
          )}

          {/* Subsidiaries (for with_subsidiaries and group types) */}
          {(organizationData.type === 'with_subsidiaries' || organizationData.type === 'group') && (
            <FormSection
              title="Filiales"
              icon={<Building2 className="h-5 w-5 text-gray-600" />}
            >
              <div className="space-y-4">
                {subsidiaries.map((subsidiary, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Filiale {index + 1}</h4>
                      <button
                        onClick={() => removeSubsidiary(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Nom de la filiale"
                        value={subsidiary.name}
                        onChange={(e) => updateSubsidiary(index, 'name', e.target.value)}
                        required
                      />
                      
                      {organizationData.type === 'group' && (
                        <FormSelect
                          label="Filière associée"
                          value={subsidiary.businessLineName || ''}
                          onChange={(value) => updateSubsidiary(index, 'businessLineName', value)}
                          options={[
                            { value: '', label: 'Sélectionnez une filière' },
                            ...getBusinessLineOptions()
                          ]}
                          required
                        />
                      )}

                      <FormInput
                        label="Adresse"
                        value={subsidiary.address}
                        onChange={(e) => updateSubsidiary(index, 'address', e.target.value)}
                        required
                      />

                      <FormInput
                        label="Ville"
                        value={subsidiary.city}
                        onChange={(e) => updateSubsidiary(index, 'city', e.target.value)}
                        required
                      />

                      <FormInput
                        label="Pays"
                        value={subsidiary.country}
                        onChange={(e) => updateSubsidiary(index, 'country', e.target.value)}
                        required
                      />

                      <FormInput
                        label="Téléphone"
                        value={subsidiary.phone}
                        onChange={(e) => updateSubsidiary(index, 'phone', e.target.value)}
                        required
                      />

                      <FormInput
                        label="Email"
                        type="email"
                        value={subsidiary.email}
                        onChange={(e) => updateSubsidiary(index, 'email', e.target.value)}
                        required
                      />

                      <FormInput
                        label="Site web"
                        value={subsidiary.website}
                        onChange={(e) => updateSubsidiary(index, 'website', e.target.value)}
                      />
                    </div>
                    <FormTextarea
                      label="Description"
                      value={subsidiary.description}
                      onChange={(e) => updateSubsidiary(index, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>
                ))}
                
                <button
                  onClick={addSubsidiary}
                  className="flex items-center px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une filiale
                </button>
              </div>
            </FormSection>
          )}

          {/* Sites */}
          <FormSection
            title="Sites"
            icon={<MapPin className="h-5 w-5 text-gray-600" />}
          >
            <div className="space-y-4">
              {sites.map((site, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Site {index + 1}</h4>
                    <button
                      onClick={() => removeSite(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Nom du site"
                      value={site.name}
                      onChange={(e) => updateSite(index, 'name', e.target.value)}
                      required
                    />

                    {organizationData.type === 'group' && (
                      <FormSelect
                        label="Filière associée"
                        value={site.businessLineName || ''}
                        onChange={(value) => updateSite(index, 'businessLineName', value)}
                        options={[
                          { value: '', label: 'Sélectionnez une filière' },
                          ...getBusinessLineOptions()
                        ]}
                        required
                      />
                    )}

                    {organizationData.type !== 'simple' && (
                      <FormSelect
                        label="Filiale associée"
                        value={site.subsidiaryName || ''}
                        onChange={(value) => updateSite(index, 'subsidiaryName', value)}
                        options={[
                          { value: '', label: 'Sélectionnez une filiale' },
                          ...getSubsidiaryOptions()
                        ]}
                        required
                      />
                    )}

                    <FormInput
                      label="Adresse"
                      value={site.address}
                      onChange={(e) => updateSite(index, 'address', e.target.value)}
                      required
                    />

                    <FormInput
                      label="Ville"
                      value={site.city}
                      onChange={(e) => updateSite(index, 'city', e.target.value)}
                      required
                    />

                    <FormInput
                      label="Pays"
                      value={site.country}
                      onChange={(e) => updateSite(index, 'country', e.target.value)}
                      required
                    />

                    <FormInput
                      label="Téléphone"
                      value={site.phone}
                      onChange={(e) => updateSite(index, 'phone', e.target.value)}
                      required
                    />

                    <FormInput
                      label="Email"
                      type="email"
                      value={site.email}
                      onChange={(e) => updateSite(index, 'email', e.target.value)}
                      required
                    />
                  </div>
                  <FormTextarea
                    label="Description"
                    value={site.description}
                    onChange={(e) => updateSite(index, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
              ))}
              
              <button
                onClick={addSite}
                className="flex items-center px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un site
              </button>
            </div>
          </FormSection>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Création en cours...' : 'Créer l\'organisation'}
          </button>
        </div>

        <ProgressNav
          currentStep={6}
          totalSteps={7}
          nextPath="/process/users"
          prevPath="/process/indicators"
          isNextDisabled={false}
        />
      </div>
    </div>
  );
};

export default ProcessStepCompany;