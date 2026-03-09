import React from 'react';
import { RotateCw, RotateCcw } from 'lucide-react';
import { useEditorState } from '../hooks/useEditorState';

export default function RotateTool() {
  const { rotation, setRotation } = useEditorState();

  const rotateCW = () => setRotation((rotation + 90) % 360);
  const rotateCCW = () => setRotation((rotation - 90 + 360) % 360);

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-900/90 rounded-lg backdrop-blur-sm">
      <button
        onClick={rotateCCW}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600"
      >
        <RotateCcw size={16} />
        90° Izquierda
      </button>
      <button
        onClick={rotateCW}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600"
      >
        <RotateCw size={16} />
        90° Derecha
      </button>
      <span className="text-gray-400 text-xs">{rotation}°</span>
    </div>
  );
}
