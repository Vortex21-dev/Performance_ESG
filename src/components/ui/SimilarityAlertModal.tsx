import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SimilarityAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  similarItems: Array<{ name: string; similarity: number }>;
}

const SimilarityAlertModal: React.FC<SimilarityAlertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  similarItems
}) => {
  if (!isOpen) return null;

  // Fonction pour normaliser les chaînes de caractères
  const normalizeString = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
      .replace(/[^a-z0-9]/g, ""); // Garde uniquement les lettres et chiffres
  };

  // Vérifie si deux chaînes sont équivalentes après normalisation
  const areStringsEquivalent = (str1: string, str2: string) => {
    const normalized1 = normalizeString(str1);
    const normalized2 = normalizeString(str2);
    
    // Vérifie l'équivalence exacte
    if (normalized1 === normalized2) return true;
    
    // Vérifie le singulier/pluriel
    if (normalized1 + "s" === normalized2 || normalized1 === normalized2 + "s") return true;
    
    return false;
  };

  // Vérifie s'il y a une correspondance exacte ou très proche
  const exactMatch = similarItems.some(item => 
    areStringsEquivalent(item.name, itemName) || 
    Math.round(item.similarity * 100) === 100
  );

  // Si correspondance exacte, ferme automatiquement le modal
  if (exactMatch) {
    onClose();
    return null;
  }

  // Groupe les éléments similaires par seuil de similarité
  const highSimilarity = similarItems.filter(item => item.similarity >= 0.8);
  const mediumSimilarity = similarItems.filter(item => item.similarity >= 0.6 && item.similarity < 0.8);
  const lowSimilarity = similarItems.filter(item => item.similarity < 0.6);

  const maxItemsPerCategory = 5;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Éléments similaires détectés
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-6">
              {/* High similarity items */}
              {highSimilarity.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Correspondances très proches :
                  </h4>
                  <div className="space-y-2">
                    {highSimilarity.slice(0, maxItemsPerCategory).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {item.name}
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          {Math.round(item.similarity * 100)}% similaire
                        </span>
                      </div>
                    ))}
                    {highSimilarity.length > maxItemsPerCategory && (
                      <p className="text-sm text-gray-500 italic">
                        Et {highSimilarity.length - maxItemsPerCategory} autres éléments similaires...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Medium similarity items */}
              {mediumSimilarity.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-amber-600">
                    Correspondances possibles :
                  </h4>
                  <div className="space-y-2">
                    {mediumSimilarity.slice(0, maxItemsPerCategory).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {item.name}
                        </span>
                        <span className="text-sm font-medium text-amber-600">
                          {Math.round(item.similarity * 100)}% similaire
                        </span>
                      </div>
                    ))}
                    {mediumSimilarity.length > maxItemsPerCategory && (
                      <p className="text-sm text-gray-500 italic">
                        Et {mediumSimilarity.length - maxItemsPerCategory} autres éléments similaires...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Low similarity items */}
              {lowSimilarity.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-600">
                    Correspondances faibles :
                  </h4>
                  <div className="space-y-2">
                    {lowSimilarity.slice(0, maxItemsPerCategory).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {item.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {Math.round(item.similarity * 100)}% similaire
                        </span>
                      </div>
                    ))}
                    {lowSimilarity.length > maxItemsPerCategory && (
                      <p className="text-sm text-gray-500 italic">
                        Et {lowSimilarity.length - maxItemsPerCategory} autres éléments similaires...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Warning message */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">
                  Voulez-vous quand même ajouter "{itemName}" malgré les correspondances existantes ?
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Continuer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SimilarityAlertModal;
