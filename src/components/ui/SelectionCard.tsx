import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import * as Icons from 'lucide-react';

interface SelectionCardProps {
  name: string;
  title: string;
  icon: string;
  iconColor: string;
  isSelected: boolean;
  onClick: () => void;
  bgColor: string;
  borderColor: string;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  title,
  icon,
  iconColor,
  isSelected,
  onClick,
  bgColor,
  borderColor
}) => {
  // @ts-ignore - Lucide icons typing issue
  const IconComponent = Icons[icon as keyof typeof Icons];

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative w-full p-6 rounded-lg border-2 text-left transition-all ${
        isSelected
          ? `${borderColor} ${bgColor}`
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {isSelected && (
        <div className="absolute top-2 right-2">
          <Check className="h-5 w-5 text-green-600" />
        </div>
      )}
      <div className="flex items-center mb-3">
        {IconComponent && (
          <IconComponent className={`h-8 w-8 ${iconColor}`} />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </motion.button>
  );
};

export default SelectionCard;