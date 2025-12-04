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
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp' | 'bmp' | 'gif'>('png');
  const [exportQuality, setExportQuality] = useState(92);

  const filters: { id: FilterType; label: string; hasValue: boolean; min?: number; max?: number; defaultValue?: number }[] = [
    { id: 'grayscale', label: 'Niveaux de gris', hasValue: false },
    { id: 'sepia', label: 'Sépia', hasValue: false },
    { id: 'invert', label: 'Inverser', hasValue: false },
    { id: 'brightness', label: 'Luminosité', hasValue: true, min: -100, max: 100, defaultValue: 0 },
    { id: 'contrast', label: 'Contraste', hasValue: true, min: -100, max: 100, defaultValue: 0 },
    { id: 'saturate', label: 'Saturation', hasValue: true, min: 0, max: 200, defaultValue: 50 },
    { id: 'blur', label: 'Flou', hasValue: true, min: 0, max: 10, defaultValue: 1 },
  ];

  const currentFilter = filters.find((f) => f.id === selectedFilter);

  const handleFilterChange = (newFilter: FilterType) => {
    setSelectedFilter(newFilter);
    const filter = filters.find((f) => f.id === newFilter);
    if (filter?.hasValue) {
      setFilterValue(filter.defaultValue ?? 50);
    }
  };

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

  const openExportModal = (format: 'png' | 'jpeg' | 'webp' | 'bmp' | 'gif') => {
    setExportFormat(format);
    setShowExportModal(true);
  };

  const handleExportConfirm = () => {
    const canvases = layers
      .filter((l) => l.visible)
      .map((l) => l.canvas);

    const quality = exportQuality / 100; // Convert to 0-1 range
    const dataUrl = exportCanvas(canvases, exportFormat, quality);
    
    // Download
    const link = document.createElement('a');
    const extension = exportFormat === 'jpeg' ? 'jpg' : exportFormat;
    link.download = `epigimp-export-${Date.now()}.${extension}`;
    link.href = dataUrl;
    link.click();
    
    setShowExportModal(false);
  };

  return (
    <div className="bg-gray-800 text-white p-4 flex flex-col gap-4">
      <h2 className="text-lg font-bold">Filtres & Export</h2>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">Sélectionner un filtre</label>
        <select
          value={selectedFilter}
          onChange={(e) => handleFilterChange(e.target.value as FilterType)}
          className="bg-gray-700 px-3 py-2 rounded text-sm"
        >
          {filters.map((filter) => (
            <option key={filter.id} value={filter.id}>
              {filter.label}
            </option>
          ))}
        </select>

        {currentFilter?.hasValue && (
          <div>
            <label className="text-sm mb-2 block">
              Intensité: {filterValue}
            </label>
            <input
              type="range"
              min={currentFilter.min ?? 0}
              max={currentFilter.max ?? 100}
              value={filterValue}
              onChange={(e) => setFilterValue(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{currentFilter.min ?? 0}</span>
              <span>{currentFilter.max ?? 100}</span>
            </div>
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
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => openExportModal('png')}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors text-sm"
          >
            PNG
          </button>
          <button
            onClick={() => openExportModal('jpeg')}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors text-sm"
          >
            JPEG
          </button>
          <button
            onClick={() => openExportModal('webp')}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors text-sm"
          >
            WebP
          </button>
          <button
            onClick={() => openExportModal('bmp')}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors text-sm"
          >
            BMP
          </button>
          <button
            onClick={() => openExportModal('gif')}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors text-sm col-span-2"
          >
            GIF
          </button>
        </div>
        <p className="text-xs text-gray-400">
          PNG: Sans perte, avec transparence<br/>
          JPEG: Compression avec perte, sans transparence<br/>
          WebP: Meilleure compression, avec transparence<br/>
          BMP: Sans compression, sans transparence<br/>
          GIF: Compression, avec transparence
        </p>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Exporter en {exportFormat.toUpperCase()}</h3>
            
            {/* Format Info */}
            <div className="mb-4 p-3 bg-gray-700 rounded text-sm">
              {exportFormat === 'png' && (
                <p>Format sans perte avec support de la transparence. Idéal pour les images avec texte et graphiques.</p>
              )}
              {exportFormat === 'jpeg' && (
                <p>Format avec compression. Pas de transparence (fond blanc appliqué). Idéal pour les photos.</p>
              )}
              {exportFormat === 'webp' && (
                <p>Format moderne avec excellente compression et support de la transparence.</p>
              )}
              {exportFormat === 'bmp' && (
                <p>Format sans compression. Fichiers volumineux, pas de transparence (fond blanc appliqué).</p>
              )}
              {exportFormat === 'gif' && (
                <p>Format avec compression et support de la transparence. Limité à 256 couleurs.</p>
              )}
            </div>

            {/* Quality Slider - Only for JPEG and WebP */}
            {(exportFormat === 'jpeg' || exportFormat === 'webp') && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Qualité: {Math.round(exportQuality * 100)}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={exportQuality * 100}
                  onChange={(e) => setExportQuality(Number(e.target.value) / 100)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Petite taille</span>
                  <span>Haute qualité</span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleExportConfirm}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
              >
                Exporter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiltersPanel;
