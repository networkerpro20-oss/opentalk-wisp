'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { conversationsAPI } from '@/lib/api-extended';

export default function ConversationsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ['conversations', selectedStatus],
    queryFn: () => conversationsAPI.list({ status: selectedStatus === 'all' ? undefined : selectedStatus }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando conversaciones...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Conversaciones</h1>
        <p className="text-gray-600">Gestiona tus conversaciones con clientes</p>
      </div>

      {/* Status Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex space-x-2">
          {([
            { value: 'all', label: 'Todas' },
            { value: 'OPEN', label: 'Abiertas' },
            { value: 'PENDING', label: 'Pendientes' },
            { value: 'RESOLVED', label: 'Resueltas' },
            { value: 'CLOSED', label: 'Cerradas' },
          ]).map((s) => (
            <button
              key={s.value}
              onClick={() => setSelectedStatus(s.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === s.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {(conversationsData?.data ?? []).length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay conversaciones
          </div>
        ) : (
          (conversationsData?.data ?? []).map((conversation: any) => (
            <a
              key={conversation.id}
              href={`/dashboard/conversations/${conversation.id}`}
              className="block p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-medium text-lg">
                      {conversation.contact?.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {conversation.contact?.name || 'Contacto sin nombre'}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(conversation.lastMessageAt || conversation.createdAt).toLocaleString('es', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        conversation.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                        conversation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        conversation.status === 'RESOLVED' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {conversation.status}
                      </span>
                      
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                        {conversation.channel}
                      </span>
                      
                      {conversation.disposition && (
                        <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                          {conversation.disposition.replace(/_/g, ' ')}
                        </span>
                      )}

                      {conversation.assignedTo && (
                        <span className="text-xs text-gray-500">
                          {conversation.assignedTo.firstName} {conversation.assignedTo.lastName}
                        </span>
                      )}
                    </div>
                    
                    {conversation.messages?.[0] && (
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.messages[0].type === 'IMAGE' ? '📷 Imagen' :
                         conversation.messages[0].type === 'VIDEO' ? '🎥 Video' :
                         conversation.messages[0].type === 'AUDIO' ? '🎵 Audio' :
                         conversation.messages[0].type === 'DOCUMENT' ? '📎 Documento' :
                         conversation.messages[0].content}
                      </p>
                    )}
                  </div>
                </div>
                
                {conversation._count?.messages > 0 && (
                  <div className="ml-4 text-xs text-gray-500">
                    {conversation._count.messages} mensajes
                  </div>
                )}
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
