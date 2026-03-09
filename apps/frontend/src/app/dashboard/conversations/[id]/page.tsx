'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsAPI, whatsappAPI } from '@/lib/api-extended';
import { usersAPI } from '@/lib/api';
import { connectSocket, getSocket } from '@/lib/socket';
import { toast } from 'sonner';
import { Paperclip, ChevronDown, ChevronUp, FileText, Download, TrendingUp, ExternalLink } from 'lucide-react';
import { InternalNotesPanel } from '@/components/internal-notes/InternalNotesPanel';
import { AISuggestions } from '@/components/ai/AISuggestions';
import MediaUpload from '@/components/MediaUpload';

const ImageEditorModal = dynamic(
  () => import('@/components/image-editor/ImageEditorModal'),
  { ssr: false }
);

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Abierta', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'PENDING', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'RESOLVED', label: 'Resuelta', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'CLOSED', label: 'Cerrada', color: 'bg-gray-100 text-gray-700 border-gray-300' },
];

const DISPOSITION_OPTIONS = [
  { value: '', label: 'Sin clasificar' },
  { value: 'PROSPECT', label: 'Prospecto' },
  { value: 'CONTACTED', label: 'Contactado' },
  { value: 'QUALIFIED', label: 'Calificado' },
  { value: 'CLIENT', label: 'Cliente' },
  { value: 'SUPPORT_PENDING', label: 'Soporte Pendiente' },
  { value: 'SUPPORT_RESOLVED', label: 'Soporte Resuelto' },
  { value: 'NOT_INTERESTED', label: 'No Interesado' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'FOLLOW_UP', label: 'Seguimiento' },
  { value: 'OTHER', label: 'Otro' },
];

