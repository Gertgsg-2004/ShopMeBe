import { useState, useEffect } from 'react'
import { UserCheck, UserX, Search, KeyRound, Wallet } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { Customer } from '../../types'
import { formatCurrency, formatDateShort } from '../../utils/format'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [resetTarget, setResetTarget] = useState<Customer | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [creditTarget, setCreditTarget] = useState<Customer | null>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await adminService.getCustomers()
      if (res.data) setCustomers(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCustomers() }, [])

  const handleToggle = async (userId: string, currentActive: boolean) => {
    const res = await adminService.toggleCustomerActive(userId)
    if (res.success) {
      toast.success(currentActive ? 'Đã khóa tài khoản' : 'Đã kích hoạt tài khoản')
      setCustomers((prev) => prev.map((c) => c.id === userId ? { ...c, isActive: !c.isActive } : c))
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetTarget) return
    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    setSubmitting(true)
    try {
      const res = await adminService.resetCustomerPassword(resetTarget.id, newPassword)
      if (res.success) {
        toast.success(`Đã đặt lại mật khẩu cho ${resetTarget.fullName}`)
        setResetTarget(null)
        setNewPassword('')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddCredit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!creditTarget) return
    const amount = parseFloat(creditAmount)
    if (!amount || amount <= 0) {
      toast.error('Số tiền phải lớn hơn 0')
      return
    }
    setSubmitting(true)
    try {
      const res = await adminService.addCustomerCredit(creditTarget.id, amount)
      if (res.success && res.data) {
        toast.success(`Đã cộng ${formatCurrency(amount)} cho ${creditTarget.fullName}`)
        setCustomers((prev) => prev.map((c) => c.id === creditTarget.id ? { ...c, walletBalance: res.data!.walletBalance } : c))
        setCreditTarget(null)
        setCreditAmount('')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = customers.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  )

  const quickAmounts = [50000, 100000, 200000, 500000]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý khách hàng</h2>
          <p className="text-sm text-gray-500 mt-1">{customers.length} khách hàng</p>
        </div>
      </div>

      <div className="card mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT..." className="input-field pl-9" />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Khách hàng', 'Liên hệ', 'Đơn hàng', 'Chi tiêu', 'Số dư ví', 'Ngày đăng ký', 'Trạng thái', 'Thao tác'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-200 to-primary-400 rounded-full flex items-center justify-center text-white font-medium shrink-0">
                          {c.fullName[0]?.toUpperCase()}
                        </div>
                        <p className="font-medium text-gray-800">{c.fullName}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-700">{c.email}</p>
                      {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{c.totalOrders} đơn</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{formatCurrency(c.totalSpent)}</td>
                    <td className="py-3 px-4 font-medium text-emerald-600">{formatCurrency(c.walletBalance || 0)}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{formatDateShort(c.createdAt)}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${c.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {c.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setResetTarget(c); setNewPassword('') }}
                          title="Đặt lại mật khẩu"
                          className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                          <KeyRound size={15} />
                        </button>
                        <button onClick={() => { setCreditTarget(c); setCreditAmount('') }}
                          title="Cộng tiền vào ví"
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors">
                          <Wallet size={15} />
                        </button>
                        <button onClick={() => handleToggle(c.id, c.isActive)}
                          title={c.isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                          className={`p-1.5 rounded-lg transition-colors ${c.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                          {c.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <KeyRound size={18} className="text-amber-500" /> Đặt lại mật khẩu
              </h3>
              <button onClick={() => setResetTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700">
                Đặt lại mật khẩu cho <b>{resetTarget.fullName}</b> ({resetTarget.email})
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới *</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="input-field"
                  placeholder="Ít nhất 6 ký tự"
                />
                <p className="text-xs text-gray-400 mt-1">Hãy gửi mật khẩu mới này cho khách hàng</p>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setResetTarget(null)} className="btn-secondary">Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add credit modal */}
      {creditTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Wallet size={18} className="text-emerald-500" /> Cộng tiền vào ví
              </h3>
              <button onClick={() => setCreditTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleAddCredit} className="p-6 space-y-4">
              <div className="bg-emerald-50 rounded-xl p-3 text-sm text-emerald-700">
                Khách hàng: <b>{creditTarget.fullName}</b><br />
                Số dư hiện tại: <b>{formatCurrency(creditTarget.walletBalance || 0)}</b>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền cộng (đ) *</label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  required
                  min={1000}
                  step={1000}
                  className="input-field"
                  placeholder="100000"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {quickAmounts.map((a) => (
                    <button key={a} type="button" onClick={() => setCreditAmount(String(a))}
                      className="px-3 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600 transition-colors">
                      {formatCurrency(a)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setCreditTarget(null)} className="btn-secondary">Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Đang lưu...' : 'Cộng tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
