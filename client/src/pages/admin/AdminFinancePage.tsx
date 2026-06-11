import { useState, useEffect } from 'react'
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Wallet, Search, CheckCircle2, XCircle, Clock } from 'lucide-react'
import api from '../../services/api'
import { formatCurrency } from '../../utils/format'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface WalletTx {
  id: number
  userId: string
  userName?: string
  adminName?: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  type: string
  reason?: string
  reference?: string
  createdAt: string
}

interface PaymentItem {
  id: number
  orderCode: string
  customerName?: string
  total: number
  status: number
  paymentMethod: number
  createdAt: string
}

interface Summary {
  totalRevenue: number
  totalTopUp: number
  totalOrders: number
  totalWalletBalance: number
}

interface TopUpRequest {
  id: number
  amount: number
  isCompleted: boolean
  createdAt: string
  completedAt?: string
  userId: string
  fullName: string
  phone?: string
  transferCode: string
}

const TYPE_LABELS: Record<string, string> = {
  TopUp: 'Nạp tiền',
  AdminCredit: 'Admin cộng',
  AdminDebit: 'Admin trừ',
  Purchase: 'Mua hàng',
  Refund: 'Hoàn tiền',
}

const TYPE_COLORS: Record<string, string> = {
  TopUp: 'text-green-600 bg-green-50',
  AdminCredit: 'text-blue-600 bg-blue-50',
  AdminDebit: 'text-red-600 bg-red-50',
  Purchase: 'text-gray-600 bg-gray-100',
  Refund: 'text-purple-600 bg-purple-50',
}

