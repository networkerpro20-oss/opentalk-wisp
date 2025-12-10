'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface CustomNodeProps extends NodeProps {
  data: {
    label: string;
    icon?: string;
    [key: string]: any;
  };
}

export const TriggerNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-gradient-to-r from-green-500 to-green-600 text-white min-w-[180px] ${selected ? 'ring-4 ring-blue-400' : ''}`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{data.icon}</span>
        <div>
          <div className="font-bold">{data.label}</div>
          <div className="text-xs opacity-90">{data.trigger}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-700" />
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';

export const MessageNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[200px] ${selected ? 'ring-4 ring-blue-400' : 'border-gray-300'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />
      <div className="flex items-center gap-2">
        <span className="text-2xl">{data.icon}</span>
        <div className="flex-1">
          <div className="font-bold text-gray-800">{data.label}</div>
          <div className="text-sm text-gray-600 truncate max-w-[150px]">{data.message}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400" />
    </div>
  );
});

MessageNode.displayName = 'MessageNode';

export const QuestionNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-blue-50 min-w-[200px] ${selected ? 'ring-4 ring-blue-400' : 'border-blue-300'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
      <div className="flex items-center gap-2">
        <span className="text-2xl">{data.icon}</span>
        <div className="flex-1">
          <div className="font-bold text-blue-800">{data.label}</div>
          <div className="text-sm text-blue-600 truncate max-w-[150px]">{data.question}</div>
          <div className="text-xs text-blue-500 mt-1">→ {data.variable}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </div>
  );
});

QuestionNode.displayName = 'QuestionNode';

export const ConditionNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-yellow-50 min-w-[200px] ${selected ? 'ring-4 ring-blue-400' : 'border-yellow-400'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-yellow-600" />
      <div className="flex items-center gap-2">
        <span className="text-2xl">{data.icon}</span>
        <div className="flex-1">
          <div className="font-bold text-yellow-800">{data.label}</div>
          <div className="text-xs text-yellow-600">
            {data.field} {data.operator} {data.value}
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-2">
        <Handle type="source" position={Position.Bottom} id="true" className="w-3 h-3 bg-green-500 -ml-2" />
        <span className="text-xs text-green-600 font-semibold">Sí</span>
        <span className="text-xs text-red-600 font-semibold">No</span>
        <Handle type="source" position={Position.Bottom} id="false" className="w-3 h-3 bg-red-500 -mr-2" />
      </div>
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';

export const AINode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white min-w-[200px] ${selected ? 'ring-4 ring-blue-400' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-700" />
      <div className="flex items-center gap-2">
        <span className="text-2xl">{data.icon}</span>
        <div className="flex-1">
          <div className="font-bold">{data.label}</div>
          <div className="text-xs opacity-90">{data.action}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-700" />
    </div>
  );
});

AINode.displayName = 'AINode';

export const DelayNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-orange-50 min-w-[180px] ${selected ? 'ring-4 ring-blue-400' : 'border-orange-300'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-orange-500" />
      <div className="flex items-center gap-2">
        <span className="text-2xl">{data.icon}</span>
        <div className="flex-1">
          <div className="font-bold text-orange-800">{data.label}</div>
          <div className="text-sm text-orange-600">{data.duration} {data.unit}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-500" />
    </div>
  );
});

DelayNode.displayName = 'DelayNode';

export const MenuNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-indigo-50 min-w-[220px] ${selected ? 'ring-4 ring-blue-400' : 'border-indigo-300'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500" />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{data.icon}</span>
        <div className="flex-1">
          <div className="font-bold text-indigo-800">{data.label}</div>
          <div className="text-xs text-indigo-600">{data.options?.length || 0} opciones</div>
        </div>
      </div>
      {data.options?.slice(0, 3).map((opt: any) => (
        <div key={opt.id} className="text-xs text-indigo-700 py-1 px-2 bg-white rounded mb-1">
          {opt.id}. {opt.text}
        </div>
      ))}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500" />
    </div>
  );
});

MenuNode.displayName = 'MenuNode';

export const MediaNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-pink-50 min-w-[200px] ${selected ? 'ring-4 ring-blue-400' : 'border-pink-300'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-pink-500" />
      <div className="flex items-center gap-2">
        <span className="text-2xl">{data.icon}</span>
        <div className="flex-1">
          <div className="font-bold text-pink-800">{data.label}</div>
          <div className="text-xs text-pink-600">{data.mediaType}</div>
          <div className="text-xs text-pink-500 truncate max-w-[140px]">{data.caption}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-pink-500" />
    </div>
  );
});

MediaNode.displayName = 'MediaNode';

export const TagNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-teal-50 min-w-[180px] ${selected ? 'ring-4 ring-blue-400' : 'border-teal-300'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-teal-500" />
      <div className="flex items-center gap-2">
        <span className="text-2xl">{data.icon}</span>
        <div className="flex-1">
          <div className="font-bold text-teal-800">{data.label}</div>
          <div className="text-sm text-teal-600">{data.tag || '(sin tag)'}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-teal-500" />
    </div>
  );
});

TagNode.displayName = 'TagNode';

export const AssignNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-cyan-50 min-w-[180px] ${selected ? 'ring-4 ring-blue-400' : 'border-cyan-300'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-cyan-500" />
      <div className="flex items-center gap-2">
        <span className="text-2xl">{data.icon}</span>
        <div className="flex-1">
          <div className="font-bold text-cyan-800">{data.label}</div>
          <div className="text-sm text-cyan-600">{data.userId || '(sin asignar)'}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-cyan-500" />
    </div>
  );
});

AssignNode.displayName = 'AssignNode';

export const APINode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-violet-50 min-w-[200px] ${selected ? 'ring-4 ring-blue-400' : 'border-violet-300'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-violet-500" />
      <div className="flex items-center gap-2">
        <span className="text-2xl">{data.icon}</span>
        <div className="flex-1">
          <div className="font-bold text-violet-800">{data.label}</div>
          <div className="text-xs text-violet-600">{data.method}</div>
          <div className="text-xs text-violet-500 truncate max-w-[140px]">{data.url || '(sin URL)'}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-violet-500" />
    </div>
  );
});

APINode.displayName = 'APINode';
