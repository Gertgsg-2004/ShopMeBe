import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../hooks/useAppSelector'
import { updateCartItem, removeCartItem } from '../store/cartSlice'
import { formatCurrency } from '../utils/format'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

export default function CartPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { cart, loading } = useAppSelector((s) => s.cart)
  const { isAuthenticated } = useAppSelector((s) => s.auth)

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState
          title="Vui lòng đăng nhập"
          description="Bạn cần đăng nhập để xem giỏ hàng"
          action={<Link to="/dang-nhap" className="btn-primary">Đăng nhập</Link>}
        />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState
          title="Giỏ hàng trống"
          description="Bạn chưa có sản phẩm nào trong giỏ hàng"
          icon={<ShoppingCart size={28} className="text-primary-400" />}
          action={<Link to="/" className="btn-primary">Tiếp tục mua sắm</Link>}
        />
      </div>
    )
  }

  const handleQuantityChange = async (itemId: number, quantity: number) => {
    if (quantity < 1) return
    await dispatch(updateCartItem({ itemId, quantity }))
  }

  const handleRemove = async (itemId: number) => {
    await dispatch(removeCartItem(itemId))
    toast.success('Đã xóa sản phẩm khỏi giỏ hàng')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Giỏ hàng ({cart.itemCount} sản phẩm)</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="card flex gap-4">
              <Link to={`/san-pham/${item.productId}`}>
                <img src={item.productImage || '/placeholder.jpg'} alt={item.productName}
                  className="w-20 h-20 object-cover rounded-xl shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg' }} />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/san-pham/${item.productId}`} className="font-medium text-gray-800 hover:text-primary-600 transition-colors line-clamp-2 text-sm">
                  {item.productName}
                </Link>
                <p className="text-primary-600 font-bold mt-1">{formatCurrency(item.price)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || loading}
                      className="p-1.5 hover:bg-gray-100 disabled:opacity-40">
                      <Minus size={14} />
                    </button>
                    <span className="px-3 text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock || loading}
                      className="p-1.5 hover:bg-gray-100 disabled:opacity-40">
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={() => handleRemove(item.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-800">{formatCurrency(item.subTotal)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card h-fit sticky top-24">
          <h2 className="font-semibold text-gray-800 mb-4">Tóm tắt đơn hàng</h2>
          <div className="space-y-3 text-sm mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính</span>
              <span>{formatCurrency(cart.total)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển</span>
              <span className="text-green-600">{cart.total >= 500000 ? 'Miễn phí' : formatCurrency(30000)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-800 text-base">
              <span>Tổng cộng</span>
              <span className="text-primary-600">{formatCurrency(cart.total + (cart.total >= 500000 ? 0 : 30000))}</span>
            </div>
          </div>
          <button onClick={() => navigate('/thanh-toan')} className="btn-primary w-full py-3">
            Tiến hành thanh toán <ArrowRight size={18} />
          </button>
          <Link to="/" className="btn-secondary w-full mt-3 py-3 text-sm">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  )
}
