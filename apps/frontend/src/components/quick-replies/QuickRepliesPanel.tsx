'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Zap, Plus, Edit, Trash2, Search } from 'lucide-react';

export function QuickRepliesPanel() {
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    shortcut: '',
    content: '',
    description: '',
    tags: [] as string[],
  });

  const queryClient = useQueryClient();

  const { data: replies, isLoading } = useQuery({
    queryKey: ['quick-replies', search],
    queryFn: async () => {
      const url = search
        ? `/api/quick-replies/search?q=${encodeURIComponent(search)}`
        : '/api/quick-replies';
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      return response.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingId ? `/api/quick-replies/${editingId}` : '/api/quick-replies';
      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al guardar');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-replies'] });
      toast.success(editingId ? 'Respuesta actualizada' : 'Respuesta creada');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/quick-replies/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Error al eliminar');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-replies'] });
      toast.success('Respuesta eliminada');
    },
  });

  const resetForm = () => {
    setFormData({ shortcut: '', content: '', description: '', tags: [] });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (reply: any) => {
    setFormData({
      shortcut: reply.shortcut,
      content: reply.content,
      description: reply.description || '',
      tags: reply.tags || [],
    });
    setEditingId(reply.id);
    setIsCreating(true);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="text-yellow-500" size={20} />
            Respuestas Rápidas
          </h2>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Plus size={16} className="inline mr-1" />
              Nueva
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por atajo o contenido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      {isCreating && (
        <div className="p-4 bg-blue-50 border-b">
          <h3 className="font-medium mb-3">
            {editingId ? 'Editar' : 'Nueva'} Respuesta Rápida
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Atajo (ej: /hola)"
              value={formData.shortcut}
              onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <textarea
              placeholder="Contenido del mensaje..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              rows={3}
            />
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={resetForm}
                className="flex-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => saveMutation.mutate(formData)}
                disabled={!formData.shortcut || !formData.content}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : replies?.length > 0 ? (
          replies.map((reply: any) => (
            <div
              key={reply.id}
              className="p-3 border rounded-lg hover:bg-gray-50 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                      {reply.shortcut}
                    </code>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{reply.content}</p>
                  {reply.description && (
                    <p className="text-xs text-gray-500">{reply.description}</p>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleEdit(reply)}
                    className="p-1 hover:bg-blue-100 rounded"
                  >
                    <Edit size={14} className="text-blue-600" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(reply.id)}
                    className="p-1 hover:bg-red-100 rounded"
                  >
                    <Trash2 size={14} className="text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {search ? 'No se encontraron resultados' : 'No hay respuestas rápidas'}
          </div>
        )}
      </div>
    </div>
  );
}
