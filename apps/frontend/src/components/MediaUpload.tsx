'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappAPI } from '@/lib/api-extended';

const ImageEditorModal = dynamic(
  () => import('@/components/image-editor/ImageEditorModal'),
  { ssr: false }
);

interface MediaUploadProps {
  instanceId: string;
  recipientPhone: string;
  onSuccess?: () => void;
}

export default function MediaUpload({ instanceId, recipientPhone, onSuccess }: MediaUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const queryClient = useQueryClient();

  const sendMediaMutation = useMutation({
    mutationFn: whatsappAPI.sendMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setFile(null);
      setCaption('');
      setPreview(null);
      setShowEditor(false);
      onSuccess?.();
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        // Open image editor automatically for images
        setShowEditor(true);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
      setShowEditor(false);
    }
  };

  const handleEditorConfirm = async (editedBase64: string, editorCaption: string) => {
    try {
      await sendMediaMutation.mutateAsync({
        instanceId,
        to: recipientPhone,
        type: 'image',
        mediaUrl: editedBase64,
        caption: editorCaption || undefined,
        mimeType: 'image/jpeg',
      });
    } catch (error) {
      console.error('Error sending edited image:', error);
    }
  };

  const handleSend = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;

      let type: 'image' | 'video' | 'audio' | 'document' = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      try {
        await sendMediaMutation.mutateAsync({
          instanceId,
          to: recipientPhone,
          type,
          mediaUrl: base64Data,
          caption: caption || undefined,
          fileName: file.name,
          mimeType: file.type,
        });
      } catch (error) {
        console.error('Error sending media:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="border-t pt-4 mt-4">
      <div className="space-y-4">
        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adjuntar archivo
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
        </div>

        {/* Image Editor Modal */}
        {preview && (
          <ImageEditorModal
            imageSrc={preview}
            isOpen={showEditor}
            onClose={() => setShowEditor(false)}
            onConfirm={handleEditorConfirm}
          />
        )}

        {/* Preview for images (when editor is closed) */}
        {preview && !showEditor && (
          <div className="mt-2">
            <div className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className="max-w-xs max-h-48 rounded-lg cursor-pointer"
                onClick={() => setShowEditor(true)}
              />
              <div
                className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setShowEditor(true)}
              >
                <span className="text-white text-sm font-medium">Editar imagen</span>
              </div>
            </div>
          </div>
        )}

        {/* File Info for non-image files */}
        {file && !preview && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p className="font-medium">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        {/* Caption + Send for non-image files */}
        {file && !file.type.startsWith('image/') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripcion (opcional)
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Agrega una descripcion..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={sendMediaMutation.isPending}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sendMediaMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </span>
              ) : (
                `Enviar ${file.type.split('/')[0]}`
              )}
            </button>
          </>
        )}

        {/* Error Message */}
        {sendMediaMutation.isError && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
            Error al enviar el archivo. Por favor intenta de nuevo.
          </div>
        )}
      </div>
    </div>
  );
}
