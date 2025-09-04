import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import ProgressNav from '../../components/ui/ProgressNav';
import SelectionCard from '../../components/ui/SelectionCard';
import SelectionSummary from '../../components/ui/SelectionSummary';
import AddButton from '../../components/ui/AddButton';
import AddForm from '../../components/ui/AddForm';
import SimilarityAlertModal from '../../components/ui/SimilarityAlertModal';
import { supabase } from '../../lib/supabase';
import { Sector, Subsector } from '../../types/sectors';
import { Loader, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getIconForSector } from '../../utils/iconMapping';
import { motion, AnimatePresence } from 'framer-motion';
import { validateAdd } from '../../utils/validation';

interface SimilarityAlert {
  items: Array<{ name: string; similarity: number }>;
  itemName: string;
  onConfirm: () => void;
}

const ProcessStep1: React.FC = () => {
  const { selectedSector, setSector, selectedSubsector, setSubsector } = useAppContext();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [subsectors, setSubsectors] = useState<Subsector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddSubsectorForm, setShowAddSubsectorForm] = useState(false);
  const [similarityAlert, setSimilarityAlert] = useState<SimilarityAlert | null>(null);

  useEffect(() => {
    fetchSectors();
  }, []);

  useEffect(() => {
    if (selectedSector) {
      fetchSubsectors(selectedSector);
    }
  }, [selectedSector]);

  async function fetchSectors() {
    try {
      const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .order('name');

      if (error) throw error;
      setSectors(data);
    } catch (err) {
      setError('Erreur lors du chargement des domaines d\'activité');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubsectors(sectorName: string) {
    try {
      const { data, error } = await supabase
        .from('subsectors')
        .select('*')
        .eq('sector_name', sectorName)
        .order('name');

      if (error) throw error;
      setSubsectors(data);
    } catch (err) {
      console.error('Error fetching sectors:', err);
    }
  }

  const handleSimilarItems = async (
    items: Array<{ name: string; similarity: number }>,
    itemName: string,
    onConfirm: () => void
  ) => {
    return new Promise<boolean>((resolve) => {
      setSimilarityAlert({
        items,
        itemName,
        onConfirm: () => {
          setSimilarityAlert(null);
          onConfirm();
          resolve(true);
        }
      });
    });
  };

  const onSubmit = async (data: { name: string }) => {
    try {
      const isValid = await validateAdd('sector', data.name, undefined, async (items, itemName) => {
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

      const { error } = await supabase
        .from('sectors')
        .insert([{ name: data.name }]);

      if (error) throw error;

      toast.success('Domaine d\'activité ajouté avec succès');
      setShowAddForm(false);
      fetchSectors();
    } catch (err) {
      toast.error('Erreur lors de l\'ajout du domaine d\'activité');
      console.error('Error:', err);
    }
  };

  const onSubmitSubsector = async (data: { name: string }) => {
    if (!selectedSector) return;

    try {
      const isValid = await validateAdd('subsector', data.name, undefined, async (items, itemName) => {
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

      const { error } = await supabase
        .from('subsectors')
        .insert([{ 
          name: data.name,
          sector_name: selectedSector
        }]);

      if (error) throw error;

      toast.success('Secteur ajouté avec succès');
      setShowAddSubsectorForm(false);
      fetchSubsectors(selectedSector);
    } catch (err) {
      toast.error('Erreur lors de l\'ajout du secteur');
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
            Étape 1 : Choix de l'Activité
          </h1>
          <p className="text-gray-600 mt-2">
            Sélectionnez votre domaine d'activité et précisez votre secteur pour personnaliser vos modules ESG.
          </p>
        </div>

        <SelectionSummary />

        <div className="flex flex-col space-y-8">
          {/* Domaines d'activité */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Domaine d'activité</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sectors.map((sector, index) => {
                const colors = getColorScheme(index);
                const iconMapping = getIconForSector(sector.name);
                return (
                  <SelectionCard
                    key={sector.name}
                    name={sector.name}
                    title={sector.name}
                    icon={iconMapping.icon}
                    iconColor={iconMapping.color}
                    isSelected={selectedSector === sector.name}
                    onClick={() => setSector(sector.name)}
                    bgColor={colors.bg}
                    borderColor={colors.border}
                  />
                );
              })}

              {showAddForm ? (
                <AddForm
                  onSubmit={onSubmit}
                  onCancel={() => setShowAddForm(false)}
                  placeholder="Ex: Transport"
                  label="Nom du domaine d'activité"
                  type="sector"
                />
              ) : (
                <AddButton
                  onClick={() => setShowAddForm(true)}
                  label="Ajouter un domaine d'activité"
                />
              )}
            </div>
          </div>

          {/* Secteurs */}
          <AnimatePresence mode="wait">
            {selectedSector && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-lg p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Secteur d'activité
                  </h2>
                  {!showAddSubsectorForm && subsectors.length > 0 && (
                    <button
                      onClick={() => setShowAddSubsectorForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Ajouter un secteur
                    </button>
                  )}
                </div>

                {showAddSubsectorForm && (
                  <div className="mb-6">
                    <AddForm
                      onSubmit={onSubmitSubsector}
                      onCancel={() => setShowAddSubsectorForm(false)}
                      placeholder="Ex: Banque d'investissement"
                      label="Nom du secteur"
                      type="subsector"
                    />
                  </div>
                )}

                {subsectors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {subsectors.map((subsector, index) => {
                      const colors = getColorScheme(index);
                      return (
                        <motion.button
                          key={subsector.name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`relative p-4 rounded-lg text-left transition-all ${
                            selectedSubsector === subsector.name
                              ? `${colors.border} ${colors.bg}`
                              : 'border border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSubsector(subsector.name)}
                        >
                          {selectedSubsector === subsector.name && (
                            <div className="absolute top-2 right-2">
                              <Check className="h-5 w-5 text-green-600" />
                            </div>
                          )}
                          <span className="font-medium text-gray-900">
                            {subsector.name}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      Ce domaine d'activité n'a pas de secteurs spécifiques.
                    </p>
                    {!showAddSubsectorForm && (
                      <button
                        onClick={() => setShowAddSubsectorForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Ajouter un secteur
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ProgressNav
          currentStep={1}
          totalSteps={6}
          nextPath="/process/standards"
          prevPath="/"
          isNextDisabled={!selectedSector}
        />
      </div>

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
  );
}

export default ProcessStep1;