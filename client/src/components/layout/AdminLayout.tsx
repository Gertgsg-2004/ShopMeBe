import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag, FolderOpen,
  Menu, X, LogOut, ChevronRight, Bell, Warehouse, Truck, BarChart2, ShoppingCart
} from 'lucide-react'
import { useAppDispatch } from '../../hooks/useAppSelector'
import { useAppSelector } from '../../hooks/useAppSelector'
import { logout } from '../../store/authSlice'

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/san-pham', icon: Package, label: 'Sản phẩm' },
  { path: '/admin/danh-muc', icon: FolderOpen, label: 'Danh mục' },
  { path: '/admin/don-hang', icon: ShoppingBag, label: 'Đơn hàng' },
  { path: '/admin/khach-hang', icon: Users, label: 'Khách hàng' },
  { path: '/admin/khuyen-mai', icon: Tag, label: 'Khuyến mãi' },
  { path: '/admin/kho-hang', icon: Warehouse, label: 'Kho hàng' },
  { path: '/admin/nha-cung-cap', icon: Truck, label: 'Nhà cung cấp' },
  { path: '/admin/bao-cao', icon: BarChart2, label: 'Báo cáo' },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path) && path !== '/admin'
      ? true : exact ? location.pathname === path : false

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
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

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = item.exact
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <item.icon size={18} className={active ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-600'} />
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && active && <ChevronRight size={14} className="ml-auto text-primary-400" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-1">
          <a href="/pos" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors w-full">
            <ShoppingCart size={18} className="text-primary-500" />
            {sidebarOpen && <span>Bán tại quầy</span>}
          </a>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full">
            <LogOut size={18} />
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-semibold text-gray-800">
            {navItems.find((n) => n.exact ? location.pathname === n.path : location.pathname.startsWith(n.path))?.label ?? 'Quản trị'}
          </h1>
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-xl">
              <Bell size={18} className="text-gray-500" />
            </button>
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
