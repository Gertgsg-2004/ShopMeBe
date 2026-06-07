import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { Coupon } from '../../types'
import { formatCurrency, formatDateShort } from '../../utils/format'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const emptyForm = {
  code: '', description: '', isPercent: false, value: '',
  minOrderAmount: '', maxDiscount: '', usageLimit: '', startDate: '', endDate: '', isActive: true,
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const res = await adminService.getCoupons()
      if (res.data) setCoupons(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCoupons() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (c: Coupon) => {
    setEditingId(c.id)
    setForm({
      code: c.code, description: c.description || '', isPercent: c.isPercent, value: c.value.toString(),
      minOrderAmount: c.minOrderAmount?.toString() || '', maxDiscount: c.maxDiscount?.toString() || '',
      usageLimit: c.usageLimit?.toString() || '',
      startDate: c.startDate?.split('T')[0] || '', endDate: c.endDate?.split('T')[0] || '',
      isActive: c.isActive,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload: Partial<Coupon> = {
        code: form.code.toUpperCase(),
        description: form.description || undefined,
        isPercent: form.isPercent,
        value: parseFloat(form.value),
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : undefined,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        isActive: form.isActive,
      }
      let res
      if (editingId) {
        res = await adminService.updateCoupon(editingId, payload)
      } else {
        res = await adminService.createCoupon(payload)
      }
      if (res.success) {
        toast.success(editingId ? 'Cập nhật thành công!' : 'Tạo mã giảm giá thành công!')
        setShowModal(false)
        fetchCoupons()
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number, code: string) => {
    if (!confirm(`Xóa mã "${code}"?`)) return
    const res = await adminService.deleteCoupon(id)
    if (res.success) {
      toast.success('Đã xóa mã giảm giá')
      fetchCoupons()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý khuyến mãi</h2>
          <p className="text-sm text-gray-500 mt-1">{coupons.length} mã giảm giá</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={18} /> Tạo mã giảm giá
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Mã', 'Mô tả', 'Giảm giá', 'Điều kiện', 'Đã dùng', 'Hiệu lực', 'Trạng thái', 'Thao tác'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-primary-400" />
                        <span className="font-bold text-primary-600">{c.code}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-[200px] truncate">{c.description || '-'}</td>
                    <td className="py-3 px-4 font-medium">
                      {c.isPercent ? `${c.value}%` : formatCurrency(c.value)}
                      {c.maxDiscount && <p className="text-xs text-gray-400">Tối đa {formatCurrency(c.maxDiscount)}</p>}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {c.minOrderAmount ? `Từ ${formatCurrency(c.minOrderAmount)}` : 'Không giới hạn'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {c.startDate ? formatDateShort(c.startDate) : 'N/A'} - {c.endDate ? formatDateShort(c.endDate) : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${c.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {c.isActive ? 'Hoạt động' : 'Tắt'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(c.id, c.code)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">{editingId ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã giảm giá *</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required className="input-field font-mono" placeholder="WELCOME10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPercent} onChange={(e) => setForm({ ...form, isPercent: e.target.checked })} />
                  <span className="text-sm text-gray-700">Giảm theo %</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị giảm *</label>
                  <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required min="0" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa (đ)</label>
                  <input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} min="0" className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu</label>
                  <input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} min="0" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn lượt</label>
                  <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} min="0" className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input-field" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                <span className="text-sm text-gray-700">Kích hoạt</span>
              </label>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo mã'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
