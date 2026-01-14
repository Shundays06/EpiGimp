import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Selection, SelectionType, Point, Layer } from '../types';

interface SelectionToolProps {
  activeLayer: Layer;
  selection: Selection | null;
  onSelectionChange: (selection: Selection | null) => void;
  selectionType: SelectionType;
  zoom: number;
  pan: { x: number; y: number };
}

const SelectionTool: React.FC<SelectionToolProps> = ({
  activeLayer,
  selection,
  onSelectionChange,
  selectionType,
  zoom,
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [lassoPoints, setLassoPoints] = useState<Point[]>([]);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  // Draw selection overlay
  const drawSelectionOverlay = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw current selection being made
    if (isSelecting && startPoint && currentPoint) {
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#00BFFF';
      ctx.lineWidth = 2;

      if (selectionType === 'rectangle') {
        const x = Math.min(startPoint.x, currentPoint.x);
        const y = Math.min(startPoint.y, currentPoint.y);
        const width = Math.abs(currentPoint.x - startPoint.x);
        const height = Math.abs(currentPoint.y - startPoint.y);
        ctx.strokeRect(x, y, width, height);
      } else if (selectionType === 'ellipse') {
        const x = Math.min(startPoint.x, currentPoint.x);
        const y = Math.min(startPoint.y, currentPoint.y);
        const width = Math.abs(currentPoint.x - startPoint.x);
        const height = Math.abs(currentPoint.y - startPoint.y);
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Draw lasso points
    if (selectionType === 'lasso' && lassoPoints.length > 0) {
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#00BFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
      lassoPoints.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      if (!isSelecting) {
        ctx.closePath();
      }
      ctx.stroke();
    }

    // Draw existing selection
    if (selection && !isSelecting) {
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(0, 191, 255, 0.1)';

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
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
      } else if (selection.type === 'lasso' && selection.points) {
        ctx.beginPath();
        ctx.moveTo(selection.points[0].x, selection.points[0].y);
        selection.points.forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }, [isSelecting, startPoint, currentPoint, lassoPoints, selection, selectionType]);

  useEffect(() => {
    drawSelectionOverlay();
  }, [drawSelectionOverlay]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setIsSelecting(true);
    setStartPoint({ x, y });
    setCurrentPoint({ x, y });

    if (selectionType === 'lasso') {
      setLassoPoints([{ x, y }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelecting) return;

    const canvas = overlayRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setCurrentPoint({ x, y });

    if (selectionType === 'lasso') {
      setLassoPoints((prev) => [...prev, { x, y }]);
    }
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;

    setIsSelecting(false);

    if (selectionType === 'lasso' && lassoPoints.length > 2) {
      onSelectionChange({
        type: 'lasso',
        points: lassoPoints,
      });
    } else if (startPoint && currentPoint) {
      const x = Math.min(startPoint.x, currentPoint.x);
      const y = Math.min(startPoint.y, currentPoint.y);
      const width = Math.abs(currentPoint.x - startPoint.x);
      const height = Math.abs(currentPoint.y - startPoint.y);

      if (width > 5 && height > 5) {
        onSelectionChange({
          type: selectionType,
          x,
          y,
          width,
          height,
        });
      }
    }

    setStartPoint(null);
    setCurrentPoint(null);
    setLassoPoints([]);
  };

  return (
    <canvas
      ref={overlayRef}
      width={activeLayer.canvas.width}
      height={activeLayer.canvas.height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'auto',
        cursor: selectionType === 'lasso' ? 'crosshair' : 'crosshair',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};

export default SelectionTool;
