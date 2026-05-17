import {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {apiClient} from '../../api/client';
import {CheckCircle, XCircle, CreditCard, ArrowDownCircle} from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import clsx from 'clsx';

const TABS = [
  {key: 'transactions', label: 'المعاملات'},
  {key: 'withdrawals', label: 'طلبات السحب'},
];

export default function PaymentsPage() {
  const [tab, setTab] = useState('transactions');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const {data: txData, isLoading: txLoading} = useQuery({
    queryKey: ['admin-transactions', page],
    queryFn: () => apiClient.get('/wallets/admin/transactions', {params: {page, limit: 15}}).then(r => r.data),
    enabled: tab === 'transactions',
  });

  const {data: wdData, isLoading: wdLoading} = useQuery({
    queryKey: ['admin-withdrawals', page],
    queryFn: () => apiClient.get('/wallets/admin/withdrawals', {params: {page, limit: 15}}).then(r => r.data),
    enabled: tab === 'withdrawals',
  });

  const approveWithdrawal = useMutation({
    mutationFn: (id: number) => apiClient.post(`/wallets/admin/withdrawals/${id}/approve`),
    onSuccess: () => {toast.success('تم اعتماد طلب السحب'); qc.invalidateQueries({queryKey: ['admin-withdrawals']});},
    onError: () => toast.error('حدث خطأ'),
  });

  const rejectWithdrawal = useMutation({
    mutationFn: ({id, reason}: {id: number; reason: string}) =>
      apiClient.post(`/wallets/admin/withdrawals/${id}/reject`, {reason}),
    onSuccess: () => {toast.success('تم رفض طلب السحب'); qc.invalidateQueries({queryKey: ['admin-withdrawals']});},
    onError: () => toast.error('حدث خطأ'),
  });

  const handleReject = (id: number) => {
    const reason = window.prompt('سبب الرفض:');
    if (reason) rejectWithdrawal.mutate({id, reason});
  };

  const transactions = txData?.data || [];
  const withdrawals = wdData?.data || [];
  const isLoading = tab === 'transactions' ? txLoading : wdLoading;
  const totalPages = tab === 'transactions' ? (txData?.meta?.totalPages || 1) : (wdData?.meta?.totalPages || 1);
  const total = tab === 'transactions' ? (txData?.meta?.total || 0) : (wdData?.meta?.total || 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">المدفوعات والمالية</h1>
        <p className="text-gray-500 text-sm">{total} سجل</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => {setTab(t.key); setPage(1);}}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700',
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'transactions' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">المستخدم</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">النوع</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">المبلغ</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">الوصف</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading
                  ? Array.from({length: 10}).map((_, i) => (
                      <tr key={i}>{Array.from({length: 6}).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      ))}</tr>
                    ))
                  : transactions.length === 0
                  ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                      <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>لا توجد معاملات</p>
                    </td></tr>
                  )
                  : transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 text-sm">{tx.user_name}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('badge', tx.type === 'credit' ? 'badge-success' : 'badge-danger')}>
                          {tx.type === 'credit' ? 'إيداع' : 'خصم'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">{tx.amount} ج.م</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{tx.description}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('badge', tx.status === 'completed' ? 'badge-success' : 'badge-warning')}>
                          {tx.status === 'completed' ? 'مكتمل' : 'معلق'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{dayjs(tx.created_at).format('DD/MM/YYYY HH:mm')}</td>
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
      )}

      {tab === 'withdrawals' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">الفني</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">المبلغ</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">البنك</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">رقم الحساب</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">التاريخ</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading
                  ? Array.from({length: 8}).map((_, i) => (
                      <tr key={i}>{Array.from({length: 7}).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      ))}</tr>
                    ))
                  : withdrawals.length === 0
                  ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                      <ArrowDownCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>لا توجد طلبات سحب</p>
                    </td></tr>
                  )
                  : withdrawals.map((wd: any) => (
                    <tr key={wd.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{wd.technician_name}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{wd.amount} ج.م</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{wd.bank_name ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs font-mono" dir="ltr">{wd.bank_account}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('badge',
                          wd.status === 'approved' ? 'badge-success'
                          : wd.status === 'rejected' ? 'badge-danger' : 'badge-warning')}>
                          {wd.status === 'approved' ? 'موافق' : wd.status === 'rejected' ? 'مرفوض' : 'معلق'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{dayjs(wd.created_at).format('DD/MM/YYYY')}</td>
                      <td className="px-4 py-3">
                        {wd.status === 'pending' && (
                          <div className="flex gap-1">
                            <button onClick={() => approveWithdrawal.mutate(wd.id)} className="p-1.5 rounded hover:bg-green-50 text-green-600" title="موافقة">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleReject(wd.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="رفض">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
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
