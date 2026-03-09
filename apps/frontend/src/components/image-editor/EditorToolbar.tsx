import React from 'react';
import { Pencil, Type, Crop, RotateCw, SlidersHorizontal, Undo2, Redo, Trash2 } from 'lucide-react';
import { useEditorState } from './hooks/useEditorState';
import { EditorTool } from './types';

const tools = [
  { tool: EditorTool.DRAW, icon: Pencil, label: 'Dibujar' },
  { tool: EditorTool.TEXT, icon: Type, label: 'Texto' },
  { tool: EditorTool.CROP, icon: Crop, label: 'Recortar' },
  { tool: EditorTool.ROTATE, icon: RotateCw, label: 'Rotar' },
  { tool: EditorTool.FILTER, icon: SlidersHorizontal, label: 'Filtros' },
];

export default function EditorToolbar() {
  const {
    tool: activeTool, setTool,
    undo, redo, undoStack, redoStack,
    selectedAnnotationId, removeAnnotation,
  } = useEditorState();

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-900/95 backdrop-blur-sm">
      {/* Tool buttons */}
      <div className="flex items-center gap-1">
        {tools.map(({ tool, icon: Icon, label }) => (
          <button
            key={tool}
            onClick={() => setTool(tool)}
            className={`flex flex-col items-center px-3 py-1.5 rounded-lg transition-colors ${
              activeTool === tool
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={label}
          >
            <Icon size={20} />
            <span className="text-[10px] mt-0.5">{label}</span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {selectedAnnotationId && (
          <button
            onClick={() => removeAnnotation(selectedAnnotationId)}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg"
            title="Eliminar seleccionado"
          >
            <Trash2 size={18} />
          </button>
        )}

        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
          title="Deshacer"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
          title="Rehacer"
        >
          <Redo size={18} />
        </button>
      </div>
    </div>
  );
}
