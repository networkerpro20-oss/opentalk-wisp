'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { StickyNote, Plus, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { internalNotesAPI } from '@/lib/api-teams';

export function InternalNotesPanel({ conversationId }: { conversationId: string }) {
  const [newNote, setNewNote] = useState('');
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['internal-notes', conversationId],
    queryFn: () => internalNotesAPI.listByConversation(conversationId),
    enabled: !!conversationId,
  });

  const createMutation = useMutation({
    mutationFn: (content: string) => 
      internalNotesAPI.create({ conversationId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-notes', conversationId] });
      setNewNote('');
      toast.success('Nota creada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear nota');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: internalNotesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-notes', conversationId] });
      toast.success('Nota eliminada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar nota');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      createMutation.mutate(newNote.trim());
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <StickyNote className="text-yellow-500" size={20} />
          Notas Internas
        </h3>
        <p className="text-xs text-gray-500 mt-1">Solo visible para el equipo</p>
      </div>

      <div className="p-4 border-b bg-gray-50">
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Agregar una nota interna..."
            className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <button
            type="submit"
            disabled={!newNote.trim() || createMutation.isPending}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Agregar Nota
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : notes?.length > 0 ? (
          notes.map((note: any) => (
            <div key={note.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{note.createdBy?.name}</span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(note.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(note.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition"
                >
                  <Trash2 size={14} className="text-red-600" />
                </button>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay notas internas
          </div>
        )}
      </div>
    </div>
  );
}
