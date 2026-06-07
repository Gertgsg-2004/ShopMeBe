import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Package, MapPin, Phone, User, CreditCard, Tag, ArrowLeft } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { orderService } from '../services/orderService'
import { Order } from '../types'
import { formatCurrency, formatDate } from '../utils/format'
import toast from 'react-hot-toast'

const statusColors: Record<number, string> = {
  0: 'bg-yellow-100 text-yellow-700',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-purple-100 text-purple-700',
  3: 'bg-green-100 text-green-700',
  4: 'bg-red-100 text-red-700',
}

const statusSteps = [
  { status: 0, label: 'Chờ xác nhận' },
  { status: 1, label: 'Đã xác nhận' },
  { status: 2, label: 'Đang giao' },
  { status: 3, label: 'Hoàn thành' },
]

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (id) {
      orderService.getOrder(parseInt(id)).then((res) => {
        if (res.data) setOrder(res.data)
      }).finally(() => setLoading(false))
    }
  }, [id])

  const handleCancel = async () => {
    if (!order) return
    setCancelling(true)
    try {
      const res = await orderService.cancelOrder(order.id)
      if (res.success) {
        toast.success('Đã hủy đơn hàng')
        setOrder({ ...order, status: 4, statusText: 'Đã hủy' })
      } else {
        toast.error(res.message || 'Hủy thất bại')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <div className="py-20"><LoadingSpinner /></div>
  if (!order) return <div className="text-center py-20 text-gray-500">Không tìm thấy đơn hàng</div>

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/don-hang" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Đơn hàng #{order.orderCode}</h1>
          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`ml-auto badge ${statusColors[order.status] || 'bg-gray-100 text-gray-600'} text-sm px-3 py-1`}>
          {order.statusText}
        </span>
      </div>

      {/* Progress */}
      {order.status < 4 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            {statusSteps.map((step, i) => (
              <div key={step.status} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${order.status >= step.status ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-200 text-gray-400'}`}>
                    {order.status > step.status ? '✓' : i + 1}
                  </div>
                  <p className={`text-xs mt-1 text-center ${order.status >= step.status ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                </div>
                {i < statusSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${order.status > step.status ? 'bg-primary-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package size={18} className="text-primary-500" /> Sản phẩm đặt mua
        </h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <img src={item.productImage || '/placeholder.jpg'} alt={item.productName}
                className="w-16 h-16 object-cover rounded-xl shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.productName}</p>
                <p className="text-xs text-gray-500 mt-1">x{item.quantity} × {formatCurrency(item.price)}</p>
              </div>
              <p className="font-medium text-gray-800">{formatCurrency(item.subTotal)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Tạm tính</span><span>{formatCurrency(order.subTotal)}</span></div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Giảm giá {order.couponCode && `(${order.couponCode})`}</span>
              <span>-{formatCurrency(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600"><span>Phí ship</span><span>{order.shippingFee === 0 ? 'Miễn phí' : formatCurrency(order.shippingFee)}</span></div>
          <div className="flex justify-between font-bold text-gray-800 text-base"><span>Tổng cộng</span><span className="text-primary-600">{formatCurrency(order.total)}</span></div>
        </div>
      </div>

      {/* Shipping & payment */}
      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-primary-500" /> Thông tin giao hàng
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2"><User size={14} /> {order.receiverName}</p>
            <p className="flex items-center gap-2"><Phone size={14} /> {order.receiverPhone}</p>
            <p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5" /> {order.shippingAddress}</p>
            {order.note && <p className="text-gray-400 italic">Ghi chú: {order.note}</p>}
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CreditCard size={16} className="text-primary-500" /> Thanh toán
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>{order.paymentMethodText}</p>
            <span className={`badge ${order.paymentStatus === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {order.paymentStatus === 1 ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </span>
          </div>
        </div>
      </div>

      {order.status === 0 && (
        <button onClick={handleCancel} disabled={cancelling}
          className="w-full py-3 border-2 border-red-300 text-red-500 hover:bg-red-50 font-medium rounded-xl transition-colors disabled:opacity-50">
          {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
        </button>
      )}
    </div>
  )
}
