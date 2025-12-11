'use client';

import { Smile, Frown, Meh } from 'lucide-react';

interface SentimentIndicatorProps {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function SentimentIndicator({
  sentiment,
  score,
  size = 'sm',
  showLabel = false,
}: SentimentIndicatorProps) {
  const getSentimentConfig = () => {
    switch (sentiment) {
      case 'POSITIVE':
        return {
          icon: Smile,
          color: 'text-green-500',
          bg: 'bg-green-50',
          label: 'Positivo',
        };
      case 'NEGATIVE':
        return {
          icon: Frown,
          color: 'text-red-500',
          bg: 'bg-red-50',
          label: 'Negativo',
        };
      case 'NEUTRAL':
      default:
        return {
          icon: Meh,
          color: 'text-gray-500',
          bg: 'bg-gray-50',
          label: 'Neutral',
        };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'lg':
        return 24;
      case 'md':
        return 18;
      case 'sm':
      default:
        return 14;
    }
  };

  const config = getSentimentConfig();
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded ${config.bg}`}
      title={`Sentimiento: ${config.label}${score ? ` (${Math.round(score * 100)}%)` : ''}`}
    >
      <Icon size={getIconSize()} className={config.color} />
      {showLabel && (
        <span className={`text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}
