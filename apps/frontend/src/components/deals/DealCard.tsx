'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, DollarSign, Calendar, User, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface DealCardProps {
  deal: {
    id: string;
    title: string;
    value: number;
    currency: string;
    probability?: number;
    expectedCloseDate?: string;
    contact?: {
      id: string;
      name: string;
      avatar?: string;
    };
    assignedTo?: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

export function DealCard({ deal, onEdit, onDelete, onClick }: DealCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 75) return 'bg-green-500';
    if (prob >= 50) return 'bg-yellow-500';
    if (prob >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white rounded-lg border border-gray-200 p-3 mb-2 
        hover:shadow-md transition-shadow cursor-pointer
        ${isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''}
      `}
      onClick={onClick}
    >
      {/* Header with drag handle and menu */}
      <div className="flex items-start justify-between mb-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-gray-100 rounded"
        >
          <GripVertical size={16} className="text-gray-400" />
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreVertical size={16} className="text-gray-400" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-6 z-20 bg-white border rounded-lg shadow-lg py-1 min-w-[120px]">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Edit size={14} />
                    Editar
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {deal.title}
      </h4>

      {/* Value */}
      <div className="flex items-center gap-1 text-green-600 font-semibold mb-2">
        <DollarSign size={16} />
        <span>{formatCurrency(deal.value, deal.currency)}</span>
      </div>

      {/* Probability bar */}
      {deal.probability !== undefined && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Probabilidad</span>
            <span>{deal.probability}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${getProbabilityColor(deal.probability)}`}
              style={{ width: `${deal.probability}%` }}
            />
          </div>
        </div>
      )}

      {/* Contact */}
      {deal.contact && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          {deal.contact.avatar ? (
            <img
              src={deal.contact.avatar}
              alt={deal.contact.name}
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white">
              {deal.contact.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="truncate">{deal.contact.name}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
        {/* Expected close date */}
        {deal.expectedCloseDate && (
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{formatDate(deal.expectedCloseDate)}</span>
          </div>
        )}

        {/* Assigned user */}
        {deal.assignedTo && (
          <div className="flex items-center gap-1">
            <User size={12} />
            {deal.assignedTo.avatar ? (
              <img
                src={deal.assignedTo.avatar}
                alt={`${deal.assignedTo.firstName} ${deal.assignedTo.lastName}`}
                className="w-4 h-4 rounded-full"
                title={`${deal.assignedTo.firstName} ${deal.assignedTo.lastName}`}
              />
            ) : (
              <div 
                className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white"
                title={`${deal.assignedTo.firstName} ${deal.assignedTo.lastName}`}
              >
                {deal.assignedTo.firstName.charAt(0)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
