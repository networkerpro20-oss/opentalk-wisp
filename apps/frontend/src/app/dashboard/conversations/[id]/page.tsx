'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsAPI, whatsappAPI } from '@/lib/api-extended';
import { connectSocket, getSocket } from '@/lib/socket';
import { toast } from 'sonner';
import { Paperclip, ChevronDown, ChevronUp } from 'lucide-react';
import { InternalNotesPanel } from '@/components/internal-notes/InternalNotesPanel';
import { AISuggestions } from '@/components/ai/AISuggestions';
import MediaUpload from '@/components/MediaUpload';

export default function ConversationDetailPage({ params }: { params: { id: string } }) {
  const [message, setMessage] = useState('');
  const [showMedia, setShowMedia] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversation, isLoading } = useQuery({
    queryKey: ['conversation', params.id],
    queryFn: () => conversationsAPI.get(params.id),
    refetchInterval: 5000, // Refresh every 5 seconds
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
    onError: () => {
      toast.error('Error al enviar mensaje');
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMutation.mutate(message);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  // WebSocket: listen for new messages in real-time
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando conversación...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Conversación no encontrada</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow">
      {/* Sidebar - Contact Info */}
      <div className="w-80 border-r border-gray-200 p-6">
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
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Estado</label>
            <span className={`mt-1 block px-3 py-2 rounded-lg text-sm ${
              conversation.status === 'OPEN' ? 'bg-green-100 text-green-700' :
              conversation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
              conversation.status === 'RESOLVED' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {conversation.status}
            </span>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Canal</label>
            <div className="mt-1 text-sm text-gray-900">{conversation.channel}</div>
          </div>

          {conversation.assignedTo && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Asignado a</label>
              <div className="mt-1 text-sm text-gray-900">{conversation.assignedTo.name}</div>
            </div>
          )}

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
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {conversation.messages.map((msg: any) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-md rounded-lg px-4 py-2 ${
                msg.direction === 'OUTBOUND'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <div className={`mt-1 text-xs ${
                  msg.direction === 'OUTBOUND' ? 'text-indigo-200' : 'text-gray-500'
                }`}>
                  {new Date(msg.createdAt).toLocaleString('es', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {msg.direction === 'OUTBOUND' && msg.status && (
                    <span className="ml-2">
                      {msg.status === 'READ' && '✓✓'}
                      {msg.status === 'DELIVERED' && '✓'}
                      {msg.status === 'SENT' && '✓'}
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
        </div>
      </div>
    </div>
  );
}
