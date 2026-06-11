import { useState, useEffect } from 'react'
import { Wallet, ArrowUpCircle, ArrowDownCircle, Copy, Clock, CheckCircle2 } from 'lucide-react'
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

interface PendingTopUp {
  id: number
  amount: number
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  TopUp: 'Nạp tiền chuyển khoản',
  AdminCredit: 'Shop cộng tiền',
  AdminDebit: 'Shop trừ tiền',
  Purchase: 'Thanh toán đơn hàng',
  Refund: 'Hoàn tiền',
}

const BANK_INFO = {
  bankName: 'Vietcombank',
  accountNumber: '1234567890',
  accountName: 'NGUYEN THI ANH TUYET',
  branch: 'Chi nhánh TP.HCM',
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0)
  const [totalTopUp, setTotalTopUp] = useState(0)
  const [history, setHistory] = useState<WalletTx[]>([])
  const [transferCode, setTransferCode] = useState('')
  const [pendingTopUps, setPendingTopUps] = useState<PendingTopUp[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [requested, setRequested] = useState(false)

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000]

  const fetchWallet = async () => {
    try {
      const { data } = await api.get('/wallet')
      if (data.data) {
        setBalance(data.data.balance)
        setTotalTopUp(data.data.totalTopUp || 0)
        setHistory(data.data.history || [])
        setTransferCode(data.data.transferCode || '')
        setPendingTopUps(data.data.pendingTopUps || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWallet() }, [])

  const handleTopUpRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!value || value < 10000) {
      toast.error('Số tiền nạp tối thiểu là 10.000đ')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/wallet/topup-request', { amount: value })
      setRequested(true)
      fetchWallet()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Đã sao chép ${label}`)
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

      {/* Pending top-ups */}
      {pendingTopUps.length > 0 && (
        <div className="card mb-6 border border-yellow-200 bg-yellow-50">
          <h2 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <Clock size={16} /> Yêu cầu nạp tiền đang chờ xử lý
          </h2>
          <div className="space-y-2">
            {pendingTopUps.map(p => (
              <div key={p.id} className="flex justify-between text-sm">
                <span className="text-yellow-700">#{p.id} — {new Date(p.createdAt).toLocaleString('vi-VN')}</span>
                <span className="font-semibold text-yellow-800">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top-up section */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Nạp tiền qua chuyển khoản ngân hàng</h2>

        {!showForm && !requested ? (
          <button onClick={() => setShowForm(true)} className="btn-primary w-full justify-center">
            Tạo yêu cầu nạp tiền
          </button>
        ) : requested ? (
          <div className="text-center py-4">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-medium">Yêu cầu đã được ghi nhận!</p>
            <p className="text-sm text-gray-500 mt-1">Vui lòng chuyển khoản theo thông tin bên dưới</p>
            <button onClick={() => { setRequested(false); setShowForm(false); setAmount('') }} className="mt-3 text-sm text-primary-600 underline">
              Tạo yêu cầu khác
            </button>
          </div>
        ) : (
          <form onSubmit={handleTopUpRequest} className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền muốn nạp (đ)</label>
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
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                {submitting ? 'Đang gửi...' : 'Xác nhận yêu cầu'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-4">
                Hủy
              </button>
            </div>
          </form>
        )}

        {/* Bank info always visible */}
        <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
          <p className="text-sm font-semibold text-gray-700">Thông tin chuyển khoản:</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Ngân hàng</p>
              <p className="font-medium">{BANK_INFO.bankName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Chi nhánh</p>
              <p className="font-medium">{BANK_INFO.branch}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Số tài khoản</p>
              <div className="flex items-center gap-1">
                <p className="font-mono font-bold text-primary-600">{BANK_INFO.accountNumber}</p>
                <button onClick={() => copyText(BANK_INFO.accountNumber, 'số tài khoản')} className="text-gray-400 hover:text-primary-500">
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Chủ tài khoản</p>
              <p className="font-medium">{BANK_INFO.accountName}</p>
            </div>
          </div>
          {transferCode && (
            <div className="border-t border-gray-200 pt-3">
              <p className="text-gray-500 text-xs mb-1">Nội dung chuyển khoản (bắt buộc)</p>
              <div className="flex items-center gap-2 bg-white border border-primary-200 rounded-lg px-3 py-2">
                <p className="font-mono font-bold text-primary-700 text-lg flex-1">{transferCode}</p>
                <button onClick={() => copyText(transferCode, 'nội dung chuyển khoản')} className="text-gray-400 hover:text-primary-500">
                  <Copy size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Mã nội dung duy nhất của tài khoản bạn. Chuyển khoản đúng nội dung để được duyệt tự động.</p>
            </div>
          )}
        </div>
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
