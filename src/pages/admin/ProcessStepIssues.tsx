import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ProgressNav from '../../components/ui/ProgressNav';
import SelectionCard from '../../components/ui/SelectionCard';
import SelectionSummary from '../../components/ui/SelectionSummary';
import AddButton from '../../components/ui/AddButton';
import AddForm from '../../components/ui/AddForm';
import SimilarityAlertModal from '../../components/ui/SimilarityAlertModal';
import SuggestionsPanel from '../../components/ui/SuggestionsPanel';
import { supabase } from '../../lib/supabase';
import { Issue } from '../../types/issues';
import { Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { getIconForIssue } from '../../utils/iconMapping';
import { validateAdd } from '../../utils/validation';

interface StandardIssue extends Issue {}

interface SimilarityAlert {
  items: Array<{ name: string; similarity: number }>;
  itemName: string;
  onConfirm: () => void;
}

const ProcessStepIssues: React.FC = () => {
  const { selectedSector, selectedSubsector, selectedIssues, selectedStandards, toggleIssue, setCurrentStep } = useAppContext();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<StandardIssue[]>([]);
  const [availableStandards, setAvailableStandards] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [similarityAlert, setSimilarityAlert] = useState<SimilarityAlert | null>(null);
  
  useEffect(() => {
    if (!selectedSector || !selectedStandards.length) {
      navigate('/process/standards');
    }
    setCurrentStep(3);
  }, [selectedSector, selectedStandards, navigate, setCurrentStep]);

  useEffect(() => {
    if (selectedStandards.length > 0 && selectedSector) {
      fetchIssues();
      fetchAvailableStandards();
    }
  }, [selectedStandards, selectedSector, selectedSubsector]);

  async function fetchAvailableStandards() {
    try {
      let standardCodes: string[] = [];
      
      if (selectedSubsector) {
        const { data: subsectorData, error: subsectorError } = await supabase
          .from('subsector_standards')
          .select('standard_codes')
          .eq('subsector_name', selectedSubsector);

        if (subsectorError) throw subsectorError;
        standardCodes = subsectorData.flatMap(item => item.standard_codes);
      } else {
        const { data: sectorData, error: sectorError } = await supabase
          .from('sector_standards')
          .select('standard_codes')
          .eq('sector_name', selectedSector);

        if (sectorError) throw sectorError;
        standardCodes = sectorData.flatMap(item => item.standard_codes);
      }

      const { data: standardsData, error: standardsError } = await supabase
        .from('standards')
        .select('name')
        .in('code', standardCodes);

      if (standardsError) throw standardsError;
      
      setAvailableStandards(standardsData.map(item => item.name));
    } catch (err) {
      console.error('Error fetching standards:', err);
      toast.error('Erreur lors du chargement des normes disponibles');
    }
  }

  async function fetchIssues() {
    try {
      let query;
      
      if (selectedSubsector) {
        const { data: subsectorData, error: subsectorError } = await supabase
          .from('subsector_standards_issues')
          .select('issue_codes')
          .eq('subsector_name', selectedSubsector)
          .in('standard_name', selectedStandards);

        if (subsectorError) throw subsectorError;
        query = subsectorData;
      } else {
        const { data: sectorData, error: sectorError } = await supabase
          .from('sector_standards_issues')
          .select('issue_codes')
          .eq('sector_name', selectedSector)
          .in('standard_name', selectedStandards);

        if (sectorError) throw sectorError;
        query = sectorData;
      }

      // Get all issue codes
      const issueCodes = query.flatMap(item => item.issue_codes);

      // Fetch issue names from issues table
      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select('name')
        .in('code', issueCodes);

      if (issuesError) throw issuesError;

      const formattedIssues = issuesData.map(item => ({
        name: item.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      setIssues(formattedIssues);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des enjeux');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: { name: string; parentId: string }) => {
    try {
      const isValid = await validateAdd('issue', data.name, data.parentId, async (items, itemName) => {
        return new Promise((resolve) => {
          setSimilarityAlert({
            items,
            itemName,
            onConfirm: () => {
              setSimilarityAlert(null);
              resolve(true);
            }
          });
        });
      });

      if (!isValid) return;

      // First, insert the new issue into the issues table
      const issueCode = data.name.replace(/\s+/g, '').toUpperCase();
      const { error: insertError } = await supabase
        .from('issues')
        .insert([{ 
          code: issueCode,
          name: data.name
        }]);

      if (insertError) throw insertError;

      // Then update the sector_standards_issues or subsector_standards_issues table
      if (selectedSubsector) {
        // Get current issue_codes array
        const { data: currentData, error: fetchError } = await supabase
          .from('subsector_standards_issues')
          .select('issue_codes')
          .eq('subsector_name', selectedSubsector)
          .eq('standard_name', data.parentId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        const existingCodes = currentData?.issue_codes || [];
        const updatedCodes = [...existingCodes, issueCode];

        const { error: relationError } = await supabase
          .from('subsector_standards_issues')
          .upsert({ 
            subsector_name: selectedSubsector,
            standard_name: data.parentId,
            issue_codes: updatedCodes 
          });

        if (relationError) throw relationError;
      } else {
        // Get current issue_codes array
        const { data: currentData, error: fetchError } = await supabase
          .from('sector_standards_issues')
          .select('issue_codes')
          .eq('sector_name', selectedSector)
          .eq('standard_name', data.parentId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        const existingCodes = currentData?.issue_codes || [];
        const updatedCodes = [...existingCodes, issueCode];

        const { error: relationError } = await supabase
          .from('sector_standards_issues')
          .upsert({ 
            sector_name: selectedSector,
            standard_name: data.parentId,
            issue_codes: updatedCodes 
          });

        if (relationError) throw relationError;
      }

      toast.success('Enjeu ajouté avec succès');
      setShowAddForm(false);
      fetchIssues();
    } catch (err) {
      toast.error('Erreur lors de l\'ajout de l\'enjeu');
      console.error('Error:', err);
    }
  };

  const standardOptions = availableStandards.map(standard => ({
    id: standard,
    name: standard
  }));

  const getColorScheme = (index: number) => {
    const colors = [
      { bg: 'bg-blue-50', border: 'border-blue-500' },
      { bg: 'bg-purple-50', border: 'border-purple-500' },
      { bg: 'bg-indigo-50', border: 'border-indigo-500' },
      { bg: 'bg-green-50', border: 'border-green-500' },
      { bg: 'bg-amber-50', border: 'border-amber-500' },
      { bg: 'bg-cyan-50', border: 'border-cyan-500' }
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 border border-red-300 text-red-800 rounded-md p-4">
          <p>{error}</p>
        </div>
      </div>
    );
  }

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
            Étape 3 : Choix des Enjeux ESG
          </h1>
          <p className="text-gray-600 mt-2">
            Sélectionnez les enjeux ESG pertinents pour votre organisation, basés sur les normes sélectionnées.
          </p>
        </div>

        <SelectionSummary />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {issues.map((issue, index) => {
            const colors = getColorScheme(index);
            const iconMapping = getIconForIssue(issue.name);
            return (
              <SelectionCard
                key={issue.name}
                name={issue.name}
                title={issue.name}
                icon={iconMapping.icon}
                iconColor={iconMapping.color}
                isSelected={selectedIssues.includes(issue.name)}
                onClick={() => toggleIssue(issue.name)}
                bgColor={colors.bg}
                borderColor={colors.border}
              />
            );
          })}

          {showAddForm ? (
            <AddForm
              onSubmit={onSubmit}
              onCancel={() => setShowAddForm(false)}
              placeholder="Ex: Biodiversité"
              label="Nom de l'enjeu"
              parentOptions={standardOptions}
              parentLabel="Norme associée"
              type="issue"
            />
          ) : (
            <AddButton
              onClick={() => setShowAddForm(true)}
              label="Ajouter un enjeu"
            />
          )}
        </div>

        {selectedSector && (
          <SuggestionsPanel
            sector={selectedSector}
            type="issues"
          />
        )}
        
        {selectedIssues.length === 0 && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-md p-4 mb-8">
            <p className="text-sm">
              Veuillez sélectionner au moins un enjeu ESG pour continuer.
            </p>
          </div>
        )}
        
        <ProgressNav
          currentStep={3}
          totalSteps={6}
          nextPath="/process/criteria"
          prevPath="/process/standards"
          isNextDisabled={selectedIssues.length === 0}
        />

        {similarityAlert && (
          <SimilarityAlertModal
            isOpen={true}
            onClose={() => setSimilarityAlert(null)}
            onConfirm={similarityAlert.onConfirm}
            itemName={similarityAlert.itemName}
            similarItems={similarityAlert.items}
          />
        )}
      </div>
    </div>
  );
};

export default ProcessStepIssues;