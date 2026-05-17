import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {apiClient} from '../../api/client';
import {Search, Eye, User} from 'lucide-react';
import dayjs from 'dayjs';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const {data, isLoading} = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () =>
      apiClient
        .get('/customers', {params: {search, page, limit: 15}})
        .then(r => r.data),
  });

  const customers = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">إدارة العملاء</h1>
        <p className="text-gray-500 text-sm">{total} عميل مسجل</p>
      </div>

      <div className="card py-4">
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث باسم العميل أو رقم هاتفه..."
            className="input-field pr-9"
            value={search}
            onChange={e => {setSearch(e.target.value); setPage(1);}}
          />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">العميل</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">رقم الهاتف</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">الطلبات</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">تاريخ التسجيل</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({length: 8}).map((_, i) => (
                    <tr key={i}>
                      {Array.from({length: 5}).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : customers.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>لا يوجد عملاء</p>
                    </td>
                  </tr>
                )
                : customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-teal-700 text-sm font-bold">{c.full_name?.charAt(0)}</span>
                        </div>
                        <p className="font-medium text-gray-900">{c.full_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs" dir="ltr">{c.phone}</td>
                    <td className="px-4 py-3 text-gray-700">{c.total_requests ?? 0} طلب</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {dayjs(c.created_at).format('DD/MM/YYYY')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/customers/${c.id}`)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                        title="عرض الملف">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
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
