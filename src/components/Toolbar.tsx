import React from 'react';
import type { Tool, TextSettings } from '../types';

interface ToolbarProps {
  selectedTool: Tool;
  onToolChange: (tool: Tool) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  brushColor: string;
  onBrushColorChange: (color: string) => void;
  textSettings?: TextSettings;
  onTextSettingsChange?: (settings: TextSettings) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  brushColor,
  onBrushColorChange,
  textSettings,
  onTextSettingsChange,
}) => {
  const tools: { id: Tool; label: string; icon: string }[] = [
    { id: 'brush', label: 'Pinceau', icon: '🖌️' },
    { id: 'eraser', label: 'Gomme', icon: '🧹' },
    { id: 'eyedropper', label: 'Pipette', icon: '💧' },
    { id: 'move', label: 'Déplacer', icon: '✋' },
    { id: 'text', label: 'Texte', icon: '🔤' },
  ];

  const fontFamilies = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Verdana',
    'Comic Sans MS',
    'Impact',
  ];

  return (
    <div className="bg-gray-800 text-white p-4 flex flex-col gap-4">
      <h2 className="text-lg font-bold">Outils</h2>
      
      {/* Tools */}
      <div className="flex flex-col gap-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={`flex items-center gap-3 px-4 py-2 rounded transition-colors ${
              selectedTool === tool.id
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={tool.label}
          >
            <span className="text-2xl">{tool.icon}</span>
            <span className="text-sm">{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Brush Settings */}
      {(selectedTool === 'brush' || selectedTool === 'eraser') && (
        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-700">
          <div>
            <label className="text-sm mb-2 block">Taille: {brushSize}px</label>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => onBrushSizeChange(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {selectedTool === 'brush' && (
            <div>
              <label className="text-sm mb-2 block">Couleur</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => onBrushColorChange(e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={brushColor}
                  onChange={(e) => onBrushColorChange(e.target.value)}
                  className="flex-1 bg-gray-700 px-2 py-1 rounded text-sm"
                  placeholder="#000000"
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Eyedropper Info */}
      {selectedTool === 'eyedropper' && (
        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-700">
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-xs text-gray-400 mb-2">Couleur actuelle:</p>
            <div className="flex gap-2 items-center">
              <div 
                className="w-12 h-12 rounded border-2 border-gray-600"
                style={{ backgroundColor: brushColor }}
              />
              <span className="text-sm font-mono">{brushColor}</span>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              💡 Cliquez sur une couleur du canvas pour la capturer
            </p>
          </div>
        </div>
      )}
      
      {/* Move Tool Info */}
      {selectedTool === 'move' && (
        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-700">
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-xs text-gray-400 mb-2">Outil de déplacement</p>
            <p className="text-xs text-gray-400">
              💡 Cliquez et glissez pour déplacer le calque actif
            </p>
            <p className="text-xs text-gray-400 mt-2">
              🔤 Double-cliquez sur un calque de texte pour l'éditer
            </p>
          </div>
        </div>
      )}

      {/* Text Tool Settings */}
      {selectedTool === 'text' && textSettings && onTextSettingsChange && (
        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-700">
          <div>
            <label className="text-sm mb-2 block">Taille: {textSettings.fontSize}px</label>
            <input
              type="range"
              min="12"
              max="200"
              value={textSettings.fontSize}
              onChange={(e) => onTextSettingsChange({ ...textSettings, fontSize: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm mb-2 block">Police</label>
            <select
              value={textSettings.fontFamily}
              onChange={(e) => onTextSettingsChange({ ...textSettings, fontFamily: e.target.value })}
              className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
            >
              {fontFamilies.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm mb-2 block">Couleur</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={brushColor}
                onChange={(e) => onBrushColorChange(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer"
              />
              <input
                type="text"
                value={brushColor}
                onChange={(e) => onBrushColorChange(e.target.value)}
                className="flex-1 bg-gray-700 px-2 py-1 rounded text-sm"
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onTextSettingsChange({ ...textSettings, bold: !textSettings.bold })}
              className={`flex-1 px-3 py-2 rounded transition-colors font-bold ${
                textSettings.bold
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              B
            </button>
            <button
              onClick={() => onTextSettingsChange({ ...textSettings, italic: !textSettings.italic })}
              className={`flex-1 px-3 py-2 rounded transition-colors italic ${
                textSettings.italic
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              I
            </button>
          </div>

          <p className="text-xs text-gray-400">
            💡 Cliquez sur le canvas pour ajouter un nouveau calque de texte
          </p>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
