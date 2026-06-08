import { useState, useEffect } from 'react'
import { Download, TrendingUp, Package, BarChart2, DollarSign } from 'lucide-react'
import { adminService, RevenueReport, TopProductReport, SummaryReport, StockValueReport } from '../../services/adminService'
import { formatCurrency } from '../../utils/format'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

type Tab = 'revenue' | 'top-products' | 'summary' | 'stock-value'

const exportExcel = (data: any[], filename: string) => {
  if (!data || data.length === 0) { toast.error('Không có dữ liệu để xuất'); return }
  const csv = [Object.keys(data[0]).join(','), ...data.map(r => Object.values(r).join(','))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename + '.csv'; a.click()
  URL.revokeObjectURL(url)
}

const todayStr = () => new Date().toISOString().slice(0, 10)
const monthAgoStr = () => {
  const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10)
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState<Tab>('revenue')

  // Revenue tab
  const [fromDate, setFromDate] = useState(monthAgoStr())
  const [toDate, setToDate] = useState(todayStr())
  const [groupBy, setGroupBy] = useState('day')
  const [revenueData, setRevenueData] = useState<RevenueReport[]>([])
  const [loadingRevenue, setLoadingRevenue] = useState(false)

  // Top products tab
  const [topFrom, setTopFrom] = useState(monthAgoStr())
  const [topTo, setTopTo] = useState(todayStr())
  const [topLimit, setTopLimit] = useState(20)
  const [topProducts, setTopProducts] = useState<TopProductReport[]>([])
  const [loadingTop, setLoadingTop] = useState(false)

  // Summary tab
  const [sumFrom, setSumFrom] = useState(monthAgoStr())
  const [sumTo, setSumTo] = useState(todayStr())
  const [summary, setSummary] = useState<SummaryReport | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  // Stock value tab
  const [stockValue, setStockValue] = useState<StockValueReport | null>(null)
  const [loadingStockValue, setLoadingStockValue] = useState(false)

  const fetchRevenue = async () => {
    setLoadingRevenue(true)
    try {
      const res = await adminService.getRevenueReport(fromDate, toDate, groupBy)
      if (res.data) setRevenueData(res.data)
    } catch {
      toast.error('Không thể tải báo cáo doanh thu')
    } finally {
      setLoadingRevenue(false)
    }
  }

  const fetchTopProducts = async () => {
    setLoadingTop(true)
    try {
      const res = await adminService.getTopProductsReport(topFrom, topTo, topLimit)
      if (res.data) setTopProducts(res.data)
    } catch {
      toast.error('Không thể tải báo cáo sản phẩm')
    } finally {
      setLoadingTop(false)
    }
  }

  const fetchSummary = async () => {
    setLoadingSummary(true)
    try {
      const res = await adminService.getSummaryReport(sumFrom, sumTo)
      if (res.data) setSummary(res.data)
    } catch {
      toast.error('Không thể tải tổng quan')
    } finally {
      setLoadingSummary(false)
    }
  }

  const fetchStockValue = async () => {
    setLoadingStockValue(true)
    try {
      const res = await adminService.getStockValueReport()
      if (res.data) setStockValue(res.data)
    } catch {
      toast.error('Không thể tải báo cáo tồn kho')
    } finally {
      setLoadingStockValue(false)
    }
  }

  useEffect(() => { if (tab === 'revenue') fetchRevenue() }, [tab])
  useEffect(() => { if (tab === 'top-products') fetchTopProducts() }, [tab])
  useEffect(() => { if (tab === 'summary') fetchSummary() }, [tab])
  useEffect(() => { if (tab === 'stock-value') fetchStockValue() }, [tab])

  const tabs = [
    { key: 'revenue' as Tab, label: 'Doanh thu', icon: TrendingUp },
    { key: 'top-products' as Tab, label: 'Sản phẩm bán chạy', icon: BarChart2 },
    { key: 'summary' as Tab, label: 'Tổng quan', icon: DollarSign },
    { key: 'stock-value' as Tab, label: 'Tồn kho', icon: Package },
  ]

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1)
  const maxQty = Math.max(...topProducts.map(p => p.qtySold), 1)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Báo cáo & Thống kê</h2>
          <p className="text-sm text-gray-500 mt-1">Phân tích kinh doanh chi tiết</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Revenue */}
      {tab === 'revenue' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nhóm theo</label>
                <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="input-field">
                  <option value="day">Ngày</option>
                  <option value="month">Tháng</option>
                </select>
              </div>
              <button onClick={fetchRevenue} className="btn-primary">Xem báo cáo</button>
              <button onClick={() => exportExcel(revenueData, `doanh-thu-${fromDate}-${toDate}`)} className="btn-secondary flex items-center gap-2">
                <Download size={15} /> Xuất CSV
              </button>
            </div>
          </div>

          {loadingRevenue ? <LoadingSpinner /> : (
            <>
              {/* Bar Chart */}
              {revenueData.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-gray-800 mb-4">Biểu đồ doanh thu</h3>
                  <div className="space-y-2">
                    {revenueData.map((d, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-20 shrink-0">{d.date}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-blue-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                            style={{ width: `${Math.max((d.revenue / maxRevenue) * 100, 2)}%` }}
                          >
                            {(d.revenue / maxRevenue) > 0.3 && (
                              <span className="text-white text-xs font-medium">{formatCurrency(d.revenue)}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 w-28 text-right shrink-0">{formatCurrency(d.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Ngày', 'Đơn hàng', 'Doanh thu', 'Giá vốn', 'Lợi nhuận', 'Tỷ lệ lãi'].map(h => (
                          <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {revenueData.length === 0 && (
                        <tr><td colSpan={6} className="py-12 text-center text-gray-400">Không có dữ liệu trong khoảng thời gian này</td></tr>
                      )}
                      {revenueData.map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-700">{d.date}</td>
                          <td className="py-3 px-4 text-gray-600">{d.orders}</td>
                          <td className="py-3 px-4 text-blue-600 font-medium">{formatCurrency(d.revenue)}</td>
                          <td className="py-3 px-4 text-red-500">{formatCurrency(d.cost)}</td>
                          <td className="py-3 px-4 text-green-600 font-medium">{formatCurrency(d.profit)}</td>
                          <td className="py-3 px-4">
                            <span className={`badge text-xs ${d.margin >= 20 ? 'bg-green-100 text-green-700' : d.margin >= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              {d.margin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {revenueData.length > 0 && (
                      <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                          <td className="py-3 px-4 font-bold text-gray-800">Tổng cộng</td>
                          <td className="py-3 px-4 font-bold">{revenueData.reduce((s, d) => s + d.orders, 0)}</td>
                          <td className="py-3 px-4 font-bold text-blue-600">{formatCurrency(revenueData.reduce((s, d) => s + d.revenue, 0))}</td>
                          <td className="py-3 px-4 font-bold text-red-500">{formatCurrency(revenueData.reduce((s, d) => s + d.cost, 0))}</td>
                          <td className="py-3 px-4 font-bold text-green-600">{formatCurrency(revenueData.reduce((s, d) => s + d.profit, 0))}</td>
                          <td className="py-3 px-4">—</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Top Products */}
      {tab === 'top-products' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
                <input type="date" value={topFrom} onChange={e => setTopFrom(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
                <input type="date" value={topTo} onChange={e => setTopTo(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Số lượng hiển thị</label>
                <select value={topLimit} onChange={e => setTopLimit(Number(e.target.value))} className="input-field">
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                  <option value={50}>Top 50</option>
                </select>
              </div>
              <button onClick={fetchTopProducts} className="btn-primary">Xem báo cáo</button>
              <button onClick={() => exportExcel(topProducts, `san-pham-ban-chay-${topFrom}-${topTo}`)} className="btn-secondary flex items-center gap-2">
                <Download size={15} /> Xuất CSV
              </button>
            </div>
          </div>

          {loadingTop ? <LoadingSpinner /> : (
            <>
              {/* Horizontal bar chart */}
              {topProducts.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-gray-800 mb-4">Top sản phẩm bán chạy</h3>
                  <div className="space-y-3">
                    {topProducts.slice(0, 10).map((p, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                          {i + 1}
                        </span>
                        <span className="text-sm text-gray-700 w-36 shrink-0 truncate">{p.productName}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary-400 to-primary-500 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                            style={{ width: `${Math.max((p.qtySold / maxQty) * 100, 3)}%` }}
                          >
                            {(p.qtySold / maxQty) > 0.25 && <span className="text-white text-xs font-medium">{p.qtySold}</span>}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right shrink-0">{p.qtySold} sp</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['#', 'Sản phẩm', 'SKU', 'SL đã bán', 'Doanh thu'].map(h => (
                          <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {topProducts.length === 0 && (
                        <tr><td colSpan={5} className="py-12 text-center text-gray-400">Không có dữ liệu</td></tr>
                      )}
                      {topProducts.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'}`}>
                              {i + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-800">{p.productName}</td>
                          <td className="py-3 px-4 text-gray-500 font-mono text-xs">{p.sku || '—'}</td>
                          <td className="py-3 px-4 text-gray-700 font-medium">{p.qtySold.toLocaleString('vi-VN')}</td>
                          <td className="py-3 px-4 text-primary-600 font-medium">{formatCurrency(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 3: Summary */}
      {tab === 'summary' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
                <input type="date" value={sumFrom} onChange={e => setSumFrom(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
                <input type="date" value={sumTo} onChange={e => setSumTo(e.target.value)} className="input-field" />
              </div>
              <button onClick={fetchSummary} className="btn-primary">Xem tổng quan</button>
              {summary && (
                <button onClick={() => exportExcel([summary], `tong-quan-${sumFrom}-${sumTo}`)} className="btn-secondary flex items-center gap-2">
                  <Download size={15} /> Xuất CSV
                </button>
              )}
            </div>
          </div>

          {loadingSummary ? <LoadingSpinner /> : summary ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="card bg-blue-50 border-blue-100">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                  <TrendingUp size={20} className="text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(summary.totalRevenue)}</p>
                <p className="text-sm font-medium text-blue-600 mt-1">Tổng doanh thu</p>
              </div>
              <div className="card bg-red-50 border-red-100">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mb-3">
                  <DollarSign size={20} className="text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalCost)}</p>
                <p className="text-sm font-medium text-red-500 mt-1">Tổng giá vốn</p>
              </div>
              <div className="card bg-green-50 border-green-100">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                  <DollarSign size={20} className="text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(summary.totalProfit)}</p>
                <p className="text-sm font-medium text-green-600 mt-1">Tổng lợi nhuận</p>
              </div>
              <div className="card">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
                  <BarChart2 size={20} className="text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{summary.totalOrders.toLocaleString('vi-VN')}</p>
                <p className="text-sm font-medium text-gray-600 mt-1">Tổng đơn hàng</p>
              </div>
              <div className="card">
                <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center mb-3">
                  <TrendingUp size={20} className="text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{summary.profitMargin.toFixed(1)}%</p>
                <p className="text-sm font-medium text-gray-600 mt-1">Tỷ lệ lợi nhuận</p>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12 text-gray-400">
              <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
              <p>Chọn khoảng thời gian và nhấn "Xem tổng quan"</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Stock Value */}
      {tab === 'stock-value' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              {stockValue && (
                <div className="flex items-center gap-3">
                  <div className="card py-3 px-5 flex items-center gap-3">
                    <Package size={20} className="text-primary-500" />
                    <div>
                      <p className="text-xs text-gray-500">Tổng giá trị tồn kho</p>
                      <p className="text-xl font-bold text-gray-800">{formatCurrency(stockValue.totalValue)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={fetchStockValue} className="btn-primary">Làm mới</button>
              {stockValue && (
                <button onClick={() => exportExcel(stockValue.items, 'gia-tri-ton-kho')} className="btn-secondary flex items-center gap-2">
                  <Download size={15} /> Xuất CSV
                </button>
              )}
            </div>
          </div>

          {loadingStockValue ? <LoadingSpinner /> : stockValue ? (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Sản phẩm', 'SKU', 'Tồn kho', 'Giá vốn', 'Giá trị'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stockValue.items.length === 0 && (
                      <tr><td colSpan={5} className="py-12 text-center text-gray-400">Không có dữ liệu</td></tr>
                    )}
                    {stockValue.items.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-800">{item.productName}</td>
                        <td className="py-3 px-4 text-gray-500 font-mono text-xs">{item.sku || '—'}</td>
                        <td className="py-3 px-4">
                          <span className={`badge ${item.stock < 5 ? 'bg-red-100 text-red-600' : item.stock < 20 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                            {item.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{item.costPrice > 0 ? formatCurrency(item.costPrice) : '—'}</td>
                        <td className="py-3 px-4 font-medium text-primary-600">{formatCurrency(item.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {stockValue.items.length > 0 && (
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan={4} className="py-3 px-4 font-bold text-gray-800">Tổng giá trị</td>
                        <td className="py-3 px-4 font-bold text-primary-600">{formatCurrency(stockValue.totalValue)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12 text-gray-400">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p>Đang tải dữ liệu tồn kho...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
