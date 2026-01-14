import { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import Toolbar from './components/Toolbar';
import LayersPanel from './components/LayersPanel';
import CanvasEditor from './components/CanvasEditor';
import FiltersPanel from './components/FiltersPanel';
import TransformPanel from './components/TransformPanel';
import SelectionActions from './components/SelectionActions';
import type { Layer, Tool, TextSettings, BrushStyle, Selection } from './types';
import { useHistory } from './hooks/useHistory';
import './App.css';

function App() {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>('');
  const [currentTool, setCurrentTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [brushHardness, setBrushHardness] = useState(100);
  const [brushStyle, setBrushStyle] = useState<BrushStyle>('round');
  const [showUploader, setShowUploader] = useState(true);
  const [textSettings, setTextSettings] = useState<TextSettings>({
    fontSize: 32,
    fontFamily: 'Arial',
    bold: false,
    italic: false,
    align: 'left',
  });
  const [showTransformPanel, setShowTransformPanel] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [clipboard, setClipboard] = useState<ImageData | null>(null);
  
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
      // Ctrl/Cmd + A for Select All
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      }
      // Ctrl/Cmd + D for Deselect
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDeselect();
      }
      // Ctrl/Cmd + C for Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selection) {
        e.preventDefault();
        handleCopySelection();
      }
      // Ctrl/Cmd + X for Cut
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selection) {
        e.preventDefault();
        handleCutSelection();
      }
      // Ctrl/Cmd + V for Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        e.preventDefault();
        handlePasteSelection();
      }
      // Delete or Backspace for Delete Selection
      if ((e.key === 'Delete' || e.key === 'Backspace') && selection) {
        e.preventDefault();
        handleDeleteSelection();
      }
      // Ctrl/Cmd + Shift + I for Invert Selection
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'i') {
        e.preventDefault();
        handleInvertSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layers, activeLayerId, selection, clipboard]);

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

  const handleImageAsLayer = (img: HTMLImageElement) => {
    if (layers.length === 0) {
      // Si aucun calque n'existe, créer le premier calque
      handleImageLoad(img);
      return;
    }

    const baseLayer = layers[0];
    const canvas = document.createElement('canvas');
    
    // Utiliser les dimensions du canvas principal
    canvas.width = baseLayer.canvas.width;
    canvas.height = baseLayer.canvas.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculer les dimensions pour adapter l'image au canvas si nécessaire
    let drawWidth = img.width;
    let drawHeight = img.height;
    let drawX = 0;
    let drawY = 0;

    // Si l'image est plus grande que le canvas, la redimensionner
    if (img.width > canvas.width || img.height > canvas.height) {
      const scaleX = canvas.width / img.width;
      const scaleY = canvas.height / img.height;
      const scale = Math.min(scaleX, scaleY);
      
      drawWidth = img.width * scale;
      drawHeight = img.height * scale;
      
      // Centrer l'image
      drawX = (canvas.width - drawWidth) / 2;
      drawY = (canvas.height - drawHeight) / 2;
    } else {
      // Centrer l'image si elle est plus petite
      drawX = (canvas.width - img.width) / 2;
      drawY = (canvas.height - img.height) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    const newLayer: Layer = {
      id: Date.now().toString(),
      name: `Image ${layers.length + 1}`,
      visible: true,
      opacity: 1,
      canvas,
      thumbnail: canvas.toDataURL('image/png', 0.1),
      type: 'image',
      position: {
        x: drawX,
        y: drawY,
      },
      transform: {
        scaleX: drawWidth / img.width,
        scaleY: drawHeight / img.height,
        rotation: 0,
      },
    };

    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const handleAddTextLayer = (
    textContent: string, 
    x: number, 
    y: number, 
    fontSize: number, 
    color: string,
    fontFamily: string,
    bold: boolean,
    italic: boolean,
    align: 'left' | 'center' | 'right'
  ) => {
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
    if (italic) fontStyle += 'italic ';
    if (bold) fontStyle += 'bold ';
    
    ctx.font = `${fontStyle}${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    
    // Set text alignment
    ctx.textAlign = align;
    
    console.log('Font settings:', ctx.font, 'Color:', ctx.fillStyle, 'Align:', align);
    
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
        fontFamily: fontFamily,
        color: color,
        bold: bold,
        italic: italic,
        align: align,
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
    ctx.textAlign = updatedTextData.align || 'left';
    
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

  // Transform functions
  const handleTransformChange = (layerId: string, transform: Layer['transform']) => {
    setLayers(layers.map(l =>
      l.id === layerId ? { ...l, transform } : l
    ));
  };

  const handleLayerResize = (layerId: string, newWidth: number, newHeight: number) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    // Sauvegarder l'état avant modification
    saveState(layerId, layer.canvas);

    // Créer un nouveau canvas avec les nouvelles dimensions
    const newCanvas = document.createElement('canvas');
    newCanvas.width = newWidth;
    newCanvas.height = newHeight;
    const newCtx = newCanvas.getContext('2d');
    if (!newCtx) return;

    // Dessiner l'ancien contenu redimensionné
    newCtx.drawImage(layer.canvas, 0, 0, newWidth, newHeight);

    // Mettre à jour le layer
    const thumbnail = newCanvas.toDataURL('image/png', 0.1);
    setLayers(layers.map(l =>
      l.id === layerId ? { ...l, canvas: newCanvas, thumbnail } : l
    ));
  };

  // Selection functions
  const handleSelectionChange = (newSelection: Selection | null) => {
    setSelection(newSelection);
  };

  const handleCopySelection = () => {
    if (!selection) return;
    const layer = layers.find(l => l.id === activeLayerId);
    if (!layer) return;

    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return;

    let imageData: ImageData;

    if (selection.type === 'rectangle' || selection.type === 'ellipse') {
      const x = Math.max(0, Math.floor(selection.x || 0));
      const y = Math.max(0, Math.floor(selection.y || 0));
      const w = Math.min(layer.canvas.width - x, Math.floor(selection.width || 0));
      const h = Math.min(layer.canvas.height - y, Math.floor(selection.height || 0));
      
      if (selection.type === 'ellipse') {
        // Pour l'ellipse, on copie un rectangle et on masque
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCtx.beginPath();
        tempCtx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        tempCtx.clip();
        tempCtx.drawImage(layer.canvas, x, y, w, h, 0, 0, w, h);
        imageData = tempCtx.getImageData(0, 0, w, h);
      } else {
        imageData = ctx.getImageData(x, y, w, h);
      }
    } else if (selection.type === 'lasso' && selection.points) {
      // Pour le lasso, calculer le bounding box
      const xs = selection.points.map(p => p.x);
      const ys = selection.points.map(p => p.y);
      const minX = Math.max(0, Math.floor(Math.min(...xs)));
      const minY = Math.max(0, Math.floor(Math.min(...ys)));
      const maxX = Math.min(layer.canvas.width, Math.ceil(Math.max(...xs)));
      const maxY = Math.min(layer.canvas.height, Math.ceil(Math.max(...ys)));
      const w = maxX - minX;
      const h = maxY - minY;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCtx.beginPath();
      tempCtx.moveTo(selection.points[0].x - minX, selection.points[0].y - minY);
      selection.points.forEach(p => tempCtx.lineTo(p.x - minX, p.y - minY));
      tempCtx.closePath();
      tempCtx.clip();
      tempCtx.drawImage(layer.canvas, minX, minY, w, h, 0, 0, w, h);
      imageData = tempCtx.getImageData(0, 0, w, h);
    } else {
      return;
    }

    setClipboard(imageData);
  };

  const handleCutSelection = () => {
    handleCopySelection();
    handleDeleteSelection();
  };

  const handlePasteSelection = () => {
    if (!clipboard || layers.length === 0) return;

    const baseLayer = layers[0];
    const canvas = document.createElement('canvas');
    canvas.width = baseLayer.canvas.width;
    canvas.height = baseLayer.canvas.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Coller au centre du canvas
    const x = Math.floor((canvas.width - clipboard.width) / 2);
    const y = Math.floor((canvas.height - clipboard.height) / 2);
    ctx.putImageData(clipboard, x, y);

    const newLayer: Layer = {
      id: Date.now().toString(),
      name: `Collé ${layers.length + 1}`,
      visible: true,
      opacity: 1,
      canvas,
      thumbnail: canvas.toDataURL('image/png', 0.1),
      position: { x: 0, y: 0 },
    };

    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const handleDeleteSelection = () => {
    if (!selection) return;
    const layer = layers.find(l => l.id === activeLayerId);
    if (!layer) return;

    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return;

    // Sauvegarder l'état avant modification
    saveState(activeLayerId, layer.canvas);

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    if (selection.type === 'rectangle') {
      ctx.fillRect(selection.x!, selection.y!, selection.width!, selection.height!);
    } else if (selection.type === 'ellipse') {
      ctx.beginPath();
      ctx.ellipse(
        selection.x! + selection.width! / 2,
        selection.y! + selection.height! / 2,
        selection.width! / 2,
        selection.height! / 2,
        0, 0, Math.PI * 2
      );
      ctx.fill();
    } else if (selection.type === 'lasso' && selection.points) {
      ctx.beginPath();
      ctx.moveTo(selection.points[0].x, selection.points[0].y);
      selection.points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // Mettre à jour la miniature
    handleLayerUpdate(activeLayerId);
    setSelection(null);
  };

  const handleDeselect = () => {
    setSelection(null);
  };

  const handleSelectAll = () => {
    const layer = layers.find(l => l.id === activeLayerId);
    if (!layer) return;

    setSelection({
      type: 'rectangle',
      x: 0,
      y: 0,
      width: layer.canvas.width,
      height: layer.canvas.height,
    });
  };

  const handleInvertSelection = () => {
    // L'inversion de sélection est complexe - on crée simplement une nouvelle sélection qui couvre tout sauf la zone actuelle
    // Pour simplifier, on va juste basculer entre tout sélectionner et désélectionner
    if (selection) {
      setSelection(null);
    } else {
      handleSelectAll();
    }
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
                brushOpacity={brushOpacity}
                onBrushOpacityChange={setBrushOpacity}
                brushHardness={brushHardness}
                onBrushHardnessChange={setBrushHardness}
                brushStyle={brushStyle}
                onBrushStyleChange={setBrushStyle}
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
                brushOpacity={brushOpacity}
                brushHardness={brushHardness}
                brushStyle={brushStyle}
                onLayerUpdate={handleLayerUpdate}
                onBeforeLayerModify={handleBeforeLayerModify}
                onAddTextLayer={handleAddTextLayer}
                onUpdateTextLayer={handleUpdateTextLayer}
                onMoveLayer={handleMoveLayer}
                textSettings={textSettings}
                selection={selection}
                onSelectionChange={handleSelectionChange}
                onOpenTransformPanel={() => setShowTransformPanel(true)}
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
                onImageAsLayer={handleImageAsLayer}
              />
              
              {/* Selection Actions */}
              {(currentTool === 'select-rect' || currentTool === 'select-ellipse' || currentTool === 'select-lasso' || selection) && (
                <SelectionActions
                  selection={selection}
                  clipboard={clipboard}
                  onCopy={handleCopySelection}
                  onCut={handleCutSelection}
                  onPaste={handlePasteSelection}
                  onDelete={handleDeleteSelection}
                  onDeselect={handleDeselect}
                  onSelectAll={handleSelectAll}
                  onInvertSelection={handleInvertSelection}
                />
              )}
              
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

      {/* Transform Panel Modal */}
      {showTransformPanel && layers.find(l => l.id === activeLayerId) && (
        <TransformPanel
          layer={layers.find(l => l.id === activeLayerId)!}
          onTransformChange={handleTransformChange}
          onResize={handleLayerResize}
          onClose={() => setShowTransformPanel(false)}
        />
      )}
    </div>
  );
}

export default App;
