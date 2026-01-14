export type Tool = 'brush' | 'eraser' | 'eyedropper' | 'text' | 'move' | 'transform' | 'select-rect' | 'select-ellipse' | 'select-lasso';

export type SelectionType = 'rectangle' | 'ellipse' | 'lasso';

export interface Selection {
  type: SelectionType;
  // Pour rectangle et ellipse
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // Pour lasso
  points?: Point[];
  // Données de la sélection copiée
  imageData?: ImageData;
}

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
    align?: 'left' | 'center' | 'right';
  };
  position?: {
    x: number;
    y: number;
  };
  transform?: {
    scaleX: number;
    scaleY: number;
    rotation: number;
    skewX?: number;
    skewY?: number;
  };
}

export interface BrushSettings {
  size: number;
  color: string;
  opacity: number;
  hardness: number;
  style: BrushStyle;
}

export type BrushStyle = 'round' | 'square' | 'soft' | 'spray' | 'calligraphy' | 'pixel';

export interface TextSettings {
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
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
