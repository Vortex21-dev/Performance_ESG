import React from 'react';
import { Plus } from 'lucide-react';

interface AddButtonProps {
  onClick: () => void;
  label: string;
}

const AddButton: React.FC<AddButtonProps> = ({ onClick, label }) => {
  return (
    <button
      onClick={onClick}
      className="group relative flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
    >
      <div className="flex flex-col items-center">
        <Plus className="h-12 w-12 text-gray-400 group-hover:text-gray-500" />
        <span className="mt-2 block text-sm font-semibold text-gray-900">
          {label}
        </span>
      </div>
    </button>
  );
};

export default AddButton;