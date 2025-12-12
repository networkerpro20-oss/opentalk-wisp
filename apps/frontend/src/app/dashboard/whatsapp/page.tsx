'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappAPI } from '@/lib/api-extended';
import { toast } from 'sonner';

export default function WhatsAppPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const queryClient = useQueryClient();

  const { data: instances, isLoading } = useQuery({
    queryKey: ['whatsapp-instances'],
    queryFn: whatsappAPI.listInstances,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const createMutation = useMutation({
    mutationFn: whatsappAPI.createInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] });
      setShowCreateModal(false);
      setNewInstanceName('');
      toast.success('Instancia creada. Escanea el código QR para conectar.');
    },
    onError: () => {
      toast.error('Error al crear instancia');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: whatsappAPI.deleteInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] });
      toast.success('Instancia eliminada correctamente');
    },
    onError: () => {
      toast.error('Error al eliminar instancia');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInstanceName.trim()) {
      createMutation.mutate({ name: newInstanceName });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando instancias...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
          <p className="text-gray-600">Conecta y gestiona tus instancias de WhatsApp</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          + Nueva Instancia
        </button>
      </div>

      {/* Instances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instances?.map((instance: any) => (
          <div key={instance.id} className="bg-white rounded-lg shadow p-6 relative">
            {/* Delete Button */}
            <button
              onClick={() => {
                if (confirm(`¿Eliminar la instancia "${instance.name}"?`)) {
                  deleteMutation.mutate(instance.id);
                }
              }}
              className="absolute top-2 right-2 text-red-600 hover:text-red-800 p-2"
              title="Eliminar instancia"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            <div className="flex items-start justify-between mb-4 pr-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{instance.name}</h3>
                {instance.phone && (
                  <p className="text-sm text-gray-500">{instance.phone}</p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                instance.status === 'CONNECTED' ? 'bg-green-100 text-green-700' :
                instance.status === 'QR_CODE' ? 'bg-yellow-100 text-yellow-700' :
                instance.status === 'ERROR' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {instance.status}
              </span>
            </div>

            {instance.status === 'CONNECTED' && (
              <div className="space-y-3">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-green-700 font-medium">Estadísticas</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-lg font-bold text-green-900">
                        {instance._count?.conversations || 0}
                      </div>
                      <div className="text-xs text-green-700">Conversaciones</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-900">
                        {instance._count?.messages || 0}
                      </div>
                      <div className="text-xs text-green-700">Mensajes</div>
                    </div>
                  </div>
                </div>
                <button
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Ver Conversaciones
                </button>
              </div>
            )}

            {instance.status === 'QR_CODE' && (
              <Link
                href={`/dashboard/whatsapp/${instance.id}/qr`}
                className="block w-full text-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Ver Código QR
              </Link>
            )}

            {instance.status === 'DISCONNECTED' && (
              <div className="text-sm text-gray-500 text-center py-2">
                Desconectado. Elimina y crea una nueva instancia.
              </div>
            )}

            {instance.status === 'ERROR' && (
              <div className="text-sm text-red-600 text-center py-2">
                Error de conexión
              </div>
            )}
          </div>
        ))}

        {instances?.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No hay instancias de WhatsApp</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Crear tu primera instancia
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva Instancia</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la instancia
                </label>
                <input
                  type="text"
                  required
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  placeholder="Mi WhatsApp Business"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creando...' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewInstanceName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
