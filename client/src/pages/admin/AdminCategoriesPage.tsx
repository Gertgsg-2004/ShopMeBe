import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { categoryService } from '../../services/categoryService'
import { Category } from '../../types'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', description: '', sortOrder: '0', isActive: true, parentId: '' })
  const [submitting, setSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const imageInputRef = useRef<HTMLInputElement>(null)

  const fetchCategories = async () => {
    setLoading(true)
    const res = await categoryService.getCategories()
    if (res.data) setCategories(res.data)
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm({ name: '', description: '', sortOrder: '0', isActive: true, parentId: '' })
    setImagePreview('')
    setShowModal(true)
  }

  const openEdit = (c: Category) => {
    setEditingId(c.id)
    setForm({ name: c.name, description: c.description || '', sortOrder: c.sortOrder.toString(), isActive: c.isActive, parentId: c.parentId?.toString() || '' })
    setImagePreview(c.imageUrl || '')
    setShowModal(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('description', form.description)
      fd.append('sortOrder', form.sortOrder)
      fd.append('isActive', String(form.isActive))
      if (form.parentId) fd.append('parentId', form.parentId)
      if (imageInputRef.current?.files?.[0]) fd.append('image', imageInputRef.current.files[0])

      const res = editingId
        ? await adminService.updateCategory(editingId, fd)
        : await adminService.createCategory(fd)
      if (res.success) {
        toast.success(editingId ? 'Cập nhật thành công!' : 'Tạo danh mục thành công!')
        setShowModal(false)
        fetchCategories()
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý danh mục</h2>
          <p className="text-sm text-gray-500 mt-1">{categories.length} danh mục</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={18} /> Thêm danh mục
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Danh mục', 'Danh mục cha', 'Số SP', 'Thứ tự', 'Trạng thái', 'Thao tác'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt={c.name} className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center text-lg">
                          {c.slug === 'do-ba-bau' ? '🤰' : c.slug === 'do-so-sinh' ? '👶' : c.slug === 'do-choi' ? '🧸' : c.slug === 'sua-va-thuc-pham' ? '🍼' : '🎀'}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{c.parentName || '-'}</td>
                  <td className="py-3 px-4 text-gray-600">{c.productCount}</td>
                  <td className="py-3 px-4 text-gray-600">{c.sortOrder}</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${c.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? 'Hiển thị' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                        <Pencil size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">{editingId ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-field" placeholder="Đồ bà bầu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục cha</label>
                <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className="input-field">
                  <option value="">-- Không có --</option>
                  {categories.filter((c) => c.id !== editingId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự hiển thị</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} min="0" className="input-field" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                <span className="text-sm text-gray-700">Hiển thị</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon danh mục</label>
                <p className="text-xs text-gray-400 mb-2">Ảnh vuông nhỏ (64×64px), hiển thị làm icon đại diện</p>
                {imagePreview && (
                  <div className="flex items-center gap-3 mb-2">
                    <img src={imagePreview} alt="preview" className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                    <span className="text-xs text-gray-400">Preview icon</span>
                  </div>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
