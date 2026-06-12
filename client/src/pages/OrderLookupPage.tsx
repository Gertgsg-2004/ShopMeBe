import { useState } from 'react'
import { Search, PackageSearch } from 'lucide-react'
import api from '../services/api'
import { formatCurrency, formatDate } from '../utils/format'

const STATUS_LABELS: Record<number, { text: string; cls: string }> = {
  0: { text: 'Chờ xác nhận', cls: 'bg-yellow-100 text-yellow-700' },
  1: { text: 'Đã xác nhận', cls: 'bg-blue-100 text-blue-700' },
  2: { text: 'Đang giao', cls: 'bg-indigo-100 text-indigo-700' },
  3: { text: 'Hoàn thành', cls: 'bg-green-100 text-green-700' },
  4: { text: 'Đã hủy', cls: 'bg-red-100 text-red-700' },
}

interface LookupResult {
  orderCode: string
  receiverName: string
  shippingAddress: string
  status: number
  paymentStatus: number
  subTotal: number
  shippingFee: number
  discountAmount: number
  total: number
  createdAt: string
  items: { productName: string; productImage?: string; price: number; quantity: number }[]
}

export default function OrderLookupPage() {
  const [code, setCode] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<LookupResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setOrder(null)
    try {
      const { data } = await api.get('/orders/lookup', { params: { code: code.trim(), phone: phone.trim() } })
      if (data?.data) setOrder(data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tìm thấy đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const status = order ? STATUS_LABELS[order.status] ?? STATUS_LABELS[0] : null

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
        <PackageSearch className="text-primary-500" /> Tra cứu đơn hàng
      </h1>
      <p className="text-gray-500 text-sm mb-6">Nhập mã đơn hàng và số điện thoại người nhận để xem trạng thái đơn — không cần đăng nhập.</p>

      <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
            <input className="input-field font-mono" value={code} onChange={e => setCode(e.target.value)}
              placeholder="VD: ORD123456" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại người nhận</label>
            <input className="input-field" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="0901234567" required />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          <Search size={18} /> {loading ? 'Đang tra cứu...' : 'Tra cứu'}
        </button>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </form>

      {order && status && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Mã đơn hàng</p>
              <p className="font-bold text-primary-600 text-lg">#{order.orderCode}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.cls}`}>{status.text}</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-sm bg-gray-50 rounded-xl p-4">
            <div><p className="text-gray-400 text-xs">Người nhận</p><p className="font-medium">{order.receiverName}</p></div>
            <div><p className="text-gray-400 text-xs">Ngày đặt</p><p className="font-medium">{formatDate(order.createdAt)}</p></div>
            <div className="sm:col-span-2"><p className="text-gray-400 text-xs">Địa chỉ giao</p><p className="font-medium">{order.shippingAddress}</p></div>
            <div><p className="text-gray-400 text-xs">Thanh toán</p>
              <p className={`font-medium ${order.paymentStatus === 1 ? 'text-green-600' : 'text-yellow-600'}`}>
                {order.paymentStatus === 1 ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </p>
            </div>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-2 text-sm">Sản phẩm</p>
            <div className="divide-y divide-gray-50">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 text-sm">
                  <img src={item.productImage || '/placeholder.jpg'} alt={item.productName}
                    className="w-10 h-10 object-cover rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 line-clamp-1">{item.productName}</p>
                    <p className="text-xs text-gray-400">x{item.quantity} × {formatCurrency(item.price)}</p>
                  </div>
                  <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 text-sm border-t border-gray-100 pt-3">
            <div className="flex justify-between text-gray-600"><span>Tạm tính</span><span>{formatCurrency(order.subTotal)}</span></div>
            {order.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{formatCurrency(order.discountAmount)}</span></div>}
            <div className="flex justify-between text-gray-600"><span>Phí ship</span><span>{order.shippingFee === 0 ? 'Miễn phí' : formatCurrency(order.shippingFee)}</span></div>
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Tổng cộng</span><span className="text-primary-600">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
