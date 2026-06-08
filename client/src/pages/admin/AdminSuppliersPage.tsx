import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronRight, Package, Truck, CreditCard } from 'lucide-react'
import { adminService, Supplier, PurchaseOrder } from '../../services/adminService'
import { formatCurrency, formatDate } from '../../utils/format'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const emptyForm = {
  name: '', phone: '', email: '', address: '', notes: '', isActive: true,
}

const statusLabels: Record<string, string> = {
  Draft: 'Nháp', Ordered: 'Đã đặt', Received: 'Đã nhận', Paid: 'Đã thanh toán',
}
const statusColors: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Ordered: 'bg-blue-100 text-blue-700',
  Received: 'bg-yellow-100 text-yellow-700',
  Paid: 'bg-green-100 text-green-700',
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })

  // Purchase orders sub-section
  const [expandedSupplierId, setExpandedSupplierId] = useState<number | null>(null)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [showPoModal, setShowPoModal] = useState(false)
  const [poSupplierId, setPoSupplierId] = useState<number | null>(null)
  const [poForm, setPoForm] = useState({ notes: '', items: [{ productId: '', productName: '', quantity: '1', costPrice: '' }] })
  const [submittingPo, setSubmittingPo] = useState(false)

  // Pay modal
  const [showPayModal, setShowPayModal] = useState(false)
  const [payOrderId, setPayOrderId] = useState<number | null>(null)
  const [payAmount, setPayAmount] = useState('')

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const res = await adminService.getSuppliers()
      if (res.data) setSuppliers(res.data)
    } catch {
      toast.error('Không thể tải danh sách nhà cung cấp')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSuppliers() }, [])

  const openCreate = () => {
    setEditingSupplier(null)
    setForm({ ...emptyForm })
    setShowModal(true)
  }

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s)
    setForm({ name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '', notes: s.notes || '', isActive: s.isActive })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên nhà cung cấp'); return }
    setSubmitting(true)
    try {
      let res
      if (editingSupplier) {
        res = await adminService.updateSupplier(editingSupplier.id, form)
      } else {
        res = await adminService.createSupplier(form)
      }
      if (res.success) {
        toast.success(editingSupplier ? 'Cập nhật thành công!' : 'Thêm nhà cung cấp thành công!')
        setShowModal(false)
        fetchSuppliers()
      } else {
        toast.error(res.message || 'Thao tác thất bại')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Xóa nhà cung cấp "${name}"?`)) return
    try {
      const res = await adminService.deleteSupplier(id)
      if (res.success) {
        toast.success('Đã xóa nhà cung cấp')
        fetchSuppliers()
      } else {
        toast.error(res.message || 'Xóa thất bại')
      }
    } catch {
      toast.error('Có lỗi xảy ra')
    }
  }

  const toggleExpand = async (supplierId: number) => {
    if (expandedSupplierId === supplierId) {
      setExpandedSupplierId(null)
      return
    }
    setExpandedSupplierId(supplierId)
    setLoadingOrders(true)
    try {
      const res = await adminService.getPurchaseOrders(supplierId)
      if (res.data) setPurchaseOrders(res.data)
    } catch {
      toast.error('Không thể tải đơn mua hàng')
    } finally {
      setLoadingOrders(false)
    }
  }

  const openPoModal = (supplierId: number) => {
    setPoSupplierId(supplierId)
    setPoForm({ notes: '', items: [{ productId: '', productName: '', quantity: '1', costPrice: '' }] })
    setShowPoModal(true)
  }

  const addPoItem = () => {
    setPoForm(f => ({ ...f, items: [...f.items, { productId: '', productName: '', quantity: '1', costPrice: '' }] }))
  }

  const removePoItem = (i: number) => {
    setPoForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  }

  const updatePoItem = (i: number, field: string, value: string) => {
    setPoForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item) }))
  }

  const handleSubmitPo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!poSupplierId) return
    const items = poForm.items.filter(it => it.productId && it.quantity && it.costPrice)
    if (items.length === 0) { toast.error('Vui lòng thêm ít nhất 1 sản phẩm'); return }
    setSubmittingPo(true)
    try {
      const res = await adminService.createPurchaseOrder({
        supplierId: poSupplierId,
        notes: poForm.notes,
        items: items.map(it => ({ productId: Number(it.productId), quantity: Number(it.quantity), costPrice: Number(it.costPrice) })),
      })
      if (res.success) {
        toast.success('Tạo đơn mua hàng thành công!')
        setShowPoModal(false)
        if (expandedSupplierId === poSupplierId) {
          const ordersRes = await adminService.getPurchaseOrders(poSupplierId)
          if (ordersRes.data) setPurchaseOrders(ordersRes.data)
        }
      } else {
        toast.error(res.message || 'Tạo đơn thất bại')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmittingPo(false)
    }
  }

  const handleReceive = async (id: number) => {
    if (!confirm('Xác nhận đã nhận hàng cho đơn này?')) return
    try {
      const res = await adminService.receivePurchaseOrder(id)
      if (res.success) {
        toast.success('Đã xác nhận nhận hàng!')
        if (expandedSupplierId) {
          const ordersRes = await adminService.getPurchaseOrders(expandedSupplierId)
          if (ordersRes.data) setPurchaseOrders(ordersRes.data)
        }
        fetchSuppliers()
      } else {
        toast.error(res.message || 'Thất bại')
      }
    } catch {
      toast.error('Có lỗi xảy ra')
    }
  }

  const openPayModal = (id: number, remaining: number) => {
    setPayOrderId(id)
    setPayAmount(remaining.toString())
    setShowPayModal(true)
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payOrderId) return
    try {
      const res = await adminService.payPurchaseOrder(payOrderId, Number(payAmount))
      if (res.success) {
        toast.success('Thanh toán thành công!')
        setShowPayModal(false)
        if (expandedSupplierId) {
          const ordersRes = await adminService.getPurchaseOrders(expandedSupplierId)
          if (ordersRes.data) setPurchaseOrders(ordersRes.data)
        }
        fetchSuppliers()
      } else {
        toast.error(res.message || 'Thanh toán thất bại')
      }
    } catch {
      toast.error('Có lỗi xảy ra')
    }
  }

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Nhà cung cấp</h2>
          <p className="text-sm text-gray-500 mt-1">{suppliers.length} nhà cung cấp</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={18} /> Thêm nhà cung cấp
        </button>
      </div>

      <div className="card mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, điện thoại, email..." className="input-field pl-9" />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Nhà cung cấp', 'Điện thoại', 'Email', 'Công nợ', 'Trạng thái', 'Thao tác'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-400">Không tìm thấy nhà cung cấp</td></tr>
                )}
                {filtered.map(s => (
                  <>
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleExpand(s.id)} className="text-gray-400 hover:text-gray-600">
                            {expandedSupplierId === s.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <div>
                            <p className="font-medium text-gray-800">{s.name}</p>
                            {s.address && <p className="text-xs text-gray-400 truncate max-w-[200px]">{s.address}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{s.phone || '—'}</td>
                      <td className="py-3 px-4 text-gray-600">{s.email || '—'}</td>
                      <td className="py-3 px-4">
                        {s.totalDebt > 0 ? (
                          <span className="font-semibold text-red-600">{formatCurrency(s.totalDebt)}</span>
                        ) : (
                          <span className="text-green-600 font-medium">Không nợ</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${s.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                          {s.isActive ? 'Hoạt động' : 'Ngừng'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button onClick={() => openPoModal(s.id)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="Tạo đơn mua">
                            <Truck size={15} />
                          </button>
                          <button onClick={() => openEdit(s)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedSupplierId === s.id && (
                      <tr key={`${s.id}-orders`}>
                        <td colSpan={6} className="bg-gray-50 px-8 pb-4 pt-2">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-700 flex items-center gap-2"><Package size={15} /> Đơn mua hàng</h4>
                            <button onClick={() => openPoModal(s.id)} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                              <Plus size={14} /> Tạo đơn mới
                            </button>
                          </div>
                          {loadingOrders ? (
                            <p className="text-sm text-gray-400 py-2">Đang tải...</p>
                          ) : purchaseOrders.length === 0 ? (
                            <p className="text-sm text-gray-400 py-2">Chưa có đơn mua hàng nào</p>
                          ) : (
                            <table className="w-full text-sm bg-white rounded-xl overflow-hidden">
                              <thead className="bg-gray-100">
                                <tr>
                                  {['Mã đơn', 'Ngày tạo', 'Tổng tiền', 'Đã trả', 'Còn lại', 'Trạng thái', 'Thao tác'].map(h => (
                                    <th key={h} className="text-left py-2 px-3 text-gray-500 font-medium">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {purchaseOrders.map(po => {
                                  const remaining = po.totalAmount - po.paidAmount
                                  return (
                                    <tr key={po.id} className="hover:bg-gray-50">
                                      <td className="py-2 px-3 font-medium text-primary-600">#{po.orderCode}</td>
                                      <td className="py-2 px-3 text-gray-500">{formatDate(po.createdAt)}</td>
                                      <td className="py-2 px-3 font-medium">{formatCurrency(po.totalAmount)}</td>
                                      <td className="py-2 px-3 text-green-600">{formatCurrency(po.paidAmount)}</td>
                                      <td className="py-2 px-3">
                                        {remaining > 0 ? (
                                          <span className="text-red-600 font-medium">{formatCurrency(remaining)}</span>
                                        ) : (
                                          <span className="text-green-600">Đã trả</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3">
                                        <span className={`badge text-xs ${statusColors[po.status] || 'bg-gray-100 text-gray-600'}`}>
                                          {statusLabels[po.status] || po.status}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3">
                                        <div className="flex gap-1">
                                          {po.status === 'Ordered' && (
                                            <button onClick={() => handleReceive(po.id)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-200">
                                              Nhận hàng
                                            </button>
                                          )}
                                          {(po.status === 'Received' || po.status === 'Ordered') && remaining > 0 && (
                                            <button onClick={() => openPayModal(po.id, remaining)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 flex items-center gap-1">
                                              <CreditCard size={12} /> Thanh toán
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-800">{editingSupplier ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhà cung cấp *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-field" placeholder="Tên nhà cung cấp" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="0901234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="ncc@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input-field" placeholder="Địa chỉ nhà cung cấp" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="input-field resize-none" placeholder="Ghi chú thêm..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                <span className="text-sm text-gray-700">Đang hoạt động</span>
              </label>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Đang lưu...' : editingSupplier ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Order Modal */}
      {showPoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-800">Tạo đơn mua hàng</h3>
              <button onClick={() => setShowPoModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmitPo} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú đơn hàng</label>
                <textarea value={poForm.notes} onChange={e => setPoForm({ ...poForm, notes: e.target.value })} rows={2} className="input-field resize-none" placeholder="Ghi chú..." />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Danh sách sản phẩm</label>
                  <button type="button" onClick={addPoItem} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                    <Plus size={14} /> Thêm dòng
                  </button>
                </div>
                <div className="space-y-2">
                  {poForm.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        className="input-field col-span-2"
                        placeholder="ID SP"
                        value={item.productId}
                        onChange={e => updatePoItem(i, 'productId', e.target.value)}
                        type="number"
                        min="1"
                      />
                      <input
                        className="input-field col-span-4"
                        placeholder="Tên sản phẩm"
                        value={item.productName}
                        onChange={e => updatePoItem(i, 'productName', e.target.value)}
                      />
                      <input
                        className="input-field col-span-2"
                        placeholder="SL"
                        value={item.quantity}
                        onChange={e => updatePoItem(i, 'quantity', e.target.value)}
                        type="number"
                        min="1"
                      />
                      <input
                        className="input-field col-span-3"
                        placeholder="Giá nhập"
                        value={item.costPrice}
                        onChange={e => updatePoItem(i, 'costPrice', e.target.value)}
                        type="number"
                        min="0"
                      />
                      <button type="button" onClick={() => removePoItem(i)} className="col-span-1 text-red-400 hover:text-red-600 p-1 flex justify-center">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">Tổng: {formatCurrency(poForm.items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.costPrice) || 0), 0))}</p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowPoModal(false)} className="btn-secondary">Hủy</button>
                <button type="submit" disabled={submittingPo} className="btn-primary">
                  {submittingPo ? 'Đang tạo...' : 'Tạo đơn hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Thanh toán công nợ</h3>
              <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handlePay} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền thanh toán</label>
                <input
                  type="number"
                  min="1"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowPayModal(false)} className="btn-secondary">Hủy</button>
                <button type="submit" className="btn-primary">Xác nhận thanh toán</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
