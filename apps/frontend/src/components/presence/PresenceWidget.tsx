'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Circle, Coffee } from 'lucide-react';
import { toast } from 'sonner';
import { presenceAPI } from '@/lib/api-teams';

const STATUS_CONFIG = {
  ONLINE: { label: 'En línea', color: 'bg-green-500', textColor: 'text-green-700' },
  BUSY: { label: 'Ocupado', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
  AWAY: { label: 'Ausente', color: 'bg-gray-500', textColor: 'text-gray-700' },
  OFFLINE: { label: 'Desconectado', color: 'bg-red-500', textColor: 'text-red-700' },
};

export function PresenceWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: presence } = useQuery({
    queryKey: ['my-presence'],
    queryFn: presenceAPI.getMyStatus,
    refetchInterval: 30000, // Refresh every 30s
  });

  const updatePresenceMutation = useMutation({
    mutationFn: presenceAPI.updateMyStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-presence'] });
      toast.success('Estado actualizado');
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar estado');
    },
  });

  const currentStatus = presence?.status || 'OFFLINE';
  const config = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
      >
        <div className="relative">
          <Circle className={`${config.color} fill-current`} size={12} />
          {presence?.isOnBreak && (
            <Coffee size={10} className="absolute -bottom-1 -right-1 text-orange-600" />
          )}
        </div>
        <span className="text-sm font-medium">{config.label}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border p-4 z-50">
          <h3 className="font-semibold mb-3">Cambiar estado</h3>
          
          <div className="space-y-2 mb-4">
            {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
              <button
                key={status}
                onClick={() => updatePresenceMutation.mutate({ status, customMessage })}
                className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 ${
                  currentStatus === status ? 'bg-blue-50 border border-blue-200' : ''
                }`}
              >
                <Circle className={`${cfg.color} fill-current`} size={12} />
                <span className="text-sm">{cfg.label}</span>
              </button>
            ))}
          </div>

          <div className="border-t pt-3">
            <label className="block text-sm font-medium mb-2">Mensaje personalizado</label>
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="ej: En reunión hasta las 3pm"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="isOnBreak"
              checked={presence?.isOnBreak || false}
              onChange={(e) =>
                updatePresenceMutation.mutate({
                  status: currentStatus,
                  isOnBreak: e.target.checked,
                  customMessage,
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="isOnBreak" className="text-sm">
              En descanso
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
