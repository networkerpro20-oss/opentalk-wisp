'use client';

import { useCallback } from 'react';
import { NodeType, useFlowStore } from '@/store/flowStore';

const nodeTypes = [
  { type: 'message' as NodeType, label: 'Mensaje', icon: '💬', color: 'bg-gray-100 hover:bg-gray-200' },
  { type: 'question' as NodeType, label: 'Pregunta', icon: '❓', color: 'bg-blue-100 hover:bg-blue-200' },
  { type: 'menu' as NodeType, label: 'Menú', icon: '📋', color: 'bg-indigo-100 hover:bg-indigo-200' },
  { type: 'condition' as NodeType, label: 'Condición', icon: '🔀', color: 'bg-yellow-100 hover:bg-yellow-200' },
  { type: 'ai' as NodeType, label: 'IA', icon: '🤖', color: 'bg-purple-100 hover:bg-purple-200' },
  { type: 'media' as NodeType, label: 'Media', icon: '📸', color: 'bg-pink-100 hover:bg-pink-200' },
  { type: 'delay' as NodeType, label: 'Esperar', icon: '⏱️', color: 'bg-orange-100 hover:bg-orange-200' },
  { type: 'tag' as NodeType, label: 'Tag', icon: '🏷️', color: 'bg-teal-100 hover:bg-teal-200' },
  { type: 'assign' as NodeType, label: 'Asignar', icon: '👤', color: 'bg-cyan-100 hover:bg-cyan-200' },
  { type: 'api' as NodeType, label: 'API', icon: '🔌', color: 'bg-violet-100 hover:bg-violet-200' },
];

export function NodePalette() {
  const addNode = useFlowStore((state) => state.addNode);

  const onDragStart = useCallback(
    (event: React.DragEvent, nodeType: NodeType) => {
      event.dataTransfer.setData('application/reactflow', nodeType);
      event.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const handleAddNode = useCallback(
    (type: NodeType) => {
      const randomX = Math.random() * 400 + 100;
      const randomY = Math.random() * 400 + 200;
      addNode(type, { x: randomX, y: randomY });
    },
    [addNode]
  );

  return (
    <div className="bg-white border-r border-gray-200 w-64 p-4 overflow-y-auto">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>🎨</span>
        Componentes
      </h3>
      
      <div className="space-y-2">
        {nodeTypes.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            onClick={() => handleAddNode(node.type)}
            className={`${node.color} border border-gray-300 rounded-lg p-3 cursor-move transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{node.icon}</span>
              <span className="font-medium text-sm text-gray-700">{node.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Arrastra los componentes al canvas o haz clic para agregarlos.
        </p>
      </div>
    </div>
  );
}
