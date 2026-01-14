import React, { useState, useEffect } from 'react';
import type { Layer } from '../types';

interface TransformPanelProps {
  layer: Layer;
  onTransformChange: (layerId: string, transform: Layer['transform']) => void;
  onResize: (layerId: string, width: number, height: number) => void;
  onClose: () => void;
}

const TransformPanel: React.FC<TransformPanelProps> = ({
  layer,
  onTransformChange,
  onResize,
  onClose,
}) => {
  const [rotation, setRotation] = useState(layer.transform?.rotation || 0);
  const [scaleX, setScaleX] = useState(layer.transform?.scaleX || 1);
  const [scaleY, setScaleY] = useState(layer.transform?.scaleY || 1);
  const [skewX, setSkewX] = useState(layer.transform?.skewX || 0);
  const [skewY, setSkewY] = useState(layer.transform?.skewY || 0);
  const [width, setWidth] = useState(layer.canvas.width);
  const [height, setHeight] = useState(layer.canvas.height);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [originalAspectRatio] = useState(layer.canvas.width / layer.canvas.height);

  useEffect(() => {
    setRotation(layer.transform?.rotation || 0);
    setScaleX(layer.transform?.scaleX || 1);
    setScaleY(layer.transform?.scaleY || 1);
    setSkewX(layer.transform?.skewX || 0);
    setSkewY(layer.transform?.skewY || 0);
    setWidth(layer.canvas.width);
    setHeight(layer.canvas.height);
  }, [layer]);

  const handleTransformApply = () => {
    onTransformChange(layer.id, {
      rotation,
      scaleX,
      scaleY,
      skewX,
      skewY,
    });
  };

  const handleResizeApply = () => {
    onResize(layer.id, width, height);
  };

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (keepAspectRatio) {
      setHeight(Math.round(newWidth / originalAspectRatio));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (keepAspectRatio) {
      setWidth(Math.round(newHeight * originalAspectRatio));
    }
  };

  const handleReset = () => {
    setRotation(0);
    setScaleX(1);
    setScaleY(1);
    setSkewX(0);
    setSkewY(0);
    onTransformChange(layer.id, {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
    });
  };

  const presetRotations = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white text-lg font-bold">🔄 Transformation - {layer.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Rotation */}
        <div className="mb-6">
          <label className="text-white text-sm font-medium mb-2 block">
            Rotation: {rotation}°
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-full mb-2"
          />
          <div className="flex flex-wrap gap-2">
            {presetRotations.map((angle) => (
              <button
                key={angle}
                onClick={() => setRotation(angle)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  rotation === angle
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {angle}°
              </button>
            ))}
          </div>
        </div>

        {/* Scale */}
        <div className="mb-6">
          <label className="text-white text-sm font-medium mb-2 block">
            Échelle X: {Math.round(scaleX * 100)}%
          </label>
          <input
            type="range"
            min="10"
            max="300"
            value={scaleX * 100}
            onChange={(e) => setScaleX(Number(e.target.value) / 100)}
            className="w-full mb-4"
          />
          
          <label className="text-white text-sm font-medium mb-2 block">
            Échelle Y: {Math.round(scaleY * 100)}%
          </label>
          <input
            type="range"
            min="10"
            max="300"
            value={scaleY * 100}
            onChange={(e) => setScaleY(Number(e.target.value) / 100)}
            className="w-full"
          />
        </div>

        {/* Skew (Déformation) */}
        <div className="mb-6">
          <label className="text-white text-sm font-medium mb-2 block">
            Déformation X: {skewX}°
          </label>
          <input
            type="range"
            min="-45"
            max="45"
            value={skewX}
            onChange={(e) => setSkewX(Number(e.target.value))}
            className="w-full mb-4"
          />
          
          <label className="text-white text-sm font-medium mb-2 block">
            Déformation Y: {skewY}°
          </label>
          <input
            type="range"
            min="-45"
            max="45"
            value={skewY}
            onChange={(e) => setSkewY(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Apply Transform Button */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={handleTransformApply}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Appliquer la transformation
          </button>
          <button
            onClick={handleReset}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            Réinitialiser
          </button>
        </div>

        <hr className="border-gray-700 my-6" />

        {/* Resize */}
        <div className="mb-6">
          <h4 className="text-white text-md font-medium mb-4">📐 Redimensionner le calque</h4>
          
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="keepAspectRatio"
              checked={keepAspectRatio}
              onChange={(e) => setKeepAspectRatio(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="keepAspectRatio" className="text-white text-sm">
              Conserver les proportions
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-white text-sm mb-1 block">Largeur (px)</label>
              <input
                type="number"
                min="1"
                max="10000"
                value={width}
                onChange={(e) => handleWidthChange(Number(e.target.value))}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="text-white text-sm mb-1 block">Hauteur (px)</label>
              <input
                type="number"
                min="1"
                max="10000"
                value={height}
                onChange={(e) => handleHeightChange(Number(e.target.value))}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setWidth(layer.canvas.width / 2); setHeight(layer.canvas.height / 2); }}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              50%
            </button>
            <button
              onClick={() => { setWidth(layer.canvas.width); setHeight(layer.canvas.height); }}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              100%
            </button>
            <button
              onClick={() => { setWidth(layer.canvas.width * 2); setHeight(layer.canvas.height * 2); }}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              200%
            </button>
          </div>
        </div>

        <button
          onClick={handleResizeApply}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
        >
          Redimensionner le calque
        </button>
      </div>
    </div>
  );
};

export default TransformPanel;
