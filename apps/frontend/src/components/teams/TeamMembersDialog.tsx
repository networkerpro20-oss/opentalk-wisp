'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Plus, Trash2, UserPlus } from 'lucide-react';
import { teamsAPI, usersAPI } from '@/lib/api-teams';

interface TeamMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  team: any;
}

export function TeamMembersDialog({ isOpen, onClose, team }: TeamMembersDialogProps) {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({
    userId: '',
    role: 'AGENT',
    maxConcurrentChats: 5,
  });

  const queryClient = useQueryClient();

  const { data: members } = useQuery({
    queryKey: ['team-members', team?.id],
    queryFn: async () => {
      const data = await teamsAPI.get(team.id);
      return data.members || [];
    },
    enabled: !!team?.id && isOpen,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: usersAPI.list,
    enabled: isAddingMember,
  });

  const addMemberMutation = useMutation({
    mutationFn: (data: any) => teamsAPI.addMember(team.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', team.id] });
      toast.success('Miembro agregado');
      setIsAddingMember(false);
      setNewMember({ userId: '', role: 'AGENT', maxConcurrentChats: 5 });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al agregar miembro');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => teamsAPI.removeMember(team.id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', team.id] });
      toast.success('Miembro eliminado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar miembro');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Miembros de {team.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {!isAddingMember ? (
          <button
            onClick={() => setIsAddingMember(true)}
            className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg hover:bg-gray-50"
          >
            <Plus size={20} />
            Agregar Miembro
          </button>
        ) : (
          <div className="mb-4 p-4 border rounded-lg bg-blue-50">
            <h3 className="font-medium mb-3">Nuevo Miembro</h3>
            <div className="space-y-3">
              <select
                value={newMember.userId}
                onChange={(e) => setNewMember({ ...newMember, userId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Seleccionar usuario...</option>
                {users?.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>

              <select
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="AGENT">Agente</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Administrador</option>
              </select>

              <input
                type="number"
                min="1"
                value={newMember.maxConcurrentChats}
                onChange={(e) =>
                  setNewMember({ ...newMember, maxConcurrentChats: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Chats concurrentes máximos"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddingMember(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => addMemberMutation.mutate(newMember)}
                  disabled={!newMember.userId || addMemberMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {members?.map((member: any) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="font-medium">{member.user?.name}</div>
                <div className="text-sm text-gray-500">{member.user?.email}</div>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {member.role}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    Max: {member.maxConcurrentChats} chats
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeMemberMutation.mutate(member.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {members?.length === 0 && !isAddingMember && (
            <div className="text-center py-8 text-gray-500">
              No hay miembros en este equipo
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
