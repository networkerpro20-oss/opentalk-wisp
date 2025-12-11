'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Tag, Plus, X, Edit, Trash2 } from 'lucide-react';
import { tagsAPI } from '@/lib/api-teams';

interface TagItemProps {
  tag: any;
  selected?: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  size?: 'sm' | 'md';
}

export function TagItem({ tag, selected, onToggle, onEdit, onDelete, size = 'md' }: TagItemProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';
  
  return (
    <div
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } cursor-pointer hover:opacity-80 transition group`}
      style={{ backgroundColor: tag.color + '20', color: tag.color }}
    >
      <Tag size={size === 'sm' ? 12 : 14} />
      <span className="font-medium">{tag.name}</span>
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white rounded"
        >
          <Edit size={12} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white rounded"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

export function TagsManager() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6' });
  const queryClient = useQueryClient();

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsAPI.list,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => 
      editingId ? tagsAPI.update(editingId, data) : tagsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success(editingId ? 'Etiqueta actualizada' : 'Etiqueta creada');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tagsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Etiqueta eliminada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', color: '#3B82F6' });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (tag: any) => {
    setFormData({ name: tag.name, color: tag.color });
    setEditingId(tag.id);
    setIsCreating(true);
  };

  const PRESET_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  ];

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Tag size={24} className="text-blue-600" />
          Gestión de Etiquetas
        </h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} />
            Nueva Etiqueta
          </button>
        )}
      </div>

      {isCreating && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium mb-4">
            {editingId ? 'Editar' : 'Nueva'} Etiqueta
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej: Urgente, VIP, Reclamo..."
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="flex gap-2 mb-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-900' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 rounded border cursor-pointer"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => saveMutation.mutate(formData)}
                disabled={!formData.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tags?.map((tag: any) => (
          <TagItem
            key={tag.id}
            tag={tag}
            onEdit={() => handleEdit(tag)}
            onDelete={() => deleteMutation.mutate(tag.id)}
          />
        ))}
        {(!tags || tags.length === 0) && !isCreating && (
          <p className="text-gray-500 text-center w-full py-8">
            No hay etiquetas creadas
          </p>
        )}
      </div>
    </div>
  );
}
