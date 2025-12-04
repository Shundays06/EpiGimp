import React, { useRef, useEffect, useState } from 'react';
import type { Layer, Tool, Point, TextSettings } from '../types';

interface CanvasEditorProps {
  layers: Layer[];
  activeLayerId: string;
  currentTool: Tool;
  brushSize: number;
  brushColor: string;
  onLayerUpdate: (layerId: string) => void;
  onBeforeLayerModify: (layerId: string) => void;
  onAddTextLayer: (textContent: string, x: number, y: number, fontSize: number, color: string) => void;
  onUpdateTextLayer: (layerId: string, newTextData: Partial<Layer['textData']>) => void;
  onMoveLayer: (layerId: string, deltaX: number, deltaY: number) => void;
  textSettings?: TextSettings;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({
  layers,
  activeLayerId,
  currentTool,
  brushSize,
  brushColor,
  onLayerUpdate,
  onBeforeLayerModify,
  onAddTextLayer,
  onUpdateTextLayer,
  onMoveLayer,
  textSettings,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [pendingTextPosition, setPendingTextPosition] = useState<Point | null>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [textColor, setTextColor] = useState('#000000');
  const [textSize, setTextSize] = useState(32);

  const activeLayer = layers.find((l) => l.id === activeLayerId);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + or = to zoom in
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setZoom((z) => Math.min(5, z + 0.1));
      }
      // Ctrl/Cmd - to zoom out
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setZoom((z) => Math.max(0.1, z - 0.1));
      }
      // Ctrl/Cmd 0 to reset zoom
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Render all layers
    const container = containerRef.current;
    if (!container) return;

    console.log('Rendering layers:', layers.length, 'layers');

