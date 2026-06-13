import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Package, ShoppingBag, Users, Tag, FolderOpen,
  Menu, X, LogOut, ChevronRight, Bell, Warehouse, Truck, BarChart2,
  ShoppingCart, DollarSign, Shield, Settings
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppSelector'
import { logout } from '../../store/authSlice'
import api from '../../services/api'
import toast from 'react-hot-toast'

const navItems = [
  { path: '/admin/san-pham', icon: Package, label: 'Sản phẩm', roles: ['Admin', 'Kho'] },
  { path: '/admin/danh-muc', icon: FolderOpen, label: 'Danh mục', roles: ['Admin'] },
  { path: '/admin/don-hang', icon: ShoppingBag, label: 'Đơn hàng', roles: ['Admin', 'CSKH', 'Kho'] },
  { path: '/admin/khach-hang', icon: Users, label: 'Khách hàng', roles: ['Admin', 'CSKH'] },
  { path: '/admin/khuyen-mai', icon: Tag, label: 'Khuyến mãi', roles: ['Admin'] },
  { path: '/admin/kho-hang', icon: Warehouse, label: 'Kho hàng', roles: ['Admin', 'Kho'] },
  { path: '/admin/nha-cung-cap', icon: Truck, label: 'Nhà cung cấp', roles: ['Admin'] },
  { path: '/admin/tai-chinh', icon: DollarSign, label: 'Tài chính', roles: ['Admin', 'Ketoan'] },
  { path: '/admin/bao-cao', icon: BarChart2, label: 'Báo cáo', roles: ['Admin', 'Ketoan'] },
  { path: '/admin/thong-bao', icon: Bell, label: 'Thông báo', roles: ['Admin', 'CSKH', 'Ketoan', 'Kho'] },
  { path: '/admin/nhan-vien', icon: Shield, label: 'Nhân viên', roles: ['Admin'] },
  { path: '/admin/cai-dat', icon: Settings, label: 'Cài đặt', roles: ['Admin'] },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user, roles } = useAppSelector((s) => s.auth)
  const visibleNavItems = navItems.filter(item => item.roles.some(r => roles.includes(r)))
  const lastAlertIdRef = useRef<number>(0)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  useEffect(() => {
    api.get('/notifications/unread-count').then(res => {
      if (res.data?.data) setUnreadCount(res.data.data.unread)
    }).catch(() => {})
  }, [location.pathname])

  // Poll for new admin alerts every 30s and show toasts
  useEffect(() => {
    const pollAlerts = async () => {
      try {
        const res = await api.get(`/notifications/admin/alerts?since=${lastAlertIdRef.current}`)
        const alerts: Array<{ id: number; title: string; content: string }> = res.data?.data ?? []
        if (alerts.length > 0) {
          const maxId = Math.max(...alerts.map(a => a.id))
          if (lastAlertIdRef.current === 0) {
            lastAlertIdRef.current = maxId
            return
          }
          lastAlertIdRef.current = maxId
          alerts.forEach(a => {
            toast(
              (t) => (
                <div onClick={() => { toast.dismiss(t.id); navigate('/admin/thong-bao') }} className="cursor-pointer">
                  <p className="font-semibold text-sm">{a.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{a.content}</p>
                </div>
              ),
              { icon: '🔔', duration: 6000 }
            )
          })
          setUnreadCount(prev => prev + alerts.length)
        }
      } catch {}
    }

    pollAlerts()
    const interval = setInterval(pollAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  // Always redirect /admin to first allowed page
  useEffect(() => {
    if (location.pathname === '/admin' && visibleNavItems.length > 0) {
      navigate(visibleNavItems[0].path, { replace: true })
    }
  }, [location.pathname, roles])

  const currentLabel = navItems.find(n =>
    n.exact ? location.pathname === n.path : location.pathname === n.path || location.pathname.startsWith(n.path + '/')
  )?.label ?? 'Quản trị'

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-white border-r border-gray-100 flex flex-col transition-all duration-300 shrink-0 shadow-sm`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {sidebarOpen && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
              <span className="font-bold text-gray-800 text-sm">Ánh Tuyết Admin</span>
            </Link>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors ml-auto">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const active = item.exact
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${active ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}>
                <item.icon size={18} className={active ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-600'} />
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && active && <ChevronRight size={14} className="ml-auto text-primary-400" />}
                {item.path === '/admin/thong-bao' && unreadCount > 0 && (
                  <span className={`absolute ${sidebarOpen ? 'right-8' : 'right-1 top-1'} bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1`}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-0.5">
          {roles.includes('Admin') && (
            <a href="/pos" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors w-full">
              <ShoppingCart size={18} className="text-primary-500" />
              {sidebarOpen && <span>Bán tại quầy</span>}
            </a>
          )}
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full">
            <LogOut size={18} />
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-semibold text-gray-800">{currentLabel}</h1>
          <div className="flex items-center gap-3">
            <Link to="/admin/thong-bao" className="relative p-2 hover:bg-gray-100 rounded-xl">
              <Bell size={18} className="text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.fullName?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-800">{user?.fullName}</p>
                <p className="text-xs text-gray-400">Quản trị viên</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
