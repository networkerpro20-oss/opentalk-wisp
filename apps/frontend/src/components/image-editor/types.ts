export enum EditorTool {
  DRAW = 'DRAW',
  TEXT = 'TEXT',
  CROP = 'CROP',
  ROTATE = 'ROTATE',
  FILTER = 'FILTER',
}

export interface StrokeAnnotation {
  type: 'stroke';
  id: string;
  points: number[];
  color: string;
  strokeWidth: number;
}

export interface TextAnnotation {
  type: 'text';
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export type Annotation = StrokeAnnotation | TextAnnotation;

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FilterValues {
  brightness: number;
  contrast: number;
}

export interface EditorState {
  tool: EditorTool;
  annotations: Annotation[];
  undoStack: Annotation[][];
  redoStack: Annotation[][];
  brushColor: string;
  brushSize: number;
  fontSize: number;
  rotation: number;
  filterValues: FilterValues;
  cropRect: CropRect | null;
  isCropping: boolean;
  isAddingText: boolean;
  textInputPosition: { x: number; y: number } | null;
  selectedAnnotationId: string | null;
}

export const PRESET_COLORS = [
  '#FF0000', // rojo
  '#00FF00', // verde
  '#0066FF', // azul
  '#FFFF00', // amarillo
  '#FF00FF', // magenta
  '#FFFFFF', // blanco
  '#000000', // negro
];

export interface ImageEditorModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (editedBase64: string, caption: string) => void;
}
