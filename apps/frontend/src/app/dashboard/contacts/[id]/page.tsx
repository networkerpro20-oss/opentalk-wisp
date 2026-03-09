'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsAPI } from '@/lib/api-extended';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ContactDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', params.id],
    queryFn: () => contactsAPI.get(params.id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => contactsAPI.update(params.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', params.id] });
      setIsEditing(false);
      toast.success('Contacto actualizado');
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const handleEdit = () => {
    setEditData({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      position: contact.position || '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando contacto...</div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Contacto no encontrado</p>
        <Link href="/dashboard/contacts" className="text-indigo-600 hover:underline mt-2 inline-block">
          Volver a contactos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
            &larr; Volver
          </button>
          <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 font-bold text-2xl">
              {contact.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
            <p className="text-gray-500">{contact.phone}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Editar
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Guardar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacion</h2>
          {isEditing ? (
            <div className="space-y-4">
              {['name', 'email', 'phone', 'company', 'position'].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-500 capitalize">{field}</label>
                  <input
                    type="text"
                    value={editData[field] || ''}
                    onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Email', value: contact.email },
                { label: 'Telefono', value: contact.phone },
                { label: 'Empresa', value: contact.company },
                { label: 'Posicion', value: contact.position },
                { label: 'Lead Score', value: contact.leadScore != null ? `${contact.leadScore}/100` : null },
                { label: 'Fuente', value: contact.source },
              ].map(({ label, value }) => value && (
                <div key={label}>
                  <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
                  <p className="text-sm text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {contact.tags?.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <span className="text-xs font-medium text-gray-500 uppercase">Tags</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {contact.tags?.map((ct: any) => (
                  <span
                    key={ct.tag.id}
                    className="px-2 py-1 text-xs rounded-full"
                    style={{ backgroundColor: ct.tag.color + '20', color: ct.tag.color }}
                  >
                    {ct.tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Conversations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Conversaciones ({contact.conversations?.length || 0})
          </h2>
          {contact.conversations?.length > 0 ? (
            <div className="space-y-3">
              {contact.conversations?.map((conv: any) => (
                <Link
                  key={conv.id}
                  href={`/dashboard/conversations/${conv.id}`}
                  className="block p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      conv.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                      conv.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      conv.status === 'RESOLVED' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {conv.status}
                    </span>
                    <span className="text-xs text-gray-400">{conv.channel}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {conv._count?.messages || 0} mensajes
                    {conv.lastMessageAt && (
                      <span className="ml-2">
                        - {new Date(conv.lastMessageAt).toLocaleDateString('es')}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin conversaciones</p>
          )}
        </div>

        {/* Deals */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Deals ({contact.deals?.length || 0})
          </h2>
          {contact.deals?.length > 0 ? (
            <div className="space-y-3">
              {contact.deals?.map((deal: any) => (
                <div key={deal.id} className="p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-900">{deal.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      deal.status === 'WON' ? 'bg-green-100 text-green-700' :
                      deal.status === 'LOST' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {deal.status}
                    </span>
                  </div>
                  {deal.value && (
                    <p className="text-sm font-semibold text-indigo-600 mt-1">
                      ${deal.value.toLocaleString()}
                    </p>
                  )}
                  {deal.stage && (
                    <p className="text-xs text-gray-500 mt-1">
                      {deal.pipeline?.name} &rarr; {deal.stage.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin deals</p>
          )}
        </div>
      </div>

      {/* Activities */}
      {contact.activities?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
          <div className="space-y-3">
            {contact.activities?.map((activity: any) => (
              <div key={activity.id} className="flex items-start space-x-3 text-sm">
                <span className="text-gray-400 min-w-[80px]">
                  {new Date(activity.createdAt).toLocaleDateString('es')}
                </span>
                <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600 uppercase">
                  {activity.type}
                </span>
                <span className="text-gray-700">{activity.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
