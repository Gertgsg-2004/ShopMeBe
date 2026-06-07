import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, Package, ArrowRight } from 'lucide-react'
import { orderService } from '../services/orderService'
import { Order } from '../types'
import { formatCurrency, formatDate } from '../utils/format'

export default function OrderSuccessPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (id) orderService.getOrder(parseInt(id)).then((res) => { if (res.data) setOrder(res.data) })
  }, [id])

  return (
    <div className="container mx-auto px-4 py-16 text-center max-w-lg">
      <div className="card">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={44} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Đặt hàng thành công! 🎉</h1>
        <p className="text-gray-500 mb-6">Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ xác nhận sớm nhất.</p>

        {order && (
          <div className="bg-pink-50 rounded-xl p-4 text-left mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Mã đơn hàng:</span>
              <span className="font-bold text-primary-600">#{order.orderCode}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Ngày đặt:</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Thanh toán:</span>
              <span>{order.paymentMethodText}</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span>Tổng tiền:</span>
              <span className="text-primary-600">{formatCurrency(order.total)}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link to={`/don-hang/${id}`} className="btn-primary justify-center">
            <Package size={18} /> Xem chi tiết đơn hàng
          </Link>
          <Link to="/" className="btn-secondary justify-center">
            Tiếp tục mua sắm <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  )
}
