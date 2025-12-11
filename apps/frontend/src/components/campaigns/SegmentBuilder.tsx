'use client';

import { useState } from 'react';
import { Plus, X, Users } from 'lucide-react';

interface SegmentBuilderProps {
  segment: any;
  onChange: (segment: any) => void;
}

export function SegmentBuilder({ segment, onChange }: SegmentBuilderProps) {
  const [tags, setTags] = useState<string[]>(segment?.tags || []);
  const [leadStatus, setLeadStatus] = useState<string>(segment?.leadStatus || '');
  const [minLeadScore, setMinLeadScore] = useState<number>(segment?.minLeadScore || 0);
  const [maxLeadScore, setMaxLeadScore] = useState<number>(segment?.maxLeadScore || 100);
  const [newTag, setNewTag] = useState('');

  const updateSegment = (updates: any) => {
    const newSegment = {
      tags: tags,
      leadStatus: leadStatus || undefined,
      minLeadScore: minLeadScore > 0 ? minLeadScore : undefined,
      maxLeadScore: maxLeadScore < 100 ? maxLeadScore : undefined,
      ...updates,
    };
    onChange(newSegment);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const newTags = [...tags, newTag.trim()];
      setTags(newTags);
      setNewTag('');
      updateSegment({ tags: newTags });
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    updateSegment({ tags: newTags });
  };

  const handleLeadStatusChange = (value: string) => {
    setLeadStatus(value);
    updateSegment({ leadStatus: value || undefined });
  };

  const handleMinScoreChange = (value: number) => {
    setMinLeadScore(value);
    updateSegment({ minLeadScore: value > 0 ? value : undefined });
  };

  const handleMaxScoreChange = (value: number) => {
    setMaxLeadScore(value);
    updateSegment({ maxLeadScore: value < 100 ? value : undefined });
  };

  const estimatedCount = '?'; // TODO: Add API endpoint to get count

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-900 mb-2">
          <Users size={20} />
          <h3 className="font-semibold">Segmentación de Contactos</h3>
        </div>
        <p className="text-sm text-blue-700">
          Define los criterios para seleccionar los contactos que recibirán esta campaña.
          Deja los campos vacíos para incluir todos los contactos.
        </p>
      </div>

      {/* Tags Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Etiquetas (Tags)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            placeholder="Agregar etiqueta..."
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={addTag}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
          >
            <Plus size={16} />
            Agregar
          </button>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Los contactos deben tener al menos una de estas etiquetas
        </p>
      </div>

      {/* Lead Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estado del Lead
        </label>
        <select
          value={leadStatus}
          onChange={(e) => handleLeadStatusChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="NEW">Nuevo</option>
          <option value="CONTACTED">Contactado</option>
          <option value="QUALIFIED">Calificado</option>
          <option value="PROPOSAL">Propuesta</option>
          <option value="NEGOTIATION">Negociación</option>
          <option value="WON">Ganado</option>
          <option value="LOST">Perdido</option>
        </select>
      </div>

      {/* Lead Score Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Puntuación del Lead
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Mínimo</label>
            <input
              type="number"
              min="0"
              max="100"
              value={minLeadScore}
              onChange={(e) => handleMinScoreChange(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Máximo</label>
            <input
              type="number"
              min="0"
              max="100"
              value={maxLeadScore}
              onChange={(e) => handleMaxScoreChange(parseInt(e.target.value) || 100)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Visual Range */}
        <div className="mt-3">
          <div className="h-2 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600 rounded-full relative">
            <div
              className="absolute top-0 h-full bg-blue-600 rounded-full"
              style={{
                left: `${minLeadScore}%`,
                width: `${maxLeadScore - minLeadScore}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{minLeadScore}</span>
            <span>{maxLeadScore}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Contactos con puntuación entre {minLeadScore} y {maxLeadScore}
        </p>
      </div>

      {/* Estimated Count */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700">
              Contactos Estimados
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Basado en los filtros aplicados
            </p>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {estimatedCount}
          </div>
        </div>
      </div>

      {/* Summary */}
      {(tags.length > 0 || leadStatus || minLeadScore > 0 || maxLeadScore < 100) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-900 mb-2">
            Criterios de Segmentación Activos:
          </h4>
          <ul className="text-sm text-green-700 space-y-1">
            {tags.length > 0 && (
              <li>• Etiquetas: {tags.join(', ')}</li>
            )}
            {leadStatus && (
              <li>• Estado: {leadStatus}</li>
            )}
            {(minLeadScore > 0 || maxLeadScore < 100) && (
              <li>• Puntuación: {minLeadScore} - {maxLeadScore}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
