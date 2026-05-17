import {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {apiClient} from '../../api/client';
import {Send, Bell, Users, Wrench} from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const AUDIENCE_OPTIONS = [
  {value: 'all', label: 'الجميع', icon: <Users className="w-4 h-4" />},
  {value: 'customers', label: 'العملاء فقط', icon: <Users className="w-4 h-4" />},
  {value: 'technicians', label: 'الفنيون فقط', icon: <Wrench className="w-4 h-4" />},
];

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({title: '', body: '', audience: 'all'});

  const {data: logs, isLoading} = useQuery({
    queryKey: ['notification-logs'],
    queryFn: () => apiClient.get('/notifications/admin/logs').then(r => r.data.data),
  });

  const send = useMutation({
    mutationFn: () => apiClient.post('/notifications/admin/broadcast', form),
    onSuccess: () => {
      toast.success('تم إرسال الإشعار');
      qc.invalidateQueries({queryKey: ['notification-logs']});
      setForm({title: '', body: '', audience: 'all'});
    },
    onError: () => toast.error('حدث خطأ عند الإرسال'),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">الإشعارات</h1>

      {/* Send Notification */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Send className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-gray-900">إرسال إشعار جماعي</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">الجمهور المستهدف</label>
            <div className="flex gap-3 flex-wrap">
              {AUDIENCE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(f => ({...f, audience: opt.value}))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    form.audience === opt.value
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الإشعار *</label>
            <input
              className="input-field"
              value={form.title}
              onChange={e => setForm(f => ({...f, title: e.target.value}))}
              placeholder="مثال: تحديث جديد في التطبيق"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نص الإشعار *</label>
            <textarea
              className="input-field h-24 resize-none"
              value={form.body}
              onChange={e => setForm(f => ({...f, body: e.target.value}))}
              placeholder="اكتب تفاصيل الإشعار هنا..."
            />
          </div>
        </div>

        <button
          onClick={() => send.mutate()}
          disabled={!form.title || !form.body || send.isPending}
          className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Send className="w-4 h-4" />
          {send.isPending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
        </button>
      </div>

      {/* Notification Logs */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-500" />
          سجل الإشعارات
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({length: 5}).map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لم يتم إرسال أي إشعارات بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{log.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5 truncate">{log.body}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-gray-400">{dayjs(log.created_at).format('DD/MM/YYYY HH:mm')}</span>
                    <span className="text-xs text-primary-600">
                      {log.audience === 'all' ? 'الجميع' : log.audience === 'customers' ? 'العملاء' : 'الفنيون'}
                    </span>
                    {log.sent_count && (
                      <span className="text-xs text-green-600">✓ أُرسل لـ {log.sent_count}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