export default function ConversationDetailPage({ params }: { params: { id: string } }) {
  const [message, setMessage] = useState('');
  const [showMedia, setShowMedia] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [dispositionNote, setDispositionNote] = useState('');
  const [showDispositionNote, setShowDispositionNote] = useState(false);
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [showPasteEditor, setShowPasteEditor] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversation, isLoading } = useQuery({
    queryKey: ['conversation', params.id],
    queryFn: () => conversationsAPI.get(params.id),
    refetchInterval: 5000,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: usersAPI.list,
  });

  const updateMutation = useMutation({
    mutationFn: (updateData: any) => conversationsAPI.update(params.id, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', params.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Conversacion actualizada');
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const assignMutation = useMutation({
    mutationFn: (userId: string) => conversationsAPI.assign(params.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', params.id] });
      toast.success('Agente asignado');
    },
    onError: () => toast.error('Error al asignar'),
  });

  const sendMutation = useMutation({
    mutationFn: async (messageText: string) => {
      if (!conversation?.whatsappInstance?.id) {
        throw new Error('No WhatsApp instance');
      }
      return whatsappAPI.sendMessage({
        instanceId: conversation.whatsappInstance.id,
        to: conversation.contact.phone,
        message: messageText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', params.id] });
      setMessage('');
      toast.success('Mensaje enviado');
    },
    onError: () => toast.error('Error al enviar mensaje'),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMutation.mutate(message);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    updateMutation.mutate({ status: newStatus });
  };

  const handleDispositionChange = (newDisposition: string) => {
    updateMutation.mutate({
      disposition: newDisposition || null,
    });
  };

  const handleDispositionNoteSave = () => {
    updateMutation.mutate({ dispositionNote });
    setShowDispositionNote(false);
  };

  const handleAssign = (userId: string) => {
    if (userId) {
      assignMutation.mutate(userId);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  useEffect(() => {
    if (conversation?.dispositionNote) {
      setDispositionNote(conversation.dispositionNote);
    }
  }, [conversation?.dispositionNote]);

  useEffect(() => {
    connectSocket();
    const socket = getSocket();

    const handleNewMessage = (msg: any) => {
      if (msg.conversationId === params.id) {
        queryClient.invalidateQueries({ queryKey: ['conversation', params.id] });
      }
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [params.id, queryClient]);

  // Handle Ctrl+V paste of images from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) return;

          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            setPastedImage(base64);
            setShowPasteEditor(true);
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const handlePasteEditorConfirm = useCallback(async (editedBase64: string, caption: string) => {
    if (!conversation?.whatsappInstance?.id) return;
    try {
      await whatsappAPI.sendMedia({
        instanceId: conversation.whatsappInstance.id,
        to: conversation.contact.phone,
        type: 'image',
        mediaUrl: editedBase64,
        caption: caption || undefined,
        mimeType: 'image/jpeg',
      });
      queryClient.invalidateQueries({ queryKey: ['conversation', params.id] });
      setPastedImage(null);
      setShowPasteEditor(false);
      toast.success('Imagen enviada');
    } catch {
      toast.error('Error al enviar imagen');
    }
  }, [conversation, queryClient, params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando conversacion...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Conversacion no encontrada</p>
      </div>
    );
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.value === conversation.status);
  const currentDisposition = DISPOSITION_OPTIONS.find(d => d.value === (conversation.disposition || ''));
  const usersList = Array.isArray(users) ? users : users?.data || [];

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow">
      {/* Sidebar - Contact Info & Controls */}
      <div className="w-80 border-r border-gray-200 p-6 overflow-y-auto">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 font-medium text-2xl">
              {conversation.contact.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {conversation.contact.name}
            </h2>
            <p className="text-sm text-gray-500">{conversation.contact.phone}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Estado - Dropdown interactivo */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Estado</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={updateMutation.isPending}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    conversation.status === opt.value
                      ? opt.color + ' ring-2 ring-offset-1 ring-indigo-400'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Disposicion / Proceso */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Proceso / Clasificacion</label>
            <select
              value={conversation.disposition || ''}
              onChange={e => handleDispositionChange(e.target.value)}
              disabled={updateMutation.isPending}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {DISPOSITION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {conversation.disposition && (
              <div className="mt-1">
                <button
                  onClick={() => setShowDispositionNote(!showDispositionNote)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  {showDispositionNote ? 'Ocultar nota' : (conversation.dispositionNote ? 'Ver/editar nota' : '+ Agregar nota')}
                </button>
                {showDispositionNote && (
                  <div className="mt-1 space-y-1">
                    <textarea
                      value={dispositionNote}
                      onChange={e => setDispositionNote(e.target.value)}
                      placeholder="Nota sobre la clasificacion..."
                      className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                      rows={2}
                    />
                    <button
                      onClick={handleDispositionNoteSave}
                      className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700"
                    >
                      Guardar nota
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Deal vinculado */}
          {conversation.deal && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700 uppercase">Deal vinculado</span>
                </div>
                <a
                  href={`/dashboard/deals`}
                  className="text-emerald-600 hover:text-emerald-800"
                  title="Ver en pipeline"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
              <p className="text-sm font-medium text-gray-900 truncate">{conversation.deal.title}</p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                {conversation.deal.pipeline && (
                  <span className="text-xs text-gray-500">{conversation.deal.pipeline.name}</span>
                )}
                {conversation.deal.stage && (
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: conversation.deal.stage.color ? `${conversation.deal.stage.color}20` : '#e0e7ff',
                      color: conversation.deal.stage.color || '#4338ca',
                    }}
                  >
                    {conversation.deal.stage.name}
                  </span>
                )}
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  conversation.deal.status === 'WON' ? 'bg-green-100 text-green-700' :
                  conversation.deal.status === 'LOST' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {conversation.deal.status === 'WON' ? 'Ganado' :
                   conversation.deal.status === 'LOST' ? 'Perdido' : 'Abierto'}
                </span>
              </div>
              {conversation.deal.value > 0 && (
                <p className="mt-1 text-sm font-semibold text-emerald-700">
                  {conversation.deal.currency || 'USD'} {Number(conversation.deal.value).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Asignar Agente */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Asignado a</label>
            <select
              value={conversation.assignedToId || ''}
              onChange={e => handleAssign(e.target.value)}
              disabled={assignMutation.isPending}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Sin asignar</option>
              {usersList.map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Canal */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Canal</label>
            <div className="mt-1 text-sm text-gray-900">{conversation.channel}</div>
          </div>

          {conversation.contact.email && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
              <div className="mt-1 text-sm text-gray-900">{conversation.contact.email}</div>
            </div>
          )}

          {conversation.contact.company && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Empresa</label>
              <div className="mt-1 text-sm text-gray-900">{conversation.contact.company}</div>
            </div>
          )}

          {/* AI Info */}
          {conversation.aiHandled && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-purple-700">IA manejando</span>
                {!conversation.aiTakenOverAt && (
                  <button
                    onClick={() => updateMutation.mutate({
                      status: 'OPEN',
                    })}
                    className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded hover:bg-purple-700"
                  >
                    Tomar control
                  </button>
                )}
              </div>
              {conversation.sentiment && (
                <p className="text-xs text-purple-600">Sentimiento: {conversation.sentiment}</p>
              )}
            </div>
          )}

          {/* Timestamps */}
          {conversation.resolvedAt && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Resuelta</label>
              <div className="mt-1 text-xs text-gray-600">
                {new Date(conversation.resolvedAt).toLocaleString()}
              </div>
            </div>
          )}
          {conversation.closedAt && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Cerrada</label>
              <div className="mt-1 text-xs text-gray-600">
                {new Date(conversation.closedAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Acciones rapidas */}
        <div className="mt-6 border-t pt-4 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase">Acciones Rapidas</p>
          <div className="grid grid-cols-2 gap-2">
            {conversation.status !== 'RESOLVED' && (
              <button
                onClick={() => handleStatusChange('RESOLVED')}
                className="px-3 py-2 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
              >
                Resolver
              </button>
            )}
            {conversation.status !== 'CLOSED' && (
              <button
                onClick={() => handleStatusChange('CLOSED')}
                className="px-3 py-2 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
              >
                Cerrar
              </button>
            )}
            {(conversation.status === 'RESOLVED' || conversation.status === 'CLOSED') && (
              <button
                onClick={() => handleStatusChange('OPEN')}
                className="px-3 py-2 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition"
              >
                Reabrir
              </button>
            )}
            {conversation.status === 'OPEN' && (
              <button
                onClick={() => handleStatusChange('PENDING')}
                className="px-3 py-2 text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition"
              >
                En Espera
              </button>
            )}
          </div>
        </div>

        {/* Internal Notes - Collapsible */}
        <div className="mt-6 border-t pt-4">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Notas Internas
            {showNotes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showNotes && (
            <div className="mt-3 -mx-2">
              <InternalNotesPanel conversationId={params.id} />
            </div>
          )}
        </div>
      </div>

      {/* Main - Messages */}
      <div className="flex-1 flex flex-col">
        {/* Header bar with status */}
        <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-gray-900">{conversation.contact.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentStatus?.color || ''}`}>
              {currentStatus?.label}
            </span>
            {currentDisposition && currentDisposition.value && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                {currentDisposition.label}
              </span>
            )}
          </div>
          {conversation.assignedTo && (
            <span className="text-xs text-gray-500">
              Agente: {conversation.assignedTo.firstName} {conversation.assignedTo.lastName}
            </span>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {(conversation.messages ?? []).map((msg: any) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-md rounded-lg px-4 py-2 ${
                msg.direction === 'OUTBOUND'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {msg.type === 'IMAGE' && msg.mediaUrl ? (
                  <img
                    src={msg.mediaUrl}
                    alt={msg.content || 'Imagen'}
                    className="max-w-xs rounded-lg cursor-pointer"
                    onClick={() => window.open(msg.mediaUrl, '_blank')}
                  />
                ) : msg.type === 'VIDEO' && msg.mediaUrl ? (
                  <video controls className="max-w-xs rounded-lg" preload="metadata">
                    <source src={msg.mediaUrl} />
                  </video>
                ) : msg.type === 'AUDIO' && msg.mediaUrl ? (
                  <audio controls src={msg.mediaUrl} className="max-w-[250px]" preload="metadata" />
                ) : msg.type === 'DOCUMENT' && msg.mediaUrl ? (
                  <a
                    href={msg.mediaUrl}
                    download={msg.content || 'documento'}
                    className={`flex items-center gap-2 text-sm underline ${
                      msg.direction === 'OUTBOUND' ? 'text-indigo-100' : 'text-indigo-600'
                    }`}
                  >
                    <FileText size={18} />
                    <span>{msg.content || 'Documento'}</span>
                    <Download size={14} />
                  </a>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
                <div className={`mt-1 text-xs ${
                  msg.direction === 'OUTBOUND' ? 'text-indigo-200' : 'text-gray-500'
                }`}>
                  {new Date(msg.createdAt).toLocaleString('es', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {msg.direction === 'OUTBOUND' && msg.status && (
                    <span className="ml-2">
                      {msg.status === 'READ' && '\u2713\u2713'}
                      {msg.status === 'DELIVERED' && '\u2713'}
                      {msg.status === 'SENT' && '\u2713'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Media Upload (toggleable) */}
        {showMedia && conversation?.whatsappInstance?.id && (
          <div className="border-t border-gray-200 px-4 pt-3">
            <MediaUpload
              instanceId={conversation.whatsappInstance.id}
              recipientPhone={conversation.contact.phone}
              onSuccess={() => {
                setShowMedia(false);
                queryClient.invalidateQueries({ queryKey: ['conversation', params.id] });
              }}
            />
          </div>
        )}

        {/* Send Message Form */}
        <div className="border-t border-gray-200 p-4">
          {conversation.status === 'CLOSED' ? (
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Esta conversacion esta cerrada</p>
              <button
                onClick={() => handleStatusChange('OPEN')}
                className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700"
              >
                Reabrir
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowMedia(!showMedia)}
                className={`p-2 rounded-lg transition ${showMedia ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-500'}`}
                title="Adjuntar archivo"
              >
                <Paperclip size={20} />
              </button>
              <AISuggestions
                conversationId={params.id}
                onSelectSuggestion={(text) => setMessage(text)}
              />
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={sendMutation.isPending}
              />
              <button
                type="submit"
                disabled={!message.trim() || sendMutation.isPending}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendMutation.isPending ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          )}
        </div>
      </div>
      {/* Image Editor for pasted images (Ctrl+V) */}
      {pastedImage && (
        <ImageEditorModal
          imageSrc={pastedImage}
          isOpen={showPasteEditor}
          onClose={() => { setShowPasteEditor(false); setPastedImage(null); }}
          onConfirm={handlePasteEditorConfirm}
        />
      )}
    </div>
  );
}
