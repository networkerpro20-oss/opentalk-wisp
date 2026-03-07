'use client';

import { useState, useEffect } from 'react';
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
import { Plus, TrendingUp, X, Trash2, GripVertical } from 'lucide-react';
import { PipelineColumn } from '@/components/deals/PipelineColumn';
import { DealCard } from '@/components/deals/DealCard';
import { DealDialog } from '@/components/deals/DealDialog';
import { dealsAPI, pipelinesAPI } from '@/lib/api-deals';

const DEFAULT_STAGES = [
  { name: 'Prospecto', order: 0, color: '#6366F1' },
  { name: 'Contactado', order: 1, color: '#8B5CF6' },
  { name: 'Propuesta', order: 2, color: '#EC4899' },
  { name: 'Negociacion', order: 3, color: '#F59E0B' },
  { name: 'Cierre', order: 4, color: '#10B981' },
];

export default function DealsPage() {
  const queryClient = useQueryClient();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [activeDeal, setActiveDeal] = useState<any>(null);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [selectedStageForNew, setSelectedStageForNew] = useState<string>('');
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [pipelineForm, setPipelineForm] = useState({
    name: '',
    stages: [...DEFAULT_STAGES],
  });
  const [stageForm, setStageForm] = useState({ name: '', color: '#6366F1' });

  // Fetch pipelines
  const { data: pipelines, isLoading: loadingPipelines } = useQuery({
    queryKey: ['pipelines'],
    queryFn: pipelinesAPI.list,
  });

  // Auto-select first pipeline
  useEffect(() => {
    if (pipelines?.length > 0 && !selectedPipelineId) {
      setSelectedPipelineId(pipelines[0].id);
    }
  }, [pipelines, selectedPipelineId]);

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
    enabled: !!selectedPipelineId,
  });

  // Create pipeline + stages
  const createPipelineMutation = useMutation({
    mutationFn: async (data: { name: string; stages: { name: string; order: number; color: string }[] }) => {
      const newPipeline = await pipelinesAPI.create({ name: data.name });
      for (const stage of data.stages) {
        await pipelinesAPI.createStage(newPipeline.id, stage);
      }
      return newPipeline;
    },
    onSuccess: (newPipeline) => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      setSelectedPipelineId(newPipeline.id);
      setShowPipelineModal(false);
      setPipelineForm({ name: '', stages: [...DEFAULT_STAGES] });
      toast.success('Pipeline creado con sus etapas');
    },
    onError: () => toast.error('Error al crear pipeline'),
  });

  // Delete pipeline
  const deletePipelineMutation = useMutation({
    mutationFn: pipelinesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      setSelectedPipelineId('');
      toast.success('Pipeline eliminado');
    },
    onError: () => toast.error('Error al eliminar pipeline'),
  });

  // Create stage
  const createStageMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => {
      const order = pipeline?.stages?.length || 0;
      return pipelinesAPI.createStage(selectedPipelineId, { ...data, order });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', selectedPipelineId] });
      setShowStageModal(false);
      setStageForm({ name: '', color: '#6366F1' });
      toast.success('Etapa creada');
    },
    onError: () => toast.error('Error al crear etapa'),
  });

  // Move deal
  const moveDealMutation = useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: string; stageId: string }) =>
      dealsAPI.moveToStage(dealId, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', selectedPipelineId] });
      queryClient.invalidateQueries({ queryKey: ['deals-stats'] });
      toast.success('Deal movido');
    },
    onError: () => toast.error('Error al mover deal'),
  });

  // Delete deal
  const deleteDealMutation = useMutation({
    mutationFn: dealsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', selectedPipelineId] });
      queryClient.invalidateQueries({ queryKey: ['deals-stats'] });
      toast.success('Deal eliminado');
    },
    onError: () => toast.error('Error al eliminar deal'),
  });

  // Drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const deal = pipeline?.stages
      ?.flatMap((stage: any) => stage.deals || [])
      .find((d: any) => d.id === event.active.id);
    setActiveDeal(deal);
  };

  const handleDragOver = (_event: DragOverEvent) => {};

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);
    if (!over) return;
    const dealId = active.id as string;
    const newStageId = over.id as string;
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
    if (confirm('Eliminar este deal?')) {
      deleteDealMutation.mutate(dealId);
    }
  };

  // Pipeline form helpers
  const addStageToForm = () => {
    setPipelineForm(prev => ({
      ...prev,
      stages: [...prev.stages, { name: '', order: prev.stages.length, color: '#6366F1' }],
    }));
  };

  const removeStageFromForm = (index: number) => {
    setPipelineForm(prev => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })),
    }));
  };

  const updateStageInForm = (index: number, field: string, value: string) => {
    setPipelineForm(prev => ({
      ...prev,
      stages: prev.stages.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }));
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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando pipelines...</div>
      </div>
    );
  }

  // Empty state
  if (!pipelines || pipelines.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <TrendingUp size={48} className="text-gray-300" />
          <p className="text-gray-500 text-lg">No hay pipelines configurados</p>
          <p className="text-gray-400 text-sm max-w-md text-center">
            Crea un pipeline con etapas para organizar tus procesos de venta
          </p>
          <button
            onClick={() => setShowPipelineModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Crear Pipeline
          </button>
        </div>

        {showPipelineModal && (
          <PipelineModal
            form={pipelineForm}
            setForm={setPipelineForm}
            onClose={() => setShowPipelineModal(false)}
            onSubmit={() => createPipelineMutation.mutate(pipelineForm)}
            isPending={createPipelineMutation.isPending}
            addStage={addStageToForm}
            removeStage={removeStageFromForm}
            updateStage={updateStageInForm}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 rounded-t-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Pipeline de Ventas</h1>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStageModal(true)}
              className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1"
            >
              <Plus size={16} /> Etapa
            </button>
            <button
              onClick={() => setShowPipelineModal(true)}
              className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1"
            >
              <Plus size={16} /> Pipeline
            </button>
            <select
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {pipelines.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {pipelines.length > 1 && (
              <button
                onClick={() => {
                  if (confirm('Eliminar este pipeline y todos sus deals?')) {
                    deletePipelineMutation.mutate(selectedPipelineId);
                  }
                }}
                className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm text-blue-600 mb-1">Total en Pipeline</div>
              <div className="text-2xl font-bold text-blue-700">{formatCurrency(stats.totalValue || 0)}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-sm text-green-600 mb-1">Deals Abiertos</div>
              <div className="text-2xl font-bold text-green-700">{stats.totalDeals || 0}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-sm text-purple-600 mb-1">Ganados (mes)</div>
              <div className="text-2xl font-bold text-purple-700">{formatCurrency(stats.wonValue || 0)}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-sm text-orange-600 mb-1">Tasa de Conversion</div>
              <div className="text-2xl font-bold text-orange-700">{stats.conversionRate || 0}%</div>
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
                  onDealClick={() => {}}
                />
              ))}

              {/* Add stage placeholder */}
              <div
                onClick={() => setShowStageModal(true)}
                className="min-w-[280px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition"
              >
                <div className="text-center text-gray-400">
                  <Plus size={24} className="mx-auto mb-1" />
                  <span className="text-sm">Agregar Etapa</span>
                </div>
              </div>
            </div>

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

      {/* Modals */}
      {showPipelineModal && (
        <PipelineModal
          form={pipelineForm}
          setForm={setPipelineForm}
          onClose={() => setShowPipelineModal(false)}
          onSubmit={() => createPipelineMutation.mutate(pipelineForm)}
          isPending={createPipelineMutation.isPending}
          addStage={addStageToForm}
          removeStage={removeStageFromForm}
          updateStage={updateStageInForm}
        />
      )}
      {showStageModal && (
        <StageModal
          form={stageForm}
          setForm={setStageForm}
          onClose={() => setShowStageModal(false)}
          onSubmit={() => createStageMutation.mutate(stageForm)}
          isPending={createStageMutation.isPending}
        />
      )}
    </div>
  );
}

// ============================================================
// Pipeline Creation Modal
// ============================================================
function PipelineModal({
  form, setForm, onClose, onSubmit, isPending, addStage, removeStage, updateStage,
}: {
  form: { name: string; stages: { name: string; order: number; color: string }[] };
  setForm: (fn: any) => void;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
  addStage: () => void;
  removeStage: (i: number) => void;
  updateStage: (i: number, f: string, v: string) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Crear Pipeline</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Pipeline</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm((prev: any) => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Ventas B2B"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Etapas</label>
              <button onClick={addStage} className="text-sm text-indigo-600 hover:underline">+ Agregar etapa</button>
            </div>
            <div className="space-y-2">
              {form.stages.map((stage, index) => (
                <div key={index} className="flex items-center gap-2">
                  <GripVertical size={16} className="text-gray-300 flex-shrink-0" />
                  <input
                    type="color"
                    value={stage.color}
                    onChange={e => updateStage(index, 'color', e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={stage.name}
                    onChange={e => updateStage(index, 'name', e.target.value)}
                    placeholder={`Etapa ${index + 1}`}
                    className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {form.stages.length > 1 && (
                    <button onClick={() => removeStage(index)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-6 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
          <button
            onClick={onSubmit}
            disabled={!form.name.trim() || form.stages.some(s => !s.name.trim()) || isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? 'Creando...' : 'Crear Pipeline'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Stage Creation Modal
// ============================================================
function StageModal({
  form, setForm, onClose, onSubmit, isPending,
}: {
  form: { name: string; color: string };
  setForm: (fn: any) => void;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Nueva Etapa</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm((prev: any) => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Calificacion"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input
              type="color"
              value={form.color}
              onChange={e => setForm((prev: any) => ({ ...prev, color: e.target.value }))}
              className="w-10 h-10 rounded border cursor-pointer"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-6 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
          <button
            onClick={onSubmit}
            disabled={!form.name.trim() || isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? 'Creando...' : 'Crear Etapa'}
          </button>
        </div>
      </div>
    </div>
  );
}
