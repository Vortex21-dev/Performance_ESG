import React from 'react';
import { Check, ChevronRight, Users } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { motion } from 'framer-motion';

const SelectionSummary: React.FC = () => {
  const { 
    currentStep,
    selectedSector,
    selectedSubsector,
    selectedIssues,
    selectedStandards,
    selectedCriteria,
    selectedIndicators,
    organizationCreated,
    usersCreated
  } = useAppContext();

  const steps = [
    {
      title: "Secteur",
      isComplete: !!selectedSector,
      content: selectedSubsector || selectedSector,
      color: "bg-blue-500"
    },
    {
      title: "Normes",
      isComplete: selectedStandards.length > 0,
      content: selectedStandards.length > 0 ? `${selectedStandards.length} normes sélectionnées` : null,
      color: "bg-purple-500"
    },
    {
      title: "Enjeux ESG",
      isComplete: selectedIssues.length > 0,
      content: selectedIssues.length > 0 ? `${selectedIssues.length} enjeux sélectionnés` : null,
      color: "bg-green-500"
    },
    {
      title: "Critères",
      isComplete: selectedCriteria.length > 0,
      content: selectedCriteria.length > 0 ? `${selectedCriteria.length} critères sélectionnés` : null,
      color: "bg-amber-500"
    },
    {
      title: "Indicateurs",
      isComplete: selectedIndicators.length > 0,
      content: selectedIndicators.length > 0 ? `${selectedIndicators.length} indicateurs sélectionnés` : null,
      color: "bg-cyan-500"
    },
    {
      title: "Organisation",
      isComplete: organizationCreated || currentStep > 6,
      content: organizationCreated ? "Organisation créée" : null,
      color: "bg-indigo-500"
    },
    {
      title: "Processus",
      isComplete: usersCreated || currentStep > 7,
      content: usersCreated ? "Utilisateurs créés" : null,
      color: "bg-pink-500"
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.title}>
            <div className="flex-1">
              <div className="relative">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.isComplete
                      ? `${step.color} text-white`
                      : 'bg-gray-200 text-gray-400'
                  } ${currentStep === index + 1 ? 'ring-4 ring-offset-2 ring-green-100' : ''}`}
                >
                  {step.isComplete ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </motion.div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  {step.content && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-gray-500 mt-1 truncate max-w-[120px] mx-auto"
                    >
                      {step.content}
                    </motion.p>
                  )}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-shrink-0 mx-2">
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-6 relative">
        <div className="h-2 bg-gray-200 rounded-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ 
              width: `${(steps.filter(step => step.isComplete).length / steps.length) * 100}%` 
            }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 via-green-500 via-amber-500 via-cyan-500 via-indigo-500 to-pink-500"
          />
        </div>
      </div>
    </div>
  );
};

export default SelectionSummary;