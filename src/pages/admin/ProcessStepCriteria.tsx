import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ProgressNav from '../../components/ui/ProgressNav';
import SelectionSummary from '../../components/ui/SelectionSummary';
import AddButton from '../../components/ui/AddButton';
import AddForm from '../../components/ui/AddForm';
import SimilarityAlertModal from '../../components/ui/SimilarityAlertModal';
import DataGrid from '../../components/ui/DataGrid';
import { supabase } from '../../lib/supabase';
import { Criteria } from '../../types/criteria';
import { Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { validateAdd } from '../../utils/validation';

interface SimilarityAlert {
  items: Array<{ name: string; similarity: number }>;
  itemName: string;
  onConfirm: () => void;
}

const ProcessStepCriteria: React.FC = () => {
  const { selectedIssues, selectedCriteria, toggleCriteria, setCurrentStep, selectedSector, selectedSubsector, selectedStandards } = useAppContext();
  const navigate = useNavigate();
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [similarityAlert, setSimilarityAlert] = useState<SimilarityAlert | null>(null);
  
  useEffect(() => {
    if (!selectedIssues.length) {
      navigate('/process/issues');
    }
    setCurrentStep(4);
  }, [selectedIssues, navigate, setCurrentStep]);

  useEffect(() => {
    if (selectedIssues.length > 0) {
      fetchCriteria();
    }
  }, [selectedIssues]);

  async function fetchCriteria() {
    try {
      let query;
      
      if (selectedSubsector) {
        const { data: subsectorData, error: subsectorError } = await supabase
          .from('subsector_standards_issues_criteria')
          .select('criteria_codes')
          .eq('subsector_name', selectedSubsector)
          .in('issue_name', selectedIssues);

        if (subsectorError) throw subsectorError;
        query = subsectorData;
      } else {
        const { data: sectorData, error: sectorError } = await supabase
          .from('sector_standards_issues_criteria')
          .select('criteria_codes')
          .eq('sector_name', selectedSector)
          .in('issue_name', selectedIssues);

        if (sectorError) throw sectorError;
        query = sectorData;
      }

      // Get all criteria codes
      const criteriaCodes = query.flatMap(item => item.criteria_codes);

      // Fetch criteria from criteria table
      const { data: criteriaData, error: criteriaError } = await supabase
        .from('criteria')
        .select('*')
        .in('code', criteriaCodes);

      if (criteriaError) throw criteriaError;

      setCriteria(criteriaData || []);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des critères');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: { name: string; parentId: string }) => {
    try {
      const isValid = await validateAdd('criteria', data.name, undefined, async (items, itemName) => {
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

      // Get the issue and standard from parentId
      const [issueName, standardName] = data.parentId.split('|');

      // Check if criteria exists and get its code
      const { data: existingCriteria, error: fetchError } = await supabase
        .from('criteria')
        .select('code')
        .eq('name', data.name)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const criteriaCode = existingCriteria?.code || data.name.replace(/\s+/g, '').toUpperCase();

      // If criteria doesn't exist, create it
      if (!existingCriteria) {
        const { error: insertError } = await supabase
          .from('criteria')
          .insert({ code: criteriaCode, name: data.name });

        if (insertError) throw insertError;
      }

      if (selectedSubsector) {
        // Get current criteria_codes
        const { data: currentData, error: fetchError } = await supabase
          .from('subsector_standards_issues_criteria')
          .select('criteria_codes')
          .eq('subsector_name', selectedSubsector)
          .eq('standard_name', standardName)
          .eq('issue_name', issueName)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        const existingCodes = currentData?.criteria_codes || [];
        if (!existingCodes.includes(criteriaCode)) {
          const updatedCodes = [...existingCodes, criteriaCode];

          const { error: updateError } = await supabase
            .from('subsector_standards_issues_criteria')
            .upsert({
              subsector_name: selectedSubsector,
              standard_name: standardName,
              issue_name: issueName,
              criteria_codes: updatedCodes
            });

          if (updateError) throw updateError;
        }
      } else {
        // Get current criteria_codes
        const { data: currentData, error: fetchError } = await supabase
          .from('sector_standards_issues_criteria')
          .select('criteria_codes')
          .eq('sector_name', selectedSector)
          .eq('standard_name', standardName)
          .eq('issue_name', issueName)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        const existingCodes = currentData?.criteria_codes || [];
        if (!existingCodes.includes(criteriaCode)) {
          const updatedCodes = [...existingCodes, criteriaCode];

          const { error: updateError } = await supabase
            .from('sector_standards_issues_criteria')
            .upsert({
              sector_name: selectedSector,
              standard_name: standardName,
              issue_name: issueName,
              criteria_codes: updatedCodes
            });

          if (updateError) throw updateError;
        }
      }

      toast.success('Critère ajouté avec succès');
      setShowAddForm(false);
      fetchCriteria();
    } catch (err) {
      toast.error('Erreur lors de l\'ajout du critère');
      console.error('Error:', err);
    }
  };

  const formattedCriteria = criteria.map(criterion => ({
    name: criterion.name,
    description: criterion.description,
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-green-600" />
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
            Étape 4 : Sélection des Critères
          </h1>
          <p className="text-gray-600 mt-2">
            Choisissez les critères d'évaluation pour chaque enjeu ESG sélectionné.
          </p>
        </div>

        <SelectionSummary />

        <div className="mb-8">
          {showAddForm ? (
            <AddForm
              onSubmit={onSubmit}
              onCancel={() => setShowAddForm(false)}
              placeholder="Ex: Émissions directes"
              label="Nom du critère"
              parentOptions={selectedIssues.map(issue => ({
                id: `${issue}|${selectedStandards[0]}`,
                name: `${issue}`
              }))}
              parentLabel="Enjeu ESG"
              type="criteria"
            />
          ) : (
            <AddButton
              onClick={() => setShowAddForm(true)}
              label="Ajouter un critère"
            />
          )}
        </div>

        <DataGrid
          items={formattedCriteria}
          selectedItems={selectedCriteria}
          onToggleItem={toggleCriteria}
          itemsPerPage={15}
        />

        {selectedCriteria.length === 0 && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-md p-4 my-8">
            <p className="text-sm">
              Veuillez sélectionner au moins un critère pour continuer.
            </p>
          </div>
        )}
        
        <ProgressNav
          currentStep={4}
          totalSteps={6}
          nextPath="/process/indicators"
          prevPath="/process/issues"
          isNextDisabled={selectedCriteria.length === 0}
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

export default ProcessStepCriteria;