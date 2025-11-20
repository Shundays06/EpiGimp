import React from 'react';
import type { Layer } from '../types';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onLayerSelect: (id: string) => void;
  onLayerAdd: () => void;
  onLayerDelete: (id: string) => void;
  onLayerVisibilityToggle: (id: string) => void;
  onLayerOpacityChange: (id: string, opacity: number) => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onLayerSelect,
  onLayerAdd,
  onLayerDelete,
  onLayerVisibilityToggle,
  onLayerOpacityChange,
}) => {
  return (
    <div className="bg-gray-800 text-white p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Calques</h2>
        <button
          onClick={onLayerAdd}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
          title="Ajouter un calque"
        >
          + Nouveau
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {[...layers].reverse().map((layer) => (
          <div
            key={layer.id}
            className={`bg-gray-700 rounded p-3 cursor-pointer transition-colors ${
              activeLayerId === layer.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => onLayerSelect(layer.id)}
          >
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLayerVisibilityToggle(layer.id);
                }}
                className="text-xl"
                title={layer.visible ? 'Masquer' : 'Afficher'}
              >
                {layer.visible ? '👁️' : '🚫'}
              </button>
              
              <span className="flex-1 text-sm font-medium">{layer.name}</span>
              
              {layers.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerDelete(layer.id);
                  }}
                  className="text-red-400 hover:text-red-300 text-xl"
                  title="Supprimer"
                >
                  🗑️
                </button>
              )}
            </div>

            {layer.thumbnail && (
              <img
                src={layer.thumbnail}
                alt={layer.name}
                className="w-full h-16 object-contain bg-gray-600 rounded"
              />
            )}

            <div className="mt-2">
              <label className="text-xs text-gray-400">
                Opacité: {Math.round(layer.opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={layer.opacity * 100}
                onChange={(e) => {
                  e.stopPropagation();
                  onLayerOpacityChange(layer.id, Number(e.target.value) / 100);
                }}
                className="w-full mt-1"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayersPanel;
