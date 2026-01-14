import React, { useRef, useEffect, useState } from 'react';
import type { Layer, Tool, Point, TextSettings, BrushStyle, Selection } from '../types';

interface CanvasEditorProps {
  layers: Layer[];
  activeLayerId: string;
  currentTool: Tool;
  brushSize: number;
  brushColor: string;
  brushOpacity: number;
  brushHardness: number;
  brushStyle: BrushStyle;
  onLayerUpdate: (layerId: string) => void;
  onBeforeLayerModify: (layerId: string) => void;
  onAddTextLayer: (textContent: string, x: number, y: number, fontSize: number, color: string, fontFamily: string, bold: boolean, italic: boolean, align: 'left' | 'center' | 'right') => void;
  onUpdateTextLayer: (layerId: string, newTextData: Partial<Layer['textData']>) => void;
  onMoveLayer: (layerId: string, deltaX: number, deltaY: number) => void;
  textSettings?: TextSettings;
  // Selection props
  selection?: Selection | null;
  onSelectionChange?: (selection: Selection | null) => void;
  // Transform props
  onOpenTransformPanel?: () => void;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({
  layers,
  activeLayerId,
  currentTool,
  brushSize,
  brushColor,
  brushOpacity,
  brushHardness,
  brushStyle,
  onLayerUpdate,
  onBeforeLayerModify,
  onAddTextLayer,
  onUpdateTextLayer,
  onMoveLayer,
  textSettings,
  selection,
  onSelectionChange,
  onOpenTransformPanel,
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
  
  // Selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<Point | null>(null);
  const [lassoPoints, setLassoPoints] = useState<Point[]>([]);
  const [textFont, setTextFont] = useState('Arial');
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

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
        const skewX = layerTransform.skewX || 0;
        const skewY = layerTransform.skewY || 0;
        const cursorStyle = isPanning ? 'grabbing' : currentTool === 'brush' ? 'crosshair' : currentTool === 'eraser' ? 'cell' : currentTool === 'eyedropper' ? 'pointer' : currentTool === 'text' ? 'text' : currentTool === 'move' ? 'move' : (currentTool === 'select-rect' || currentTool === 'select-ellipse' || currentTool === 'select-lasso') ? 'crosshair' : currentTool === 'transform' ? 'pointer' : 'default';
        
        displayCanvas.style.position = 'absolute';
        displayCanvas.style.top = '0';
        displayCanvas.style.left = '0';
        displayCanvas.style.transform = `translate(${layerPos.x}px, ${layerPos.y}px) scale(${layerTransform.scaleX}, ${layerTransform.scaleY}) skew(${skewX}deg, ${skewY}deg) rotate(${layerTransform.rotation}deg)`;
        displayCanvas.style.transformOrigin = 'center center';
        displayCanvas.style.opacity = layer.opacity.toString();
        displayCanvas.style.pointerEvents = layer.id === activeLayerId ? 'auto' : 'none';
        displayCanvas.style.cursor = cursorStyle;
        
        container.appendChild(displayCanvas);
      }
    });

    // Draw selection overlay
    if (activeLayer && (selection || (isSelecting && selectionStart && selectionCurrent))) {
      const selectionCanvas = document.createElement('canvas');
      selectionCanvas.width = activeLayer.canvas.width;
      selectionCanvas.height = activeLayer.canvas.height;
      selectionCanvas.style.position = 'absolute';
      selectionCanvas.style.top = '0';
      selectionCanvas.style.left = '0';
      selectionCanvas.style.pointerEvents = 'none';
      selectionCanvas.style.zIndex = '1000';

      const ctx = selectionCanvas.getContext('2d');
      if (ctx) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#00BFFF';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(0, 191, 255, 0.1)';

        // Draw current selection being made
        if (isSelecting && selectionStart && selectionCurrent) {
          const x = Math.min(selectionStart.x, selectionCurrent.x);
          const y = Math.min(selectionStart.y, selectionCurrent.y);
          const width = Math.abs(selectionCurrent.x - selectionStart.x);
          const height = Math.abs(selectionCurrent.y - selectionStart.y);

          if (currentTool === 'select-rect') {
            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);
          } else if (currentTool === 'select-ellipse') {
            ctx.beginPath();
            ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (currentTool === 'select-lasso' && lassoPoints.length > 0) {
            ctx.beginPath();
            ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
            lassoPoints.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
          }
        }

        // Draw existing selection
        if (selection && !isSelecting) {
          ctx.strokeStyle = '#FF6B6B';
          if (selection.type === 'rectangle' && selection.x !== undefined) {
            ctx.fillRect(selection.x, selection.y!, selection.width!, selection.height!);
            ctx.strokeRect(selection.x, selection.y!, selection.width!, selection.height!);
          } else if (selection.type === 'ellipse' && selection.x !== undefined) {
            ctx.beginPath();
            ctx.ellipse(
              selection.x + selection.width! / 2,
              selection.y! + selection.height! / 2,
              selection.width! / 2,
              selection.height! / 2,
              0, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.stroke();
          } else if (selection.type === 'lasso' && selection.points) {
            ctx.beginPath();
            ctx.moveTo(selection.points[0].x, selection.points[0].y);
            selection.points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }
      }

      container.appendChild(selectionCanvas);
    }
  }, [layers, activeLayerId, forceUpdate, currentTool, isPanning, selection, isSelecting, selectionStart, selectionCurrent, lassoPoints]);

  const getMousePos = (e: React.MouseEvent<HTMLDivElement>): Point => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    // Get mouse position in the container, adjusted for zoom and pan
    const containerX = (e.clientX - rect.left - pan.x) / zoom;
    const containerY = (e.clientY - rect.top - pan.y) / zoom;
    
    // Adjust for active layer position and transform
    if (activeLayer) {
      const layerPos = activeLayer.position || { x: 0, y: 0 };
      const layerTransform = activeLayer.transform || { scaleX: 1, scaleY: 1, rotation: 0 };
      
      return {
        x: (containerX - layerPos.x) / layerTransform.scaleX,
        y: (containerY - layerPos.y) / layerTransform.scaleY,
      };
    }
    
    return {
      x: containerX,
      y: containerY,
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
      setTextFont(activeLayer.textData.fontFamily);
      setTextBold(activeLayer.textData.bold);
      setTextItalic(activeLayer.textData.italic);
      setTextAlign(activeLayer.textData.align || 'left');
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
      setTextFont(textSettings?.fontFamily || 'Arial');
      setTextBold(textSettings?.bold || false);
      setTextItalic(textSettings?.italic || false);
      setTextAlign(textSettings?.align || 'left');
      setShowTextInput(true);
      return;
    }

    if (currentTool === 'move') {
      // Start moving the active layer
      setIsDrawing(true);
      setLastPoint(point);
      return;
    }

    // Handle transform tool
    if (currentTool === 'transform') {
      if (onOpenTransformPanel) {
        onOpenTransformPanel();
      }
      return;
    }

    // Handle selection tools
    if (currentTool === 'select-rect' || currentTool === 'select-ellipse' || currentTool === 'select-lasso') {
      setIsSelecting(true);
      setSelectionStart(point);
      setSelectionCurrent(point);
      if (currentTool === 'select-lasso') {
        setLassoPoints([point]);
      }
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

    const point = getMousePos(e);

    // Handle selection in progress
    if (isSelecting && selectionStart) {
      setSelectionCurrent(point);
      if (currentTool === 'select-lasso') {
        setLassoPoints(prev => [...prev, point]);
      }
      return;
    }
    
    if (!isDrawing || !activeLayer || !lastPoint) return;

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

    // Finalize selection
    if (isSelecting && selectionStart && selectionCurrent && onSelectionChange) {
      if (currentTool === 'select-lasso' && lassoPoints.length > 2) {
        onSelectionChange({
          type: 'lasso',
          points: lassoPoints,
        });
      } else if (currentTool === 'select-rect' || currentTool === 'select-ellipse') {
        const x = Math.min(selectionStart.x, selectionCurrent.x);
        const y = Math.min(selectionStart.y, selectionCurrent.y);
        const width = Math.abs(selectionCurrent.x - selectionStart.x);
        const height = Math.abs(selectionCurrent.y - selectionStart.y);

        if (width > 5 && height > 5) {
          onSelectionChange({
            type: currentTool === 'select-rect' ? 'rectangle' : 'ellipse',
            x,
            y,
            width,
            height,
          });
        }
      }
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionCurrent(null);
      setLassoPoints([]);
      return;
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
    ctx.globalAlpha = brushOpacity;

    switch (brushStyle) {
      case 'round':
        drawRoundBrush(ctx, point);
        break;
      case 'square':
        drawSquareBrush(ctx, point);
        break;
      case 'soft':
        drawSoftBrush(ctx, point);
        break;
      case 'spray':
        drawSprayBrush(ctx, point);
        break;
      case 'calligraphy':
        drawCalligraphyBrush(ctx, point);
        break;
      case 'pixel':
        drawPixelBrush(ctx, point);
        break;
      default:
        drawRoundBrush(ctx, point);
    }

    ctx.globalAlpha = 1; // Reset
    
    // Force update display
    setForceUpdate(prev => prev + 1);
  };

  const drawRoundBrush = (ctx: CanvasRenderingContext2D, point: Point) => {
    ctx.fillStyle = brushColor;
    ctx.beginPath();
    ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawSquareBrush = (ctx: CanvasRenderingContext2D, point: Point) => {
    ctx.fillStyle = brushColor;
    ctx.fillRect(
      point.x - brushSize / 2,
      point.y - brushSize / 2,
      brushSize,
      brushSize
    );
  };

  const drawSoftBrush = (ctx: CanvasRenderingContext2D, point: Point) => {
    const gradient = ctx.createRadialGradient(
      point.x, point.y, 0,
      point.x, point.y, brushSize / 2
    );
    
    const hardnessRatio = brushHardness / 100;
    const colorWithAlpha = brushColor + Math.floor(255 * hardnessRatio).toString(16).padStart(2, '0');
    
    gradient.addColorStop(0, colorWithAlpha);
    gradient.addColorStop(hardnessRatio, brushColor + '80');
    gradient.addColorStop(1, brushColor + '00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawSprayBrush = (ctx: CanvasRenderingContext2D, point: Point) => {
    const density = 50; // Number of spray particles
    const radius = brushSize / 2;
    
    ctx.fillStyle = brushColor;
    
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      const x = point.x + Math.cos(angle) * distance;
      const y = point.y + Math.sin(angle) * distance;
      
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawCalligraphyBrush = (ctx: CanvasRenderingContext2D, point: Point) => {
    ctx.fillStyle = brushColor;
    
    // Forme elliptique inclinée à 45 degrés
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.ellipse(0, 0, brushSize / 2, brushSize / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawPixelBrush = (ctx: CanvasRenderingContext2D, point: Point) => {
    const pixelSize = Math.max(2, Math.floor(brushSize / 4));
    const gridX = Math.floor(point.x / pixelSize) * pixelSize;
    const gridY = Math.floor(point.y / pixelSize) * pixelSize;
    
    ctx.fillStyle = brushColor;
    
    const gridSize = Math.ceil(brushSize / pixelSize);
    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        const px = gridX + i * pixelSize;
        const py = gridY + j * pixelSize;
        const distance = Math.sqrt((px - point.x) ** 2 + (py - point.y) ** 2);
        
        if (distance <= brushSize / 2) {
          ctx.fillRect(px, py, pixelSize, pixelSize);
        }
      }
    }
  };

  const drawLine = (from: Point, to: Point) => {
    if (!activeLayer) return;

    const ctx = activeLayer.canvas.getContext('2d');
    if (!ctx) return;

    // Pour les pinceaux avec des patterns spéciaux, dessiner point par point
    if (['spray', 'pixel'].includes(brushStyle)) {
      const distance = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
      const steps = Math.max(1, Math.floor(distance / 2));
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const point = {
          x: from.x + (to.x - from.x) * t,
          y: from.y + (to.y - from.y) * t,
        };
        drawPoint(point);
      }
      return;
    }

    // Pour les autres styles, utiliser le dessin de ligne
    ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.globalAlpha = brushOpacity;
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Ajuster le style de ligne selon le brush style
    if (brushStyle === 'square') {
      ctx.lineCap = 'square';
    } else if (brushStyle === 'calligraphy') {
      // Pour la calligraphie, dessiner plusieurs fois avec différentes épaisseurs
      const angle = Math.atan2(to.y - from.y, to.x - from.x) + Math.PI / 4;
      ctx.lineWidth = brushSize * (0.5 + 0.5 * Math.abs(Math.cos(angle)));
    }

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    ctx.globalAlpha = 1; // Reset
    
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
          fontFamily: textFont,
          bold: textBold,
          italic: textItalic,
          align: textAlign,
        });
      } else {
        // Create a new text layer with all settings
        onAddTextLayer(
          textInputValue, 
          pendingTextPosition.x, 
          pendingTextPosition.y, 
          textSize, 
          textColor,
          textFont,
          textBold,
          textItalic,
          textAlign
        );
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
            
            {/* Font Family Control */}
            <div className="mb-4">
              <label className="text-white text-sm mb-2 block">Police</label>
              <select
                value={textFont}
                onChange={(e) => setTextFont(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              >
                {['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS', 'Impact', 'Trebuchet MS'].map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

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

            {/* Bold and Italic Controls */}
            <div className="mb-4">
              <label className="text-white text-sm mb-2 block">Style</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTextBold(!textBold)}
                  className={`flex-1 px-4 py-2 rounded font-bold transition-colors ${
                    textBold ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  B
                </button>
                <button
                  onClick={() => setTextItalic(!textItalic)}
                  className={`flex-1 px-4 py-2 rounded italic transition-colors ${
                    textItalic ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  I
                </button>
              </div>
            </div>

            {/* Text Alignment Control */}
            <div className="mb-4">
              <label className="text-white text-sm mb-2 block">Alignement</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTextAlign('left')}
                  className={`flex-1 px-4 py-2 rounded transition-colors ${
                    textAlign === 'left' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                  title="Aligner à gauche"
                >
                  ⬅
                </button>
                <button
                  onClick={() => setTextAlign('center')}
                  className={`flex-1 px-4 py-2 rounded transition-colors ${
                    textAlign === 'center' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                  title="Centrer"
                >
                  ↔
                </button>
                <button
                  onClick={() => setTextAlign('right')}
                  className={`flex-1 px-4 py-2 rounded transition-colors ${
                    textAlign === 'right' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                  title="Aligner à droite"
                >
                  ➡
                </button>
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
