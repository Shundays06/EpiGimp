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
    fontSize: 32,
    fontFamily: 'Arial',
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

  const handleAddTextLayer = (textContent: string, x: number, y: number, fontSize: number, color: string) => {
    if (layers.length === 0) return;

    const baseLayer = layers[0];
    const canvas = document.createElement('canvas');
    canvas.width = baseLayer.canvas.width;
    canvas.height = baseLayer.canvas.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    console.log('Adding text layer:', { textContent, x, y, fontSize, color });

    // Draw the text on the new layer
    let fontStyle = '';
    if (textSettings.italic) fontStyle += 'italic ';
    if (textSettings.bold) fontStyle += 'bold ';
    
    ctx.font = `${fontStyle}${fontSize}px ${textSettings.fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    
    console.log('Font settings:', ctx.font, 'Color:', ctx.fillStyle);
    
    // Draw text with multiple lines support
    const lines = textContent.split('\n');
    lines.forEach((line, index) => {
      const yPos = y + (index * fontSize * 1.2);
      console.log(`Drawing line "${line}" at (${x}, ${yPos})`);
      ctx.fillText(line, x, yPos);
    });

    // Generate thumbnail after drawing
    const thumbnail = canvas.toDataURL('image/png', 0.1);
    console.log('Thumbnail generated, length:', thumbnail.length);

    const newLayer: Layer = {
      id: Date.now().toString(),
      name: `Texte ${layers.length + 1}`,
      visible: true,
      opacity: 1,
      canvas,
      thumbnail,
      type: 'text',
      textData: {
        content: textContent,
        x,
        y,
        fontSize: fontSize,
        fontFamily: textSettings.fontFamily,
        color: color,
        bold: textSettings.bold,
        italic: textSettings.italic,
      },
      position: { x: 0, y: 0 },
    };

    console.log('New layer created:', newLayer.name, 'Canvas size:', canvas.width, 'x', canvas.height);

    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const handleUpdateTextLayer = (layerId: string, newTextData: Partial<Layer['textData']>) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || layer.type !== 'text' || !layer.textData) return;

    // Merge old and new text data
    const updatedTextData = { ...layer.textData, ...newTextData };

    // Redraw canvas with new text
    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);

    // Draw text with new settings
    let fontStyle = '';
    if (updatedTextData.italic) fontStyle += 'italic ';
    if (updatedTextData.bold) fontStyle += 'bold ';
    
    ctx.font = `${fontStyle}${updatedTextData.fontSize}px ${updatedTextData.fontFamily}`;
    ctx.fillStyle = updatedTextData.color;
    ctx.textBaseline = 'top';
    
    const lines = updatedTextData.content.split('\n');
    lines.forEach((line, index) => {
      const yPos = updatedTextData.y + (index * updatedTextData.fontSize * 1.2);
      ctx.fillText(line, updatedTextData.x, yPos);
    });

    // Update layer
    const thumbnail = layer.canvas.toDataURL('image/png', 0.1);
    setLayers(layers.map(l => 
      l.id === layerId 
        ? { ...l, textData: updatedTextData, thumbnail }
        : l
    ));
  };

  const handleMoveLayer = (layerId: string, deltaX: number, deltaY: number) => {
    setLayers(layers.map(l => {
      if (l.id === layerId) {
        const currentPos = l.position || { x: 0, y: 0 };
        return {
          ...l,
          position: {
            x: currentPos.x + deltaX,
            y: currentPos.y + deltaY,
          }
        };
      }
      return l;
    }));
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

    const thumbnail = layer.canvas.toDataURL('image/png', 0.1);
    setLayers(
      layers.map((l) =>
        l.id === layerId ? { ...l, thumbnail } : l
      )
    );
  };

  const handleBeforeLayerModify = (layerId: string) => {
    // Save state BEFORE modification for undo/redo
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;
    
    saveState(layerId, layer.canvas);
  };

  const handleUndo = () => {
    const state = undo();
    if (!state) return;

    const layer = layers.find((l) => l.id === state.layerId);
    if (!layer) return;

    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(state.imageData, 0, 0);
    
    // Update thumbnail without saving to history
    const thumbnail = layer.canvas.toDataURL('image/png', 0.1);
    setLayers(
      layers.map((l) =>
        l.id === state.layerId ? { ...l, thumbnail } : l
      )
    );
  };

  const handleRedo = () => {
    const state = redo();
    if (!state) return;

    const layer = layers.find((l) => l.id === state.layerId);
    if (!layer) return;

    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(state.imageData, 0, 0);
    
    // Update thumbnail without saving to history
    const thumbnail = layer.canvas.toDataURL('image/png', 0.1);
    setLayers(
      layers.map((l) =>
        l.id === state.layerId ? { ...l, thumbnail } : l
      )
    );
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
                onBeforeLayerModify={handleBeforeLayerModify}
                onAddTextLayer={handleAddTextLayer}
                onUpdateTextLayer={handleUpdateTextLayer}
                onMoveLayer={handleMoveLayer}
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
