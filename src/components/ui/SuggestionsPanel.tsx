import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useAISuggestions } from '../../hooks/useAISuggestions';
import { useSuggestionStore } from '../../store/suggestionStore';
import { useAppContext } from '../../context/AppContext';
import { useAuthStore } from '../../store/authStore';
import SuggestionCard from './SuggestionCard';

interface SuggestionsPanelProps {
  sector: string;
  type: 'issues' | 'standards';
}

const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ sector, type }) => {
  // Temporarily disabled AI suggestions
  return null;

  /* Commented out for now - AI suggestions feature
  const { generateSuggestions, loading, error } = useAISuggestions();
  const { selectedSubsector, selectedStandards } = useAppContext();
  const suggestions = useSuggestionStore(state => 
    state.suggestions.filter(s => s.sector === sector && s.type === type)
  );
  const { profile } = useAuthStore();

  // Hide panel for enterprise users
  if (profile?.role === 'enterprise') {
    return null;
  }

  const handleGenerateSuggestions = async () => {
    try {
      if (type === 'issues') {
        await generateSuggestions(sector, type, selectedSubsector, selectedStandards);
      } else {
        await generateSuggestions(sector, type, selectedSubsector);
      }
    } catch (err) {
      console.error('Error in handleGenerateSuggestions:', err);
    }
  };

  const getTitle = () => {
    if (type === 'issues') {
      return "Suggestions d'enjeux ESG";
    }
    return "Suggestions de normes";
  };

  const getDescription = () => {
    if (type === 'issues') {
      return `Basées sur votre secteur${selectedSubsector ? ` (${selectedSubsector})` : ''} et les normes sélectionnées`;
    }
    return `Basées sur votre secteur${selectedSubsector ? ` (${selectedSubsector})` : ''}`;
  };

  return (
    <div className="mt-8 bg-gray-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              {getTitle()}
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            {getDescription()}
          </p>
        </div>
        
        <button
          onClick={handleGenerateSuggestions}
          disabled={loading}
          className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Génération...' : 'Générer des suggestions'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <AnimatePresence>
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.map((suggestion) => (
            <motion.div
              key={suggestion.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SuggestionCard suggestion={suggestion} />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {suggestions.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          {type === 'issues' 
            ? "Cliquez sur \"Générer des suggestions\" pour obtenir des recommandations d'enjeux ESG basées sur votre secteur et les normes sélectionnées."
            : "Cliquez sur \"Générer des suggestions\" pour obtenir des recommandations de normes basées sur votre secteur."}
        </div>
      )}
    </div>
  );
  */
};

export default SuggestionsPanel;