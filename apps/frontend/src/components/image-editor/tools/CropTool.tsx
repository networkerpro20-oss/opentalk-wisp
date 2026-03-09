import React from 'react';
import { useEditorState } from '../hooks/useEditorState';

interface CropToolProps {
  stageWidth: number;
  stageHeight: number;
  onApplyCrop: () => void;
}

export default function CropTool({ stageWidth, stageHeight, onApplyCrop }: CropToolProps) {
  const { cropRect, setCropRect, isCropping, setIsCropping } = useEditorState();

  const startCrop = () => {
    const margin = 0.1;
    setCropRect({
      x: Math.round(stageWidth * margin),
      y: Math.round(stageHeight * margin),
      width: Math.round(stageWidth * (1 - 2 * margin)),
      height: Math.round(stageHeight * (1 - 2 * margin)),
    });
    setIsCropping(true);
  };

  const handleCancel = () => {
    setCropRect(null);
    setIsCropping(false);
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-900/90 rounded-lg backdrop-blur-sm">
      {!isCropping ? (
        <button
          onClick={startCrop}
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
        >
          Iniciar recorte
        </button>
      ) : (
        <>
          <span className="text-white text-xs">Arrastra los bordes para ajustar</span>
          <button
            onClick={onApplyCrop}
            className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
          >
            Aplicar
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
          >
            Cancelar
          </button>
        </>
      )}
    </div>
  );
}
