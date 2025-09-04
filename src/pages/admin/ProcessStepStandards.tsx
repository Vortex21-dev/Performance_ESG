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
import { Standard } from '../../types/standards';
import { Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { getIconForStandard } from '../../utils/iconMapping';
import { validateAdd } from '../../utils/validation';

interface SectorStandard extends Standard {}

interface SimilarityAlert {
  items: Array<{ name: string; similarity: number }>;
  itemName: string;
  onConfirm: () => void;
}

const ProcessStepStandards: React.FC = () => {
  const { selectedSector, selectedSubsector, selectedStandards, toggleStandard, setCurrentStep } = useAppContext();
  const navigate = useNavigate();
  const [standards, setStandards] = useState<SectorStandard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [similarityAlert, setSimilarityAlert] = useState<SimilarityAlert | null>(null);
  
  useEffect(() => {
    if (!selectedSector) {
      navigate('/process/sectors');
    }
    setCurrentStep(2);
  }, [selectedSector, navigate, setCurrentStep]);

  useEffect(() => {
    if (selectedSector) {
      fetchStandards();
    }
  }, [selectedSector, selectedSubsector]);

  async function fetchStandards() {
    try {
      let query;
      
      if (selectedSubsector) {
        const { data, error } = await supabase
          .from('subsector_standards')
          .select('standard_codes')
          .eq('subsector_name', selectedSubsector);
          
        if (error) throw error;
        query = data;
      } else {
        const { data, error } = await supabase
          .from('sector_standards')
          .select('standard_codes')
          .eq('sector_name', selectedSector);
          
        if (error) throw error;
        query = data;
      }

      // Get all standard codes
      const standardCodes = query.flatMap(item => item.standard_codes);

      // Fetch standard names from standards table
      const { data: standardsData, error: standardsError } = await supabase
        .from('standards')
        .select('name')
        .in('code', standardCodes);

      if (standardsError) throw standardsError;

      const formattedStandards = standardsData.map(item => ({
        name: item.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      setStandards(formattedStandards);
    } catch (err) {
      setError('Erreur lors du chargement des normes');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: { name: string }) => {
    try {
      const isValid = await validateAdd('standard', data.name, undefined, async (items, itemName) => {
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

      // Check if standard exists and get its code
      const { data: existingStandard, error: fetchError } = await supabase
        .from('standards')
        .select('code')
        .eq('name', data.name)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const standardCode = existingStandard?.code || data.name.replace(/\s+/g, '').toUpperCase();

      // If standard doesn't exist, create it
      if (!existingStandard) {
        await supabase
          .from('standards')
          .insert({ code: standardCode, name: data.name });
      }

      // Update the sector_standards or subsector_standards table
      if (selectedSubsector) {
        // Get current standard_codes array
        const { data: currentData, error: fetchError } = await supabase
          .from('subsector_standards')
          .select('standard_codes')
          .eq('subsector_name', selectedSubsector)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        const existingCodes = currentData?.standard_codes || [];
        if (!existingCodes.includes(standardCode)) {
          const updatedCodes = [...existingCodes, standardCode];

          const { error: relationError } = await supabase
            .from('subsector_standards')
            .upsert({ 
              subsector_name: selectedSubsector,
              standard_codes: updatedCodes 
            });

          if (relationError) throw relationError;
        }
      } else {
        // Get current standard_codes array
        const { data: currentData, error: fetchError } = await supabase
          .from('sector_standards')
          .select('standard_codes')
          .eq('sector_name', selectedSector)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        const existingCodes = currentData?.standard_codes || [];
        if (!existingCodes.includes(standardCode)) {
          const updatedCodes = [...existingCodes, standardCode];

          const { error: relationError } = await supabase
            .from('sector_standards')
            .upsert({ 
              sector_name: selectedSector,
              standard_codes: updatedCodes 
            });

          if (relationError) throw relationError;
        }
      }

      toast.success('Norme ajoutée avec succès');
      setShowAddForm(false);
      fetchStandards();
    } catch (err) {
      toast.error('Erreur lors de l\'ajout de la norme');
      console.error('Error:', err);
    }
  };

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
            Étape 2 : Choix des Normes
          </h1>
          <p className="text-gray-600 mt-2">
            Sélectionnez les normes et certifications applicables à votre organisation.
          </p>
        </div>

        <SelectionSummary />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {standards.map((standard, index) => {
            const colors = getColorScheme(index);
            const iconMapping = getIconForStandard(standard.name);
            return (
              <SelectionCard
                key={standard.name}
                name={standard.name}
                title={standard.name}
                icon={iconMapping.icon}
                iconColor={iconMapping.color}
                isSelected={selectedStandards.includes(standard.name)}
                onClick={() => toggleStandard(standard.name)}
                bgColor={colors.bg}
                borderColor={colors.border}
              />
            );
          })}

          {showAddForm ? (
            <AddForm
              onSubmit={onSubmit}
              onCancel={() => setShowAddForm(false)}
              placeholder="Ex: ISO 14001"
              label="Nom de la norme"
              type="standard"
            />
          ) : (
            <AddButton
              onClick={() => setShowAddForm(true)}
              label="Ajouter une norme"
            />
          )}
        </div>

        {selectedSector && (
          <SuggestionsPanel
            sector={selectedSector}
            type="standards"
          />
        )}
        
        {selectedStandards.length === 0 && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-md p-4 mb-8">
            <p className="text-sm">
              Veuillez sélectionner au moins une norme pour continuer.
            </p>
          </div>
        )}
        
        <ProgressNav
          currentStep={2}
          totalSteps={6}
          nextPath="/process/issues"
          prevPath="/process/sectors"
          isNextDisabled={selectedStandards.length === 0}
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

export default ProcessStepStandards;