export default function AdminFinancePage() {
  const [tab, setTab] = useState<'summary' | 'payments' | 'wallet' | 'topups'>('summary')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [walletTxs, setWalletTxs] = useState<WalletTx[]>([])
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [pendingOnly, setPendingOnly] = useState(true)

  useEffect(() => { loadSummary() }, [])
  useEffect(() => {
    if (tab === 'payments') loadPayments()
    if (tab === 'wallet') loadWallet()
    if (tab === 'topups') loadTopUps()
  }, [tab, typeFilter, pendingOnly])

  const loadSummary = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/finance/summary')
      if (data.data) setSummary(data.data)
    } finally { setLoading(false) }
  }

  const loadPayments = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/finance/payments?pageSize=50')
      if (data.data) setPayments(data.data.items || [])
    } finally { setLoading(false) }
  }

  const loadWallet = async () => {
    setLoading(true)
    try {
      const q = typeFilter ? `&type=${typeFilter}` : ''
      const { data } = await api.get(`/admin/finance/wallet-transactions?pageSize=50${q}`)
      if (data.data) setWalletTxs(data.data.items || [])
    } finally { setLoading(false) }
  }

  const loadTopUps = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/topup-requests?pendingOnly=${pendingOnly}`)
      if (data.data) setTopUpRequests(data.data)
    } finally { setLoading(false) }
  }

  const approveTopUp = async (id: number) => {
    try {
      const { data } = await api.post(`/admin/topup-requests/${id}/approve`)
      toast.success(data.message || 'Đã duyệt nạp tiền')
      loadTopUps()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Lỗi') }
  }

  const rejectTopUp = async (id: number) => {
    if (!confirm('Từ chối yêu cầu nạp tiền này?')) return
    try {
      await api.delete(`/admin/topup-requests/${id}`)
      toast.success('Đã từ chối yêu cầu')
      loadTopUps()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Lỗi') }
  }

  const filteredWallet = walletTxs.filter(t =>
    !searchFilter || t.userName?.toLowerCase().includes(searchFilter.toLowerCase())
  )

  const tabs = [
    { id: 'summary', label: 'Tổng quan' },
    { id: 'payments', label: 'Lịch sử thanh toán' },
    { id: 'wallet', label: 'Giao dịch ví' },
    { id: 'topups', label: 'Yêu cầu nạp tiền' },
  ] as const

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Quản lý tài chính</h2>
        <p className="text-sm text-gray-500 mt-1">Theo dõi doanh thu, nạp tiền và giao dịch ví</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <LoadingSpinner />}

      {/* Summary */}
      {tab === 'summary' && !loading && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Tổng doanh thu', value: formatCurrency(summary.totalRevenue), icon: DollarSign, color: 'text-green-500 bg-green-50' },
              { label: 'Tổng đơn hàng', value: summary.totalOrders.toLocaleString(), icon: ArrowUpCircle, color: 'text-blue-500 bg-blue-50' },
              { label: 'Tổng tiền nạp', value: formatCurrency(summary.totalTopUp), icon: ArrowDownCircle, color: 'text-purple-500 bg-purple-50' },
              { label: 'Tổng số dư ví', value: formatCurrency(summary.totalWalletBalance), icon: Wallet, color: 'text-amber-500 bg-amber-50' },
            ].map((s, i) => (
              <div key={i} className="card">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                  <s.icon size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payments */}
      {tab === 'payments' && !loading && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Mã đơn', 'Khách hàng', 'Số tiền', 'Phương thức', 'Trạng thái', 'Thời gian'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">{p.orderCode}</td>
                    <td className="py-3 px-4 text-gray-700">{p.customerName || '-'}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{formatCurrency(p.total)}</td>
                    <td className="py-3 px-4 text-gray-600">{p.paymentMethod === 1 ? 'Tiền mặt' : p.paymentMethod === 2 ? 'VNPay' : 'COD'}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${p.status === 1 ? 'bg-green-100 text-green-600' : p.status === 0 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
                        {p.status === 0 ? 'Chờ' : p.status === 1 ? 'Xác nhận' : p.status === 2 ? 'Giao hàng' : 'Hoàn thành'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{new Date(p.createdAt).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Wallet transactions */}
      {tab === 'wallet' && !loading && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
                placeholder="Tìm theo tên khách..." className="input-field pl-9 text-sm" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field text-sm w-auto">
              <option value="">Tất cả loại</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Khách hàng', 'Loại', 'Số tiền', 'Số dư trước', 'Số dư sau', 'Lý do', 'Thực hiện bởi', 'Thời gian'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredWallet.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{t.userName || t.userId.slice(0, 8)}</td>
                      <td className="py-3 px-4">
                        <span className={`badge text-xs ${TYPE_COLORS[t.type] || 'bg-gray-100 text-gray-600'}`}>{TYPE_LABELS[t.type] || t.type}</span>
                      </td>
                      <td className={`py-3 px-4 font-semibold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {t.amount >= 0 ? '+' : ''}{formatCurrency(t.amount)}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{formatCurrency(t.balanceBefore)}</td>
                      <td className="py-3 px-4 text-gray-700 text-xs font-medium">{formatCurrency(t.balanceAfter)}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs max-w-[160px] truncate">{t.reason || '-'}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{t.adminName || '-'}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">{new Date(t.createdAt).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Top-up requests */}
      {tab === 'topups' && !loading && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={pendingOnly} onChange={e => setPendingOnly(e.target.checked)} className="rounded" />
              Chỉ hiện chờ duyệt
            </label>
          </div>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['#', 'Khách hàng', 'SĐT', 'Mã ND CK', 'Số tiền', 'Trạng thái', 'Thời gian', 'Hành động'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topUpRequests.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-400 text-xs">#{r.id}</td>
                      <td className="py-3 px-4 font-medium text-gray-800">{r.fullName}</td>
                      <td className="py-3 px-4 text-gray-600">{r.phone || '-'}</td>
                      <td className="py-3 px-4 font-mono text-primary-700 font-bold">{r.transferCode}</td>
                      <td className="py-3 px-4 font-semibold text-green-600">{formatCurrency(r.amount)}</td>
                      <td className="py-3 px-4">
                        {r.isCompleted ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 size={12} /> Đã duyệt</span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 text-xs"><Clock size={12} /> Chờ duyệt</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">{new Date(r.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="py-3 px-4">
                        {!r.isCompleted && (
                          <div className="flex gap-2">
                            <button onClick={() => approveTopUp(r.id)}
                              className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1">
                              <CheckCircle2 size={12} /> Duyệt
                            </button>
                            <button onClick={() => rejectTopUp(r.id)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1">
                              <XCircle size={12} /> Từ chối
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {topUpRequests.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-gray-400">Không có yêu cầu nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
