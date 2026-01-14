import React from 'react';
import type { Selection } from '../types';

interface SelectionActionsProps {
  selection: Selection | null;
  clipboard: ImageData | null;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onDeselect: () => void;
  onSelectAll: () => void;
  onInvertSelection: () => void;
}

const SelectionActions: React.FC<SelectionActionsProps> = ({
  selection,
  clipboard,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onDeselect,
  onSelectAll,
  onInvertSelection,
}) => {
  const hasSelection = selection !== null;

  return (
    <div className="bg-gray-700 rounded p-3 mt-4">
      <h4 className="text-white text-sm font-medium mb-3">Actions sur la sélection</h4>
      
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onSelectAll}
          className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1.5 rounded text-xs transition-colors"
          title="Sélectionner tout (Ctrl+A)"
        >
          ⬜ Tout sélectionner
        </button>
        
        <button
          onClick={onDeselect}
          disabled={!hasSelection}
          className={`px-2 py-1.5 rounded text-xs transition-colors ${
            hasSelection
              ? 'bg-gray-600 hover:bg-gray-500 text-white'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
          title="Désélectionner (Ctrl+D)"
        >
          ❌ Désélectionner
        </button>
        
        <button
          onClick={onCopy}
          disabled={!hasSelection}
          className={`px-2 py-1.5 rounded text-xs transition-colors ${
            hasSelection
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
          title="Copier (Ctrl+C)"
        >
          📋 Copier
        </button>
        
        <button
          onClick={onCut}
          disabled={!hasSelection}
          className={`px-2 py-1.5 rounded text-xs transition-colors ${
            hasSelection
              ? 'bg-orange-600 hover:bg-orange-500 text-white'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
          title="Couper (Ctrl+X)"
        >
          ✂️ Couper
        </button>
        
        <button
          onClick={onPaste}
          disabled={!clipboard}
          className={`px-2 py-1.5 rounded text-xs transition-colors ${
            clipboard
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
          title="Coller (Ctrl+V)"
        >
          📌 Coller
        </button>
        
        <button
          onClick={onDelete}
          disabled={!hasSelection}
          className={`px-2 py-1.5 rounded text-xs transition-colors ${
            hasSelection
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
          title="Supprimer (Suppr)"
        >
          🗑️ Effacer
        </button>
        
        <button
          onClick={onInvertSelection}
          disabled={!hasSelection}
          className={`col-span-2 px-2 py-1.5 rounded text-xs transition-colors ${
            hasSelection
              ? 'bg-purple-600 hover:bg-purple-500 text-white'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
          title="Inverser la sélection (Ctrl+Shift+I)"
        >
          🔄 Inverser la sélection
        </button>
      </div>

      {/* Selection info */}
      {hasSelection && (
        <div className="mt-3 text-xs text-gray-400 border-t border-gray-600 pt-2">
          <p>Type: {selection.type === 'rectangle' ? 'Rectangle' : selection.type === 'ellipse' ? 'Ellipse' : 'Lasso'}</p>
          {selection.type !== 'lasso' && selection.width && selection.height && (
            <p>Taille: {Math.round(selection.width)} × {Math.round(selection.height)} px</p>
          )}
          {selection.type === 'lasso' && selection.points && (
            <p>Points: {selection.points.length}</p>
          )}
        </div>
      )}

      {/* Clipboard info */}
      {clipboard && (
        <div className="mt-2 text-xs text-green-400">
          📋 Presse-papier: {clipboard.width} × {clipboard.height} px
        </div>
      )}
    </div>
  );
};

export default SelectionActions;
