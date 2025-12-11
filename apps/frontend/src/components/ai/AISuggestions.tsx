'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sparkles, Copy, RefreshCw, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { aiAPI } from '@/lib/api-ai';

interface AISuggestionsProps {
  conversationId: string;
  onSelectSuggestion?: (text: string) => void;
}

export function AISuggestions({ conversationId, onSelectSuggestion }: AISuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<any>(null);

  const generateMutation = useMutation({
    mutationFn: () => aiAPI.generateResponse({ conversationId }),
    onSuccess: (data) => {
      setSuggestion(data);
      setIsOpen(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al generar respuesta');
    },
  });

  const handleCopy = () => {
    if (suggestion?.response) {
      navigator.clipboard.writeText(suggestion.response);
      toast.success('Respuesta copiada');
    }
  };

  const handleUse = () => {
    if (suggestion?.response && onSelectSuggestion) {
      onSelectSuggestion(suggestion.response);
      setIsOpen(false);
      toast.success('Respuesta agregada');
    }
  };

  const handleFeedback = async (isPositive: boolean) => {
    // TODO: Send feedback to backend
    toast.success('Gracias por tu feedback');
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => generateMutation.mutate()}
        disabled={generateMutation.isPending}
        className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 hover:text-purple-700 transition disabled:opacity-50"
        title="Generar respuesta con IA"
      >
        {generateMutation.isPending ? (
          <RefreshCw size={20} className="animate-spin" />
        ) : (
          <Sparkles size={20} />
        )}
      </button>

      {/* Suggestion Modal */}
      {isOpen && suggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center gap-2">
                <Sparkles className="text-purple-600" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Respuesta Sugerida por IA
                  </h3>
                  <p className="text-xs text-gray-500">
                    Confianza: {Math.round(suggestion.confidence * 100)}%
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white rounded"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Suggested Response */}
              <div className="bg-purple-50 rounded-lg p-4 mb-4">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {suggestion.response}
                </p>
              </div>

              {/* Needs Human Review Warning */}
              {suggestion.needsHumanReview && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Esta respuesta requiere revisión humana antes de enviar
                  </p>
                </div>
              )}

              {/* Suggested Actions */}
              {suggestion.suggestedActions && suggestion.suggestedActions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Acciones Sugeridas:
                  </h4>
                  <ul className="space-y-1">
                    {suggestion.suggestedActions.map((action: string, index: number) => (
                      <li
                        key={index}
                        className="text-sm text-gray-600 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">¿Útil?</span>
                <button
                  onClick={() => handleFeedback(true)}
                  className="p-2 hover:bg-green-100 text-green-600 rounded transition"
                  title="Útil"
                >
                  <ThumbsUp size={18} />
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className="p-2 hover:bg-red-100 text-red-600 rounded transition"
                  title="No útil"
                >
                  <ThumbsDown size={18} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 flex items-center gap-2"
                >
                  <Copy size={18} />
                  Copiar
                </button>
                <button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={18} className={generateMutation.isPending ? 'animate-spin' : ''} />
                  Regenerar
                </button>
                <button
                  onClick={handleUse}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <Sparkles size={18} />
                  Usar Respuesta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
