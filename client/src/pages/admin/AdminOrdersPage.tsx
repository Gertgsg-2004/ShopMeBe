import { useState, useEffect } from 'react'
import { Eye } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { Order } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Pagination from '../../components/ui/Pagination'
import toast from 'react-hot-toast'

const statusOptions = [
  { value: 0, label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700' },
  { value: 1, label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  { value: 2, label: 'Đang giao hàng', color: 'bg-purple-100 text-purple-700' },
  { value: 3, label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  { value: 4, label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await adminService.getAllOrders(page, 20)
      if (res.data) {
        setOrders(res.data.items)
        setTotal(res.data.totalCount)
        setTotalPages(res.data.totalPages)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [page])

  const handleUpdateStatus = async (orderId: number, status: number) => {
    setUpdatingStatus(true)
    try {
      const res = await adminService.updateOrderStatus(orderId, status)
      if (res.success) {
        toast.success('Cập nhật trạng thái thành công')
        fetchOrders()
        setSelectedOrder(null)
      }
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý đơn hàng</h2>
          <p className="text-sm text-gray-500 mt-1">{total} đơn hàng</p>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Mã đơn', 'Khách hàng', 'Sản phẩm', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Ngày đặt', 'Thao tác'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const statusInfo = statusOptions.find((s) => s.value === order.status)
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-primary-600">#{order.orderCode}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800">{order.receiverName}</p>
                        <p className="text-xs text-gray-400">{order.receiverPhone}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{order.items.length} sản phẩm</td>
                      <td className="py-3 px-4 font-medium">{formatCurrency(order.total)}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{order.paymentMethodText}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${statusInfo?.color || 'bg-gray-100 text-gray-600'}`}>
                          {statusInfo?.label || order.statusText}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(order.createdAt)}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-1 text-primary-600 hover:bg-primary-50 px-2 py-1 rounded-lg transition-colors text-xs">
                          <Eye size={14} /> Chi tiết
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Đơn hàng #{selectedOrder.orderCode}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Khách hàng</p>
                <p className="text-sm text-gray-600">{selectedOrder.receiverName} · {selectedOrder.receiverPhone}</p>
                <p className="text-sm text-gray-600">{selectedOrder.shippingAddress}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Sản phẩm</p>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span className="text-gray-600">{item.productName} x{item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.subTotal)}</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                  <span>Tổng</span>
                  <span className="text-primary-600">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Cập nhật trạng thái</p>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((s) => (
                    <button key={s.value} onClick={() => handleUpdateStatus(selectedOrder.id, s.value)}
                      disabled={updatingStatus || selectedOrder.status === s.value}
                      className={`text-xs py-2 px-3 rounded-xl border transition-colors ${selectedOrder.status === s.value ? s.color + ' border-transparent font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'} disabled:opacity-50`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
