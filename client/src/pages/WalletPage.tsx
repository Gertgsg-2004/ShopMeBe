import { useState, useEffect } from 'react'
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle2 } from 'lucide-react'
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

const BANK = {
  bankId: 'VCB',        // Vietcombank bank code for VietQR
  accountNo: '1234567890',
  accountName: 'DO THI ANH TUYET',
  bankName: 'Vietcombank',
  branch: 'Chi nhánh Mai Sơn Sơn La',
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
  const [step, setStep] = useState<'select' | 'info'>('select')
  const [confirmedAmount, setConfirmedAmount] = useState(0)

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

  const handleConfirmAmount = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!value || value < 10000) {
      toast.error('Số tiền nạp tối thiểu là 10.000đ')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/wallet/topup-request', { amount: value })
      setConfirmedAmount(value)
      setStep('info')
      fetchWallet()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  const qrUrl = step === 'info'
    ? `https://img.vietqr.io/image/${BANK.bankId}-${BANK.accountNo}-compact2.png?amount=${confirmedAmount}&addInfo=${encodeURIComponent(transferCode)}&accountName=${encodeURIComponent(BANK.accountName)}`
    : ''

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
            <Clock size={16} /> Yêu cầu đang chờ xử lý
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

        {step === 'select' ? (
          <form onSubmit={handleConfirmAmount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chọn số tiền muốn nạp</label>
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
              {submitting ? 'Đang xử lý...' : 'Xác nhận và xem thông tin chuyển khoản'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl p-3">
              <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              <p className="text-sm">Yêu cầu nạp <strong>{formatCurrency(confirmedAmount)}</strong> đã được ghi nhận. Vui lòng chuyển khoản theo thông tin bên dưới.</p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white border-2 border-primary-200 rounded-2xl p-4 shadow-sm">
                <img
                  src={qrUrl}
                  alt="QR chuyển khoản"
                  className="w-56 h-56 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <p className="text-xs text-gray-400 text-center mt-2">Quét mã QR bằng app ngân hàng</p>
              </div>

              {/* Bank info */}
              <div className="w-full bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-gray-400 text-xs">Ngân hàng</p><p className="font-medium">{BANK.bankName}</p></div>
                  <div><p className="text-gray-400 text-xs">Chi nhánh</p><p className="font-medium">{BANK.branch}</p></div>
                  <div>
                    <p className="text-gray-400 text-xs">Số tài khoản</p>
                    <p className="font-mono font-bold text-primary-600 text-base">{BANK.accountNo}</p>
                  </div>
                  <div><p className="text-gray-400 text-xs">Chủ tài khoản</p><p className="font-medium">Đỗ Thị Ánh Tuyết</p></div>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-gray-400 text-xs mb-1">Số tiền</p>
                  <p className="font-bold text-green-600 text-lg">{formatCurrency(confirmedAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Nội dung chuyển khoản <span className="text-red-500">(bắt buộc)</span></p>
                  <div className="flex items-center gap-2 bg-white border border-primary-200 rounded-lg px-3 py-2">
                    <p className="font-mono font-bold text-primary-700 text-lg flex-1">{transferCode}</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(transferCode); toast.success('Đã sao chép mã') }}
                      className="text-xs text-primary-600 border border-primary-300 rounded-lg px-2 py-1 hover:bg-primary-50">
                      Sao chép
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Nhập đúng nội dung để admin xác nhận nhanh hơn</p>
                </div>
              </div>
            </div>

            <button onClick={() => { setStep('select'); setAmount('') }}
              className="btn-secondary w-full justify-center text-sm">
              Tạo yêu cầu khác
            </button>
          </div>
        )}
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
