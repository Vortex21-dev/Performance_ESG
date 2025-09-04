import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface ProgressNavProps {
  currentStep: number;
  totalSteps: number;
  nextPath: string;
  prevPath: string;
  isNextDisabled?: boolean;
}

const ProgressNav: React.FC<ProgressNavProps> = ({
  currentStep,
  totalSteps,
  nextPath,
  prevPath,
  isNextDisabled = false
}) => {
  const navigate = useNavigate();

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(prevPath)}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Précédent
        </button>

        <div className="flex items-center space-x-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i + 1 === currentStep ? 'bg-green-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => navigate(nextPath)}
          disabled={isNextDisabled}
          className={`flex items-center px-6 py-2 rounded-md ${
            isNextDisabled
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
        >
          Suivant
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default ProgressNav;