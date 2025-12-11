'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal } from 'lucide-react';
import { DealCard } from './DealCard';

interface PipelineColumnProps {
  stage: {
    id: string;
    name: string;
    color?: string;
    deals?: any[];
    _count?: {
      deals: number;
    };
  };
  deals: any[];
  onAddDeal?: () => void;
  onEditDeal?: (deal: any) => void;
  onDeleteDeal?: (dealId: string) => void;
  onDealClick?: (deal: any) => void;
}

export function PipelineColumn({
  stage,
  deals,
  onAddDeal,
  onEditDeal,
  onDeleteDeal,
  onDealClick,
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="flex-shrink-0 w-80">
      <div className="bg-gray-50 rounded-lg p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: stage.color || '#6b7280' }}
            />
            <h3 className="font-semibold text-gray-900">{stage.name}</h3>
            <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
              {deals.length}
            </span>
          </div>

          <button className="p-1 hover:bg-gray-200 rounded">
            <MoreHorizontal size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Total value */}
        {totalValue > 0 && (
          <div className="text-sm text-gray-600 mb-3 font-medium">
            {formatCurrency(totalValue)}
          </div>
        )}

        {/* Deals list (droppable area) */}
        <div
          ref={setNodeRef}
          className={`
            min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto
            rounded-lg p-2 transition-colors
            ${isOver ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-gray-100'}
          `}
        >
          <SortableContext
            items={deals.map((d) => d.id)}
            strategy={verticalListSortingStrategy}
          >
            {deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onEdit={() => onEditDeal?.(deal)}
                onDelete={() => onDeleteDeal?.(deal.id)}
                onClick={() => onDealClick?.(deal)}
              />
            ))}
          </SortableContext>

          {/* Empty state */}
          {deals.length === 0 && !isOver && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No hay deals en esta etapa
            </div>
          )}

          {/* Drop indicator */}
          {isOver && deals.length === 0 && (
            <div className="text-center py-8 text-blue-500 text-sm font-medium">
              Suelta aquí
            </div>
          )}
        </div>

        {/* Add deal button */}
        {onAddDeal && (
          <button
            onClick={onAddDeal}
            className="w-full mt-3 py-2 px-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <Plus size={16} />
            <span className="text-sm font-medium">Agregar Deal</span>
          </button>
        )}
      </div>
    </div>
  );
}
