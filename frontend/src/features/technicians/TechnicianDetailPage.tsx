import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useParams, useNavigate} from 'react-router-dom';
import {apiClient} from '../../api/client';
import {ArrowRight, Star, Wrench, CheckCircle, XCircle, MapPin} from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import clsx from 'clsx';

const VERIFICATION_CFG: Record<string, {label: string; cls: string}> = {
  pending:  {label: 'بانتظار الموافقة', cls: 'badge-warning'},
  approved: {label: 'معتمد',            cls: 'badge-success'},
  rejected: {label: 'مرفوض',            cls: 'badge-danger'},
  suspended:{label: 'موقوف',            cls: 'badge-gray'},
};

export default function TechnicianDetailPage() {
  const {id} = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const {data: tech, isLoading} = useQuery({
    queryKey: ['technician-detail', id],
    queryFn: () => apiClient.get(`/technicians/${id}`).then(r => r.data.data),
  });

  const {data: jobs} = useQuery({
    queryKey: ['technician-jobs', id],
    queryFn: () =>
      apiClient.get(`/requests?technicianId=${id}&status=completed`, {params: {limit: 10}}).then(r => r.data.data),
    enabled: !!tech,
  });

  const approve = useMutation({
    mutationFn: () => apiClient.post(`/technicians/${id}/approve`),
    onSuccess: () => {toast.success('تم تفعيل الحساب'); qc.invalidateQueries({queryKey: ['technician-detail', id]});},
    onError: () => toast.error('حدث خطأ'),
  });

  const reject = useMutation({
    mutationFn: (reason: string) => apiClient.post(`/technicians/${id}/reject`, {reason}),
    onSuccess: () => {toast.success('تم رفض الفني'); qc.invalidateQueries({queryKey: ['technician-detail', id]});},
    onError: () => toast.error('حدث خطأ'),
  });

  const suspend = useMutation({
    mutationFn: () => apiClient.post(`/technicians/${id}/suspend`),
    onSuccess: () => {toast.success('تم تعليق الحساب'); qc.invalidateQueries({queryKey: ['technician-detail', id]});},
    onError: () => toast.error('حدث خطأ'),
  });

  const handleReject = () => {
    const reason = window.prompt('سبب الرفض:');
    if (reason) reject.mutate(reason);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({length: 4}).map((_, i) => (
          <div key={i} className="card h-24 animate-pulse bg-gray-50" />
        ))}
      </div>
    );
  }

  if (!tech) return <div className="card text-center py-16 text-gray-400">الفني غير موجود</div>;

  const vc = VERIFICATION_CFG[tech.verification_status] || VERIFICATION_CFG.pending;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{tech.full_name}</h1>
          <p className="text-gray-500 text-sm" dir="ltr">{tech.phone}</p>
        </div>
        <div className="mr-auto flex items-center gap-2">
          <span className={vc.cls}>{vc.label}</span>
          {tech.verification_status === 'pending' && (
            <>
              <button
                onClick={() => approve.mutate()}
                className="btn-primary flex items-center gap-1.5 text-sm py-1.5"
                disabled={approve.isPending}>
                <CheckCircle className="w-4 h-4" />
                موافقة
              </button>
              <button
                onClick={handleReject}
                className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-red-100"
                disabled={reject.isPending}>
                <XCircle className="w-4 h-4" />
                رفض
              </button>
            </>
          )}
          {tech.verification_status === 'approved' && (
            <button
              onClick={() => suspend.mutate()}
              className="bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg text-sm hover:bg-orange-100"
              disabled={suspend.isPending}>
              تعليق الحساب
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Profile Info */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900 border-b pb-2">معلومات الفني</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-0.5">التخصص</p>
                <p className="font-medium">{tech.specialty || '-'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">سنوات الخبرة</p>
                <p className="font-medium">{tech.experience_years ?? 0} سنة</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">تاريخ التسجيل</p>
                <p className="font-medium">{dayjs(tech.created_at).format('DD/MM/YYYY')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">آخر نشاط</p>
                <p className="font-medium">{tech.last_seen ? dayjs(tech.last_seen).fromNow() : 'غير معروف'}</p>
              </div>
              {tech.bio && (
                <div className="col-span-2">
                  <p className="text-gray-400 text-xs mb-0.5">نبذة</p>
                  <p className="text-gray-700">{tech.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Services */}
          {tech.services?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 border-b pb-2 mb-3">الخدمات المقدمة</h2>
              <div className="flex flex-wrap gap-2">
                {tech.services.map((s: any) => (
                  <span key={s.id} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm">
                    {s.icon} {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Jobs */}
          {jobs && jobs.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 border-b pb-2 mb-3">آخر الوظائف ({jobs.length})</h2>
              <div className="space-y-2">
                {jobs.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
                    <div>
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-gray-400 text-xs">{dayjs(job.created_at).format('DD/MM/YYYY')}</p>
                    </div>
                    <p className="font-bold text-green-700">{job.accepted_price ?? '-'} ج.م</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Stats */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-900 border-b pb-2">الإحصائيات</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">التقييم</span>
                <span className="font-medium flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  {parseFloat(tech.rating_average || 0).toFixed(1)} ({tech.rating_count || 0})
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">الوظائف المكتملة</span>
                <span className="font-medium">{tech.completed_jobs || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">رصيد المحفظة</span>
                <span className="font-medium text-green-700">{tech.wallet_balance ?? 0} ج.م</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">الحالة</span>
                <span className={clsx('font-medium', tech.is_online ? 'text-green-600' : 'text-gray-400')}>
                  {tech.is_online ? 'متصل' : 'غير متصل'}
                </span>
              </div>
              {tech.current_latitude && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">الموقع</span>
                  <span className="font-medium text-xs text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {parseFloat(tech.current_latitude).toFixed(4)}, {parseFloat(tech.current_longitude).toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          {tech.documents?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 border-b pb-2 mb-3">المستندات</h2>
              <div className="space-y-2">
                {tech.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{
                      doc.type === 'national_id' ? 'الهوية الوطنية'
                      : doc.type === 'criminal_record' ? 'صحيفة الحالة الجنائية'
                      : 'شهادة'
                    }</span>
                    <span className={clsx('badge text-xs',
                      doc.status === 'approved' ? 'badge-success'
                      : doc.status === 'rejected' ? 'badge-danger' : 'badge-warning')}>
                      {doc.status === 'approved' ? 'معتمد' : doc.status === 'rejected' ? 'مرفوض' : 'معلق'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
