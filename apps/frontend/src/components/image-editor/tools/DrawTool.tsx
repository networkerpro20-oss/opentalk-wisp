import React from 'react';
import { useEditorState } from '../hooks/useEditorState';
import { PRESET_COLORS } from '../types';

export default function DrawTool() {
  const { brushColor, setBrushColor, brushSize, setBrushSize } = useEditorState();

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-900/90 rounded-lg backdrop-blur-sm">
      <div className="flex items-center gap-1.5">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setBrushColor(color)}
            className={`w-7 h-7 rounded-full border-2 transition-transform ${
              brushColor === color ? 'border-white scale-125' : 'border-gray-600'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <div className="w-px h-6 bg-gray-600" />

      <div className="flex items-center gap-2">
        <span className="text-white text-xs">Grosor</span>
        <input
          type="range"
          min={1}
          max={20}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-20 accent-indigo-500"
        />
        <div
          className="rounded-full bg-white flex-shrink-0"
          style={{ width: brushSize, height: brushSize, minWidth: 4, minHeight: 4 }}
        />
      </div>
    </div>
  );
}
