export type Tool = 'brush' | 'eraser' | 'eyedropper' | 'text' | 'move';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  canvas: HTMLCanvasElement;
  thumbnail?: string;
  type?: 'image' | 'text';
  textData?: {
    content: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    bold: boolean;
    italic: boolean;
  };
  position?: {
    x: number;
    y: number;
  };
  transform?: {
    scaleX: number;
    scaleY: number;
    rotation: number;
  };
}

export interface BrushSettings {
  size: number;
  color: string;
  opacity: number;
}

export interface TextSettings {
  fontSize: number;
  fontFamily: string;
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
