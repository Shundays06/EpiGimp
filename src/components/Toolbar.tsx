import React from 'react';
import type { Tool } from '../types';

interface ToolbarProps {
  selectedTool: Tool;
  onToolChange: (tool: Tool) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  brushColor: string;
  onBrushColorChange: (color: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  brushColor,
  onBrushColorChange,
}) => {
  const tools: { id: Tool; label: string; icon: string }[] = [
    { id: 'brush', label: 'Pinceau', icon: '🖌️' },
    { id: 'eraser', label: 'Gomme', icon: '🧹' },
    { id: 'eyedropper', label: 'Pipette', icon: '💧' },
    { id: 'select', label: 'Sélection', icon: '⬚' },
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
    </div>
  );
};

export default Toolbar;
