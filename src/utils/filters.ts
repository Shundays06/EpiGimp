import type { FilterSettings } from '../types';

export const applyFilter = (
  canvas: HTMLCanvasElement,
  filter: FilterSettings
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  switch (filter.type) {
    case 'grayscale':
      applyGrayscale(data);
      break;
    case 'sepia':
      applySepia(data);
      break;
    case 'invert':
      applyInvert(data);
      break;
    case 'brightness':
      applyBrightness(data, filter.value || 0);
      break;
    case 'contrast':
      applyContrast(data, filter.value || 0);
      break;
    case 'saturate':
      applySaturate(data, filter.value || 1);
      break;
    case 'blur':
      applyBlur(ctx, canvas, filter.value || 1);
      return;
  }

  ctx.putImageData(imageData, 0, 0);
};

const applyGrayscale = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;
    data[i + 1] = avg;
    data[i + 2] = avg;
  }
};

const applySepia = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
  }
};

const applyInvert = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
};

const applyBrightness = (data: Uint8ClampedArray, value: number) => {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] + value));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + value));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + value));
  }
};

const applyContrast = (data: Uint8ClampedArray, value: number) => {
  const factor = (259 * (value + 255)) / (255 * (259 - value));
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
    data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
  }
};

const applySaturate = (data: Uint8ClampedArray, value: number) => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
    
    data[i] = Math.max(0, Math.min(255, gray + value * (r - gray)));
    data[i + 1] = Math.max(0, Math.min(255, gray + value * (g - gray)));
    data[i + 2] = Math.max(0, Math.min(255, gray + value * (b - gray)));
  }
};

const applyBlur = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  radius: number
) => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  const tempData = new Uint8ClampedArray(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const i = (ny * width + nx) * 4;
            r += tempData[i];
            g += tempData[i + 1];
            b += tempData[i + 2];
            a += tempData[i + 3];
            count++;
          }
        }
      }
      
      const i = (y * width + x) * 4;
      data[i] = r / count;
      data[i + 1] = g / count;
      data[i + 2] = b / count;
      data[i + 3] = a / count;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

export const exportCanvas = (
  layers: HTMLCanvasElement[],
  format: 'png' | 'jpeg' = 'png'
): string => {
  if (layers.length === 0) return '';

  const mainCanvas = layers[0];
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = mainCanvas.width;
  exportCanvas.height = mainCanvas.height;
  const ctx = exportCanvas.getContext('2d');
  
  if (!ctx) return '';

  layers.forEach(layer => {
    ctx.drawImage(layer, 0, 0);
  });

  return exportCanvas.toDataURL(`image/${format}`);
};