    // Clear container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Add all visible layers
    layers.forEach((layer, index) => {
      console.log(`Layer ${index} (${layer.name}):`, {
        visible: layer.visible,
        width: layer.canvas.width,
        height: layer.canvas.height,
        opacity: layer.opacity,
        position: layer.position
      });
      
      if (layer.visible) {
        // Create a new canvas and copy the content
        const displayCanvas = document.createElement('canvas');
        displayCanvas.width = layer.canvas.width;
        displayCanvas.height = layer.canvas.height;
        
        const displayCtx = displayCanvas.getContext('2d');
        if (displayCtx) {
          displayCtx.drawImage(layer.canvas, 0, 0);
        }
        
        const layerPos = layer.position || { x: 0, y: 0 };
        const layerTransform = layer.transform || { scaleX: 1, scaleY: 1, rotation: 0 };
        const cursorStyle = isPanning ? 'grabbing' : currentTool === 'brush' ? 'crosshair' : currentTool === 'eraser' ? 'cell' : currentTool === 'eyedropper' ? 'pointer' : currentTool === 'text' ? 'text' : currentTool === 'move' ? 'move' : 'default';
        
        displayCanvas.style.position = 'absolute';
        displayCanvas.style.top = '0';
        displayCanvas.style.left = '0';
        displayCanvas.style.transform = `translate(${layerPos.x}px, ${layerPos.y}px) scale(${layerTransform.scaleX}, ${layerTransform.scaleY})`;
        displayCanvas.style.transformOrigin = '0 0';
        displayCanvas.style.opacity = layer.opacity.toString();
        displayCanvas.style.pointerEvents = layer.id === activeLayerId ? 'auto' : 'none';
        displayCanvas.style.cursor = cursorStyle;
        
        container.appendChild(displayCanvas);
      }
    });
  }, [layers, activeLayerId, forceUpdate, currentTool, isPanning]);

  const getMousePos = (e: React.MouseEvent<HTMLDivElement>): Point => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    // Adjust for zoom and pan
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Zoom with mouse wheel
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(0.1, zoom * delta), 5);
    
    // Zoom towards mouse position
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      setPan({
        x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
        y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
      });
    }
    
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeLayer) return;
    
    // Pan with middle mouse button or space + left click
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    
    const point = getMousePos(e);

    // Double-click on text layer to edit it (works with any tool)
    if (e.detail === 2 && activeLayer.type === 'text' && activeLayer.textData) {
      setEditingLayerId(activeLayer.id);
      setPendingTextPosition({ x: activeLayer.textData.x, y: activeLayer.textData.y });
      setTextInputValue(activeLayer.textData.content);
      setTextSize(activeLayer.textData.fontSize);
      setTextColor(activeLayer.textData.color);
      setShowTextInput(true);
      return;
    }

    if (currentTool === 'eyedropper') {
      pickColor(point);
      return;
    }

    if (currentTool === 'text') {
      // Single click with text tool: create new text
      setEditingLayerId(null);
      setPendingTextPosition(point);
      setTextInputValue('');
      setTextSize(textSettings?.fontSize || 32);
      setTextColor(brushColor);
      setShowTextInput(true);
      return;
    }

    if (currentTool === 'move') {
      // Start moving the active layer
      setIsDrawing(true);
      setLastPoint(point);
      return;
    }
    
    // Save state BEFORE making any modifications
    onBeforeLayerModify(activeLayer.id);
    
    setIsDrawing(true);
    setLastPoint(point);

    if (currentTool === 'brush' || currentTool === 'eraser') {
      drawPoint(point);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Handle panning
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }
    
    if (!isDrawing || !activeLayer || !lastPoint) return;

    const point = getMousePos(e);

    if (currentTool === 'move') {
      // Move the active layer
      const deltaX = point.x - lastPoint.x;
      const deltaY = point.y - lastPoint.y;
      onMoveLayer(activeLayer.id, deltaX, deltaY);
      setLastPoint(point);
      return;
    }

    if (currentTool === 'brush' || currentTool === 'eraser') {
      drawLine(lastPoint, point);
      // Force re-render to show drawing in real-time
      setForceUpdate(prev => prev + 1);
    }

    setLastPoint(point);
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    
    if (isDrawing && activeLayer) {
      onLayerUpdate(activeLayer.id);
    }
    setIsDrawing(false);
    setLastPoint(null);
  };

  const drawPoint = (point: Point) => {
    if (!activeLayer) return;

    const ctx = activeLayer.canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.fillStyle = brushColor;
    ctx.beginPath();
    ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Force update display
    setForceUpdate(prev => prev + 1);
  };

  const drawLine = (from: Point, to: Point) => {
    if (!activeLayer) return;

    const ctx = activeLayer.canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    
    // Force update display
    setForceUpdate(prev => prev + 1);
  };

  const pickColor = (point: Point) => {
    if (!activeLayer) return;

    // Create a temporary canvas to merge all visible layers
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = activeLayer.canvas.width;
    tempCanvas.height = activeLayer.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw all visible layers
    layers.forEach((layer) => {
      if (layer.visible) {
        tempCtx.globalAlpha = layer.opacity;
        tempCtx.drawImage(layer.canvas, 0, 0);
      }
    });

    // Get pixel color at the clicked position
    const x = Math.floor(Math.max(0, Math.min(point.x, activeLayer.canvas.width - 1)));
    const y = Math.floor(Math.max(0, Math.min(point.y, activeLayer.canvas.height - 1)));
    const pixel = tempCtx.getImageData(x, y, 1, 1).data;
    
    // Convert to hex
    const hex = `#${[pixel[0], pixel[1], pixel[2]]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')}`;
    
    console.log('Couleur capturée:', hex); // Pour debug
    
    // Dispatch custom event to update color
    window.dispatchEvent(new CustomEvent('colorPicked', { detail: hex }));
  };

  const handleTextSubmit = () => {
    if (pendingTextPosition && textInputValue.trim()) {
      console.log('Submitting text:', textInputValue, 'at position:', pendingTextPosition, 'size:', textSize, 'color:', textColor);
      
      // Check if we're editing an existing text layer
      if (editingLayerId) {
        // Update existing text layer
        onUpdateTextLayer(editingLayerId, {
          content: textInputValue,
          x: pendingTextPosition.x,
          y: pendingTextPosition.y,
          fontSize: textSize,
          color: textColor,
        });
      } else {
        // Create a new text layer with custom size and color from the modal
        onAddTextLayer(textInputValue, pendingTextPosition.x, pendingTextPosition.y, textSize, textColor);
      }
    }
    setShowTextInput(false);
    setTextInputValue('');
    setPendingTextPosition(null);
    setEditingLayerId(null);
  };

  const handleTextCancel = () => {
    setShowTextInput(false);
    setTextInputValue('');
    setPendingTextPosition(null);
    setEditingLayerId(null);
  };

  if (layers.length === 0 || !activeLayer) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <p className="text-gray-500 text-lg">Importez une image pour commencer</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
      {/* Zoom Controls */}
      <div className="bg-gray-800 px-4 py-2 flex items-center gap-4 border-b border-gray-700">
        <span className="text-white text-sm font-medium">Zoom:</span>
        <button
          onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
        >
          −
        </button>
        <span className="text-white text-sm font-mono min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(Math.min(5, zoom + 0.1))}
          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
        >
          +
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
        >
          Réinitialiser
        </button>
        <span className="text-gray-400 text-xs ml-auto">
          💡 Molette: Zoom | Shift+Clic: Déplacer
        </span>
      </div>

      {/* Canvas Area */}
      <div 
        className="flex-1 flex items-center justify-center overflow-hidden"
        onWheel={handleWheel}
      >
        <div
          ref={containerRef}
          className="relative bg-white shadow-2xl"
          style={{
            width: activeLayer.canvas.width,
            height: activeLayer.canvas.height,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Text Input Modal */}
      {showTextInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-white text-lg font-bold mb-4">
              {editingLayerId ? 'Modifier le texte' : 'Ajouter du texte'}
            </h3>
            
            {/* Text Size Control */}
            <div className="mb-4">
              <label className="text-white text-sm mb-2 block">
                Taille: {textSize}px
              </label>
              <input
                type="range"
                min="12"
                max="200"
                value={textSize}
                onChange={(e) => setTextSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Text Color Control */}
            <div className="mb-4">
              <label className="text-white text-sm mb-2 block">Couleur</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Text Content */}
            <textarea
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              placeholder="Entrez votre texte ici..."
              className="w-full bg-gray-700 text-white px-3 py-2 rounded mb-4 min-h-[100px] resize-vertical"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleTextSubmit();
                } else if (e.key === 'Escape') {
                  handleTextCancel();
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleTextCancel}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
              >
                Annuler (Esc)
              </button>
              <button
                onClick={handleTextSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                Ajouter (Ctrl+Enter)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasEditor;
