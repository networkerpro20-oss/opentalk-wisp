'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Users, Settings, Trash2, Edit, BarChart3 } from 'lucide-react';
import { TeamDialog } from '@/components/teams/TeamDialog';
import { TeamMembersDialog } from '@/components/teams/TeamMembersDialog';
import { TeamStatsCard } from '@/components/teams/TeamStatsCard';

interface Team {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  maxConcurrentChats?: number;
  workingHours?: any;
  createdAt: string;
}

export default function TeamsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/teams/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete team');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Equipo eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar equipo');
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Está seguro de eliminar el equipo "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipos</h1>
          <p className="text-gray-500 mt-1">
            Organiza tus agentes en equipos para mejor colaboración
          </p>
        </div>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Crear Equipo
        </button>
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : teams && teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team: Team) => (
            <div
              key={team.id}
              className="bg-white rounded-lg border hover:shadow-lg transition p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{team.name}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        team.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {team.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              {team.description && (
                <p className="text-gray-600 text-sm mb-4">{team.description}</p>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {team.maxConcurrentChats && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    Max: {team.maxConcurrentChats} chats
                  </span>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => {
                    setSelectedTeam(team);
                    setIsMembersDialogOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                >
                  <Users size={16} />
                  Miembros
                </button>
                <button
                  onClick={() => {
                    setSelectedTeam(team);
                    setIsEditDialogOpen(true);
                  }}
                  className="flex items-center justify-center px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(team.id, team.name)}
                  className="flex items-center justify-center px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Users className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay equipos creados
          </h3>
          <p className="text-gray-500 mb-4">
            Crea tu primer equipo para organizar a tus agentes
          </p>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Crear Primer Equipo
          </button>
        </div>
      )}

      {/* Dialogs */}
      <TeamDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        mode="create"
      />

      {selectedTeam && (
        <>
          <TeamDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedTeam(null);
            }}
            mode="edit"
            team={selectedTeam}
          />

          <TeamMembersDialog
            isOpen={isMembersDialogOpen}
            onClose={() => {
              setIsMembersDialogOpen(false);
              setSelectedTeam(null);
            }}
            team={selectedTeam}
          />
        </>
      )}
    </div>
  );
}
