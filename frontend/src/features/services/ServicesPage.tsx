import {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {apiClient} from '../../api/client';
import {Plus, Pencil, Trash2, Grid3x3} from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  icon: string;
  description: string;
  is_active: boolean;
  technician_count: number;
}

const EMPTY_FORM = {name: '', icon: '', description: ''};

export default function ServicesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const {data, isLoading} = useQuery({
    queryKey: ['categories-admin'],
    queryFn: () => apiClient.get('/categories').then(r => r.data.data as Category[]),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        return apiClient.put(`/categories/${editing.id}`, form);
      }
      return apiClient.post('/categories', form);
    },
    onSuccess: () => {
      toast.success(editing ? 'تم تحديث الخدمة' : 'تم إضافة الخدمة');
      qc.invalidateQueries({queryKey: ['categories-admin']});
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/categories/${id}`),
    onSuccess: () => {
      toast.success('تم حذف الخدمة');
      qc.invalidateQueries({queryKey: ['categories-admin']});
    },
    onError: () => toast.error('لا يمكن حذف فئة مستخدمة'),
  });

  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setForm({name: cat.name, icon: cat.icon, description: cat.description});
    setShowForm(true);
  };

  const handleDelete = (cat: Category) => {
    if (window.confirm(`حذف فئة "${cat.name}"؟`)) {
      remove.mutate(cat.id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الخدمات</h1>
          <p className="text-gray-500 text-sm">{data?.length ?? 0} فئة خدمة</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => {setShowForm(true); setEditing(null); setForm(EMPTY_FORM);}}>
          <Plus className="w-4 h-4" />
          إضافة فئة
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">
            {editing ? `تعديل: ${editing.name}` : 'إضافة فئة جديدة'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم الفئة *</label>
              <input
                className="input-field"
                value={form.name}
                onChange={e => setForm(f => ({...f, name: e.target.value}))}
                placeholder="مثال: سباكة"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الأيقونة (emoji) *</label>
              <input
                className="input-field text-2xl"
                value={form.icon}
                onChange={e => setForm(f => ({...f, icon: e.target.value}))}
                placeholder="🔧"
                maxLength={4}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
              <textarea
                className="input-field h-20 resize-none"
                value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))}
                placeholder="وصف مختصر للفئة..."
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              className="btn-primary"
              onClick={() => save.mutate()}
              disabled={!form.name || !form.icon || save.isPending}>
              {save.isPending ? 'جاري الحفظ...' : editing ? 'تحديث' : 'إضافة'}
            </button>
            <button className="btn-secondary" onClick={handleCancel}>إلغاء</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({length: 12}).map((_, i) => (
            <div key={i} className="card h-32 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(data ?? []).map((cat) => (
            <div key={cat.id} className="card hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{cat.icon}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-1 rounded hover:bg-blue-50 text-blue-600">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1 rounded hover:bg-red-50 text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="font-semibold text-gray-900 mb-1">{cat.name}</p>
              {cat.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{cat.description}</p>
              )}
              <p className="text-xs text-gray-400">{cat.technician_count ?? 0} فني</p>
            </div>
          ))}
          {(!data || data.length === 0) && (
            <div className="col-span-4 card text-center py-16 text-gray-400">
              <Grid3x3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد فئات بعد</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
