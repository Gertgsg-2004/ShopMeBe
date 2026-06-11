import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Wallet, CreditCard, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import api from '../services/api'
import { formatCurrency } from '../utils/format'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface WalletTx {
  id: number
  amount: number
  balanceBefore: number
  balanceAfter: number
  type: string
  reason?: string
  reference?: string
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  TopUp: 'Nạp tiền VNPay',
  AdminCredit: 'Shop cộng tiền',
  AdminDebit: 'Shop trừ tiền',
  Purchase: 'Thanh toán đơn hàng',
  Refund: 'Hoàn tiền',
}

export default function WalletPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [balance, setBalance] = useState(0)
  const [totalTopUp, setTotalTopUp] = useState(0)
  const [history, setHistory] = useState<WalletTx[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000]

  const fetchWallet = async () => {
    try {
      const { data } = await api.get('/wallet')
      if (data.data) {
        setBalance(data.data.balance)
        setTotalTopUp(data.data.totalTopUp || 0)
        setHistory(data.data.history || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const topup = searchParams.get('topup')
    if (topup === 'success') {
      toast.success('Nạp tiền thành công! 🎉')
      setSearchParams({}, { replace: true })
    } else if (topup === 'failed') {
      toast.error('Nạp tiền thất bại, vui lòng thử lại')
      setSearchParams({}, { replace: true })
    }
    fetchWallet()
  }, [])

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!value || value < 10000) {
      toast.error('Số tiền nạp tối thiểu là 10.000đ')
      return
    }
    setSubmitting(true)
    try {
      const { data } = await api.post('/wallet/topup', { amount: value })
      if (data.success && data.data) {
        window.location.href = data.data
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
      setSubmitting(false)
    }
  }

  if (loading) return <div className="container mx-auto px-4 py-12"><LoadingSpinner /></div>

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Wallet className="text-primary-500" /> Ví của tôi
      </h1>

      {/* Balance card */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-400 rounded-2xl p-6 text-white mb-6 flex items-end justify-between">
        <div>
          <p className="text-primary-100 text-sm mb-1">Số dư khả dụng</p>
          <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
        </div>
        <div className="text-right">
          <p className="text-primary-100 text-xs">Tổng đã nạp</p>
          <p className="text-lg font-semibold">{formatCurrency(totalTopUp)}</p>
        </div>
      </div>

      {/* Top-up form */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard size={18} className="text-primary-500" /> Nạp tiền qua VNPay
        </h2>
        <form onSubmit={handleTopUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền nạp (đ)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={10000}
              step={10000}
              required
              className="input-field"
              placeholder="Tối thiểu 10.000đ"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((a) => (
              <button key={a} type="button" onClick={() => setAmount(String(a))}
                className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
                  amount === String(a)
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                }`}>
                {formatCurrency(a)}
              </button>
            ))}
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
            {submitting ? 'Đang chuyển đến VNPay...' : 'Nạp tiền ngay'}
          </button>
          <p className="text-xs text-gray-400 text-center">
            Bạn sẽ được chuyển đến cổng thanh toán VNPay an toàn để hoàn tất giao dịch
          </p>
        </form>
      </div>

      {/* History */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Lịch sử giao dịch ví</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Chưa có giao dịch nào</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {h.amount >= 0 ? (
                    <ArrowUpCircle size={18} className="text-green-500" />
                  ) : (
                    <ArrowDownCircle size={18} className="text-red-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-800">{TYPE_LABELS[h.type] || h.type}</p>
                    {h.reason && <p className="text-xs text-gray-500">{h.reason}</p>}
                    <p className="text-xs text-gray-400">{new Date(h.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${h.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {h.amount >= 0 ? '+' : ''}{formatCurrency(h.amount)}
                  </p>
                  <p className="text-xs text-gray-400">Số dư: {formatCurrency(h.balanceAfter)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
