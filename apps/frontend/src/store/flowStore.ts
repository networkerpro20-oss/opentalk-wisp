import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';

export type NodeType = 
  | 'trigger' 
  | 'message' 
  | 'question' 
  | 'condition' 
  | 'api' 
  | 'ai' 
  | 'delay' 
  | 'tag' 
  | 'assign'
  | 'media'
  | 'menu';

export interface FlowState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  flowName: string;
  flowTrigger: string;
  onNodesChange: (changes: NodeChange<Node>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, data: any) => void;
  deleteNode: (nodeId: string) => void;
  setSelectedNode: (node: Node | null) => void;
  setFlowName: (name: string) => void;
  setFlowTrigger: (trigger: string) => void;
  loadFlow: (flowData: any) => void;
  clearFlow: () => void;
  getFlowData: () => { nodes: Node[]; edges: Edge[]; name: string; trigger: string };
}

const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 250, y: 50 },
    data: { 
      label: 'Inicio',
      trigger: 'NEW_MESSAGE',
      icon: '▶️'
    },
  },
];

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: initialNodes,
  edges: [],
  selectedNode: null,
  flowName: 'Nuevo Flow',
  flowTrigger: 'NEW_MESSAGE',

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  addNode: (type, position) => {
    const id = `${type}-${Date.now()}`;
    const nodeConfig: Record<NodeType, any> = {
      trigger: {
        label: 'Inicio',
        trigger: 'NEW_MESSAGE',
        icon: '▶️',
      },
      message: {
        label: 'Enviar Mensaje',
        message: 'Hola! ¿En qué puedo ayudarte?',
        icon: '💬',
      },
      question: {
        label: 'Hacer Pregunta',
        question: '¿Cuál es tu nombre?',
        variable: 'nombre',
        icon: '❓',
      },
      condition: {
        label: 'Condición',
        field: 'nombre',
        operator: 'contains',
        value: '',
        icon: '🔀',
      },
      api: {
        label: 'Llamar API',
        url: '',
        method: 'GET',
        icon: '🔌',
      },
      ai: {
        label: 'IA',
        action: 'analyze_sentiment',
        icon: '🤖',
      },
      delay: {
        label: 'Esperar',
        duration: 5,
        unit: 'seconds',
        icon: '⏱️',
      },
      tag: {
        label: 'Agregar Tag',
        tag: '',
        icon: '🏷️',
      },
      assign: {
        label: 'Asignar a Usuario',
        userId: '',
        icon: '👤',
      },
      media: {
        label: 'Enviar Media',
        mediaType: 'image',
        mediaUrl: '',
        caption: '',
        icon: '📸',
      },
      menu: {
        label: 'Menú de Opciones',
        options: [
          { id: '1', text: 'Opción 1', value: '1' },
          { id: '2', text: 'Opción 2', value: '2' },
        ],
        variable: 'opcion',
        icon: '📋',
      },
    };

    const newNode: Node = {
      id,
      type,
      position,
      data: nodeConfig[type] || { label: type },
    };

    set({
      nodes: [...get().nodes, newNode],
      selectedNode: newNode,
    });
  },

  updateNode: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      selectedNode: null,
    });
  },

  setSelectedNode: (node) => {
    set({ selectedNode: node });
  },

  setFlowName: (name) => {
    set({ flowName: name });
  },

  setFlowTrigger: (trigger) => {
    set({ flowTrigger: trigger });
  },

  loadFlow: (flowData) => {
    set({
      nodes: flowData.config?.nodes || [],
      edges: flowData.config?.edges || [],
      flowName: flowData.name,
      flowTrigger: flowData.trigger,
    });
  },

  clearFlow: () => {
    set({
      nodes: initialNodes,
      edges: [],
      selectedNode: null,
      flowName: 'Nuevo Flow',
      flowTrigger: 'NEW_MESSAGE',
    });
  },

  getFlowData: () => {
    const state = get();
    return {
      nodes: state.nodes,
      edges: state.edges,
      name: state.flowName,
      trigger: state.flowTrigger,
    };
  },
}));
