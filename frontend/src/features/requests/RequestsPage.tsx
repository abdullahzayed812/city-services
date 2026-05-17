import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {apiClient} from '../../api/client';
import {Search, Eye, FileText} from 'lucide-react';
import dayjs from 'dayjs';
import clsx from 'clsx';

const STATUS_MAP: Record<string, {label: string; cls: string}> = {
  pending:    {label: 'معلق',       cls: 'badge-warning'},
  accepted:   {label: 'مقبول',      cls: 'badge-info'},
  in_progress:{label: 'جاري',       cls: 'bg-purple-100 text-purple-700 badge'},
  completed:  {label: 'مكتمل',      cls: 'badge-success'},
  cancelled:  {label: 'ملغى',       cls: 'badge-danger'},
  expired:    {label: 'منتهي',      cls: 'badge-gray'},
};

const TYPE_MAP: Record<string, string> = {
  emergency: 'طارئ',
  standard:  'عادي',
  scheduled: 'مجدول',
};

export default function RequestsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const {data, isLoading} = useQuery({
    queryKey: ['admin-requests', search, status, page],
    queryFn: () =>
      apiClient
        .get('/requests', {params: {search, status: status || undefined, page, limit: 15}})
        .then(r => r.data),
  });

  const requests = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h1>
        <p className="text-gray-500 text-sm">{total} طلب</p>
      </div>

      <div className="card py-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث في الطلبات..."
              className="input-field pr-9"
              value={search}
              onChange={e => {setSearch(e.target.value); setPage(1);}}
            />
          </div>
          <select
            className="input-field w-44"
            value={status}
            onChange={e => {setStatus(e.target.value); setPage(1);}}>
            <option value="">جميع الحالات</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">#</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">الطلب</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">العميل</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">النوع</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">الميزانية</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">التاريخ</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">عرض</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({length: 10}).map((_, i) => (
                    <tr key={i}>
                      {Array.from({length: 8}).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : requests.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>لا توجد طلبات</p>
                    </td>
                  </tr>
                )
                : requests.map((r: any) => {
                  const st = STATUS_MAP[r.status] || {label: r.status, cls: 'badge-gray'};
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">#{r.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 max-w-40 truncate">{r.title}</p>
                        <p className="text-xs text-gray-400">{r.category_icon} {r.category_name}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{r.customer_name}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium',
                          r.type === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600')}>
                          {TYPE_MAP[r.type] || r.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{r.budget_min}-{r.budget_max} ج.م</td>
                      <td className="px-4 py-3"><span className={st.cls}>{st.label}</span></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{dayjs(r.created_at).format('DD/MM/YYYY')}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/requests/${r.id}`)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">صفحة {page} من {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-50">السابق</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-50">التالي</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
