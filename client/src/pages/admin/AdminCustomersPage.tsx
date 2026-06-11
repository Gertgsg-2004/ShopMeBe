import { useState, useEffect } from 'react'
import { UserCheck, UserX, Search, KeyRound, Wallet, User, TrendingUp, X, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { adminService } from '../../services/adminService'
import api from '../../services/api'
import { useAppSelector } from '../../hooks/useAppSelector'
import { Customer } from '../../types'
import { formatCurrency, formatDateShort } from '../../utils/format'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface CustomerProfile {
  id: string
  fullName: string
  email?: string
  phone?: string
  address?: string
  isActive: boolean
  createdAt: string
  walletBalance: number
  totalOrders: number
  totalSpent: number
  totalTopUp: number
  avgOrderValue: number
  lastOrderAt?: string
  walletLog: { id: number; amount: number; type: string; reason?: string; balanceBefore: number; balanceAfter: number; createdAt: string }[]
}

const TYPE_LABELS: Record<string, string> = {
  TopUp: 'Nạp tiền', AdminCredit: 'Admin cộng', AdminDebit: 'Admin trừ', Purchase: 'Mua hàng'
}

interface PasswordResetReq {
  id: number
  status: string
  createdAt: string
  completedAt?: string
  userId: string
  fullName: string
  phone?: string
  email?: string
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [resetTarget, setResetTarget] = useState<Customer | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [adjustTarget, setAdjustTarget] = useState<Customer | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit')
  const [profileTarget, setProfileTarget] = useState<CustomerProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState<'customers' | 'password-requests'>('customers')
  const [passwordResets, setPasswordResets] = useState<PasswordResetReq[]>([])
  const [resetNewPwd, setResetNewPwd] = useState('')
  const [processingReset, setProcessingReset] = useState<number | null>(null)
  const { roles } = useAppSelector((s) => s.auth)
  const isAdmin = roles.includes('Admin')

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await adminService.getCustomers()
      if (res.data) setCustomers(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchCustomers() }, [])

  const fetchPasswordResets = async () => {
    try {
      const { data } = await api.get('/admin/password-reset-requests')
      if (data.data) setPasswordResets(data.data)
    } catch {}
  }

  useEffect(() => {
    if (tab === 'password-requests') fetchPasswordResets()
  }, [tab])

  const handleCompleteReset = async (id: number) => {
    if (!resetNewPwd || resetNewPwd.length < 6) { toast.error('Mật khẩu mới phải ít nhất 6 ký tự'); return }
    setProcessingReset(id)
    try {
      const { data } = await api.post(`/admin/password-reset-requests/${id}/complete`, { newPassword: resetNewPwd })
      toast.success(data.message || 'Đã đặt lại mật khẩu')
      setResetNewPwd('')
      fetchPasswordResets()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Lỗi') }
    finally { setProcessingReset(null) }
  }

  const handleDeleteReset = async (id: number) => {
    try {
      await api.delete(`/admin/password-reset-requests/${id}`)
      toast.success('Đã xóa yêu cầu')
      fetchPasswordResets()
    } catch {}
  }

  const openProfile = async (c: Customer) => {
    setProfileLoading(true)
    setProfileTarget(null)
    try {
      const { data } = await api.get(`/admin/customers/${c.id}/profile`)
      if (data.data) setProfileTarget(data.data)
    } finally { setProfileLoading(false) }
  }

  const handleToggle = async (userId: string, currentActive: boolean) => {
    const res = await adminService.toggleCustomerActive(userId)
    if (res.success) {
      toast.success(currentActive ? 'Đã khóa tài khoản' : 'Đã kích hoạt tài khoản')
      setCustomers(prev => prev.map(c => c.id === userId ? { ...c, isActive: !c.isActive } : c))
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetTarget) return
    if (newPassword.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự'); return }
    setSubmitting(true)
    try {
      const res = await adminService.resetCustomerPassword(resetTarget.id, newPassword)
      if (res.success) { toast.success(`Đã đặt lại mật khẩu cho ${resetTarget.fullName}`); setResetTarget(null); setNewPassword('') }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Có lỗi xảy ra') }
    finally { setSubmitting(false) }
  }

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustTarget) return
    const rawAmount = parseFloat(adjustAmount)
    if (!rawAmount || rawAmount <= 0) { toast.error('Số tiền phải lớn hơn 0'); return }
    const amount = adjustType === 'debit' ? -rawAmount : rawAmount
    setSubmitting(true)
    try {
      const { data } = await api.post(`/admin/customers/${adjustTarget.id}/adjust-balance`, { amount, reason: adjustReason })
      if (data.success) {
        toast.success(adjustType === 'credit' ? `Đã cộng ${formatCurrency(rawAmount)}` : `Đã trừ ${formatCurrency(rawAmount)}`)
        setCustomers(prev => prev.map(c => c.id === adjustTarget.id ? { ...c, walletBalance: data.data?.walletBalance ?? c.walletBalance } : c))
        setAdjustTarget(null); setAdjustAmount(''); setAdjustReason(''); setAdjustType('credit')
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Có lỗi xảy ra') }
    finally { setSubmitting(false) }
  }

  const filtered = customers.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  )

  const quickAmounts = [50000, 100000, 200000, 500000]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý khách hàng</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('customers')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'customers' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Danh sách khách hàng
        </button>
        <button onClick={() => setTab('password-requests')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${tab === 'password-requests' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <ShieldAlert size={14} /> Yêu cầu quên mật khẩu
          {passwordResets.filter(r => r.status === 'Pending').length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center ml-1">
              {passwordResets.filter(r => r.status === 'Pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Password reset requests tab */}
      {tab === 'password-requests' && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Khách hàng', 'Email', 'SĐT', 'Trạng thái', 'Thời gian', 'Xử lý'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {passwordResets.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{r.fullName}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{r.email || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{r.phone || '-'}</td>
                    <td className="py-3 px-4">
                      {r.status === 'Pending' ? (
                        <span className="text-amber-600 text-xs font-medium">Chờ xử lý</span>
                      ) : (
                        <span className="text-green-600 text-xs font-medium flex items-center gap-1"><CheckCircle2 size={12} /> Đã xử lý</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="py-3 px-4">
                      {r.status === 'Pending' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Mật khẩu mới"
                            className="input-field text-xs py-1 w-32"
                            onFocus={() => setProcessingReset(r.id)}
                            onChange={e => setResetNewPwd(e.target.value)}
                            value={processingReset === r.id ? resetNewPwd : ''}
                          />
                          <button onClick={() => handleCompleteReset(r.id)}
                            className="px-3 py-1 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                            Đặt lại
                          </button>
                          {isAdmin && (
                            <button onClick={() => handleDeleteReset(r.id)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                              Xóa
                            </button>
                          )}
                        </div>
                      ) : (
                        isAdmin && (
                          <button onClick={() => handleDeleteReset(r.id)}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200">
                            Xóa
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
                {passwordResets.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-400">Không có yêu cầu quên mật khẩu nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'customers' && <>
      <div className="card mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT..." className="input-field pl-9" />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Khách hàng', 'Liên hệ', 'Đơn hàng', 'Chi tiêu', 'Số dư ví', 'Lần mua gần nhất', 'Trạng thái', 'Thao tác'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-200 to-primary-400 rounded-full flex items-center justify-center text-white font-medium shrink-0">
                          {c.fullName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{c.fullName}</p>
                          <p className="text-xs text-gray-400">{formatDateShort(c.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-700">{c.email}</p>
                      {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{c.totalOrders} đơn</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{formatCurrency(c.totalSpent)}</td>
                    <td className="py-3 px-4 font-medium text-emerald-600">{formatCurrency(c.walletBalance || 0)}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {c.lastOrderAt ? formatDateShort(c.lastOrderAt) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${c.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {c.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openProfile(c)} title="Xem hồ sơ"
                          className="p-1.5 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"><User size={15} /></button>
                        <button onClick={() => { setResetTarget(c); setNewPassword('') }} title="Đặt lại mật khẩu"
                          className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><KeyRound size={15} /></button>
                        {isAdmin && (
                          <>
                            <button onClick={() => { setAdjustTarget(c); setAdjustAmount(''); setAdjustReason(''); setAdjustType('credit') }} title="Điều chỉnh số dư"
                              className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"><Wallet size={15} /></button>
                            <button onClick={() => handleToggle(c.id, c.isActive)}
                              title={c.isActive ? 'Khóa tài khoản' : 'Kích hoạt'}
                              className={`p-1.5 rounded-lg transition-colors ${c.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                              {c.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile modal */}
      {(profileLoading || profileTarget) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary-500" />
                Hồ sơ khách hàng
              </h3>
              <button onClick={() => setProfileTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="overflow-y-auto p-6">
              {profileLoading ? <LoadingSpinner /> : profileTarget && (
                <div className="space-y-4">
                  {/* Basic info */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-200 to-primary-400 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                      {profileTarget.fullName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{profileTarget.fullName}</h4>
                      <p className="text-sm text-gray-500">{profileTarget.email}</p>
                      {profileTarget.phone && <p className="text-xs text-gray-400">{profileTarget.phone}</p>}
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-gray-400">Ngày tham gia</p>
                      <p className="text-sm font-medium">{formatDateShort(profileTarget.createdAt)}</p>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Tổng đơn hàng', value: `${profileTarget.totalOrders} đơn`, color: 'bg-blue-50 text-blue-700' },
                      { label: 'Tổng chi tiêu', value: formatCurrency(profileTarget.totalSpent), color: 'bg-green-50 text-green-700' },
                      { label: 'Tổng tiền nạp', value: formatCurrency(profileTarget.totalTopUp), color: 'bg-purple-50 text-purple-700' },
                      { label: 'TB mỗi đơn', value: formatCurrency(profileTarget.avgOrderValue), color: 'bg-amber-50 text-amber-700' },
                      { label: 'Số dư ví', value: formatCurrency(profileTarget.walletBalance), color: 'bg-emerald-50 text-emerald-700' },
                      { label: 'Lần mua gần nhất', value: profileTarget.lastOrderAt ? formatDateShort(profileTarget.lastOrderAt) : 'Chưa có', color: 'bg-gray-50 text-gray-700' },
                    ].map((s, i) => (
                      <div key={i} className={`rounded-xl p-3 ${s.color}`}>
                        <p className="text-xs opacity-70 mb-0.5">{s.label}</p>
                        <p className="font-bold text-sm">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* User ID */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">User ID (dùng để gán nhân viên hoặc gửi thông báo cá nhân)</p>
                    <p className="font-mono text-xs text-gray-600 break-all">{profileTarget.id}</p>
                  </div>

                  {/* Wallet log */}
                  {profileTarget.walletLog.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-700 mb-2 text-sm">Lịch sử giao dịch ví gần đây</p>
                      <div className="border border-gray-100 rounded-xl overflow-hidden">
                        {profileTarget.walletLog.map(tx => (
                          <div key={tx.id} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0">
                            <div>
                              <span className="text-xs font-medium text-gray-700">{TYPE_LABELS[tx.type] || tx.type}</span>
                              {tx.reason && <span className="text-xs text-gray-400 ml-2">— {tx.reason}</span>}
                              <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                              </p>
                              <p className="text-xs text-gray-400">{formatCurrency(tx.balanceAfter)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </>}

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><KeyRound size={18} className="text-amber-500" /> Đặt lại mật khẩu</h3>
              <button onClick={() => setResetTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700">
                Đặt lại mật khẩu cho <b>{resetTarget.fullName}</b> ({resetTarget.email})
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới *</label>
                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  required minLength={6} className="input-field" placeholder="Ít nhất 6 ký tự" />
                <p className="text-xs text-gray-400 mt-1">Hãy gửi mật khẩu mới này cho khách hàng</p>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setResetTarget(null)} className="btn-secondary">Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Đang lưu...' : 'Đặt lại mật khẩu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust balance modal */}
      {adjustTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Wallet size={18} className="text-emerald-500" /> Điều chỉnh số dư</h3>
              <button onClick={() => setAdjustTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleAdjustBalance} className="p-6 space-y-4">
              <div className="bg-emerald-50 rounded-xl p-3 text-sm text-emerald-700">
                Khách hàng: <b>{adjustTarget.fullName}</b><br />
                Số dư hiện tại: <b>{formatCurrency(adjustTarget.walletBalance || 0)}</b>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setAdjustType('credit')}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${adjustType === 'credit' ? 'bg-green-500 text-white border-green-500' : 'border-gray-200 text-gray-600'}`}>
                  + Cộng tiền
                </button>
                <button type="button" onClick={() => setAdjustType('debit')}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${adjustType === 'debit' ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-600'}`}>
                  − Trừ tiền
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (đ) *</label>
                <input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)}
                  required min={1000} step={1000} className="input-field" placeholder="100000" />
                <div className="flex flex-wrap gap-2 mt-2">
                  {quickAmounts.map(a => (
                    <button key={a} type="button" onClick={() => setAdjustAmount(String(a))}
                      className="px-3 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors">
                      {formatCurrency(a)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do *</label>
                <input value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                  required className="input-field" placeholder="VD: Hoàn tiền đơn hàng #1234" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setAdjustTarget(null)} className="btn-secondary">Hủy</button>
                <button type="submit" disabled={submitting}
                  className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors ${adjustType === 'credit' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                  {submitting ? 'Đang lưu...' : adjustType === 'credit' ? 'Cộng tiền' : 'Trừ tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
