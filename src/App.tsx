import { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import Toolbar from './components/Toolbar';
import LayersPanel from './components/LayersPanel';
import CanvasEditor from './components/CanvasEditor';
import FiltersPanel from './components/FiltersPanel';
import type { Layer, Tool, TextSettings } from './types';
import { useHistory } from './hooks/useHistory';
import './App.css';

function App() {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>('');
  const [currentTool, setCurrentTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#000000');
  const [showUploader, setShowUploader] = useState(true);
  const [textSettings, setTextSettings] = useState<TextSettings>({
    text: 'Votre texte',
    fontSize: 32,
    fontFamily: 'Arial',
    color: '#000000',
    bold: false,
    italic: false,
  });
  
  const { saveState, undo, redo, canUndo, canRedo, clear: clearHistory } = useHistory();

  // Listen for color picker events
  useEffect(() => {
    const handleColorPicked = (e: Event) => {
      const customEvent = e as CustomEvent;
      setBrushColor(customEvent.detail);
    };

    window.addEventListener('colorPicked', handleColorPicked);
    return () => window.removeEventListener('colorPicked', handleColorPicked);
  }, []);

  // Handle Undo/Redo keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z for Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for Redo
      if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layers, activeLayerId]);

  const handleImageLoad = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);

    const newLayer: Layer = {
      id: Date.now().toString(),
      name: 'Calque 1',
      visible: true,
      opacity: 1,
      canvas,
      thumbnail: canvas.toDataURL('image/png', 0.1),
    };

    setLayers([newLayer]);
    setActiveLayerId(newLayer.id);
    setShowUploader(false);
  };

  const handleLayerAdd = () => {
    if (layers.length === 0) return;

    const baseLayer = layers[0];
    const canvas = document.createElement('canvas');
    canvas.width = baseLayer.canvas.width;
    canvas.height = baseLayer.canvas.height;

    const newLayer: Layer = {
      id: Date.now().toString(),
      name: `Calque ${layers.length + 1}`,
      visible: true,
      opacity: 1,
      canvas,
    };

    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const handleLayerDelete = (id: string) => {
    if (layers.length <= 1) return;

    const newLayers = layers.filter((l) => l.id !== id);
    setLayers(newLayers);

    if (activeLayerId === id) {
      setActiveLayerId(newLayers[newLayers.length - 1].id);
    }
  };

  const handleLayerVisibilityToggle = (id: string) => {
    setLayers(
      layers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      )
    );
  };

  const handleLayerOpacityChange = (id: string, opacity: number) => {
    setLayers(
      layers.map((l) =>
        l.id === id ? { ...l, opacity } : l
      )
    );
  };

  const handleLayerUpdate = (layerId: string) => {
    // Update thumbnail
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    // Save to history before updating
    saveState(layerId, layer.canvas);

    const thumbnail = layer.canvas.toDataURL('image/png', 0.1);
    setLayers(
      layers.map((l) =>
        l.id === layerId ? { ...l, thumbnail } : l
      )
    );
  };

  const handleUndo = () => {
    const state = undo();
    if (!state) return;

    const layer = layers.find((l) => l.id === state.layerId);
    if (!layer) return;

    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(state.imageData, 0, 0);
    handleLayerUpdate(state.layerId);
  };

  const handleRedo = () => {
    const state = redo();
    if (!state) return;

    const layer = layers.find((l) => l.id === state.layerId);
    if (!layer) return;

    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(state.imageData, 0, 0);
    handleLayerUpdate(state.layerId);
  };

  const handleReset = () => {
    setLayers([]);
    setActiveLayerId('');
    setShowUploader(true);
    clearHistory();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🎨 EpiGimp</h1>
          {layers.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className={`px-4 py-2 rounded transition-colors text-sm ${
                  canUndo
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                }`}
                title="Annuler (Ctrl+Z)"
              >
                ↶ Annuler
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className={`px-4 py-2 rounded transition-colors text-sm ${
                  canRedo
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                }`}
                title="Rétablir (Ctrl+Shift+Z)"
              >
                ↷ Rétablir
              </button>
              <button
                onClick={handleReset}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors text-sm"
              >
                Nouveau projet
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {showUploader && layers.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <ImageUploader onImageLoad={handleImageLoad} />
          </div>
        ) : (
          <>
            {/* Left Sidebar - Tools */}
            <aside className="w-64 overflow-y-auto">
              <Toolbar
                selectedTool={currentTool}
                onToolChange={setCurrentTool}
                brushSize={brushSize}
                onBrushSizeChange={setBrushSize}
                brushColor={brushColor}
                onBrushColorChange={setBrushColor}
                textSettings={textSettings}
                onTextSettingsChange={setTextSettings}
              />
            </aside>

            {/* Canvas Area */}
            <main className="flex-1 overflow-hidden">
              <CanvasEditor
                layers={layers}
                activeLayerId={activeLayerId}
                currentTool={currentTool}
                brushSize={brushSize}
                brushColor={brushColor}
                onLayerUpdate={handleLayerUpdate}
                textSettings={textSettings}
              />
            </main>

            {/* Right Sidebar - Layers & Filters */}
            <aside className="w-80 overflow-y-auto flex flex-col">
              <LayersPanel
                layers={layers}
                activeLayerId={activeLayerId}
                onLayerSelect={setActiveLayerId}
                onLayerAdd={handleLayerAdd}
                onLayerDelete={handleLayerDelete}
                onLayerVisibilityToggle={handleLayerVisibilityToggle}
                onLayerOpacityChange={handleLayerOpacityChange}
              />
              <div className="border-t-4 border-gray-900" />
              <FiltersPanel
                layers={layers}
                activeLayerId={activeLayerId}
                onLayerUpdate={handleLayerUpdate}
              />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
