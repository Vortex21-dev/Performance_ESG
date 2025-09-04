import React from 'react';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Suggestion } from '../../types/suggestions';
import { useSuggestionStore } from '../../store/suggestionStore';

interface SuggestionCardProps {
  suggestion: Suggestion;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion }) => {
  const { approveSuggestion, rejectSuggestion } = useSuggestionStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{suggestion.name}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => approveSuggestion(suggestion.name)}
            className="p-1 rounded-full text-green-600 hover:bg-green-50 transition-colors"
          >
            <Check className="h-5 w-5" />
          </button>
          <button
            onClick={() => rejectSuggestion(suggestion.name)}
            className="p-1 rounded-full text-red-600 hover:bg-red-50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {suggestion.description && (
        <p className="text-sm text-gray-600">{suggestion.description}</p>
      )}
      
      <div className="mt-2 flex items-center space-x-2">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {suggestion.type === 'issue' ? 'Enjeu' : 'Norme'}
        </span>
        <span className="text-xs text-gray-500">
          Suggéré pour : {suggestion.sector}
        </span>
      </div>
    </motion.div>
  );
}

export default SuggestionCard;