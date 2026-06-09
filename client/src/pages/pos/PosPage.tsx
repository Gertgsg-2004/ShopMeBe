import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Printer, CheckCircle, RotateCcw } from 'lucide-react'
import { adminService, PosProduct, PosOrderResponse } from '../../services/adminService'
import { Order } from '../../types'
import { formatCurrency } from '../../utils/format'
import toast from 'react-hot-toast'

interface CartItem {
  product: PosProduct
  quantity: number
}

const paymentMethods = [
  { value: 'Cash', label: 'Tiền mặt' },
  { value: 'Card', label: 'Thẻ' },
  { value: 'Transfer', label: 'Chuyển khoản' },
]

export default function PosPage() {
  const [activeTab, setActiveTab] = useState<'sell' | 'return'>('sell')

  // --- Sell tab state ---
  const [products, setProducts] = useState<PosProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [cashReceived, setCashReceived] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [receipt, setReceipt] = useState<PosOrderResponse | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  // --- Return tab state ---
  const [returnSearch, setReturnSearch] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [returnOrder, setReturnOrder] = useState<Order | null>(null)
  const [returnReason, setReturnReason] = useState('')
  const [returningId, setReturningId] = useState<number | null>(null)

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setProducts([]); return }
    setLoadingProducts(true)
    try {
      const res = await adminService.posSearchProducts(q)
      if (res.data) setProducts(res.data)
    } catch {
      // silently fail
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchProducts(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery, searchProducts])

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true)
    try {
      const res = await adminService.getAllOrders(1, 20)
      if (res.data) setOrders(res.data.items || [])
    } catch {
      // silently fail
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'return') fetchOrders()
  }, [activeTab, fetchOrders])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === 'Escape') {
        clearCart()
      } else if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault()
        handleCheckout()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cart, discount, paymentMethod, cashReceived])

  const addToCart = (product: PosProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('Không đủ hàng trong kho')
          return prev
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      if (product.stock === 0) {
        toast.error('Sản phẩm hết hàng')
        return prev
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQty = (productId: number, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id !== productId) return item
        const newQty = item.quantity + delta
        if (newQty <= 0) return item
        if (newQty > item.product.stock) { toast.error('Không đủ hàng'); return item }
        return { ...item, quantity: newQty }
      })
    })
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const clearCart = () => {
    if (cart.length === 0) return
    setCart([])
    setDiscount(0)
    setCashReceived('')
    toast.success('Đã xóa giỏ hàng')
  }

  const subTotal = cart.reduce((sum, item) => sum + item.product.displayPrice * item.quantity, 0)
  const total = Math.max(0, subTotal - discount)
  const change = cashReceived ? Math.max(0, Number(cashReceived) - total) : 0

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Giỏ hàng trống'); return }
    if (paymentMethod === 'Cash' && cashReceived && Number(cashReceived) < total) {
      toast.error('Tiền nhận không đủ')
      return
    }
    setSubmitting(true)
    try {
      const res = await adminService.posCreateOrder({
        items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity, price: item.product.displayPrice })),
        discount,
        paymentMethod,
        cashReceived: paymentMethod === 'Cash' && cashReceived ? Number(cashReceived) : undefined,
        notes: '',
      })
      if (res.success && res.data) {
        setReceipt(res.data)
        setShowReceipt(true)
        setCart([])
        setDiscount(0)
        setCashReceived('')
        setSearchQuery('')
        setProducts([])
        toast.success('Thanh toán thành công!')
      } else {
        toast.error(res.message || 'Thanh toán thất bại')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleConfirmReturn = async () => {
    if (!returnOrder) return
    setReturningId(returnOrder.id)
    try {
      const res = await adminService.updateOrderStatus(returnOrder.id, 4)
      if (res.success) {
        toast.success('Trả hàng thành công!')
        setReturnOrder(null)
        setReturnReason('')
        fetchOrders()
      } else {
        toast.error((res as any).message || 'Có lỗi xảy ra')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setReturningId(null)
    }
  }

  const filteredOrders = orders.filter(o => {
    if (!returnSearch.trim()) return true
    const q = returnSearch.toLowerCase()
    const matchCode = o.orderCode?.toLowerCase().includes(q)
    const matchProduct = o.items?.some(i => i.productName?.toLowerCase().includes(q))
    return matchCode || matchProduct
  })

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return { label: 'Chờ xác nhận', cls: 'bg-yellow-100 text-yellow-700' }
      case 1: return { label: 'Đã xác nhận', cls: 'bg-blue-100 text-blue-700' }
      case 2: return { label: 'Đang giao', cls: 'bg-indigo-100 text-indigo-700' }
      case 3: return { label: 'Hoàn thành', cls: 'bg-green-100 text-green-700' }
      case 4: return { label: 'Đã huỷ', cls: 'bg-red-100 text-red-600' }
      default: return { label: `Trạng thái ${status}`, cls: 'bg-gray-100 text-gray-600' }
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col bg-white border-r border-gray-200" style={{ flex: '60%' }}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
              <h1 className="text-lg font-bold text-gray-800">Shop Mẹ & Bé Ánh Tuyết - Bán tại quầy</h1>
            </div>
            <a href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Quản trị</a>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-3 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('sell')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'sell' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingCart size={16} /> Bán hàng
            </button>
            <button
              onClick={() => setActiveTab('return')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'return' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <RotateCcw size={16} /> Trả hàng
            </button>
          </div>

          {activeTab === 'sell' && (
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm sản phẩm theo tên, mã vạch... (F1)"
                className="w-full pl-10 pr-4 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          )}

          {activeTab === 'return' && (
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={returnSearch}
                onChange={e => setReturnSearch(e.target.value)}
                placeholder="Tìm theo mã đơn hoặc tên sản phẩm..."
                className="w-full pl-10 pr-4 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Sell tab content */}
          {activeTab === 'sell' && (
            <>
              {loadingProducts && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
                </div>
              )}

              {!loadingProducts && searchQuery && products.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Search size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-lg">Không tìm thấy sản phẩm</p>
                </div>
              )}

              {!loadingProducts && !searchQuery && (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-lg font-medium">Tìm kiếm sản phẩm để bắt đầu</p>
                  <p className="text-sm mt-1">Nhập tên sản phẩm hoặc mã vạch</p>
                  <div className="mt-4 flex gap-2 justify-center text-xs text-gray-400">
                    <span className="bg-gray-100 px-2 py-1 rounded">F1: Tìm kiếm</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">Esc: Xóa giỏ</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">Ctrl+Enter: Thanh toán</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className={`bg-white border rounded-xl p-3 text-left transition-all hover:shadow-md hover:border-primary-300 active:scale-95 ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {product.mainImageUrl ? (
                      <img src={product.mainImageUrl} alt={product.name} className="w-full aspect-square object-cover rounded-lg mb-2" />
                    ) : (
                      <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                        <ShoppingCart size={24} className="text-gray-300" />
                      </div>
                    )}
                    <p className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">{product.name}</p>
                    {product.sku && <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>}
                    <p className="text-base font-bold text-primary-600 mt-1">{formatCurrency(product.displayPrice)}</p>
                    <p className={`text-xs mt-0.5 ${product.stock === 0 ? 'text-red-500' : product.stock < 5 ? 'text-yellow-600' : 'text-gray-400'}`}>
                      {product.stock === 0 ? 'Hết hàng' : `Còn: ${product.stock}`}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Return tab content */}
          {activeTab === 'return' && (
            <>
              {loadingOrders && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
                </div>
              )}

              {!loadingOrders && filteredOrders.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <RotateCcw size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-lg">Không tìm thấy đơn hàng</p>
                </div>
              )}

              {!loadingOrders && filteredOrders.length > 0 && (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Mã đơn', 'Thời gian', 'Sản phẩm', 'Tổng tiền', 'Trạng thái', ''].map(h => (
                          <th key={h} className="text-left py-3 px-3 text-gray-500 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredOrders.map(order => {
                        const status = getStatusLabel(order.status)
                        return (
                          <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-3 font-medium text-gray-800">{order.orderCode}</td>
                            <td className="py-3 px-3 text-gray-500 text-xs whitespace-nowrap">
                              {new Date(order.createdAt).toLocaleString('vi-VN')}
                            </td>
                            <td className="py-3 px-3 text-gray-600 max-w-[160px]">
                              <p className="truncate">{order.items?.map(i => i.productName).join(', ') || '-'}</p>
                            </td>
                            <td className="py-3 px-3 font-semibold text-gray-800 whitespace-nowrap">
                              {formatCurrency(order.total)}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>{status.label}</span>
                            </td>
                            <td className="py-3 px-3">
                              {order.status !== 4 && (
                                <button
                                  onClick={() => { setReturnOrder(order); setReturnReason('') }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-100 transition-colors"
                                >
                                  <RotateCcw size={12} /> Trả hàng
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Panel - Cart (only visible in sell tab) */}
      {activeTab === 'sell' && (
        <div className="flex flex-col bg-white" style={{ width: '40%', minWidth: '360px' }}>
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ShoppingCart size={20} className="text-primary-500" />
              Đơn hàng
              {cart.length > 0 && (
                <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </h2>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                <Trash2 size={14} /> Xóa tất cả
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingCart size={40} className="mx-auto mb-3 opacity-20" />
                <p>Chưa có sản phẩm</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-tight truncate">{item.product.name}</p>
                    <p className="text-sm text-primary-600 font-semibold">{formatCurrency(item.product.displayPrice)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => updateQty(item.product.id, -1)}
                      className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                      <Minus size={13} />
                    </button>
                    <span className="w-8 text-center font-bold text-gray-800">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, 1)}
                      className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                      <Plus size={13} />
                    </button>
                  </div>
                  <div className="text-right shrink-0 min-w-[72px]">
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(item.product.displayPrice * item.quantity)}</p>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 mt-0.5">
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          <div className="border-t border-gray-200 p-4 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tạm tính</span>
              <span className="font-medium">{formatCurrency(subTotal)}</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 w-24 shrink-0">Giảm giá</label>
              <input
                type="number"
                min="0"
                max={subTotal}
                value={discount || ''}
                onChange={e => setDiscount(Number(e.target.value))}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                placeholder="0"
              />
            </div>

            <div className="flex justify-between items-center bg-primary-50 rounded-xl p-3">
              <span className="text-base font-semibold text-gray-800">Tổng tiền</span>
              <span className="text-xl font-bold text-primary-600">{formatCurrency(total)}</span>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Phương thức thanh toán</p>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                      paymentMethod === m.value
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'Cash' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 w-24 shrink-0">Tiền nhận</label>
                <input
                  type="number"
                  min="0"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder={total.toString()}
                />
              </div>
            )}

            {paymentMethod === 'Cash' && cashReceived && Number(cashReceived) >= total && (
              <div className="flex justify-between items-center bg-green-50 rounded-xl p-3">
                <span className="text-sm font-medium text-gray-700">Tiền thối lại</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(change)}</span>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || submitting}
              className={`w-full py-4 rounded-xl text-lg font-bold transition-all ${
                cart.length === 0 || submitting
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-200 active:scale-[0.99]'
              }`}
            >
              {submitting ? 'Đang xử lý...' : '💳 THANH TOÁN'}
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && receipt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="p-5 text-center border-b border-gray-100">
              <CheckCircle size={40} className="text-green-500 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-gray-800">Thanh toán thành công!</h3>
              <p className="text-sm text-gray-500">Đơn #{receipt.orderCode}</p>
            </div>

            <div id="receipt-content" className="p-5 font-mono text-sm">
              <div className="text-center mb-4">
                <p className="text-lg font-bold">SHOP MẸ & BÉ ÁNH TUYẾT</p>
                <p className="text-xs text-gray-500">Cảm ơn quý khách!</p>
                <p className="text-xs text-gray-400">{new Date(receipt.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              <div className="border-t border-dashed border-gray-300 my-3" />
              {receipt.items.map((item, i) => (
                <div key={i} className="flex justify-between py-1">
                  <div>
                    <p className="text-xs font-medium leading-tight">{item.productName}</p>
                    <p className="text-xs text-gray-400">{item.quantity} x {formatCurrency(item.price)}</p>
                  </div>
                  <p className="text-xs font-medium ml-2 shrink-0">{formatCurrency(item.subTotal)}</p>
                </div>
              ))}
              <div className="border-t border-dashed border-gray-300 my-3" />
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span>Tạm tính</span><span>{formatCurrency(receipt.subTotal)}</span></div>
                {receipt.discount > 0 && <div className="flex justify-between text-red-600"><span>Giảm giá</span><span>-{formatCurrency(receipt.discount)}</span></div>}
                <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-gray-200">
                  <span>TỔNG CỘNG</span>
                  <span>{formatCurrency(receipt.total)}</span>
                </div>
                <div className="flex justify-between"><span>Thanh toán</span><span>{paymentMethods.find(m => m.value === receipt.paymentMethod)?.label || receipt.paymentMethod}</span></div>
                {receipt.cashReceived && <div className="flex justify-between"><span>Tiền nhận</span><span>{formatCurrency(receipt.cashReceived)}</span></div>}
                {receipt.change !== undefined && receipt.change > 0 && (
                  <div className="flex justify-between font-bold text-green-600"><span>Tiền thối</span><span>{formatCurrency(receipt.change)}</span></div>
                )}
              </div>
              <div className="border-t border-dashed border-gray-300 my-3" />
              <p className="text-center text-xs text-gray-400">Hẹn gặp lại quý khách!</p>
            </div>

            <div className="p-4 flex gap-3">
              <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium">
                <Printer size={16} /> In hóa đơn
              </button>
              <button onClick={() => setShowReceipt(false)} className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600">
                Đơn tiếp theo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Confirmation Modal */}
      {returnOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw size={20} className="text-orange-500" />
                <h3 className="text-lg font-bold text-gray-800">Xác nhận trả hàng</h3>
              </div>
              <button onClick={() => setReturnOrder(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Mã đơn hàng</p>
                <p className="font-semibold text-gray-800">{returnOrder.orderCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Sản phẩm trong đơn</p>
                <div className="space-y-2">
                  {returnOrder.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-700">{item.productName}</span>
                      <span className="font-medium text-gray-800">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tổng tiền</span>
                <span className="font-bold text-gray-800">{formatCurrency(returnOrder.total)}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do trả hàng</label>
                <textarea
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  rows={3}
                  placeholder="Nhập lý do trả hàng..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmReturn}
                  disabled={returningId === returnOrder.id}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {returningId === returnOrder.id ? 'Đang xử lý...' : 'Xác nhận trả hàng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
