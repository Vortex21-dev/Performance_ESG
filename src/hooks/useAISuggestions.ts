import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Suggestion } from '../types/suggestions';
import { useSuggestionStore } from '../store/suggestionStore';

export function useAISuggestions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addSuggestion } = useSuggestionStore();

  const generateSuggestions = async (
    sector: string,
    type: 'issues' | 'standards',
    subsector?: string,
    standards?: string[]
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke<{ suggestions: Suggestion[] }>('generate-suggestions', {
        body: { 
          sector, 
          type,
          subsector,
          standards: standards || []
        }
      });

      if (functionError) {
        console.error('Détails de l\'erreur Edge Function:', functionError);
        throw new Error(`Échec de la génération des suggestions: ${functionError.message || 'Erreur inconnue'}`);
      }

      if (!data?.suggestions) {
        throw new Error('Aucune suggestion reçue du service IA');
      }

      data.suggestions.forEach((suggestion: Suggestion) => {
        addSuggestion(suggestion);
      });

      return data.suggestions;
    } catch (err) {
      console.error('Erreur lors de la génération des suggestions:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Une erreur inattendue est survenue lors de la génération des suggestions';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { generateSuggestions, loading, error };
}