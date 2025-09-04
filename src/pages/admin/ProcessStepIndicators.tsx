// ProcessStepIndicators.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ProgressNav from '../../components/ui/ProgressNav';
import SelectionSummary from '../../components/ui/SelectionSummary';
import AddButton from '../../components/ui/AddButton';
import AddForm from '../../components/ui/AddForm';
import SimilarityAlertModal from '../../components/ui/SimilarityAlertModal';
import { supabase } from '../../lib/supabase';
import { Indicator } from '../../types/indicators';
import { Loader, CheckSquare, Check, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { validateAdd } from '../../utils/validation';

interface SimilarityAlert {
  items: Array<{ name: string; similarity: number }>;
  itemName: string;
  onConfirm: () => void;
}

const ProcessStepIndicators: React.FC = () => {
  const { 
    selectedCriteria, 
    selectedIndicators, 
    toggleIndicator, 
    setCurrentStep, 
    selectedSector, 
    selectedSubsector,
    selectedIssues,
    selectedStandards
  } = useAppContext();
  const navigate = useNavigate();
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [similarityAlert, setSimilarityAlert] = useState<SimilarityAlert | null>(null);
  const [indicatorsCriteriaMap, setIndicatorsCriteriaMap] = useState<{ indicator: Indicator; criteria: string }[]>([]);
  
  useEffect(() => {
    if (!selectedCriteria.length) {
      navigate('/process/criteria');
    }
    setCurrentStep(5);
  }, [selectedCriteria, navigate, setCurrentStep]);

  useEffect(() => {
    if (selectedCriteria.length > 0 && selectedIssues.length > 0) {
      fetchIndicators();
    }
  }, [selectedCriteria, selectedIssues, selectedSector, selectedSubsector]);

  async function fetchIndicators() {
    try {
      let indicatorsWithCriteria: { indicator: Indicator; criteria: string }[] = [];
      
      if (selectedSubsector) {
        const { data: subsectorData, error: subsectorError } = await supabase
          .from('subsector_standards_issues_criteria_indicators')
          .select('criteria_name, indicator_codes, unit')
          .eq('subsector_name', selectedSubsector)
          .in('standard_name', selectedStandards)
          .in('issue_name', selectedIssues)
          .in('criteria_name', selectedCriteria);

        if (subsectorError) throw subsectorError;
        
        for (const row of subsectorData || []) {
          if (row.indicator_codes && row.indicator_codes.length > 0) {
            const { data: indicators, error: indicatorError } = await supabase
              .from('indicators')
              .select('*')
              .in('code', row.indicator_codes);
            
            if (indicatorError) throw indicatorError;
            
            indicators?.forEach(indicator => {
              indicatorsWithCriteria.push({ indicator, criteria: row.criteria_name });
            });
          }
        }
      } else {
        const { data: sectorData, error: sectorError } = await supabase
          .from('sector_standards_issues_criteria_indicators')
          .select('criteria_name, indicator_codes, unit')
          .eq('sector_name', selectedSector)
          .in('standard_name', selectedStandards)
          .in('issue_name', selectedIssues)
          .in('criteria_name', selectedCriteria);

        if (sectorError) throw sectorError;
        
        for (const row of sectorData || []) {
          if (row.indicator_codes && row.indicator_codes.length > 0) {
            const { data: indicators, error: indicatorError } = await supabase
              .from('indicators')
              .select('*')
              .in('code', row.indicator_codes);
            
            if (indicatorError) throw indicatorError;
            
            indicators?.forEach(indicator => {
              indicatorsWithCriteria.push({ indicator, criteria: row.criteria_name });
            });
          }
        }
      }

      setIndicators(indicatorsWithCriteria.map(item => item.indicator));
      setIndicatorsCriteriaMap(indicatorsWithCriteria);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des indicateurs');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: {
    name: string;
    parentId?: string;
    unit?: string;
    type: 'primaire' | 'calculé';
    axe: 'Environnement' | 'Social' | 'Gouvernance';
    formule: 'somme' | 'dernier_mois' | 'moyenne' | 'max' | 'min';
    frequence: 'mensuelle' | 'trimestrielle' | 'annuelle';
  }) => {
    try {
      const isValid = await validateAdd('indicator', data.name, undefined, async (items, itemName) => {
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

      const [criteriaName, standardName] = data.parentId!.split('|');
      const indicatorCode = data.name.replace(/\s+/g, '').toUpperCase();

      const { data: existingIndicator } = await supabase
        .from('indicators')
        .select('code')
        .eq('code', indicatorCode)
        .maybeSingle();

      if (!existingIndicator) {
        await supabase.from('indicators').insert({
          code: indicatorCode,
          name: data.name,
          unit: data.unit,
          type: data.type,
          axe: data.axe,
          formule: data.formule,
          frequence: data.frequence
        });
      }

      const table = selectedSubsector
        ? 'subsector_standards_issues_criteria_indicators'
        : 'sector_standards_issues_criteria_indicators';

      const query = {
        ...(selectedSubsector ? { subsector_name: selectedSubsector } : { sector_name: selectedSector }),
        standard_name: standardName,
        issue_name: selectedIssues[0],
        criteria_name: criteriaName
      };

      const { data: currentData } = await supabase
        .from(table)
        .select('indicator_codes')
        .match(query)
        .maybeSingle();

      const existingCodes = currentData?.indicator_codes || [];
      if (!existingCodes.includes(indicatorCode)) {
        const updatedCodes = [...existingCodes, indicatorCode];
        if (currentData) {
          await supabase.from(table).update({ indicator_codes: updatedCodes }).match(query);
        } else {
          await supabase.from(table).insert({ ...query, indicator_codes: [indicatorCode], unit: data.unit });
        }
      }

      toast.success('Indicateur ajouté avec succès');
      setShowAddForm(false);
      fetchIndicators();
    } catch (err) {
      toast.error('Erreur lors de l\'ajout de l\'indicateur');
      console.error('Error:', err);
    }
  };

  const criteriaOptions = selectedCriteria.map(criteria => ({
    id: `${criteria}|${selectedStandards[0] || 'DEFAULT'}`,
    name: criteria
  }));

  const groupedIndicators = React.useMemo(() => {
    const groups: { [criteriaName: string]: typeof indicators } = {};
    selectedCriteria.forEach(criteria => { groups[criteria] = []; });
    
    indicatorsCriteriaMap.forEach(({ indicator, criteria }) => {
      if (groups[criteria] && !groups[criteria].some(existing => existing.code === indicator.code)) {
        groups[criteria].push(indicator);
      }
    });
    
    return groups;
  }, [indicatorsCriteriaMap, selectedCriteria]);

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
        <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg">
          <img src="/Imade full VSG.jpg" alt="Global ESG Banner" className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Étape 5 : Sélection des Indicateurs</h1>
          <p className="text-gray-600 mt-2">
            Choisissez les indicateurs de performance pour chaque critère sélectionné.
          </p>
        </div>

        <SelectionSummary />

        <div className="mb-8">
          {showAddForm ? (
            <AddForm
              onSubmit={onSubmit}
              onCancel={() => setShowAddForm(false)}
              placeholder="Ex: Tonnes CO2 émises"
              label="Nom de l'indicateur"
              parentOptions={criteriaOptions}
              parentLabel="Critère associé"
              showUnit
              type="indicator"
            />
          ) : (
            <AddButton onClick={() => setShowAddForm(true)} label="Ajouter un indicateur" />
          )}
        </div>

        <div className="space-y-8">
          {Object.entries(groupedIndicators).map(([criteriaName, criteriaIndicators]) => (
            <div key={criteriaName} className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckSquare className="h-5 w-5 text-green-600 mr-2" />
                  {criteriaName}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {criteriaIndicators.length} indicateur(s) disponible(s)
                </p>
              </div>
              
              <div className="p-6">
                {criteriaIndicators.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {criteriaIndicators.map((indicator) => (
                      <div
                        key={indicator.code}
                        onClick={() => toggleIndicator(indicator.name)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedIndicators.includes(indicator.name)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`flex items-center justify-center w-4 h-4 rounded border transition-colors mt-0.5 ${
                              selectedIndicators.includes(indicator.name)
                                ? 'border-green-600 bg-green-600'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedIndicators.includes(indicator.name) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 truncate">{indicator.name}</h4>
                            {indicator.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{indicator.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {indicator.unit && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {indicator.unit}
                                </span>
                              )}
                              {indicator.type && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  {indicator.type}
                                </span>
                              )}
                              {indicator.axe && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  {indicator.axe}
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedIndicators.includes(indicator.name) && (
                            <div className="flex-shrink-0">
                              <BarChart3 className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Aucun indicateur disponible pour ce critère</p>
                    <p className="text-xs mt-1">Ajoutez des indicateurs en utilisant le bouton ci-dessus</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedIndicators.length === 0 && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-md p-4 my-8">
            <p className="text-sm">
              Veuillez sélectionner au moins un indicateur pour continuer.
            </p>
          </div>
        )}
        
        <ProgressNav
          currentStep={5}
          totalSteps={6}
          nextPath="/process/company"
          prevPath="/process/criteria"
          isNextDisabled={selectedIndicators.length === 0}
        />

        {similarityAlert && (
          <SimilarityAlertModal
            isOpen
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

export default ProcessStepIndicators;