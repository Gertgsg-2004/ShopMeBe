import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from './hooks/useAppSelector'
import MainLayout from './components/layout/MainLayout'
import AdminLayout from './components/layout/AdminLayout'

// Public pages
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import SearchPage from './pages/SearchPage'
import WalletPage from './pages/WalletPage'
import NotFoundPage from './pages/NotFoundPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import OrderLookupPage from './pages/OrderLookupPage'

// Admin pages
import DashboardPage from './pages/admin/DashboardPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminCustomersPage from './pages/admin/AdminCustomersPage'
import AdminCouponsPage from './pages/admin/AdminCouponsPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminSuppliersPage from './pages/admin/AdminSuppliersPage'
import AdminWarehousePage from './pages/admin/AdminWarehousePage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminFinancePage from './pages/admin/AdminFinancePage'
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage'
import AdminStaffPage from './pages/admin/AdminStaffPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import PosPage from './pages/pos/PosPage'
import PaymentSuccessPage from './pages/checkout/PaymentSuccessPage'
import PaymentFailedPage from './pages/checkout/PaymentFailedPage'

function ProtectedRoute({ children, adminOnly = false, roles: requiredRoles }: { children: React.ReactNode; adminOnly?: boolean; roles?: string[] }) {
  const { isAuthenticated, roles } = useAppSelector((s) => s.auth)
  if (!isAuthenticated) return <Navigate to="/dang-nhap" replace />
  if (adminOnly && !roles.some(r => ['Admin', 'CSKH', 'Ketoan', 'Kho'].includes(r))) return <Navigate to="/" replace />
  if (requiredRoles && !requiredRoles.some(r => roles.includes(r))) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/danh-muc/:slug" element={<CategoryPage />} />
        <Route path="/san-pham/:slug" element={<ProductDetailPage />} />
        <Route path="/tim-kiem" element={<SearchPage />} />
        <Route path="/gio-hang" element={<CartPage />} />
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />
        <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
        <Route path="/tra-cuu-don-hang" element={<OrderLookupPage />} />
        <Route path="/thanh-toan" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/dat-hang-thanh-cong/:id" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
        <Route path="/tai-khoan" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/vi-cua-toi" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
        <Route path="/don-hang" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/don-hang/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/thanh-toan/thanh-cong" element={<PaymentSuccessPage />} />
        <Route path="/thanh-toan/that-bai" element={<PaymentFailedPage />} />
      </Route>

      {/* POS - standalone fullscreen */}
      <Route path="/pos" element={<ProtectedRoute roles={['Admin']}><PosPage /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="san-pham" element={<AdminProductsPage />} />
        <Route path="don-hang" element={<AdminOrdersPage />} />
        <Route path="khach-hang" element={<AdminCustomersPage />} />
        <Route path="khuyen-mai" element={<AdminCouponsPage />} />
        <Route path="danh-muc" element={<AdminCategoriesPage />} />
        <Route path="nha-cung-cap" element={<AdminSuppliersPage />} />
        <Route path="kho-hang" element={<AdminWarehousePage />} />
        <Route path="bao-cao" element={<AdminReportsPage />} />
        <Route path="tai-chinh" element={<AdminFinancePage />} />
        <Route path="thong-bao" element={<AdminNotificationsPage />} />
        <Route path="nhan-vien" element={<AdminStaffPage />} />
        <Route path="cai-dat" element={<AdminSettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
