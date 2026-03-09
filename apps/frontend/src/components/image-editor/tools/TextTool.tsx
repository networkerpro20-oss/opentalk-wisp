import React, { useState, useRef, useEffect } from 'react';
import { useEditorState } from '../hooks/useEditorState';
import { PRESET_COLORS, TextAnnotation } from '../types';

export default function TextTool() {
  const {
    brushColor, setBrushColor, fontSize, setFontSize,
    isAddingText, textInputPosition, setIsAddingText,
    setTextInputPosition, addAnnotation,
  } = useEditorState();

  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingText && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingText]);

  const handleSubmitText = () => {
    if (inputText.trim() && textInputPosition) {
      const annotation: TextAnnotation = {
        type: 'text',
        id: `text-${Date.now()}`,
        text: inputText.trim(),
        x: textInputPosition.x,
        y: textInputPosition.y,
        fontSize,
        color: brushColor,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      };
      addAnnotation(annotation);
      setInputText('');
      setIsAddingText(false);
      setTextInputPosition(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmitText();
    if (e.key === 'Escape') {
      setInputText('');
      setIsAddingText(false);
      setTextInputPosition(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 px-3 py-2 bg-gray-900/90 rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setBrushColor(color)}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${
                brushColor === color ? 'border-white scale-125' : 'border-gray-600'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-gray-600" />

        <div className="flex items-center gap-2">
          <span className="text-white text-xs">Tamaño</span>
          <input
            type="range"
            min={12}
            max={72}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-20 accent-indigo-500"
          />
          <span className="text-white text-xs w-6">{fontSize}</span>
        </div>

        <span className="text-gray-400 text-xs">Toca la imagen para agregar texto</span>
      </div>

      {/* Floating text input */}
      {isAddingText && textInputPosition && (
        <div
          className="absolute z-50"
          style={{ left: textInputPosition.x, top: textInputPosition.y }}
        >
          <div className="flex items-center gap-1 bg-white rounded-lg shadow-lg p-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe aquí..."
              className="px-2 py-1 text-sm border-none outline-none w-48"
              style={{ color: brushColor, fontSize: `${Math.min(fontSize, 24)}px` }}
            />
            <button
              onClick={handleSubmitText}
              className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
            >
              OK
            </button>
            <button
              onClick={() => { setIsAddingText(false); setTextInputPosition(null); setInputText(''); }}
              className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
