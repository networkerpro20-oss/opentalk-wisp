import React from 'react';
import { useEditorState } from '../hooks/useEditorState';

export default function FilterControls() {
  const { filterValues, setFilterValues } = useEditorState();

  return (
    <div className="flex items-center gap-4 px-3 py-2 bg-gray-900/90 rounded-lg backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-white text-xs w-16">Brillo</span>
        <input
          type="range"
          min={-100}
          max={100}
          value={filterValues.brightness}
          onChange={(e) => setFilterValues({ ...filterValues, brightness: Number(e.target.value) })}
          className="w-24 accent-indigo-500"
        />
        <span className="text-white text-xs w-8 text-right">{filterValues.brightness}</span>
      </div>

      <div className="w-px h-6 bg-gray-600" />

      <div className="flex items-center gap-2">
        <span className="text-white text-xs w-16">Contraste</span>
        <input
          type="range"
          min={-100}
          max={100}
          value={filterValues.contrast}
          onChange={(e) => setFilterValues({ ...filterValues, contrast: Number(e.target.value) })}
          className="w-24 accent-indigo-500"
        />
        <span className="text-white text-xs w-8 text-right">{filterValues.contrast}</span>
      </div>

      {(filterValues.brightness !== 0 || filterValues.contrast !== 0) && (
        <button
          onClick={() => setFilterValues({ brightness: 0, contrast: 0 })}
          className="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
        >
          Reset
        </button>
      )}
    </div>
  );
}
