'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Play,
  X,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

interface FlowTestPanelProps {
  flowId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FlowTestPanel({ flowId, isOpen, onClose }: FlowTestPanelProps) {
  const [testMessage, setTestMessage] = useState('');
  const [testResults, setTestResults] = useState<any>(null);

  // Fetch recent executions
  const { data: executions, refetch } = useQuery({
    queryKey: ['flow-executions', flowId],
    queryFn: async () => {
      const res = await fetch(`/api/flows/${flowId}/executions`);
      if (!res.ok) throw new Error('Failed to load executions');
      return res.json();
    },
    enabled: isOpen,
  });

  // Test flow mutation
  const testMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(`/api/flows/${flowId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error('Test failed');
      return res.json();
    },
    onSuccess: (data) => {
      setTestResults(data);
      toast.success('Test ejecutado exitosamente');
      refetch();
    },
    onError: () => {
      toast.error('Error al ejecutar test');
    },
  });

  const handleTest = () => {
    if (!testMessage.trim()) {
      toast.error('Ingresa un mensaje de prueba');
      return;
    }
    testMutation.mutate(testMessage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-40 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between bg-purple-50">
        <div className="flex items-center gap-2">
          <Play size={20} className="text-purple-600" />
          <h3 className="font-semibold text-gray-900">Test & Métricas</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-purple-100 rounded transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Test Input */}
      <div className="p-6 border-b bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Probar Flow
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTest()}
            placeholder="Escribe un mensaje de prueba..."
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
          />
          <button
            onClick={handleTest}
            disabled={testMutation.isPending}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
          >
            <Play size={16} />
            {testMutation.isPending ? 'Probando...' : 'Probar'}
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="p-6 border-b bg-blue-50">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={20} className="text-green-600" />
            <h4 className="font-medium text-gray-900">Resultado del Test</h4>
          </div>

          <div className="space-y-2">
            <div className="bg-white rounded p-3 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Estado:</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    testResults.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {testResults.status === 'completed' ? '✅ Completado' : '❌ Error'}
                </span>
              </div>

              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Nodos Ejecutados:</span>
                <span className="font-medium">{testResults.nodesExecuted || 0}</span>
              </div>

              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Duración:</span>
                <span className="font-medium">{testResults.duration || 0}ms</span>
              </div>

              {testResults.response && (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-gray-600 text-xs block mb-1">Respuesta:</span>
                  <div className="bg-gray-50 rounded p-2 text-sm">
                    {testResults.response}
                  </div>
                </div>
              )}
            </div>

            {testResults.path && testResults.path.length > 0 && (
              <div className="bg-white rounded p-3">
                <span className="text-xs text-gray-600 block mb-2">
                  Ruta de Ejecución:
                </span>
                <div className="space-y-1">
                  {testResults.path.map((nodeId: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <ArrowRight size={12} className="text-gray-400" />
                      <code className="bg-gray-100 px-2 py-0.5 rounded">
                        {nodeId}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Execution Metrics */}
      <div className="flex-1 overflow-y-auto p-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={18} />
          Ejecuciones Recientes
        </h4>

        {!executions || executions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            <Clock size={32} className="mx-auto mb-2 text-gray-300" />
            <p>No hay ejecuciones registradas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {executions.slice(0, 10).map((exec: any) => (
              <div
                key={exec.id}
                className="bg-white border rounded-lg p-3 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {exec.status === 'completed' ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : exec.status === 'failed' ? (
                      <XCircle size={16} className="text-red-600" />
                    ) : (
                      <Clock size={16} className="text-yellow-600" />
                    )}
                    <span className="text-xs font-medium text-gray-700">
                      {new Date(exec.createdAt).toLocaleString('es-MX', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      exec.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : exec.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {exec.status}
                  </span>
                </div>

                {exec.trigger && (
                  <div className="flex items-start gap-2 mb-2">
                    <MessageSquare size={14} className="text-gray-400 mt-0.5" />
                    <span className="text-xs text-gray-600 line-clamp-2">
                      {exec.trigger}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{exec.nodesExecuted || 0} nodos</span>
                  <span>{exec.duration || 0}ms</span>
                </div>

                {exec.error && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">
                    {exec.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {executions && executions.length > 0 && (
        <div className="p-6 border-t bg-gray-50">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {executions.length}
              </div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {executions.filter((e: any) => e.status === 'completed').length}
              </div>
              <div className="text-xs text-gray-600">Exitosas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {executions.filter((e: any) => e.status === 'failed').length}
              </div>
              <div className="text-xs text-gray-600">Fallidas</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
