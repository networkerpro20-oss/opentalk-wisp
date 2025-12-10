'use client';

import { useCallback, useState } from 'react';
import { useFlowStore } from '@/store/flowStore';

interface NodeEditorProps {
  onClose: () => void;
}

export function NodeEditor({ onClose }: NodeEditorProps) {
  const { selectedNode, updateNode, deleteNode } = useFlowStore();
  const [formData, setFormData] = useState<any>(selectedNode?.data || {});

  const handleUpdate = useCallback(() => {
    if (!selectedNode) return;
    updateNode(selectedNode.id, formData);
    onClose();
  }, [selectedNode, formData, updateNode, onClose]);

  const handleDelete = useCallback(() => {
    if (!selectedNode) return;
    if (confirm('¿Estás seguro de eliminar este nodo?')) {
      deleteNode(selectedNode.id);
      onClose();
    }
  }, [selectedNode, deleteNode, onClose]);

  if (!selectedNode) return null;

  const renderFields = () => {
    const type = selectedNode.type;

    switch (type) {
      case 'message':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
              <textarea
                value={formData.message || ''}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Escribe el mensaje que se enviará..."
              />
              <p className="text-xs text-gray-500 mt-1">Usa {'{'}nombre{'}'} para variables</p>
            </div>
          </div>
        );

      case 'question':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pregunta</label>
              <textarea
                value={formData.question || ''}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="¿Cuál es tu pregunta?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Guardar en variable</label>
              <input
                type="text"
                value={formData.variable || ''}
                onChange={(e) => setFormData({ ...formData, variable: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="nombre_variable"
              />
            </div>
          </div>
        );

      case 'menu':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Opciones del Menú</label>
              {(formData.options || []).map((opt: any, idx: number) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={opt.id}
                    onChange={(e) => {
                      const newOptions = [...formData.options];
                      newOptions[idx].id = e.target.value;
                      setFormData({ ...formData, options: newOptions });
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded"
                    placeholder="ID"
                  />
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => {
                      const newOptions = [...formData.options];
                      newOptions[idx].text = e.target.value;
                      setFormData({ ...formData, options: newOptions });
                    }}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded"
                    placeholder="Texto de la opción"
                  />
                  <button
                    onClick={() => {
                      const newOptions = formData.options.filter((_: any, i: number) => i !== idx);
                      setFormData({ ...formData, options: newOptions });
                    }}
                    className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newOptions = [...(formData.options || []), { id: String((formData.options?.length || 0) + 1), text: '', value: '' }];
                  setFormData({ ...formData, options: newOptions });
                }}
                className="w-full px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200"
              >
                + Agregar Opción
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Variable para guardar respuesta</label>
              <input
                type="text"
                value={formData.variable || ''}
                onChange={(e) => setFormData({ ...formData, variable: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="opcion_seleccionada"
              />
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campo/Variable</label>
              <input
                type="text"
                value={formData.field || ''}
                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Operador</label>
              <select
                value={formData.operator || 'equals'}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="equals">Es igual a</option>
                <option value="not_equals">No es igual a</option>
                <option value="contains">Contiene</option>
                <option value="not_contains">No contiene</option>
                <option value="starts_with">Empieza con</option>
                <option value="ends_with">Termina con</option>
                <option value="greater_than">Mayor que</option>
                <option value="less_than">Menor que</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
              <input
                type="text"
                value={formData.value || ''}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="valor a comparar"
              />
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Acción de IA</label>
              <select
                value={formData.action || 'analyze_sentiment'}
                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="analyze_sentiment">Analizar Sentimiento</option>
                <option value="generate_response">Generar Respuesta Inteligente</option>
                <option value="extract_intent">Extraer Intención</option>
                <option value="classify">Clasificar Mensaje</option>
                <option value="calculate_score">Calcular Lead Score</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prompt (opcional)</label>
              <textarea
                value={formData.prompt || ''}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Instrucciones específicas para la IA..."
              />
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Media</label>
              <select
                value={formData.mediaType || 'image'}
                onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="image">Imagen</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="document">Documento</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL o Variable</label>
              <input
                type="text"
                value={formData.mediaUrl || ''}
                onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="https://... o {variable_url}"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Caption (opcional)</label>
              <textarea
                value={formData.caption || ''}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="Descripción de la imagen..."
              />
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duración</label>
              <input
                type="number"
                value={formData.duration || 5}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unidad</label>
              <select
                value={formData.unit || 'seconds'}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="seconds">Segundos</option>
                <option value="minutes">Minutos</option>
                <option value="hours">Horas</option>
                <option value="days">Días</option>
              </select>
            </div>
          </div>
        );

      case 'tag':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tag a agregar</label>
              <input
                type="text"
                value={formData.tag || ''}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="cliente-vip"
              />
            </div>
          </div>
        );

      case 'assign':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usuario ID</label>
              <input
                type="text"
                value={formData.userId || ''}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="user-123"
              />
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
              <input
                type="url"
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="https://api.ejemplo.com/endpoint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Método</label>
              <select
                value={formData.method || 'GET'}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>
        );

      default:
        return <p className="text-gray-500">No hay configuración disponible para este tipo de nodo.</p>;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl overflow-y-auto z-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>{selectedNode.data.icon as string}</span>
            {selectedNode.data.label as string}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {renderFields()}

        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleUpdate}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Guardar
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
