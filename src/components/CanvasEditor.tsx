import React, { useRef, useEffect, useState } from 'react';
import type { Layer, Tool, Point } from '../types';

interface CanvasEditorProps {
  layers: Layer[];
  activeLayerId: string;
  currentTool: Tool;
  brushSize: number;
  brushColor: string;
  onLayerUpdate: (layerId: string) => void;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({
  layers,
  activeLayerId,
  currentTool,
  brushSize,
  brushColor,
  onLayerUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [, setForceUpdate] = useState(0);

  const activeLayer = layers.find((l) => l.id === activeLayerId);

  useEffect(() => {
    // Render all layers
    const container = containerRef.current;
    if (!container) return;

    // Clear container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Add all visible layers
    layers.forEach((layer) => {
      if (layer.visible) {
        // Create a new canvas and copy the content
        const displayCanvas = document.createElement('canvas');
        displayCanvas.width = layer.canvas.width;
        displayCanvas.height = layer.canvas.height;
        
        const displayCtx = displayCanvas.getContext('2d');
        if (displayCtx) {
          displayCtx.drawImage(layer.canvas, 0, 0);
        }
        
        displayCanvas.style.position = 'absolute';
        displayCanvas.style.top = '0';
        displayCanvas.style.left = '0';
        displayCanvas.style.opacity = layer.opacity.toString();
        displayCanvas.style.pointerEvents = layer.id === activeLayerId ? 'auto' : 'none';
        container.appendChild(displayCanvas);
      }
    });
  }, [layers, activeLayerId]);

  const getMousePos = (e: React.MouseEvent<HTMLDivElement>): Point => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeLayer) return;
    
    const point = getMousePos(e);

    if (currentTool === 'eyedropper') {
      pickColor(point);
      return; // Don't set isDrawing for eyedropper
    }
    
    setIsDrawing(true);
    setLastPoint(point);

    if (currentTool === 'brush' || currentTool === 'eraser') {
      drawPoint(point);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !activeLayer || !lastPoint) return;

    const point = getMousePos(e);

    if (currentTool === 'brush' || currentTool === 'eraser') {
      drawLine(lastPoint, point);
    }

    setLastPoint(point);
  };

  const handleMouseUp = () => {
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

  if (layers.length === 0 || !activeLayer) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <p className="text-gray-500 text-lg">Importez une image pour commencer</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-900 overflow-auto">
      <div
        ref={containerRef}
        className="relative bg-white shadow-2xl"
        style={{
          width: activeLayer.canvas.width,
          height: activeLayer.canvas.height,
          cursor: currentTool === 'brush' ? 'crosshair' : currentTool === 'eraser' ? 'cell' : currentTool === 'eyedropper' ? 'pointer' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default CanvasEditor;
