'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhooksAPI, apiKeysAPI } from '@/lib/api-webhooks';
import { toast } from 'sonner';

type SettingsTab = 'webhooks' | 'api-keys';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('webhooks');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracion</h1>
        <p className="text-gray-600">Webhooks, API Keys e integraciones</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {([
            { id: 'webhooks' as SettingsTab, label: 'Webhooks' },
            { id: 'api-keys' as SettingsTab, label: 'API Keys' },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'webhooks' && <WebhooksTab />}
      {activeTab === 'api-keys' && <ApiKeysTab />}
    </div>
  );
}

// ============================================================
// Webhooks Tab
// ============================================================
function WebhooksTab() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', secret: '', events: [] as string[] });
  const [viewingLogs, setViewingLogs] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: webhooksAPI.list,
  });

  const { data: eventsData } = useQuery({
    queryKey: ['webhook-events'],
    queryFn: webhooksAPI.getEvents,
  });

  const { data: logsData } = useQuery({
    queryKey: ['webhook-logs', viewingLogs],
    queryFn: () => webhooksAPI.getLogs(viewingLogs!),
    enabled: !!viewingLogs,
  });

  const createMutation = useMutation({
    mutationFn: () => webhooksAPI.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook creado');
      setShowForm(false);
      setForm({ name: '', url: '', secret: '', events: [] });
    },
    onError: () => toast.error('Error al crear webhook'),
  });

  const deleteMutation = useMutation({
    mutationFn: webhooksAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook eliminado');
    },
  });

  const testMutation = useMutation({
    mutationFn: webhooksAPI.test,
    onSuccess: () => toast.success('Evento de prueba enviado'),
    onError: () => toast.error('Error al enviar prueba'),
  });

  const toggleEvent = (event: string) => {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Recibe notificaciones en tu servidor cuando ocurren eventos</p>
        <button onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          + Nuevo Webhook
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Nuevo Webhook</h3>
          <div className="space-y-3">
            <input type="text" placeholder="Nombre" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            <input type="url" placeholder="URL (https://...)" value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            <input type="text" placeholder="Secret (HMAC, opcional)" value={form.secret}
              onChange={e => setForm({ ...form, secret: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Eventos</label>
              <div className="flex flex-wrap gap-2">
                {(eventsData?.events || []).map((event: string) => (
                  <button key={event} type="button"
                    onClick={() => toggleEvent(event)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      form.events.includes(event) ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                    {event}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {createMutation.isPending ? 'Creando...' : 'Crear'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : !webhooks?.length ? (
        <div className="text-center py-12 text-gray-500">No hay webhooks configurados</div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh: any) => (
            <div key={wh.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{wh.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${wh.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {wh.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{wh.url}</p>
                <div className="flex gap-1 mt-1">
                  {wh.events?.map((e: string) => (
                    <span key={e} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">{e}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewingLogs(viewingLogs === wh.id ? null : wh.id)}
                  className="text-sm text-indigo-600 hover:underline">Logs</button>
                <button onClick={() => testMutation.mutate(wh.id)}
                  className="text-sm text-green-600 hover:underline">Test</button>
                <button onClick={() => { if (confirm('Eliminar?')) deleteMutation.mutate(wh.id); }}
                  className="text-sm text-red-600 hover:underline">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingLogs && logsData?.data && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-3">Logs de entrega</h3>
          {logsData.data.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin logs</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logsData.data.map((log: any) => (
                <div key={log.id} className={`p-2 rounded text-sm border ${log.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex justify-between">
                    <span className="font-medium">{log.event}</span>
                    <span className="text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Status: {log.statusCode || 'N/A'} | Intento: {log.attempt}
                    {log.error && <span className="text-red-600 ml-2">{log.error}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// API Keys Tab
// ============================================================
function ApiKeysTab() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', permissions: [] as string[] });
  const [newKey, setNewKey] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const availablePermissions = [
    'contacts.read', 'contacts.write',
    'conversations.read', 'messages.read',
    'deals.read', 'deals.write',
  ];

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeysAPI.list,
  });

  const generateMutation = useMutation({
    mutationFn: () => apiKeysAPI.generate(form.name, form.permissions),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setNewKey(data.rawKey);
      toast.success('API Key generada');
      setShowForm(false);
      setForm({ name: '', permissions: [] });
    },
    onError: () => toast.error('Error al generar API key'),
  });

  const revokeMutation = useMutation({
    mutationFn: apiKeysAPI.revoke,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API Key revocada');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiKeysAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API Key eliminada');
    },
  });

  const togglePerm = (perm: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Genera API keys para integrar con sistemas externos</p>
        <button onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          + Nueva API Key
        </button>
      </div>

      {newKey && (
        <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Tu nueva API Key (se muestra solo una vez):</h4>
          <code className="block bg-white p-3 rounded border text-sm break-all">{newKey}</code>
          <button onClick={() => { navigator.clipboard.writeText(newKey); toast.success('Copiada'); }}
            className="mt-2 text-sm text-indigo-600 hover:underline">Copiar al portapapeles</button>
          <button onClick={() => setNewKey(null)}
            className="mt-2 ml-4 text-sm text-gray-500 hover:underline">Cerrar</button>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Nueva API Key</h3>
          <div className="space-y-3">
            <input type="text" placeholder="Nombre (ej: Integracion CRM)" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permisos</label>
              <div className="flex flex-wrap gap-2">
                {availablePermissions.map(perm => (
                  <button key={perm} type="button"
                    onClick={() => togglePerm(perm)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      form.permissions.includes(perm) ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                    {perm}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending || !form.name}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {generateMutation.isPending ? 'Generando...' : 'Generar Key'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : !keys?.length ? (
        <div className="text-center py-12 text-gray-500">No hay API Keys</div>
      ) : (
        <div className="space-y-3">
          {keys.map((key: any) => (
            <div key={key.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{key.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${key.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {key.isActive ? 'Activa' : 'Revocada'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-mono">{key.prefix}...</p>
                <div className="flex gap-1 mt-1">
                  {key.permissions?.map((p: string) => (
                    <span key={p} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">{p}</span>
                  ))}
                </div>
                {key.lastUsedAt && (
                  <p className="text-xs text-gray-400 mt-1">Ultimo uso: {new Date(key.lastUsedAt).toLocaleString()}</p>
                )}
              </div>
              <div className="flex gap-2">
                {key.isActive && (
                  <button onClick={() => { if (confirm('Revocar esta key?')) revokeMutation.mutate(key.id); }}
                    className="text-sm text-yellow-600 hover:underline">Revocar</button>
                )}
                <button onClick={() => { if (confirm('Eliminar?')) deleteMutation.mutate(key.id); }}
                  className="text-sm text-red-600 hover:underline">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
