import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Search, Filter, CheckCircle, XCircle, Eye, Star, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'بانتظار الموافقة', className: 'badge-warning' },
  approved: { label: 'معتمد', className: 'badge-success' },
  rejected: { label: 'مرفوض', className: 'badge-danger' },
  suspended: { label: 'موقوف', className: 'badge-gray' },
};

const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  online: { label: 'متصل', color: 'text-green-600' },
  offline: { label: 'غير متصل', color: 'text-gray-400' },
  busy: { label: 'مشغول', color: 'text-orange-500' },
};

export default function TechniciansPage() {
  const [search, setSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['technicians', search, verificationFilter, page],
    queryFn: () => apiClient.get('/technicians', {
      params: { search, verification_status: verificationFilter || undefined, page, limit: 15 },
    }).then(r => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/technicians/${id}/approve`),
    onSuccess: () => {
      toast.success('تم تفعيل حساب الفني');
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post(`/technicians/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success('تم رفض الفني');
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
  });

  const handleReject = (id: string) => {
    const reason = window.prompt('سبب الرفض:');
    if (reason) {
      rejectMutation.mutate({ id, reason });
    }
  };

  const technicians = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الفنيين</h1>
          <p className="text-gray-500 text-sm">{total} فني مسجل</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث باسم الفني..."
              className="input-field pr-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input-field w-48"
            value={verificationFilter}
            onChange={(e) => { setVerificationFilter(e.target.value); setPage(1); }}
          >
            <option value="">جميع الحالات</option>
            <option value="pending">بانتظار الموافقة</option>
            <option value="approved">معتمد</option>
            <option value="rejected">مرفوض</option>
            <option value="suspended">موقوف</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">الفني</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">الهاتف</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">التقييم</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">الوظائف</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">التوفر</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : technicians.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>لا يوجد فنيون</p>
                  </td>
                </tr>
              ) : (
                technicians.map((tech: any) => {
                  const avail = AVAILABILITY_LABELS[tech.availability] || AVAILABILITY_LABELS.offline;
                  const status = STATUS_LABELS[tech.verification_status] || STATUS_LABELS.pending;
                  return (
                    <tr key={tech.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-700 text-sm font-bold">{tech.full_name?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{tech.full_name}</p>
                            <p className="text-xs text-gray-400">{tech.years_experience} سنوات خبرة</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs" dir="ltr">{tech.phone}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span>{parseFloat(tech.rating_average || 0).toFixed(1)}</span>
                          <span className="text-gray-400 text-xs">({tech.rating_count})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{tech.completed_jobs}</td>
                      <td className="px-4 py-3">
                        <span className={status.className}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-xs font-medium', avail.color)}>{avail.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/technicians/${tech.id}`)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                            title="عرض الملف"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {tech.verification_status === 'pending' && (
                            <>
                              <button
                                onClick={() => approveMutation.mutate(tech.id)}
                                className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"
                                title="موافقة"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(tech.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                                title="رفض"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              صفحة {page} من {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-50"
              >
                السابق
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
