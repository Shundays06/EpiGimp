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
  onImageAsLayer?: (image: HTMLImageElement) => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onLayerSelect,
  onLayerAdd,
  onLayerDelete,
  onLayerVisibilityToggle,
  onLayerOpacityChange,
  onImageAsLayer,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageAsLayer) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      alert('Format de fichier non supporté. Veuillez utiliser PNG, JPEG, GIF, WebP ou BMP.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        onImageAsLayer(img);
        // Reset input to allow importing the same file again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      img.onerror = () => {
        alert('Erreur lors du chargement de l\'image. Veuillez réessayer.');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      alert('Erreur lors de la lecture du fichier. Veuillez réessayer.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-gray-800 text-white p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Calques</h2>
        <div className="flex gap-2">
          <button
            onClick={onLayerAdd}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
            title="Ajouter un calque vide"
          >
            + Nouveau
          </button>
          {onImageAsLayer && layers.length > 0 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.gif,.webp,.bmp,image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp"
                onChange={handleImageImport}
                className="hidden"
                id="layer-image-upload"
              />
              <label
                htmlFor="layer-image-upload"
                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors cursor-pointer"
                title="Importer une image comme nouveau calque"
              >
                📁 Image
              </label>
            </>
          )}
        </div>
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
