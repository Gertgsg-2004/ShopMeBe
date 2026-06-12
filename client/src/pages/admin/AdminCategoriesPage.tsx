import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, PlusCircle, X } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { categoryService } from '../../services/categoryService'
import { Category } from '../../types'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface FilterChip { label: string; value: string }

const EMOJI_SUGGESTIONS = ['👗','👖','👚','🧥','👘','🩳','👙','🧶','🎽','👜','🎒','🛒','🍼','🥛','🥣','🌾','🧸','🎪','🧩','🪵','🎵','🌱','🩱','🎁','💼','🌻','👧','🧒','🌞','❄️']

const SLUG_ICONS: Record<string, string> = {
  'do-ba-bau': '🤰', 'do-so-sinh': '🛏️', 'do-choi': '🎮',
  'sua-va-thuc-pham': '🥛', 'phu-kien': '🎒', 'bim': '🩲',
  'quan-ao-thu-dong': '❄️', 'quan-ao-he': '🌞',
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', description: '', sortOrder: '0', isActive: true, parentId: '' })
  const [submitting, setSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Filter chips state
  const [chips, setChips] = useState<FilterChip[]>([])
  const [newChipLabel, setNewChipLabel] = useState('')
  const [newChipValue, setNewChipValue] = useState('')

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
    setChips([])
    setShowModal(true)
  }

  const openEdit = (c: Category) => {
    setEditingId(c.id)
    setForm({ name: c.name, description: c.description || '', sortOrder: c.sortOrder.toString(), isActive: c.isActive, parentId: c.parentId?.toString() || '' })
    setImagePreview(c.imageUrl || '')
    try { setChips(c.filterConfig ? JSON.parse(c.filterConfig) : []) } catch { setChips([]) }
    setShowModal(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setImagePreview(URL.createObjectURL(file))
  }

  const addChip = () => {
    if (!newChipLabel.trim() || !newChipValue.trim()) { toast.error('Nhập cả nhãn và từ khóa lọc'); return }
    setChips(prev => [...prev, { label: newChipLabel.trim(), value: newChipValue.trim().toLowerCase() }])
    setNewChipLabel('')
    setNewChipValue('')
  }

  const removeChip = (i: number) => setChips(prev => prev.filter((_, idx) => idx !== i))

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
      if (chips.length > 0) fd.append('filterConfig', JSON.stringify(chips))

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
                {['Danh mục', 'Danh mục cha', 'Bộ lọc riêng', 'Số SP', 'Thứ tự', 'Trạng thái', 'Thao tác'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((c) => {
                let chips: FilterChip[] = []
                try { chips = c.filterConfig ? JSON.parse(c.filterConfig) : [] } catch {}
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {c.imageUrl ? (
                          <img src={c.imageUrl} alt={c.name} className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center text-xl">
                            {SLUG_ICONS[c.slug] ?? '🎀'}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{c.parentName || '-'}</td>
                    <td className="py-3 px-4">
                      {chips.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {chips.map((ch, i) => (
                            <span key={i} className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full text-xs">{ch.label}</span>
                          ))}
                        </div>
                      ) : <span className="text-gray-400 text-xs">Không có</span>}
                    </td>
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg my-4">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">{editingId ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-field" placeholder="Quần áo hè" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục cha</label>
                <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className="input-field">
                  <option value="">-- Không có (danh mục gốc) --</option>
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
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
              </div>

              {/* === Filter chips section === */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bộ lọc riêng cho danh mục</label>
                <p className="text-xs text-gray-400 mb-3">
                  Khách hàng sẽ thấy các chip lọc này trên trang danh mục. Mỗi chip có nhãn hiển thị và từ khóa để lọc sản phẩm theo tên.
                </p>

                {/* Emoji suggestions */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {EMOJI_SUGGESTIONS.map(e => (
                    <button key={e} type="button" onClick={() => setNewChipLabel(prev => e + ' ' + prev.replace(/^\p{Emoji_Presentation}+\s*/u, ''))}
                      className="text-lg hover:bg-gray-100 rounded px-1 transition-colors" title="Chèn emoji">
                      {e}
                    </button>
                  ))}
                </div>

                {/* Current chips */}
                {chips.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-xl">
                    {chips.map((ch, i) => (
                      <span key={i} className="flex items-center gap-1 px-3 py-1 bg-white border border-primary-200 rounded-full text-sm text-primary-700 shadow-sm">
                        {ch.label}
                        <button type="button" onClick={() => removeChip(i)} className="text-gray-400 hover:text-red-500 ml-1">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add chip inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nhãn hiển thị</label>
                    <input className="input-field text-sm" placeholder="🧥 Áo khoác" value={newChipLabel}
                      onChange={e => setNewChipLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChip() } }} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Từ khóa lọc</label>
                    <input className="input-field text-sm" placeholder="áo khoác" value={newChipValue}
                      onChange={e => setNewChipValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChip() } }} />
                  </div>
                </div>
                <button type="button" onClick={addChip}
                  className="mt-2 flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 font-medium">
                  <PlusCircle size={15} /> Thêm chip lọc
                </button>
                <p className="text-xs text-gray-400 mt-1">Nhấn Enter hoặc nút "Thêm chip" để thêm. Kéo chip để sắp xếp (tính năng sắp ra).</p>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
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
