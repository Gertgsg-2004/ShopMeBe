import { useState, useEffect } from 'react'
import { UserCheck, UserX, Search } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { Customer } from '../../types'
import { formatCurrency, formatDateShort } from '../../utils/format'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  const filtered = customers.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  )

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
                  {['Khách hàng', 'Liên hệ', 'Đơn hàng', 'Chi tiêu', 'Ngày đăng ký', 'Trạng thái', 'Thao tác'].map((h) => (
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
                    <td className="py-3 px-4 text-gray-400 text-xs">{formatDateShort(c.createdAt)}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${c.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {c.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => handleToggle(c.id, c.isActive)}
                        className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg transition-colors ${c.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                        {c.isActive ? <><UserX size={14} /> Khóa</> : <><UserCheck size={14} /> Kích hoạt</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
