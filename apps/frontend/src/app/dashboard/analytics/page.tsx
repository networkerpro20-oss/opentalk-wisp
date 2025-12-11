'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', dateRange],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return {
        kpis: {
          totalContacts: 1247,
          activeConversations: 89,
          totalDeals: 156,
          totalRevenue: 234500,
          growthRate: 12.5,
          conversionRate: 3.2,
        },
        conversationsByDay: [
          { date: '01 Dic', conversations: 45 },
          { date: '02 Dic', conversations: 52 },
          { date: '03 Dic', conversations: 48 },
          { date: '04 Dic', conversations: 61 },
          { date: '05 Dic', conversations: 55 },
          { date: '06 Dic', conversations: 67 },
          { date: '07 Dic', conversations: 71 },
        ],
        dealsByStage: [
          { stage: 'Lead', deals: 45, value: 67500 },
          { stage: 'Qualified', deals: 32, value: 96000 },
          { stage: 'Proposal', deals: 28, value: 112000 },
          { stage: 'Negotiation', deals: 18, value: 90000 },
          { stage: 'Won', deals: 12, value: 72000 },
        ],
        channelDistribution: [
          { name: 'WhatsApp', value: 65 },
          { name: 'Email', value: 20 },
          { name: 'Web Chat', value: 15 },
        ],
        topAgents: [
          { name: 'Miguel Domínguez', conversations: 125, deals: 24, revenue: 72000 },
          { name: 'Ana García', conversations: 98, deals: 19, revenue: 57000 },
          { name: 'Carlos Ruiz', conversations: 87, deals: 15, revenue: 45000 },
          { name: 'María López', conversations: 76, deals: 12, revenue: 36000 },
        ],
        responseTime: {
          average: 4.2, // minutes
          median: 2.5,
          percentile90: 8.5,
        },
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
              +{analytics.kpis.growthRate}%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Total Contactos</h3>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.kpis.totalContacts.toLocaleString()}
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
            {analytics.kpis.activeConversations}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <span className="text-green-600 text-sm font-medium">
              {analytics.kpis.conversionRate}%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Deals Abiertos</h3>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.kpis.totalDeals}
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
            {formatCurrency(analytics.kpis.totalRevenue)}
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
            <LineChart data={analytics.conversationsByDay}>
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
            <BarChart data={analytics.dealsByStage}>
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
                data={analytics.channelDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.channelDistribution.map((entry, index) => (
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

        {/* Response Time */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tiempo de Respuesta
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Promedio</span>
                <span className="text-2xl font-bold text-blue-600">
                  {analytics.responseTime.average} min
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: '60%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Mediana</span>
                <span className="text-2xl font-bold text-green-600">
                  {analytics.responseTime.median} min
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: '40%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Percentil 90</span>
                <span className="text-2xl font-bold text-orange-600">
                  {analytics.responseTime.percentile90} min
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full"
                  style={{ width: '85%' }}
                />
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
              {analytics.topAgents.map((agent, index) => (
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
