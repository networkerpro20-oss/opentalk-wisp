'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Play,
  Pause,
  Trash2,
  Users,
  MessageSquare,
  Calendar,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { campaignsAPI } from '@/lib/api-campaigns';
import { CampaignWizard } from '@/components/campaigns/CampaignWizard';

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Fetch campaigns
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', statusFilter],
    queryFn: () => campaignsAPI.list(statusFilter || undefined),
  });

  // Start campaign
  const startMutation = useMutation({
    mutationFn: campaignsAPI.start,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaña iniciada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al iniciar campaña');
    },
  });

  // Pause campaign
  const pauseMutation = useMutation({
    mutationFn: campaignsAPI.pause,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaña pausada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al pausar campaña');
    },
  });

  // Delete campaign
  const deleteMutation = useMutation({
    mutationFn: campaignsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaña eliminada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar campaña');
    },
  });

  const getStatusBadge = (status: string) => {
    const badges: any = {
      DRAFT: { color: 'bg-gray-100 text-gray-700', label: 'Borrador' },
      SCHEDULED: { color: 'bg-blue-100 text-blue-700', label: 'Programada' },
      RUNNING: { color: 'bg-green-100 text-green-700 animate-pulse', label: 'En Ejecución' },
      PAUSED: { color: 'bg-yellow-100 text-yellow-700', label: 'Pausada' },
      COMPLETED: { color: 'bg-purple-100 text-purple-700', label: 'Completada' },
      CANCELLED: { color: 'bg-red-100 text-red-700', label: 'Cancelada' },
    };

    const badge = badges[status] || badges.DRAFT;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Cargando campañas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Campañas Masivas</h1>

          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Campaña
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="DRAFT">Borradores</option>
            <option value="SCHEDULED">Programadas</option>
            <option value="RUNNING">En Ejecución</option>
            <option value="PAUSED">Pausadas</option>
            <option value="COMPLETED">Completadas</option>
          </select>
        </div>
      </div>

      {/* Campaigns Grid */}
      {!campaigns || campaigns.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay campañas
          </h3>
          <p className="text-gray-500 mb-4">
            Crea tu primera campaña masiva para enviar mensajes a múltiples contactos
          </p>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Crear Primera Campaña
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign: any) => (
            <div key={campaign.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {campaign.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    {getStatusBadge(campaign.status)}
                    {campaign.campaignMessageType === 'AUDIO' && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">Audio</span>
                    )}
                    {campaign.variants && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">A/B</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {campaign.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {campaign.description}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded p-2">
                  <div className="flex items-center gap-1 text-blue-600 mb-1">
                    <Users size={14} />
                    <span className="text-xs font-medium">Objetivo</span>
                  </div>
                  <div className="text-lg font-bold text-blue-700">
                    {campaign._count?.executions || 0}
                  </div>
                </div>

                <div className="bg-green-50 rounded p-2">
                  <div className="flex items-center gap-1 text-green-600 mb-1">
                    <MessageSquare size={14} />
                    <span className="text-xs font-medium">Enviados</span>
                  </div>
                  <div className="text-lg font-bold text-green-700">
                    {campaign._count?.executions || 0}
                  </div>
                </div>
              </div>

              {/* Schedule info */}
              {campaign.scheduledAt && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Calendar size={14} />
                  <span>{formatDate(campaign.scheduledAt)}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                {campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED' ? (
                  <button
                    onClick={() => startMutation.mutate(campaign.id)}
                    disabled={startMutation.isPending}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Play size={16} />
                    Iniciar
                  </button>
                ) : campaign.status === 'RUNNING' ? (
                  <button
                    onClick={() => pauseMutation.mutate(campaign.id)}
                    disabled={pauseMutation.isPending}
                    className="flex-1 px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Pause size={16} />
                    Pausar
                  </button>
                ) : campaign.status === 'PAUSED' ? (
                  <button
                    onClick={() => startMutation.mutate(campaign.id)}
                    disabled={startMutation.isPending}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Play size={16} />
                    Reanudar
                  </button>
                ) : null}

                <button
                  onClick={() => {
                    if (confirm('¿Eliminar esta campaña?')) {
                      deleteMutation.mutate(campaign.id);
                    }
                  }}
                  disabled={campaign.status === 'RUNNING'}
                  className="px-3 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Campaign Wizard */}
      <CampaignWizard
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setSelectedCampaign(null);
        }}
        campaign={selectedCampaign}
      />
    </div>
  );
}
