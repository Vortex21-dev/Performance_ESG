import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface SimilarItem {
  name: string;
  similarity: number;
}

// Fonction pour normaliser une chaîne de caractères
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-z0-9]/g, ""); // Garde uniquement les lettres et chiffres
}

// Fonction pour calculer la similarité entre deux chaînes
function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  // Vérification exacte ou singulier/pluriel
  if (normalized1 === normalized2 || 
      normalized1 + "s" === normalized2 || 
      normalized1 === normalized2 + "s") {
    return 1.0;
  }

  // Calcul de la distance de Levenshtein
  const matrix = Array(normalized2.length + 1).fill(null).map(() => 
    Array(normalized1.length + 1).fill(null)
  );

  for (let i = 0; i <= normalized1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= normalized2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= normalized2.length; j++) {
    for (let i = 1; i <= normalized1.length; i++) {
      const substitutionCost = normalized1[i - 1] === normalized2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + substitutionCost
      );
    }
  }

  const maxLength = Math.max(normalized1.length, normalized2.length);
  return maxLength === 0 ? 1.0 : 1 - matrix[normalized2.length][normalized1.length] / maxLength;
}

async function findSimilarItems(
  type: 'sector' | 'subsector' | 'standard' | 'issue' | 'criteria' | 'indicator',
  name: string,
  parentId?: string
): Promise<SimilarItem[]> {
  try {
    let query;
    
    switch (type) {
      case 'criteria':
        // Check in criteria table
        query = await supabase
          .from('criteria')
          .select('name');
        break;
        
      case 'indicator':
        // Check in indicators table
        query = await supabase
          .from('indicators')
          .select('name');
        break;
        
      case 'sector':
        query = await supabase
          .from('sectors')
          .select('name');
        break;
        
      case 'subsector':
        query = await supabase
          .from('subsectors')
          .select('name');
        break;
        
      case 'standard':
        query = await supabase
          .from('standards')
          .select('name');
        break;
        
      case 'issue':
        query = await supabase
          .from('issues')
          .select('name');
        break;
    }

    if (query.error) throw query.error;

    // Calculate similarities
    const similarItems = query.data
      ?.map(item => {
        const similarity = calculateSimilarity(name, item.name);
        return {
          name: item.name,
          similarity
        };
      })
      .filter(item => item.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity) || [];

    return similarItems;
  } catch (err) {
    console.error('Error searching for similar items:', err);
    return [];
  }
}

export async function validateAdd(
  type: 'sector' | 'subsector' | 'standard' | 'issue' | 'criteria' | 'indicator',
  name: string,
  parentId?: string,
  onSimilarItems?: (items: SimilarItem[], itemName: string) => Promise<boolean>
): Promise<boolean> {
  try {
    // Find similar items
    const similarItems = await findSimilarItems(type, name, parentId);
    
    // Check for exact matches (including singular/plural)
    const exactMatch = similarItems.some(item => {
      const normalizedName = normalizeString(name);
      const normalizedItem = normalizeString(item.name);
      return normalizedName === normalizedItem || 
             normalizedName + "s" === normalizedItem ||
             normalizedItem + "s" === normalizedName;
    });

    // For criteria and indicators, we want to show similarity alert but allow reuse
    if ((type === 'criteria' || type === 'indicator')) {
      if (similarItems.length > 0 && onSimilarItems) {
        const shouldProceed = await onSimilarItems(similarItems, name);
        if (!shouldProceed) {
          return false;
        }
      }
      return true;
    }

    // For other types, prevent duplicates
    if (exactMatch) {
      toast.error(`Cet élément existe déjà (en tenant compte du singulier/pluriel)`);
      return false;
    }

    // Show similarity dialog for non-exact matches
    if (similarItems.length > 0 && onSimilarItems) {
      const shouldProceed = await onSimilarItems(similarItems, name);
      if (!shouldProceed) {
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error('Error in validateAdd:', err);
    toast.error('Une erreur est survenue lors de la validation');
    return false;
  }
}