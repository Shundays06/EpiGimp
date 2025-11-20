export type Tool = 'brush' | 'eraser' | 'eyedropper';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  canvas: HTMLCanvasElement;
  thumbnail?: string;
}

export interface BrushSettings {
  size: number;
  color: string;
  opacity: number;
}

export type FilterType = 'grayscale' | 'sepia' | 'blur' | 'brightness' | 'contrast' | 'invert' | 'saturate';

export interface FilterSettings {
  type: FilterType;
  value?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface HistoryState {
  layerId: string;
  imageData: ImageData;
}
