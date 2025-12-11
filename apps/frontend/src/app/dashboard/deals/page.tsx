'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { Plus, Filter, TrendingUp, DollarSign } from 'lucide-react';
import { PipelineColumn } from '@/components/deals/PipelineColumn';
import { DealCard } from '@/components/deals/DealCard';
import { DealDialog } from '@/components/deals/DealDialog';
import { dealsAPI, pipelinesAPI } from '@/lib/api-deals';

export default function DealsPage() {
  const queryClient = useQueryClient();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [activeDeal, setActiveDeal] = useState<any>(null);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [selectedStageForNew, setSelectedStageForNew] = useState<string>('');

  // Fetch pipelines
  const { data: pipelines, isLoading: loadingPipelines } = useQuery({
    queryKey: ['pipelines'],
    queryFn: pipelinesAPI.list,
  });

  // Auto-select first pipeline
  useState(() => {
    if (pipelines?.length > 0 && !selectedPipelineId) {
      setSelectedPipelineId(pipelines[0].id);
    }
  });

  // Fetch pipeline with stages and deals
  const { data: pipeline, isLoading: loadingPipeline } = useQuery({
    queryKey: ['pipeline', selectedPipelineId],
    queryFn: () => dealsAPI.getByPipeline(selectedPipelineId),
    enabled: !!selectedPipelineId,
  });

  // Fetch deals stats
  const { data: stats } = useQuery({
    queryKey: ['deals-stats'],
    queryFn: dealsAPI.getStats,
  });

  // Move deal mutation
  const moveDealMutation = useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: string; stageId: string }) =>
      dealsAPI.moveToStage(dealId, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', selectedPipelineId] });
      queryClient.invalidateQueries({ queryKey: ['deals-stats'] });
      toast.success('Deal movido exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al mover deal');
    },
  });

  // Delete deal mutation
  const deleteDealMutation = useMutation({
    mutationFn: dealsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', selectedPipelineId] });
      queryClient.invalidateQueries({ queryKey: ['deals-stats'] });
      toast.success('Deal eliminado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar deal');
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const deal = pipeline?.stages
      ?.flatMap((stage: any) => stage.deals || [])
      .find((d: any) => d.id === active.id);
    setActiveDeal(deal);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Opcional: lógica de hover
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const newStageId = over.id as string;

    // Find current stage
    const currentStage = pipeline?.stages?.find((stage: any) =>
      stage.deals?.some((d: any) => d.id === dealId)
    );

    if (currentStage?.id !== newStageId) {
      moveDealMutation.mutate({ dealId, stageId: newStageId });
    }
  };

  const handleAddDeal = (stageId: string) => {
    setSelectedStageForNew(stageId);
    setEditingDeal(null);
    setIsDealDialogOpen(true);
  };

  const handleEditDeal = (deal: any) => {
    setEditingDeal(deal);
    setSelectedStageForNew('');
    setIsDealDialogOpen(true);
  };

  const handleDeleteDeal = (dealId: string) => {
    if (confirm('¿Estás seguro de eliminar este deal?')) {
      deleteDealMutation.mutate(dealId);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  if (loadingPipelines) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Cargando pipelines...</div>
      </div>
    );
  }

  if (!pipelines || pipelines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <TrendingUp size={48} className="text-gray-300" />
        <p className="text-gray-500">No hay pipelines configurados</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Crear Pipeline
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Pipeline de Ventas</h1>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter size={18} />
              Filtros
            </button>
            <select
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {pipelines.map((pipeline: any) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm text-blue-600 mb-1">Total en Pipeline</div>
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(stats.totalValue || 0)}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-sm text-green-600 mb-1">Deals Abiertos</div>
              <div className="text-2xl font-bold text-green-700">
                {stats.totalDeals || 0}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-sm text-purple-600 mb-1">Ganados (mes)</div>
              <div className="text-2xl font-bold text-purple-700">
                {formatCurrency(stats.wonValue || 0)}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-sm text-orange-600 mb-1">Tasa de Conversión</div>
              <div className="text-2xl font-bold text-orange-700">
                {stats.conversionRate || 0}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pipeline Kanban Board */}
      {loadingPipeline ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Cargando pipeline...</div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 h-full pb-4">
              {pipeline?.stages?.map((stage: any) => (
                <PipelineColumn
                  key={stage.id}
                  stage={stage}
                  deals={stage.deals || []}
                  onAddDeal={() => handleAddDeal(stage.id)}
                  onEditDeal={handleEditDeal}
                  onDeleteDeal={handleDeleteDeal}
                  onDealClick={(deal) => {}}
                />
              ))}
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {activeDeal ? <DealCard deal={activeDeal} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Deal Dialog */}
      <DealDialog
        isOpen={isDealDialogOpen}
        onClose={() => {
          setIsDealDialogOpen(false);
          setEditingDeal(null);
          setSelectedStageForNew('');
        }}
        deal={editingDeal}
        pipelineId={selectedPipelineId}
        stageId={selectedStageForNew}
      />
    </div>
  );
}
