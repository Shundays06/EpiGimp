import React, { useRef } from 'react';

interface ImageUploaderProps {
  onImageLoad: (image: HTMLImageElement) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageLoad }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      alert('Format de fichier non supporté. Veuillez utiliser PNG, JPEG, GIF, WebP ou BMP.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        onImageLoad(img);
      };
      img.onerror = () => {
        alert('Erreur lors du chargement de l\'image. Veuillez réessayer.');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      alert('Erreur lors de la lecture du fichier. Veuillez réessayer.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.gif,.webp,.bmp,image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp"
        onChange={handleFileChange}
        className="hidden"
        id="image-upload"
      />
      <label
        htmlFor="image-upload"
        className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
      >
        Importer une image
      </label>
      <p className="text-gray-500 text-sm">
        Formats supportés: PNG, JPEG, GIF, WebP, BMP
      </p>
    </div>
  );
};

export default ImageUploader;
