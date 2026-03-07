'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Users,
  MessageSquare,
  Calendar,
  Settings,
  Send,
} from 'lucide-react';
import { campaignsAPI } from '@/lib/api-campaigns';
import { SegmentBuilder } from '@/components/campaigns/SegmentBuilder';

interface CampaignWizardProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: any;
}

export function CampaignWizard({ isOpen, onClose, campaign }: CampaignWizardProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    description: campaign?.description || '',
    targetSegment: campaign?.targetSegment || {},
    messageTemplate: campaign?.messageTemplate || '',
    mediaUrl: campaign?.mediaUrl || '',
    scheduledAt: campaign?.scheduledAt || '',
    messagesPerMinute: campaign?.messagesPerMinute || 10,
    autoStart: campaign?.autoStart || false,
    aiBrief: campaign?.aiBrief || '',
    aiGeneratedText: campaign?.aiGeneratedText || '',
    campaignMessageType: campaign?.campaignMessageType || 'TEXT',
    audioUrl: campaign?.audioUrl || '',
    ttsVoice: campaign?.ttsVoice || 'alloy',
    variants: campaign?.variants || null,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: campaignsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaña creada exitosamente');
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear campaña');
    },
  });

  const resetForm = () => {
    setStep(1);
    setFormData({
      name: '',
      description: '',
      targetSegment: {},
      messageTemplate: '',
      mediaUrl: '',
      scheduledAt: '',
      messagesPerMinute: 10,
      autoStart: false,
      aiBrief: '',
      aiGeneratedText: '',
      campaignMessageType: 'TEXT',
      audioUrl: '',
      ttsVoice: 'alloy',
      variants: null,
    });
    setAudioPreview(null);
  };

  const handleGenerateMessage = async () => {
    if (!formData.aiBrief.trim()) {
      toast.error('Escribe un brief para generar el mensaje');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await campaignsAPI.generateMessage(formData.aiBrief);
      setFormData({
        ...formData,
        messageTemplate: result.message,
        aiGeneratedText: result.message,
        variants: result.variants || null,
      });
      toast.success('Mensaje generado con IA');
    } catch {
      toast.error('Error al generar mensaje');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!formData.messageTemplate.trim()) {
      toast.error('Primero genera o escribe un mensaje');
      return;
    }
    setIsGeneratingAudio(true);
    try {
      const result = await campaignsAPI.generateAudio(formData.messageTemplate, formData.ttsVoice);
      setFormData({ ...formData, audioUrl: result.audio, campaignMessageType: 'AUDIO' });
      setAudioPreview(result.audio);
      toast.success('Audio generado');
    } catch {
      toast.error('Error al generar audio');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    // Validations
    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      setStep(1);
      return;
    }
    if (!formData.messageTemplate.trim()) {
      toast.error('El mensaje es obligatorio');
      setStep(2);
      return;
    }

    createMutation.mutate(formData);
  };

  const steps = [
    { number: 1, title: 'Información', icon: Settings },
    { number: 2, title: 'Mensaje', icon: MessageSquare },
    { number: 3, title: 'Segmento', icon: Users },
    { number: 4, title: 'Programación', icon: Calendar },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {campaign ? 'Editar Campaña' : 'Nueva Campaña'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.number;
              const isCompleted = step > s.number;

              return (
                <div key={s.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        step > s.number ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Campaña *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej: Promoción Black Friday 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Describe el objetivo de esta campaña..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Message */}
          {step === 2 && (
            <div className="space-y-4">
              {/* AI Message Generator */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-indigo-700 mb-1">
                  Genera tu mensaje con IA
                </label>
                <textarea
                  value={formData.aiBrief}
                  onChange={(e) => setFormData({ ...formData, aiBrief: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Ej: Promocion de 20% de descuento en todos los productos esta semana..."
                />
                <button
                  onClick={handleGenerateMessage}
                  disabled={isGenerating}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
                >
                  {isGenerating ? 'Generando...' : 'Generar Mensaje con IA'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje *
                </label>
                <textarea
                  value={formData.messageTemplate}
                  onChange={(e) =>
                    setFormData({ ...formData, messageTemplate: e.target.value })
                  }
                  rows={5}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  placeholder="Hola {{name}}, tenemos una oferta especial para ti..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Variables: <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code>,{' '}
                  <code className="bg-gray-100 px-1 rounded">{'{{phoneNumber}}'}</code>,{' '}
                  <code className="bg-gray-100 px-1 rounded">{'{{email}}'}</code>
                </p>
              </div>

              {/* A/B Variants */}
              {formData.variants && formData.variants.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2">Variantes A/B Testing</h4>
                  {formData.variants.map((v: any, i: number) => (
                    <div key={v.id} className="mb-2 p-2 bg-white rounded border">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-600">Variante {v.id} (peso: {v.weight}%)</span>
                      </div>
                      <p className="text-sm text-gray-700">{v.message}</p>
                    </div>
                  ))}
                  <button
                    onClick={() => setFormData({ ...formData, variants: null })}
                    className="text-xs text-red-600 hover:underline mt-1"
                  >
                    Eliminar variantes (usar solo mensaje principal)
                  </button>
                </div>
              )}

              {/* TTS Audio */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-green-700 mb-2">
                  Generar Audio (TTS)
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={formData.ttsVoice}
                    onChange={(e) => setFormData({ ...formData, ttsVoice: e.target.value })}
                    className="px-3 py-2 border border-green-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="alloy">Alloy</option>
                    <option value="echo">Echo</option>
                    <option value="fable">Fable</option>
                    <option value="onyx">Onyx</option>
                    <option value="nova">Nova</option>
                    <option value="shimmer">Shimmer</option>
                  </select>
                  <button
                    onClick={handleGenerateAudio}
                    disabled={isGeneratingAudio}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    {isGeneratingAudio ? 'Generando...' : 'Generar Audio'}
                  </button>
                </div>
                {audioPreview && (
                  <div className="mt-3">
                    <audio controls src={audioPreview} className="w-full" />
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-green-600 font-medium">
                        Tipo: {formData.campaignMessageType}
                      </span>
                      {formData.campaignMessageType === 'AUDIO' && (
                        <button
                          onClick={() => setFormData({ ...formData, campaignMessageType: 'TEXT', audioUrl: '' })}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Cambiar a texto
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de Imagen/Video (opcional)
                </label>
                <input
                  type="url"
                  value={formData.mediaUrl}
                  onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
            </div>
          )}

          {/* Step 3: Segment */}
          {step === 3 && (
            <div>
              <SegmentBuilder
                segment={formData.targetSegment}
                onChange={(segment: any) => setFormData({ ...formData, targetSegment: segment })}
              />
            </div>
          )}

          {/* Step 4: Schedule & Settings */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Programar Envío (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledAt: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deja vacío para iniciar manualmente
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Velocidad de Envío (mensajes por minuto)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.messagesPerMinute}
                  onChange={(e) =>
                    setFormData({ ...formData, messagesPerMinute: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recomendado: 10-20 mensajes/min para evitar bloqueos
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoStart"
                  checked={formData.autoStart}
                  onChange={(e) =>
                    setFormData({ ...formData, autoStart: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="autoStart" className="text-sm text-gray-700">
                  Iniciar automáticamente cuando llegue la fecha programada
                </label>
              </div>

              {/* Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Send size={16} />
                  Resumen de la Campaña
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre:</span>
                    <span className="font-medium">{formData.name || 'Sin nombre'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Velocidad:</span>
                    <span className="font-medium">{formData.messagesPerMinute} msg/min</span>
                  </div>
                  {formData.scheduledAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Programada:</span>
                      <span className="font-medium">
                        {new Date(formData.scheduledAt).toLocaleString('es-MX')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            Atrás
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {createMutation.isPending ? (
                  'Creando...'
                ) : (
                  <>
                    <Check size={16} />
                    Crear Campaña
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
