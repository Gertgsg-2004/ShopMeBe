import { useState, useEffect } from 'react'
import { Shield, Search, Plus, UserMinus, X } from 'lucide-react'
import api from '../../services/api'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface StaffMember {
  id: string
  fullName: string
  email?: string
  phone?: string
  isActive: boolean
  roles: string[]
}

const ROLES = [
  { value: 'Admin', label: 'Admin', color: 'bg-red-100 text-red-600', desc: 'Toàn quyền hệ thống' },
  { value: 'CSKH', label: 'CSKH', color: 'bg-blue-100 text-blue-600', desc: 'Xem đơn hàng & khách hàng, đặt lại mật khẩu' },
  { value: 'Ketoan', label: 'Kế toán', color: 'bg-green-100 text-green-600', desc: 'Xem giao dịch ví, xem báo cáo' },
  { value: 'Kho', label: 'Kho', color: 'bg-amber-100 text-amber-600', desc: 'Xử lý đơn hàng, quản lý kho' },
]

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAssign, setShowAssign] = useState<StaffMember | null>(null)
  const [selectedRole, setSelectedRole] = useState('CSKH')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addUserId, setAddUserId] = useState('')
  const [addRole, setAddRole] = useState('CSKH')

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/staff')
      if (data.data) setStaff(data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchStaff() }, [])

  const handleAssign = async () => {
    if (!showAssign) return
    try {
      await api.post(`/admin/staff/${showAssign.id}/assign-role`, { role: selectedRole })
      toast.success(`Đã gán vai trò ${selectedRole}`)
      setShowAssign(null)
      fetchStaff()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleRemoveRole = async (userId: string, role: string) => {
    if (!confirm(`Xóa vai trò ${role}?`)) return
    try {
      await api.delete(`/admin/staff/${userId}/role/${role}`)
      toast.success(`Đã xóa vai trò ${role}`)
      fetchStaff()
    } catch {
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post(`/admin/staff/${addUserId}/assign-role`, { role: addRole })
      toast.success('Đã thêm nhân viên thành công')
      setShowAddModal(false)
      setAddUserId('')
      fetchStaff()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không tìm thấy người dùng hoặc có lỗi xảy ra')
    }
  }

  const filtered = staff.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Phân quyền nhân viên</h2>
          <p className="text-sm text-gray-500 mt-1">{staff.length} nhân viên</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={18} /> Thêm nhân viên
        </button>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {ROLES.map(r => (
          <div key={r.value} className="card p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className="text-gray-400" />
              <span className={`badge text-xs ${r.color}`}>{r.label}</span>
            </div>
            <p className="text-xs text-gray-500">{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="card mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm nhân viên..." className="input-field pl-9" />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Nhân viên', 'Email', 'Vai trò', 'Trạng thái', 'Thao tác'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-200 to-primary-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {s.fullName[0]?.toUpperCase()}
                        </div>
                        <p className="font-medium text-gray-800">{s.fullName}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{s.email}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {s.roles.map(r => {
                          const role = ROLES.find(x => x.value === r)
                          return (
                            <span key={r} className={`badge text-xs flex items-center gap-1 pr-1 ${role?.color || 'bg-gray-100 text-gray-600'}`}>
                              {role?.label || r}
                              {r !== 'Admin' && (
                                <button onClick={() => handleRemoveRole(s.id, r)}
                                  className="hover:text-red-600 ml-0.5">
                                  <X size={10} />
                                </button>
                              )}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${s.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {s.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => { setShowAssign(s); setSelectedRole('CSKH') }}
                        className="text-xs text-primary-600 hover:bg-primary-50 px-2 py-1 rounded-lg transition-colors">
                        + Thêm vai trò
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign role modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Thêm vai trò</h3>
              <button onClick={() => setShowAssign(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Thêm vai trò cho <b>{showAssign.fullName}</b></p>
              <div className="space-y-2">
                {ROLES.filter(r => !showAssign.roles.includes(r.value)).map(r => (
                  <label key={r.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedRole === r.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                    <input type="radio" name="role" value={r.value}
                      checked={selectedRole === r.value}
                      onChange={() => setSelectedRole(r.value)}
                      className="text-primary-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.label}</p>
                      <p className="text-xs text-gray-400">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowAssign(null)} className="btn-secondary">Hủy</button>
                <button onClick={handleAssign} className="btn-primary">Gán vai trò</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add staff modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Thêm nhân viên</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <p className="text-xs text-gray-500 bg-blue-50 text-blue-700 p-3 rounded-xl">
                Nhập User ID của tài khoản khách hàng muốn nâng cấp thành nhân viên. User ID có thể lấy trong trang Quản lý khách hàng.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID *</label>
                <input value={addUserId} onChange={e => setAddUserId(e.target.value)}
                  required className="input-field font-mono text-sm" placeholder="xxxxxxxx-xxxx-xxxx-..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò *</label>
                <select value={addRole} onChange={e => setAddRole(e.target.value)} className="input-field">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Hủy</button>
                <button type="submit" className="btn-primary">Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
