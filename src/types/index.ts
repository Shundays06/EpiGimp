export type Tool = 'brush' | 'eraser' | 'eyedropper' | 'text';

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

export interface TextSettings {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
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
