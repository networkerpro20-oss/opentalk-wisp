'use client';

import { TrendingUp, Flame, Snowflake } from 'lucide-react';

interface LeadScoreProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  category?: 'HOT' | 'WARM' | 'COLD';
}

export function LeadScore({
  score,
  size = 'md',
  showLabel = true,
  category,
}: LeadScoreProps) {
  const getCategory = () => {
    if (category) return category;
    if (score >= 70) return 'HOT';
    if (score >= 40) return 'WARM';
    return 'COLD';
  };

  const getCategoryConfig = (cat: string) => {
    switch (cat) {
      case 'HOT':
        return {
          icon: Flame,
          color: 'text-red-600',
          bg: 'bg-red-50',
          ring: 'ring-red-300',
          gradient: 'from-red-500 to-orange-500',
          label: 'Hot Lead',
        };
      case 'WARM':
        return {
          icon: TrendingUp,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          ring: 'ring-yellow-300',
          gradient: 'from-yellow-500 to-orange-500',
          label: 'Warm Lead',
        };
      case 'COLD':
      default:
        return {
          icon: Snowflake,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          ring: 'ring-blue-300',
          gradient: 'from-blue-500 to-cyan-500',
          label: 'Cold Lead',
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'lg':
        return {
          container: 'w-24 h-24',
          text: 'text-2xl',
          iconSize: 32,
        };
      case 'sm':
        return {
          container: 'w-12 h-12',
          text: 'text-xs',
          iconSize: 16,
        };
      case 'md':
      default:
        return {
          container: 'w-16 h-16',
          text: 'text-base',
          iconSize: 20,
        };
    }
  };

  const cat = getCategory();
  const config = getCategoryConfig(cat);
  const sizeConfig = getSizeConfig();
  const Icon = config.icon;

  return (
    <div className="inline-flex flex-col items-center gap-2">
      {/* Circular Score */}
      <div className="relative">
        <svg className={sizeConfig.container} viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Score arc */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={`url(#gradient-${cat})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 283} 283`}
            transform="rotate(-90 50 50)"
            className="transition-all duration-500"
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id={`gradient-${cat}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={cat === 'HOT' ? '#ef4444' : cat === 'WARM' ? '#f59e0b' : '#3b82f6'} />
              <stop offset="100%" stopColor={cat === 'HOT' ? '#f97316' : cat === 'WARM' ? '#f59e0b' : '#06b6d4'} />
            </linearGradient>
          </defs>
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${config.color} ${sizeConfig.text}`}>
            {score}
          </span>
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded ${config.bg}`}>
          <Icon size={14} className={config.color} />
          <span className={`text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>
      )}
    </div>
  );
}

// Compact version for lists
export function LeadScoreBadge({ score, category }: { score: number; category?: 'HOT' | 'WARM' | 'COLD' }) {
  const getCategory = () => {
    if (category) return category;
    if (score >= 70) return 'HOT';
    if (score >= 40) return 'WARM';
    return 'COLD';
  };

  const getCategoryConfig = (cat: string) => {
    switch (cat) {
      case 'HOT':
        return {
          icon: Flame,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
        };
      case 'WARM':
        return {
          icon: TrendingUp,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
        };
      case 'COLD':
      default:
        return {
          icon: Snowflake,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
        };
    }
  };

  const cat = getCategory();
  const config = getCategoryConfig(cat);
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${config.bg} ${config.border}`}>
      <Icon size={12} className={config.color} />
      <span className={`text-xs font-semibold ${config.color}`}>
        {score}
      </span>
    </div>
  );
}
