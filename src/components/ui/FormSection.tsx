import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FormSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, icon, children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      <div className="px-6 py-5 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200">
        <h3 className="flex items-center text-lg font-semibold text-gray-900">
          <div className="p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm mr-3">
            {icon}
          </div>
          <span>{title}</span>
        </h3>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
};