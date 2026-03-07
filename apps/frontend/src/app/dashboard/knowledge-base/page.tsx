'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { knowledgeBaseAPI, KnowledgeItem } from '@/lib/api-knowledge-base';
import { toast } from 'sonner';

type Tab = 'items' | 'config' | 'wizard' | 'test';

export default function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<Tab>('items');
  const [showAddModal, setShowAddModal] = useState<null | 'manual' | 'url' | 'document'>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: kb, isLoading: kbLoading } = useQuery({
    queryKey: ['knowledge-base'],
    queryFn: knowledgeBaseAPI.getConfig,
  });

  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['kb-items', page, search],
    queryFn: () => knowledgeBaseAPI.listItems({ page, limit: 20, search: search || undefined }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Base de Conocimiento</h1>
          <p className="text-gray-600">
            Gestiona la informacion que tu IA usa para responder
            {kb?._count?.items !== undefined && (
              <span className="ml-2 text-indigo-600 font-medium">
                ({kb._count.items} items)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {([
            { id: 'items' as Tab, label: 'Items de Conocimiento' },
            { id: 'config' as Tab, label: 'Configuracion IA' },
            { id: 'wizard' as Tab, label: 'Asistente de Creacion' },
            { id: 'test' as Tab, label: 'Probar Respuesta' },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'items' && (
        <ItemsTab
          items={itemsData?.data || []}
          meta={itemsData?.meta}
          isLoading={itemsLoading}
          search={search}
          onSearchChange={setSearch}
          page={page}
          onPageChange={setPage}
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
        />
      )}
      {activeTab === 'config' && <ConfigTab kb={kb} kbLoading={kbLoading} />}
      {activeTab === 'wizard' && <WizardTab />}
      {activeTab === 'test' && <TestTab />}
    </div>
  );
}

// ============================================================
// Items Tab
// ============================================================
function ItemsTab({
  items, meta, isLoading, search, onSearchChange, page, onPageChange, showAddModal, setShowAddModal,
}: {
  items: KnowledgeItem[];
  meta?: { page: number; limit: number; total: number; lastPage: number };
  isLoading: boolean;
  search: string;
  onSearchChange: (s: string) => void;
  page: number;
  onPageChange: (p: number) => void;
  showAddModal: null | 'manual' | 'url' | 'document';
  setShowAddModal: (v: null | 'manual' | 'url' | 'document') => void;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: knowledgeBaseAPI.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-items'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      toast.success('Item eliminado');
    },
  });

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Buscar items..."
          value={search}
          onChange={(e) => { onSearchChange(e.target.value); onPageChange(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal('manual')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            + Manual
          </button>
          <button
            onClick={() => setShowAddModal('url')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            + Desde URL
          </button>
          <button
            onClick={() => setShowAddModal('document')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Documento
          </button>
        </div>
      </div>

      {/* Items list */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Cargando items...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay items en tu base de conocimiento</p>
          <p className="text-gray-400 mt-2">Agrega items manualmente, desde una URL, documento o usa el asistente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    {item.category && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                        {item.category}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      item.sourceType === 'URL' ? 'bg-green-100 text-green-700' :
                      item.sourceType === 'DOCUMENT' ? 'bg-blue-100 text-blue-700' :
                      item.sourceType === 'WIZARD' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.sourceType}
                    </span>
                    <span className="text-xs text-gray-400">Prioridad: {item.priority}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{item.content}</p>
                  {item.keywords.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {item.keywords.slice(0, 5).map(kw => (
                        <span key={kw} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Eliminar este item?')) {
                      deleteMutation.mutate(item.id);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 ml-4 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-3 py-1 text-gray-600">
            {meta.page} de {meta.lastPage}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= meta.lastPage}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Add modals */}
      {showAddModal === 'manual' && <AddManualModal onClose={() => setShowAddModal(null)} />}
      {showAddModal === 'url' && <AddFromUrlModal onClose={() => setShowAddModal(null)} />}
      {showAddModal === 'document' && <AddFromDocumentModal onClose={() => setShowAddModal(null)} />}
    </div>
  );
}

// ============================================================
// Add Manual Modal
// ============================================================
function AddManualModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ title: '', content: '', category: '', priority: 5, keywords: '' });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => knowledgeBaseAPI.addItem({
      ...form,
      keywords: form.keywords ? form.keywords.split(',').map(k => k.trim()) : [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-items'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      toast.success('Item agregado');
      onClose();
    },
    onError: () => toast.error('Error al agregar item'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Agregar Item Manual</h2>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titulo</label>
            <input type="text" required value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
            <textarea required rows={4} value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="">General</option>
                <option value="FAQ">FAQ</option>
                <option value="Producto">Producto</option>
                <option value="Precio">Precio</option>
                <option value="Politica">Politica</option>
                <option value="Horario">Horario</option>
                <option value="Contacto">Contacto</option>
                <option value="Servicio">Servicio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad (1-10)</label>
              <input type="number" min={1} max={10} value={form.priority}
                onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 5 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Palabras clave (separadas por coma)</label>
            <input type="text" value={form.keywords}
              onChange={e => setForm({ ...form, keywords: e.target.value })}
              placeholder="precio, servicio, horario"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Add From URL Modal
// ============================================================
function AddFromUrlModal({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => knowledgeBaseAPI.generateFromUrl(url),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kb-items'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      toast.success(`Se generaron ${data.count} items desde la URL`);
      onClose();
    },
    onError: () => toast.error('Error al procesar la URL'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Generar desde URL</h2>
        <p className="text-sm text-gray-500 mb-4">
          La IA extraera contenido de la pagina web y generara items de conocimiento automaticamente.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL del sitio web</label>
            <input type="url" required value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://ejemplo.com/sobre-nosotros"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {mutation.isPending ? 'Procesando...' : 'Generar Items'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Add From Document Modal
// ============================================================
function AddFromDocumentModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => knowledgeBaseAPI.generateFromDocument(file!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kb-items'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      toast.success(`Se generaron ${data.count} items desde el documento`);
      onClose();
    },
    onError: () => toast.error('Error al procesar el documento'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Generar desde Documento</h2>
        <p className="text-sm text-gray-500 mb-4">
          Sube un archivo PDF, TXT o CSV. La IA extraera contenido y generara items de conocimiento.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); if (file) mutation.mutate(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Archivo</label>
            <input type="file" accept=".pdf,.txt,.csv"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending || !file}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {mutation.isPending ? 'Procesando...' : 'Generar Items'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Config Tab
// ============================================================
function ConfigTab({ kb, kbLoading }: { kb: any; kbLoading: boolean }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    personality: 'PROFESSIONAL',
    confidenceThreshold: 0.7,
    autoResponseEnabled: false,
    outsideHoursMessage: '',
  });
  const [initialized, setInitialized] = useState(false);
  const queryClient = useQueryClient();

  if (kb && !initialized) {
    setForm({
      name: kb.name || '',
      description: kb.description || '',
      systemPrompt: kb.systemPrompt || '',
      personality: kb.personality || 'PROFESSIONAL',
      confidenceThreshold: kb.confidenceThreshold ?? 0.7,
      autoResponseEnabled: kb.autoResponseEnabled ?? false,
      outsideHoursMessage: kb.outsideHoursMessage || '',
    });
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: () => knowledgeBaseAPI.updateConfig(form as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      toast.success('Configuracion guardada');
    },
    onError: () => toast.error('Error al guardar configuracion'),
  });

  if (kbLoading) return <div className="text-center py-12 text-gray-500">Cargando configuracion...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Configuracion del Agente IA</h2>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Base</label>
          <input type="text" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
          <input type="text" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prompt del Sistema (instrucciones para la IA)</label>
          <textarea rows={4} value={form.systemPrompt}
            onChange={e => setForm({ ...form, systemPrompt: e.target.value })}
            placeholder="Ej: Eres el asistente de Mi Empresa. Solo responde sobre nuestros productos..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personalidad</label>
            <select value={form.personality}
              onChange={e => setForm({ ...form, personality: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              <option value="PROFESSIONAL">Profesional</option>
              <option value="FRIENDLY">Amigable</option>
              <option value="AGGRESSIVE">Vendedor Proactivo</option>
              <option value="EDUCATIONAL">Educativo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Umbral de Confianza: {form.confidenceThreshold}
            </label>
            <input type="range" min={0} max={1} step={0.05} value={form.confidenceThreshold}
              onChange={e => setForm({ ...form, confidenceThreshold: parseFloat(e.target.value) })}
              className="w-full" />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Responde mas</span>
              <span>Mas estricto</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="autoResponse" checked={form.autoResponseEnabled}
            onChange={e => setForm({ ...form, autoResponseEnabled: e.target.checked })}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          <label htmlFor="autoResponse" className="text-sm text-gray-700">
            Habilitar respuesta automatica por IA
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje fuera de horario</label>
          <input type="text" value={form.outsideHoursMessage}
            onChange={e => setForm({ ...form, outsideHoursMessage: e.target.value })}
            placeholder="Estamos fuera de horario, te responderemos pronto."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <button type="submit" disabled={mutation.isPending}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {mutation.isPending ? 'Guardando...' : 'Guardar Configuracion'}
        </button>
      </form>
    </div>
  );
}

// ============================================================
// Wizard Tab
// ============================================================
function WizardTab() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    businessName: '', mainActivity: '', servicesAndPricing: '',
    operatingHours: '', location: '', frequentQuestions: '',
    differentiators: '', policies: '', experience: '', contactMethods: '',
  });
  const queryClient = useQueryClient();

  const questions = [
    { key: 'businessName', label: 'Cual es el nombre de tu negocio?', placeholder: 'Ej: Mi Tienda Online' },
    { key: 'mainActivity', label: 'A que se dedica tu negocio?', placeholder: 'Ej: Venta de ropa deportiva por internet' },
    { key: 'servicesAndPricing', label: 'Cuales son tus productos/servicios y precios?', placeholder: 'Ej: Camisetas desde $20, Pantalones desde $35...' },
    { key: 'operatingHours', label: 'Cual es tu horario de atencion?', placeholder: 'Ej: Lunes a Viernes 9am-6pm, Sabados 10am-2pm' },
    { key: 'location', label: 'Donde estas ubicado?', placeholder: 'Ej: Ciudad de Mexico, envios a todo el pais' },
    { key: 'frequentQuestions', label: 'Cuales son las preguntas mas frecuentes de tus clientes?', placeholder: 'Ej: Hacen envios? Aceptan devoluciones? Cuanto tarda el envio?' },
    { key: 'differentiators', label: 'Que te diferencia de la competencia?', placeholder: 'Ej: Envio gratis en compras mayores a $50, calidad premium' },
    { key: 'policies', label: 'Cuales son tus politicas? (devoluciones, garantia, etc.)', placeholder: 'Ej: 30 dias de devolucion, garantia de 1 ano...' },
    { key: 'experience', label: 'Cuanta experiencia tienes y que logros destacas?', placeholder: 'Ej: 5 anos de experiencia, +10,000 clientes satisfechos' },
    { key: 'contactMethods', label: 'Cuales son tus metodos de contacto?', placeholder: 'Ej: WhatsApp 55-1234-5678, email info@mitienda.com' },
  ];

  const mutation = useMutation({
    mutationFn: () => knowledgeBaseAPI.generateFromWizard(form),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kb-items'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      toast.success(`Se generaron ${data.count} items de conocimiento`);
      setStep(0);
      setForm({
        businessName: '', mainActivity: '', servicesAndPricing: '',
        operatingHours: '', location: '', frequentQuestions: '',
        differentiators: '', policies: '', experience: '', contactMethods: '',
      });
    },
    onError: () => toast.error('Error al generar base de conocimiento'),
  });

  const currentQ = questions[step];
  const currentKey = currentQ?.key as keyof typeof form;
  const isLast = step === questions.length - 1;
  const progress = ((step + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Asistente de Creacion de Base de Conocimiento</h2>
        <p className="text-sm text-gray-500 mb-6">
          Responde 10 preguntas y la IA generara tu base de conocimiento automaticamente.
        </p>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Pregunta {step + 1} de {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{currentQ.label}</label>
          <textarea rows={3}
            value={form[currentKey]}
            onChange={e => setForm({ ...form, [currentKey]: e.target.value })}
            placeholder={currentQ.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          {isLast ? (
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Generando...' : 'Generar Base de Conocimiento'}
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Test Tab
// ============================================================
function TestTab() {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: () => knowledgeBaseAPI.testResponse(message),
    onSuccess: (data) => setResult(data),
    onError: () => toast.error('Error al probar respuesta'),
  });

  return (
    <div className="max-w-2xl">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Probar Respuesta de IA</h2>
        <p className="text-sm text-gray-500 mb-4">
          Escribe un mensaje como si fueras un cliente y ve como responde tu IA con la base de conocimiento.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <textarea rows={3} value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Ej: Hola, cuales son sus precios?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          <button type="submit" disabled={mutation.isPending || !message.trim()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {mutation.isPending ? 'Generando...' : 'Probar Respuesta'}
          </button>
        </form>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Respuesta de la IA:</h3>
            <p className="text-gray-800 mb-3">{result.response}</p>
            <div className="flex gap-4 text-sm">
              <span className={`font-medium ${
                result.confidence >= 0.7 ? 'text-green-600' :
                result.confidence >= 0.4 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                Confianza: {Math.round(result.confidence * 100)}%
              </span>
              {result.needsHumanReview && (
                <span className="text-orange-600 font-medium">Requiere revision humana</span>
              )}
            </div>
            {result.suggestedActions?.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Acciones sugeridas:</span>
                <div className="flex gap-1 mt-1">
                  {result.suggestedActions.map((a: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
