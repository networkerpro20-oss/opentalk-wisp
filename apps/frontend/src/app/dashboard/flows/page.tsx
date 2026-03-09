'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Flow {
  id: string;
  name: string;
  trigger: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  config?: {
    nodes?: any[];
    edges?: any[];
  };
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      const res = await api.get('/flows');
      setFlows(res.data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string) => {
    try {
      await api.post(`/flows/${id}/toggle`);
      loadFlows();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error toggling flow:', error);
    }
  };

  const deleteFlow = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este flow?')) return;

    try {
      await api.delete(`/flows/${id}`);
      loadFlows();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting flow:', error);
    }
  };

  const testFlow = async (id: string) => {
    try {
      await api.post(`/flows/${id}/test`);
      alert('Flow ejecutado correctamente');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error testing flow:', error);
      alert('Error al ejecutar el flow');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Cargando flows...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span>🤖</span>
              Automatizaciones
            </h1>
            <p className="text-gray-600 mt-2">
              Crea flujos inteligentes para responder automáticamente a tus clientes
            </p>
          </div>

          <Link
            href="/dashboard/flows/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
          >
            <span>➕</span>
            Crear Flow
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Flows</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{flows.length}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {flows.filter((f) => f.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactivos</p>
                <p className="text-3xl font-bold text-gray-400 mt-1">
                  {flows.filter((f) => f.status !== 'ACTIVE').length}
                </p>
              </div>
              <div className="text-4xl">⏸️</div>
            </div>
          </div>
        </div>

        {/* Flows List */}
        {flows.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No tienes flows creados
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza creando tu primer flujo de automatización
            </p>
            <Link
              href="/dashboard/flows/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <span>➕</span>
              Crear mi primer Flow
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {flows.map((flow) => (
              <div
                key={flow.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{flow.name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          flow.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {flow.status === 'ACTIVE' ? '✅ Activo' : '⏸️ Inactivo'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <span>🎯</span>
                        Trigger: <strong>{flow.trigger}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>🧩</span>
                        {flow.config?.nodes?.length || 0} nodos
                      </span>
                      <span className="flex items-center gap-1">
                        <span>🔗</span>
                        {flow.config?.edges?.length || 0} conexiones
                      </span>
                    </div>

                    <p className="text-xs text-gray-500">
                      Creado: {new Date(flow.createdAt).toLocaleDateString('es-ES')} • 
                      Actualizado: {new Date(flow.updatedAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testFlow(flow.id)}
                      className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium text-sm"
                      title="Probar Flow"
                    >
                      ▶️ Test
                    </button>

                    <button
                      onClick={() => toggleActive(flow.id)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm ${
                        flow.status === 'ACTIVE'
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      title={flow.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                    >
                      {flow.status === 'ACTIVE' ? '⏸️ Pausar' : '▶️ Activar'}
                    </button>

                    <Link
                      href={`/dashboard/flows/${flow.id}`}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium text-sm"
                    >
                      ✏️ Editar
                    </Link>

                    <button
                      onClick={() => deleteFlow(flow.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span>💡</span>
            ¿Cómo funcionan los Flows?
          </h4>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>1. Trigger:</strong> Define cuándo se activa el flow (nuevo mensaje, palabra clave, etc.)
            </p>
            <p>
              <strong>2. Nodos:</strong> Arrastra y conecta componentes para crear la lógica (mensajes, preguntas, condiciones, IA)
            </p>
            <p>
              <strong>3. Automatización:</strong> El chatbot ejecutará el flow automáticamente cuando se cumpla el trigger
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
