import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import {
  Users, Wrench, FileText, TrendingUp, Clock, CheckCircle,
  AlertCircle, DollarSign, UserCheck, BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import dayjs from 'dayjs';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

interface KPI {
  users: { total: number; customers: number; technicians: number; pendingTechnicians: number };
  requests: { today: number; pending: number; completed: number };
  revenue: { today: number; total: number };
}

function StatCard({
  title, value, subtitle, icon: Icon, color, trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: number;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString('ar-EG')}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% عن الأمس
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['admin-kpis'],
    queryFn: () => apiClient.get('/analytics/kpis').then(r => r.data.data as KPI),
    refetchInterval: 30000,
  });

  const { data: chartData } = useQuery({
    queryKey: ['requests-chart'],
    queryFn: () => apiClient.get('/analytics/requests-chart?days=14').then(r => r.data.data),
  });

  const { data: topServices } = useQuery({
    queryKey: ['top-services'],
    queryFn: () => apiClient.get('/analytics/top-services').then(r => r.data.data),
  });

  const { data: topTechnicians } = useQuery({
    queryKey: ['top-technicians'],
    queryFn: () => apiClient.get('/analytics/top-technicians').then(r => r.data.data),
  });

  if (kpisLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500 text-sm mt-1">{dayjs().format('dddd، D MMMM YYYY')}</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المستخدمين"
          value={kpis?.users.total || 0}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="الفنيون النشطون"
          value={kpis?.users.technicians || 0}
          subtitle={`${kpis?.users.pendingTechnicians || 0} بانتظار الموافقة`}
          icon={Wrench}
          color="bg-purple-500"
        />
        <StatCard
          title="طلبات اليوم"
          value={kpis?.requests.today || 0}
          subtitle={`${kpis?.requests.pending || 0} معلق`}
          icon={FileText}
          color="bg-amber-500"
        />
        <StatCard
          title="إيرادات اليوم"
          value={`${(kpis?.revenue.today || 0).toFixed(0)} ج`}
          subtitle={`الإجمالي: ${(kpis?.revenue.total || 0).toFixed(0)} ج`}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="العملاء"
          value={kpis?.users.customers || 0}
          icon={UserCheck}
          color="bg-cyan-500"
        />
        <StatCard
          title="طلبات مكتملة"
          value={kpis?.requests.completed || 0}
          icon={CheckCircle}
          color="bg-green-600"
        />
        <StatCard
          title="طلبات معلقة"
          value={kpis?.requests.pending || 0}
          icon={Clock}
          color="bg-orange-500"
        />
        <StatCard
          title="فنيون بانتظار موافقة"
          value={kpis?.users.pendingTechnicians || 0}
          icon={AlertCircle}
          color="bg-red-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Requests Area Chart */}
        <div className="card col-span-2">
          <h3 className="text-base font-semibold text-gray-900 mb-4">الطلبات (آخر 14 يوم)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#dbeafe" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Services Pie */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">أكثر الخدمات طلباً</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={(topServices || []).slice(0, 5)}
                dataKey="request_count"
                nameKey="name_ar"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name_ar }) => name_ar}
                labelLine={false}
              >
                {(topServices || []).slice(0, 5).map((_: any, index: number) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Technicians Table */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 mb-4">أفضل الفنيين أداءً</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="px-4 py-3 text-right font-medium">الفني</th>
                <th className="px-4 py-3 text-right font-medium">وظائف مكتملة</th>
                <th className="px-4 py-3 text-right font-medium">التقييم</th>
                <th className="px-4 py-3 text-right font-medium">عدد التقييمات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(topTechnicians || []).map((tech: any) => (
                <tr key={tech.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-700 text-xs font-bold">{tech.full_name.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-gray-900">{tech.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{tech.completed_jobs}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-gray-700">{parseFloat(tech.rating_average).toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{tech.rating_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
