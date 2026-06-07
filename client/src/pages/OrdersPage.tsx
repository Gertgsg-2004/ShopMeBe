import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Eye } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import { orderService } from '../services/orderService'
import { Order } from '../types'
import { formatCurrency, formatDate } from '../utils/format'

const statusColors: Record<number, string> = {
  0: 'bg-yellow-100 text-yellow-700',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-purple-100 text-purple-700',
  3: 'bg-green-100 text-green-700',
  4: 'bg-red-100 text-red-700',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    orderService.getMyOrders(page).then((res) => {
      if (res.data) {
        setOrders(res.data.items)
        setTotal(res.data.totalCount)
        setTotalPages(res.data.totalPages)
      }
    }).finally(() => setLoading(false))
  }, [page])

  if (loading) return <div className="py-20"><LoadingSpinner /></div>

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Đơn hàng của tôi ({total})</h1>

      {orders.length === 0 ? (
        <EmptyState
          title="Chưa có đơn hàng nào"
          description="Bạn chưa đặt hàng lần nào. Hãy mua sắm ngay!"
          icon={<Package size={28} className="text-primary-400" />}
          action={<Link to="/" className="btn-primary">Mua sắm ngay</Link>}
        />
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">#{order.orderCode}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className={`badge ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.statusText}
                  </span>
                </div>

                <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
                  {order.items.slice(0, 4).map((item) => (
                    <img key={item.id} src={item.productImage || '/placeholder.jpg'} alt={item.productName}
                      className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ))}
                  {order.items.length > 4 && (
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 text-sm font-medium shrink-0">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{order.items.length} sản phẩm • {order.paymentMethodText}</p>
                    <p className="font-bold text-primary-600">{formatCurrency(order.total)}</p>
                  </div>
                  <Link to={`/don-hang/${order.id}`} className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:bg-primary-50 px-3 py-2 rounded-xl transition-colors">
                    <Eye size={16} /> Xem chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
