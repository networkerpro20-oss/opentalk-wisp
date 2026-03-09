'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
  ReactFlowProvider,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlowStore } from '@/store/flowStore';
import { NodePalette } from '@/components/NodePalette';
import { NodeEditor } from '@/components/NodeEditor';
import { FlowTestPanel } from '@/components/flows/FlowTestPanel';
import { api } from '@/lib/api';
import {
  TriggerNode,
  MessageNode,
  QuestionNode,
  ConditionNode,
  AINode,
  DelayNode,
  MenuNode,
  MediaNode,
  TagNode,
  AssignNode,
  APINode,
} from '@/components/FlowNodes';

const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  question: QuestionNode,
  condition: ConditionNode,
  ai: AINode,
  delay: DelayNode,
  menu: MenuNode,
  media: MediaNode,
  tag: TagNode,
  assign: AssignNode,
  api: APINode,
};

function FlowCanvas({ onSave, flowId }: { onSave: () => void; flowId: string }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
    flowName,
    setFlowName,
  } = useFlowStore();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      addNode(type as any, position);
    },
    [reactFlowInstance, addNode]
  );

  const onNodeClick = useCallback(
    (_: any, node: any) => {
      setSelectedNode(node);
      setShowEditor(true);
    },
    [setSelectedNode]
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <NodePalette />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="text-xl font-bold text-gray-800 border-none focus:ring-2 focus:ring-blue-500 rounded px-2"
              placeholder="Nombre del Flow"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTestPanel(!showTestPanel)}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${
                showTestPanel
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              🧪 {showTestPanel ? 'Ocultar Test' : 'Test & Métricas'}
            </button>
            <button
              onClick={onSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              💾 Guardar
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            className="bg-gray-50"
          >
            <Background color="#e5e7eb" gap={16} />
            <Controls />
            <MiniMap
              nodeStrokeColor={(n) => {
                if (n.type === 'trigger') return '#10b981';
                if (n.type === 'condition') return '#f59e0b';
                if (n.type === 'ai') return '#a855f7';
                return '#6b7280';
              }}
              nodeColor={(n) => {
                if (n.type === 'trigger') return '#d1fae5';
                if (n.type === 'condition') return '#fef3c7';
                if (n.type === 'ai') return '#f3e8ff';
                return '#f3f4f6';
              }}
              nodeBorderRadius={8}
            />
            <Panel position="top-right" className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 m-4">
              <div className="text-xs text-gray-600">
                <div className="font-semibold mb-1">💡 Atajos</div>
                <div>• Drag & Drop: Arrastra nodos desde la paleta</div>
                <div>• Click: Selecciona un nodo para editarlo</div>
                <div>• Conecta: Arrastra desde los puntos de conexión</div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {showEditor && <NodeEditor onClose={() => setShowEditor(false)} />}
      {showTestPanel && flowId !== 'new' && (
        <FlowTestPanel
          flowId={flowId}
          isOpen={showTestPanel}
          onClose={() => setShowTestPanel(false)}
        />
      )}
    </div>
  );
}

export default function FlowEditorPage({ params }: { params: { id: string } }) {
  const { getFlowData, loadFlow, clearFlow } = useFlowStore();
  const flowId = params.id;

  // Load existing flow data when editing
  useEffect(() => {
    if (flowId !== 'new') {
      api.get(`/flows/${flowId}`)
        .then((res) => loadFlow(res.data))
        .catch((err) => {
          console.error('Error loading flow:', err);
          alert('Error al cargar el flow');
        });
    } else {
      clearFlow();
    }
  }, [flowId, loadFlow, clearFlow]);

  const handleSave = useCallback(async () => {
    const flowData = getFlowData();
    
    const payload = {
      name: flowData.name,
      trigger: flowData.trigger,
      isActive: true,
      nodes: flowData.nodes,
      edges: flowData.edges,
      description: '',
    };

    try {
      if (flowId === 'new') {
        await api.post('/flows', payload);
      } else {
        await api.patch(`/flows/${flowId}`, payload);
      }
      alert('Flow guardado correctamente');
      if (flowId === 'new') {
        window.location.href = '/dashboard/flows';
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving flow:', error);
      alert('Error al guardar el flow');
    }
  }, [flowId, getFlowData]);

  return (
    <ReactFlowProvider>
      <FlowCanvas onSave={handleSave} flowId={flowId} />
    </ReactFlowProvider>
  );
}
