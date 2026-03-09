import { create } from 'zustand';
import { Annotation, EditorTool, FilterValues, CropRect, EditorState } from '../types';

interface EditorActions {
  setTool: (tool: EditorTool) => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setFontSize: (size: number) => void;
  setRotation: (rotation: number) => void;
  setFilterValues: (values: FilterValues) => void;
  setCropRect: (rect: CropRect | null) => void;
  setIsCropping: (isCropping: boolean) => void;
  setIsAddingText: (isAdding: boolean) => void;
  setTextInputPosition: (pos: { x: number; y: number } | null) => void;
  setSelectedAnnotationId: (id: string | null) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

const initialState: EditorState = {
  tool: EditorTool.DRAW,
  annotations: [],
  undoStack: [],
  redoStack: [],
  brushColor: '#FF0000',
  brushSize: 4,
  fontSize: 24,
  rotation: 0,
  filterValues: { brightness: 0, contrast: 0 },
  cropRect: null,
  isCropping: false,
  isAddingText: false,
  textInputPosition: null,
  selectedAnnotationId: null,
};

export const useEditorState = create<EditorState & EditorActions>((set, get) => ({
  ...initialState,

  setTool: (tool) => set({ tool, selectedAnnotationId: null, isAddingText: false, textInputPosition: null, isCropping: false, cropRect: null }),
  setBrushColor: (brushColor) => set({ brushColor }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setFontSize: (fontSize) => set({ fontSize }),
  setRotation: (rotation) => set({ rotation }),
  setFilterValues: (filterValues) => set({ filterValues }),
  setCropRect: (cropRect) => set({ cropRect }),
  setIsCropping: (isCropping) => set({ isCropping }),
  setIsAddingText: (isAddingText) => set({ isAddingText }),
  setTextInputPosition: (textInputPosition) => set({ textInputPosition }),
  setSelectedAnnotationId: (selectedAnnotationId) => set({ selectedAnnotationId }),

  addAnnotation: (annotation) => {
    const { annotations } = get();
    set({
      undoStack: [...get().undoStack, annotations],
      redoStack: [],
      annotations: [...annotations, annotation],
    });
  },

  updateAnnotation: (id, updates) => {
    const { annotations } = get();
    set({
      annotations: annotations.map((a) =>
        a.id === id ? { ...a, ...updates } as Annotation : a
      ),
    });
  },

  removeAnnotation: (id) => {
    const { annotations } = get();
    set({
      undoStack: [...get().undoStack, annotations],
      redoStack: [],
      annotations: annotations.filter((a) => a.id !== id),
    });
  },

  undo: () => {
    const { undoStack, annotations } = get();
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...get().redoStack, annotations],
      annotations: prev,
    });
  },

  redo: () => {
    const { redoStack, annotations } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [...get().undoStack, annotations],
      annotations: next,
    });
  },

  reset: () => set(initialState),
}));
