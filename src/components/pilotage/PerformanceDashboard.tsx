// src/components/pilotage/PerformanceDashboard.tsx
import React from 'react';

interface PerformanceDashboardProps {
  siteName: string;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ siteName }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
      <h3 className="text-xl font-bold text-white mb-4">Tableau de Performance - {siteName}</h3>
      {/* Implémentez ici votre dashboard de performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <h4 className="text-purple-400 font-semibold">Consommation Énergétique</h4>
          <p className="text-2xl font-bold text-white mt-2">1,234 kWh</p>
          <p className="text-sm text-gray-400">-5% vs mois dernier</p>
        </div>
        {/* Ajoutez d'autres métriques */}
      </div>
    </div>
  );
};

export default PerformanceDashboard;