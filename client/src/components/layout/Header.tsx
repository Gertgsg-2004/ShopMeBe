import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, User, Menu, X, Heart, ChevronDown, LogOut, Package, Settings, ScanLine, Wallet } from 'lucide-react'
import BarcodeScanner from '../barcode/BarcodeScanner'
import { useAppSelector } from '../../hooks/useAppSelector'
import { useAppDispatch } from '../../hooks/useAppSelector'
import { logout } from '../../store/authSlice'
import { fetchCart } from '../../store/cartSlice'
import { categoryService } from '../../services/categoryService'
import { Category } from '../../types'

export default function Header() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user, roles } = useAppSelector((s) => s.auth)
  const { cart } = useAppSelector((s) => s.cart)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const handleBarcodeScan = useCallback((code: string) => {
    setShowScanner(false)
    navigate(`/tim-kiem?q=${encodeURIComponent(code)}&barcode=1`)
  }, [navigate])

  useEffect(() => {
    categoryService.getCategories().then((res) => {
      if (res.success && res.data) setCategories(res.data.filter((c) => c.isActive))
    })
    if (isAuthenticated) dispatch(fetchCart())
  }, [isAuthenticated, dispatch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/tim-kiem?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
    setUserMenuOpen(false)
  }

  const cartCount = cart?.itemCount ?? 0

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-pink-100">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-400 text-white text-xs py-1.5 text-center">
        🎁 Miễn phí vận chuyển đơn hàng từ 500.000đ | Giao hàng toàn quốc
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
            <div>
              <span className="text-xl font-bold text-primary-600">Shop Mẹ & Bé </span>
              <span className="text-xl font-bold text-secondary-500">Ánh Tuyết</span>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm hoặc quét mã vạch..."
                  className="w-full pl-4 pr-10 py-2.5 border-2 border-pink-100 rounded-xl focus:outline-none focus:border-primary-400 text-sm bg-pink-50/50"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 hover:text-primary-700">
                  <Search size={18} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                title="Quét mã vạch bằng camera"
                className="flex items-center gap-1.5 px-3 py-2.5 bg-primary-50 text-primary-600 border-2 border-primary-100 rounded-xl hover:bg-primary-100 transition-colors text-sm font-medium shrink-0"
              >
                <ScanLine size={18} />
                <span>Quét</span>
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to="/gio-hang" className="relative p-2 hover:bg-pink-50 rounded-xl transition-colors">
              <ShoppingCart size={22} className="text-gray-600" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-pink-50 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {user?.fullName}
                  </span>
                  <ChevronDown size={16} className="hidden lg:block text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50">
                    <Link to="/tai-khoan" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 transition-colors">
                      <Settings size={16} className="text-primary-400" /> Hồ sơ cá nhân
                    </Link>
                    <Link to="/don-hang" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 transition-colors">
                      <Package size={16} className="text-primary-400" /> Đơn hàng của tôi
                    </Link>
                    <Link to="/vi-cua-toi" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 transition-colors">
                      <Wallet size={16} className="text-primary-400" /> Ví của tôi
                    </Link>
                    {roles.includes('Admin') && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 transition-colors">
                        <Settings size={16} className="text-secondary-400" /> Quản trị
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full">
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/dang-nhap" className="text-sm font-medium text-gray-600 hover:text-primary-600 px-3 py-2 hover:bg-pink-50 rounded-xl transition-colors">
                  Đăng nhập
                </Link>
                <Link to="/dang-ky" className="btn-primary text-sm px-4 py-2">
                  Đăng ký
                </Link>
              </div>
            )}

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 hover:bg-pink-50 rounded-xl">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Nav categories */}
        <nav className="hidden md:flex items-center gap-1 pb-2 border-t border-pink-50 pt-2 overflow-x-auto scrollbar-hide">
          <Link to="/" className="whitespace-nowrap px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-pink-50 rounded-lg transition-colors">
            Trang chủ
          </Link>
          {categories.slice(0, 6).map((cat) => (
            <Link
              key={cat.id}
              to={`/danh-muc/${cat.slug}`}
              className="whitespace-nowrap px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-pink-50 rounded-lg transition-colors"
            >
              {cat.name}
            </Link>
          ))}
          <Link to="/tra-cuu-don-hang" className="whitespace-nowrap px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-pink-50 rounded-lg transition-colors">
            Tra cứu đơn
          </Link>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-pink-100 bg-white px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary px-4 py-2">
              <Search size={16} />
            </button>
          </form>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/danh-muc/${cat.slug}`}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-gray-700 border-b border-gray-50"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </header>
  )
}
