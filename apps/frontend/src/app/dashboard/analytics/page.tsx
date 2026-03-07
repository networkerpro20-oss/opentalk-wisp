'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Users,
  MessageSquare,
  DollarSign,
  Calendar,
  Download,
  Filter,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30'); // days

  // Fetch analytics data from API
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', dateRange],
    queryFn: async () => {
      const days = parseInt(dateRange, 10);
      const [overview, conversationsByDay, dealsByStage, topAgents, channels] =
        await Promise.all([
          api.get('/analytics/overview', { params: { days } }).then((r) => r.data),
          api.get('/analytics/conversations-by-day', { params: { days } }).then((r) => r.data),
          api.get('/analytics/deals-by-stage').then((r) => r.data),
          api.get('/analytics/top-agents', { params: { days } }).then((r) => r.data),
          api.get('/analytics/channels').then((r) => r.data),
        ]);

      return {
        kpis: {
          totalContacts: overview.totalContacts,
          activeConversations: overview.activeConversations,
          totalDeals: overview.totalDeals,
          totalRevenue: overview.totalRevenue,
          growthRate: overview.newContacts > 0 ? Math.round((overview.newContacts / Math.max(overview.totalContacts - overview.newContacts, 1)) * 100 * 10) / 10 : 0,
          conversionRate: overview.conversionRate,
        },
        conversationsByDay,
        dealsByStage,
        channelDistribution: channels,
        topAgents,
      };
    },
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Cargando analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reportes</h1>

          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="365">Último año</option>
            </select>

            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter size={18} />
              Filtros
            </button>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Download size={18} />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
            <span className="text-green-600 text-sm font-medium">
              +{analytics?.kpis?.growthRate ?? 0}%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Total Contactos</h3>
          <p className="text-3xl font-bold text-gray-900">
            {analytics?.kpis?.totalContacts?.toLocaleString() ?? '0'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-green-600" size={24} />
            </div>
            <span className="text-blue-600 text-sm font-medium">Activas</span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Conversaciones</h3>
          <p className="text-3xl font-bold text-gray-900">
            {analytics?.kpis?.activeConversations ?? 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <span className="text-green-600 text-sm font-medium">
              {analytics?.kpis?.conversionRate ?? 0}%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Deals Abiertos</h3>
          <p className="text-3xl font-bold text-gray-900">
            {analytics?.kpis?.totalDeals ?? 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-yellow-600" size={24} />
            </div>
            <span className="text-green-600 text-sm font-medium">+12%</span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Revenue Total</h3>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(analytics?.kpis?.totalRevenue ?? 0)}
          </p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Conversations Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Conversaciones por Día
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.conversationsByDay ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="conversations"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Conversaciones"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Deals by Stage */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Deals por Etapa
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.dealsByStage ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="deals" fill="#10b981" name="Cantidad" />
              <Bar dataKey="value" fill="#3b82f6" name="Valor (USD)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Channel Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución por Canal
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.channelDistribution ?? []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics?.channelDistribution?.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resumen
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Deals Ganados</span>
                <span className="text-2xl font-bold text-green-600">
                  {analytics?.kpis?.conversionRate ?? 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${Math.min(analytics?.kpis?.conversionRate ?? 0, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Contactos Nuevos</span>
                <span className="text-2xl font-bold text-blue-600">
                  +{analytics?.kpis?.growthRate ?? 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min(analytics?.kpis?.growthRate ?? 0, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Conversaciones Activas</span>
                <span className="text-2xl font-bold text-purple-600">
                  {analytics?.kpis?.activeConversations ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Agents Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Agentes por Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Agente
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">
                  Conversaciones
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">
                  Deals Cerrados
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {analytics?.topAgents?.map((agent: any, index: number) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {agent.name.charAt(0)}
                      </div>
                      <span className="font-medium">{agent.name}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4">{agent.conversations}</td>
                  <td className="text-right py-3 px-4">{agent.deals}</td>
                  <td className="text-right py-3 px-4 font-semibold text-green-600">
                    {formatCurrency(agent.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
