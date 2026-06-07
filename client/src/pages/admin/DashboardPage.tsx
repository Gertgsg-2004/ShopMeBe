import { useState, useEffect } from 'react'
import { ShoppingBag, Users, Package, TrendingUp, ArrowUpRight, Clock, AlertTriangle } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { DashboardData } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Shipping: 'bg-purple-100 text-purple-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  Shipping: 'Đang giao',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã hủy',
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getDashboard().then((res) => {
      if (res.data) setData(res.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  const stats = data ? [
    { label: 'Tổng đơn hàng', value: data.totalOrders.toString(), sub: `+${data.totalOrdersToday} hôm nay`, icon: ShoppingBag, color: 'bg-blue-500', light: 'bg-blue-50' },
    { label: 'Doanh thu', value: formatCurrency(data.totalRevenue), sub: `+${formatCurrency(data.totalRevenueToday)} hôm nay`, icon: TrendingUp, color: 'bg-green-500', light: 'bg-green-50' },
    { label: 'Khách hàng', value: data.totalCustomers.toString(), sub: 'Tổng tài khoản', icon: Users, color: 'bg-purple-500', light: 'bg-purple-50' },
    { label: 'Sản phẩm', value: data.totalProducts.toString(), sub: `${data.lowStockProducts} sắp hết hàng`, icon: Package, color: 'bg-primary-500', light: 'bg-primary-50' },
  ] : []

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${stat.light} rounded-xl flex items-center justify-center`}>
                <stat.icon size={20} className={`text-${stat.color.split('-')[1]}-500`} />
              </div>
              <ArrowUpRight size={16} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</p>
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {data && (data.pendingOrders > 0 || data.lowStockProducts > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {data.pendingOrders > 0 && (
            <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <Clock size={20} className="text-yellow-500 shrink-0" />
              <div>
                <p className="font-medium text-yellow-800 text-sm">Đơn chờ xác nhận</p>
                <p className="text-yellow-600 text-xs">{data.pendingOrders} đơn đang chờ</p>
              </div>
            </div>
          )}
          {data.lowStockProducts > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
              <AlertTriangle size={20} className="text-red-500 shrink-0" />
              <div>
                <p className="font-medium text-red-800 text-sm">Sản phẩm sắp hết hàng</p>
                <p className="text-red-600 text-xs">{data.lowStockProducts} sản phẩm ≤ 5 còn lại</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart (simple) */}
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-gray-800 mb-4">Doanh thu 7 ngày qua</h3>
          {data && data.revenueChart.length > 0 ? (
            <div className="space-y-3">
              {data.revenueChart.map((d, i) => {
                const maxRev = Math.max(...data.revenueChart.map((r) => r.revenue), 1)
                const pct = (d.revenue / maxRev) * 100
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-12 shrink-0">{d.date}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div className="bg-gradient-to-r from-primary-400 to-primary-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(pct, 3)}%` }}>
                        {pct > 30 && <span className="text-white text-xs font-medium">{formatCurrency(d.revenue)}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 w-24 text-right shrink-0">{formatCurrency(d.revenue)}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu doanh thu</p>
          )}
        </div>

        {/* Top products */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Sản phẩm bán chạy</h3>
          {data && data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.productName}</p>
                    <p className="text-xs text-gray-500">{p.soldCount} đã bán</p>
                  </div>
                  <span className="text-xs font-medium text-green-600 shrink-0">{formatCurrency(p.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu</p>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Đơn hàng gần đây</h3>
        {data && data.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Mã đơn</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Khách hàng</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Tổng tiền</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Trạng thái</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-2 font-medium text-primary-600">#{order.orderCode}</td>
                    <td className="py-3 px-2 text-gray-700">{order.customerName}</td>
                    <td className="py-3 px-2 font-medium">{formatCurrency(order.total)}</td>
                    <td className="py-3 px-2">
                      <span className={`badge ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-400 text-xs">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">Chưa có đơn hàng nào</p>
        )}
      </div>
    </div>
  )
}
