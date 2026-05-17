import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {apiClient} from '../../api/client';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';

const PERIODS = [
  {label: '7 أيام', value: 7},
  {label: '30 يوم', value: 30},
  {label: '90 يوم', value: 90},
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

function StatCard({label, value, sub, color}: {label: string; value: string | number; sub?: string; color: string}) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30);

  const {data: kpis} = useQuery({
    queryKey: ['analytics-kpis'],
    queryFn: () => apiClient.get('/analytics/kpis').then(r => r.data.data),
  });

  const {data: requestsChart} = useQuery({
    queryKey: ['analytics-requests', period],
    queryFn: () => apiClient.get('/analytics/requests-chart', {params: {days: period}}).then(r => r.data.data),
  });

  const {data: topServices} = useQuery({
    queryKey: ['analytics-services'],
    queryFn: () => apiClient.get('/analytics/top-services').then(r => r.data.data),
  });

  const {data: topTechs} = useQuery({
    queryKey: ['analytics-technicians'],
    queryFn: () => apiClient.get('/analytics/top-technicians').then(r => r.data.data),
  });

  const {data: revenue} = useQuery({
    queryKey: ['analytics-revenue', period],
    queryFn: () => apiClient.get('/analytics/revenue', {params: {days: period}}).then(r => r.data.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">التحليلات والتقارير</h1>
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                period === p.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="إجمالي الطلبات" value={kpis?.totalRequests ?? '-'} color="text-blue-600" />
        <StatCard label="طلبات مكتملة" value={kpis?.completedRequests ?? '-'} sub={`${kpis?.completionRate ?? 0}% معدل إتمام`} color="text-green-600" />
        <StatCard label="إجمالي المستخدمين" value={kpis?.totalUsers ?? '-'} sub={`${kpis?.totalTechnicians ?? 0} فني`} color="text-purple-600" />
        <StatCard label="إيرادات المنصة" value={`${kpis?.totalRevenue ?? 0} ج.م`} color="text-orange-600" />
      </div>

      {/* Requests Chart */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">الطلبات خلال آخر {period} يوم</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={requestsChart ?? []} margin={{top: 5, right: 10, left: 0, bottom: 5}}>
            <defs>
              <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tickFormatter={d => dayjs(d).format('DD/MM')} tick={{fontSize: 11}} />
            <YAxis tick={{fontSize: 11}} />
            <Tooltip labelFormatter={d => dayjs(d).format('DD/MM/YYYY')} />
            <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#reqGrad)" strokeWidth={2} name="الطلبات" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Services Pie */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">توزيع الخدمات</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={topServices ?? []}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {(topServices ?? []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val: number) => [`${val} طلب`, 'عدد']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Bar */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">الإيرادات الأسبوعية (ج.م)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenue ?? []} margin={{top: 5, right: 10, left: 0, bottom: 5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{fontSize: 11}} />
              <YAxis tick={{fontSize: 11}} />
              <Tooltip formatter={(val: number) => [`${val} ج.م`, 'الإيراد']} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="الإيراد" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Technicians */}
      {topTechs && topTechs.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">أفضل الفنيين</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">#</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الفني</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الوظائف المكتملة</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">التقييم</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الأرباح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topTechs.map((t: any, i: number) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{t.full_name}</td>
                    <td className="px-4 py-2.5 text-gray-600">{t.completed_jobs}</td>
                    <td className="px-4 py-2.5 text-yellow-500">★ {parseFloat(t.rating_average || 0).toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-green-700 font-medium">{t.total_earnings ?? 0} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
