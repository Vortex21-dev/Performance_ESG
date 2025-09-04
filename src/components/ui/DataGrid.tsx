import React, { useState, useEffect } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';

interface DataGridProps {
  items: Array<{
    name: string;
    description?: string;
    metadata?: {
      [key: string]: string;
    };
  }>;
  selectedItems: string[];
  onToggleItem: (name: string) => void;
  itemsPerPage?: number;
}

const DataGrid: React.FC<DataGridProps> = ({
  items,
  selectedItems,
  onToggleItem,
  itemsPerPage = 10
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [filteredItems, setFilteredItems] = useState(items);

  // Update filtered items when search term or items change
  useEffect(() => {
    const filtered = items.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        Object.values(item.metadata || {}).some(value => 
          value.toLowerCase().includes(searchLower)
        ) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
    });
    setFilteredItems(filtered);
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, items]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const handleCheckboxClick = (name: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleItem(name);
  };

  const handleRowClick = (name: string) => {
    setExpandedItem(expandedItem === name ? null : name);
  };

  return (
    <div className="space-y-4">
      {/* Search bar and stats */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div className="text-sm text-gray-500">
          {selectedItems.length} sélectionné(s) sur {items.length} total
        </div>
      </div>

      {/* Items list */}
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        {paginatedItems.map((item) => (
          <div
            key={item.name}
            onClick={() => handleRowClick(item.name)}
            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
              selectedItems.includes(item.name) ? 'bg-green-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div
                    onClick={(e) => handleCheckboxClick(item.name, e)}
                    className={`flex items-center justify-center w-5 h-5 rounded-md border cursor-pointer transition-colors ${
                      selectedItems.includes(item.name)
                        ? 'border-green-600 bg-green-600'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {selectedItems.includes(item.name) && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <span className="font-medium text-gray-900">{item.name}</span>
                </div>
              </div>
              
              {(item.description || item.metadata) && (
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transform transition-transform ${
                    expandedItem === item.name ? 'rotate-180' : ''
                  }`}
                />
              )}
            </div>

            {/* Expanded details */}
            {expandedItem === item.name && (
              <div className="mt-3 pl-8 text-sm text-gray-600 space-y-2">
                {item.description && (
                  <p>{item.description}</p>
                )}
                {item.metadata && Object.entries(item.metadata).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <span className="font-medium">{key}:</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {paginatedItems.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            Aucun résultat trouvé pour "{searchTerm}"
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Précédent
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Suivant
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Page {currentPage} sur {totalPages}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataGrid;