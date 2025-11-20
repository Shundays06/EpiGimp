import { useEffect, useRef } from 'react';

export const useCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getContext = (): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d', { willReadFrequently: true });
  };

  return { canvasRef, getContext };
};

export const useCanvasDrawing = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  onDraw?: (ctx: CanvasRenderingContext2D, point: { x: number; y: number }) => void
) => {
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const startDrawing = (e: MouseEvent) => {
      isDrawingRef.current = true;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ctx = canvas.getContext('2d');
      if (ctx && onDraw) {
        onDraw(ctx, { x, y });
      }
    };

    const draw = (e: MouseEvent) => {
      if (!isDrawingRef.current) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ctx = canvas.getContext('2d');
      if (ctx && onDraw) {
        onDraw(ctx, { x, y });
      }
    };

    const stopDrawing = () => {
      isDrawingRef.current = false;
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
    };
  }, [canvasRef, onDraw]);

  return { isDrawingRef };
};
