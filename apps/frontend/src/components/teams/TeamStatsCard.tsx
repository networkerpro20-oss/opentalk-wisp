'use client';

export function TeamStatsCard({ team }: { team: any }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
      <h4 className="font-medium text-blue-900 mb-3">Estadísticas del Equipo</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-2xl font-bold text-blue-600">{team.totalMembers || 0}</div>
          <div className="text-xs text-blue-700">Miembros Totales</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{team.activeMembers || 0}</div>
          <div className="text-xs text-green-700">Miembros Activos</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-600">{team.openConversations || 0}</div>
          <div className="text-xs text-orange-700">Conversaciones Abiertas</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600">
            {team.averageLoad?.toFixed(1) || '0.0'}
          </div>
          <div className="text-xs text-purple-700">Carga Promedio</div>
        </div>
      </div>
    </div>
  );
}
