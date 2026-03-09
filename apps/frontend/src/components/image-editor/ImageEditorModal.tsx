'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { X, Send } from 'lucide-react';
import { useEditorState } from './hooks/useEditorState';
import { useCanvasExport } from './hooks/useCanvasExport';
import EditorCanvas from './EditorCanvas';
import EditorToolbar from './EditorToolbar';
import DrawTool from './tools/DrawTool';
import TextTool from './tools/TextTool';
import CropTool from './tools/CropTool';
import RotateTool from './tools/RotateTool';
import FilterControls from './tools/FilterControls';
import { EditorTool, ImageEditorModalProps } from './types';

export default function ImageEditorModal({ imageSrc, isOpen, onClose, onConfirm }: ImageEditorModalProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [caption, setCaption] = useState('');
  const [croppedSrc, setCroppedSrc] = useState<string | null>(null);
  const { tool, reset, cropRect, setCropRect, setIsCropping, filterValues } = useEditorState();
  const { exportAsBase64 } = useCanvasExport(stageRef);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      reset();
      setCaption('');
      setCroppedSrc(null);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, reset]);

  const handleApplyCrop = useCallback(() => {
    if (!stageRef.current || !cropRect) return;
    const dataUrl = stageRef.current.toDataURL({
      x: cropRect.x,
      y: cropRect.y,
      width: cropRect.width,
      height: cropRect.height,
      mimeType: 'image/jpeg',
      quality: 0.95,
    });
    setCroppedSrc(dataUrl);
    setCropRect(null);
    setIsCropping(false);
    reset();
  }, [cropRect, setCropRect, setIsCropping, reset]);

  const handleSend = useCallback(() => {
    const base64 = exportAsBase64();
    if (base64) {
      onConfirm(base64, caption);
    }
  }, [exportAsBase64, caption, onConfirm]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  if (!isOpen) return null;

  const currentImageSrc = croppedSrc || imageSrc;

  // CSS filter for brightness/contrast applied to stage container
  const filterStyle = (filterValues.brightness !== 0 || filterValues.contrast !== 0)
    ? {
        filter: `brightness(${1 + filterValues.brightness / 100}) contrast(${1 + filterValues.contrast / 100})`,
      }
    : {};

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
        <button
          onClick={handleClose}
          className="p-2 text-white hover:bg-gray-800 rounded-lg"
        >
          <X size={24} />
        </button>
        <span className="text-white text-sm font-medium">Editor de imagen</span>
        <div className="w-10" />
      </div>

      {/* Toolbar */}
      <EditorToolbar />

      {/* Tool-specific controls */}
      <div className="flex justify-center px-4 py-1">
        {tool === EditorTool.DRAW && <DrawTool />}
        {tool === EditorTool.TEXT && <TextTool />}
        {tool === EditorTool.CROP && (
          <CropTool
            stageWidth={containerRef.current?.clientWidth || 400}
            stageHeight={containerRef.current?.clientHeight || 400}
            onApplyCrop={handleApplyCrop}
          />
        )}
        {tool === EditorTool.ROTATE && <RotateTool />}
        {tool === EditorTool.FILTER && <FilterControls />}
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={filterStyle}
      >
        <EditorCanvas
          imageSrc={currentImageSrc}
          stageRef={stageRef}
          containerRef={containerRef}
        />
      </div>

      {/* Caption + Send */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-900">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Agregar descripcion..."
          className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm placeholder-gray-500"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
        />
        <button
          onClick={handleSend}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          <Send size={16} />
          Enviar
        </button>
      </div>
    </div>
  );
}
