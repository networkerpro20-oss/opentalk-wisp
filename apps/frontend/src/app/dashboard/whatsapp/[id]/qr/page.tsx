'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { whatsappAPI } from '@/lib/api-extended';

export default function QRCodePage({ params }: { params: { id: string } }) {
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  const { data: instance, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-qr', params.id],
    queryFn: () => whatsappAPI.getQRCode(params.id),
    refetchInterval: 3000, // Refresh every 3 seconds to get new QR before expiry
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refetch();
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Auto-redirect when connected
  useEffect(() => {
    if (instance?.status === 'CONNECTED') {
      const timer = setTimeout(() => {
        router.push('/dashboard/whatsapp');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [instance?.status, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando código QR...</div>
      </div>
    );
  }

  if (instance?.status === 'CONNECTED') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-green-100 text-green-700 p-8 rounded-lg mb-6">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-2">¡Conectado!</h2>
          <p className="text-green-600">
            Tu instancia de WhatsApp está conectada y lista para usar
          </p>
          {instance.phone && (
            <p className="mt-4 text-lg font-semibold">{instance.phone}</p>
          )}
          <p className="text-sm text-green-600 mt-2">
            Redirigiendo automáticamente en 3 segundos...
          </p>
        </div>
        <Link
          href="/dashboard/whatsapp"
          className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          Volver a Instancias
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Conectar WhatsApp
          </h1>
          <p className="text-gray-600">
            Escanea este código QR con tu WhatsApp
          </p>
        </div>

        {instance?.qrCode ? (
          <div className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center bg-gray-50 p-8 rounded-lg">
              <div className="bg-white p-4 rounded-lg shadow-md border-2 border-gray-200">
                {/* Usar img nativo para Data URLs en lugar de Next Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={instance.qrCode}
                  alt="QR Code"
                  width={300}
                  height={300}
                  className="w-72 h-72"
                  key={instance.qrCode} // Force re-render when QR changes
                />
              </div>
            </div>

            {/* Auto-refresh countdown */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-full">
                <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Actualizando en {countdown} segundos...</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">
                Cómo conectar:
              </h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li>1. Abre WhatsApp en tu teléfono</li>
                <li>2. Ve a Configuración → Dispositivos vinculados</li>
                <li>3. Toca &quot;Vincular un dispositivo&quot;</li>
                <li>4. Escanea este código QR</li>
              </ol>
            </div>

            {/* Status */}
            <div className="text-center">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-yellow-100 text-yellow-700">
                <span className="animate-pulse mr-2">●</span>
                Esperando escaneo...
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              No hay código QR disponible
            </p>
            <button
              onClick={() => refetch()}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/dashboard/whatsapp"
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            ← Volver a instancias
          </Link>
        </div>
      </div>
    </div>
  );
}
