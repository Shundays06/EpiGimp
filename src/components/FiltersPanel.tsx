import React, { useState } from 'react';
import type { FilterType, Layer } from '../types';
import { applyFilter, exportCanvas } from '../utils/filters';

interface FiltersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onLayerUpdate: (layerId: string) => void;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  layers,
  activeLayerId,
  onLayerUpdate,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('grayscale');
  const [filterValue, setFilterValue] = useState(50);

  const filters: { id: FilterType; label: string; hasValue: boolean }[] = [
    { id: 'grayscale', label: 'Niveaux de gris', hasValue: false },
    { id: 'sepia', label: 'Sépia', hasValue: false },
    { id: 'invert', label: 'Inverser', hasValue: false },
    { id: 'brightness', label: 'Luminosité', hasValue: true },
    { id: 'contrast', label: 'Contraste', hasValue: true },
    { id: 'saturate', label: 'Saturation', hasValue: true },
    { id: 'blur', label: 'Flou', hasValue: true },
  ];

  const handleApplyFilter = () => {
    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer) return;

    const filter = filters.find((f) => f.id === selectedFilter);
    if (!filter) return;

    const value = filter.hasValue ? filterValue : undefined;
    
    applyFilter(activeLayer.canvas, {
      type: selectedFilter,
      value,
    });

    onLayerUpdate(activeLayerId);
  };

  const handleExport = (format: 'png' | 'jpeg') => {
    const canvases = layers
      .filter((l) => l.visible)
      .map((l) => l.canvas);

    const dataUrl = exportCanvas(canvases, format);
    
    // Download
    const link = document.createElement('a');
    link.download = `epigimp-export.${format}`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="bg-gray-800 text-white p-4 flex flex-col gap-4">
      <h2 className="text-lg font-bold">Filtres & Export</h2>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">Sélectionner un filtre</label>
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value as FilterType)}
          className="bg-gray-700 px-3 py-2 rounded text-sm"
        >
          {filters.map((filter) => (
            <option key={filter.id} value={filter.id}>
              {filter.label}
            </option>
          ))}
        </select>

        {filters.find((f) => f.id === selectedFilter)?.hasValue && (
          <div>
            <label className="text-sm mb-2 block">
              Intensité: {filterValue}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={filterValue}
              onChange={(e) => setFilterValue(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        <button
          onClick={handleApplyFilter}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
        >
          Appliquer le filtre
        </button>
      </div>

      {/* Export */}
      <div className="flex flex-col gap-3 pt-4 border-t border-gray-700">
        <label className="text-sm font-medium">Exporter l'image</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('png')}
            className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors text-sm"
          >
            PNG
          </button>
          <button
            onClick={() => handleExport('jpeg')}
            className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors text-sm"
          >
            JPEG
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel;
