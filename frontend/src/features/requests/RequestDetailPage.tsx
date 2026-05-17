import {useQuery} from '@tanstack/react-query';
import {useParams, useNavigate} from 'react-router-dom';
import {apiClient} from '../../api/client';
import {ArrowRight, MapPin, User, Wrench, Clock} from 'lucide-react';
import dayjs from 'dayjs';
import clsx from 'clsx';

const STATUS_MAP: Record<string, {label: string; cls: string}> = {
  pending:    {label: 'معلق',       cls: 'badge-warning'},
  accepted:   {label: 'مقبول',      cls: 'bg-blue-100 text-blue-700 badge'},
  in_progress:{label: 'جاري',       cls: 'bg-purple-100 text-purple-700 badge'},
  completed:  {label: 'مكتمل',      cls: 'badge-success'},
  cancelled:  {label: 'ملغى',       cls: 'badge-danger'},
  expired:    {label: 'منتهي',      cls: 'badge-gray'},
};

export default function RequestDetailPage() {
  const {id} = useParams();
  const navigate = useNavigate();

  const {data, isLoading} = useQuery({
    queryKey: ['request-detail', id],
    queryFn: () => apiClient.get(`/requests/${id}`).then(r => r.data.data),
  });

  const {data: proposals} = useQuery({
    queryKey: ['request-proposals', id],
    queryFn: () => apiClient.get(`/proposals?requestId=${id}`).then(r => r.data.data),
    enabled: !!data,
  });

  const {data: history} = useQuery({
    queryKey: ['request-history', id],
    queryFn: () => apiClient.get(`/requests/${id}/history`).then(r => r.data.data),
    enabled: !!data,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({length: 4}).map((_, i) => (
          <div key={i} className="card h-24 animate-pulse bg-gray-50" />
        ))}
      </div>
    );
  }

  if (!data) return <div className="card text-center py-16 text-gray-400">الطلب غير موجود</div>;

  const st = STATUS_MAP[data.status] || {label: data.status, cls: 'badge-gray'};

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{data.title}</h1>
          <p className="text-gray-500 text-sm">طلب #{data.id}</p>
        </div>
        <span className={clsx('mr-auto', st.cls)}>{st.label}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900 border-b pb-2">تفاصيل الطلب</h2>
            <p className="text-gray-700 leading-relaxed">{data.description}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-lg">{data.category_icon}</span>
                <span>{data.category_name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{dayjs(data.created_at).format('DD/MM/YYYY HH:mm')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">الميزانية:</span>
                <span>{data.budget_min} - {data.budget_max} ج.م</span>
              </div>
              {data.address && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{data.address}</span>
                </div>
              )}
            </div>
          </div>

          {proposals && proposals.length > 0 && (
            <div className="card space-y-3">
              <h2 className="font-semibold text-gray-900 border-b pb-2">
                عروض الأسعار ({proposals.length})
              </h2>
              {proposals.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-700 text-xs font-bold">{p.technician_name?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{p.technician_name}</p>
                      {p.note && <p className="text-xs text-gray-500 max-w-xs truncate">{p.note}</p>}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-green-700">{p.price} ج.م</p>
                    <p className={clsx('text-xs', p.status === 'accepted' ? 'text-green-600' : 'text-gray-400')}>
                      {p.status === 'accepted' ? 'مقبول' : p.status === 'rejected' ? 'مرفوض' : 'معلق'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {history && history.length > 0 && (
            <div className="card space-y-2">
              <h2 className="font-semibold text-gray-900 border-b pb-2">سجل الحالة</h2>
              <div className="space-y-2">
                {history.map((h: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                    <span className="text-gray-600">{h.status}</span>
                    <span className="text-gray-400 text-xs mr-auto">{dayjs(h.changed_at).format('DD/MM/YYYY HH:mm')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-900 border-b pb-2">معلومات العميل</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <User className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{data.customer_name}</p>
                <p className="text-xs text-gray-500" dir="ltr">{data.customer_phone}</p>
              </div>
            </div>
          </div>

          {data.technician_name && (
            <div className="card space-y-3">
              <h2 className="font-semibold text-gray-900 border-b pb-2">الفني المعين</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-primary-700" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{data.technician_name}</p>
                  <p className="text-xs text-gray-500">السعر المتفق: {data.accepted_price} ج.م</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
