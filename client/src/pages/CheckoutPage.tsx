import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Tag, Truck, CreditCard, Wallet } from 'lucide-react'
import { useAppSelector } from '../hooks/useAppSelector'
import { orderService } from '../services/orderService'
import { formatCurrency } from '../utils/format'
import api from '../services/api'
import toast from 'react-hot-toast'

interface CheckoutForm {
  receiverName: string
  receiverPhone: string
  shippingAddress: string
  paymentMethod: number
  note: string
  couponCode: string
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { cart } = useAppSelector((s) => s.cart)
  const { user } = useAppSelector((s) => s.auth)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutForm>({
    defaultValues: {
      receiverName: user?.fullName || '',
      receiverPhone: user?.phone || '',
      shippingAddress: user?.address || '',
      paymentMethod: 0,
    }
  })

  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [shipConfig, setShipConfig] = useState({ shippingFee: 30000, freeShipThreshold: 500000 })

  useEffect(() => {
    api.get('/wallet').then(res => {
      if (res.data?.data) setWalletBalance(res.data.data.balance || 0)
    }).catch(() => {})
    api.get('/settings/shipping').then(res => {
      if (res.data?.data) setShipConfig(res.data.data)
    }).catch(() => {})
  }, [])

  const couponCode = watch('couponCode')
  const paymentMethod = watch('paymentMethod')

  if (!cart || cart.items.length === 0) {
    navigate('/gio-hang')
    return null
  }

  const shippingFee = cart.total >= shipConfig.freeShipThreshold ? 0 : shipConfig.shippingFee
  const total = cart.total - couponDiscount + shippingFee

  const handleApplyCoupon = async () => {
    if (!couponCode?.trim()) return
    setCouponLoading(true)
    try {
      const res = await orderService.validateCoupon(couponCode, cart.total)
      if (res.success && res.data) {
        setCouponDiscount(res.data.discount)
        setCouponApplied(couponCode.toUpperCase())
        toast.success(res.data.message)
      } else {
        toast.error(res.message || 'Mã không hợp lệ')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Mã không hợp lệ')
    } finally {
      setCouponLoading(false)
    }
  }

  const onSubmit = async (data: CheckoutForm) => {
    setSubmitting(true)
    try {
      const res = await orderService.createOrder({
        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone,
        shippingAddress: data.shippingAddress,
        paymentMethod: Number(data.paymentMethod),
        note: data.note,
        couponCode: couponApplied || undefined,
      })
      if (res.success && res.data) {
        toast.success('Đặt hàng thành công!')
        navigate(`/dat-hang-thanh-cong/${res.data.id}`)
      } else {
        toast.error(res.message || 'Đặt hàng thất bại')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Đặt hàng thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Thanh toán</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping info */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Truck size={18} className="text-primary-500" /> Thông tin giao hàng
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên người nhận *</label>
                <input {...register('receiverName', { required: 'Vui lòng nhập họ tên' })}
                  className="input-field" placeholder="Nguyễn Thị Lan" />
                {errors.receiverName && <p className="text-red-500 text-xs mt-1">{errors.receiverName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                <input {...register('receiverPhone', { required: 'Vui lòng nhập SĐT' })}
                  className="input-field" placeholder="0901234567" />
                {errors.receiverPhone && <p className="text-red-500 text-xs mt-1">{errors.receiverPhone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng *</label>
                <textarea {...register('shippingAddress', { required: 'Vui lòng nhập địa chỉ' })}
                  className="input-field resize-none" rows={3} placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" />
                {errors.shippingAddress && <p className="text-red-500 text-xs mt-1">{errors.shippingAddress.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <input {...register('note')} className="input-field" placeholder="Ghi chú cho người giao hàng..." />
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-primary-500" /> Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              {[
                { value: 0, label: 'Tiền mặt khi nhận hàng (COD)', icon: '💵', desc: 'Thanh toán khi nhận được hàng' },
                { value: 1, label: 'Chuyển khoản ngân hàng', icon: '🏦', desc: 'STK: 1234567890 - Vietcombank - Đỗ Thị Ánh Tuyết' },
                { value: 3, label: 'Thanh toán bằng ví', icon: '👛', desc: `Số dư: ${formatCurrency(walletBalance)}${walletBalance < total ? ' (không đủ)' : ''}` },
              ].map((method) => (
                <label key={method.value} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${Number(paymentMethod) === method.value ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-200'} ${method.value === 3 && walletBalance < total ? 'opacity-50' : ''}`}>
                  <input type="radio" {...register('paymentMethod')} value={method.value} className="mt-1" disabled={method.value === 3 && walletBalance < total} />
                  <div>
                    <span className="font-medium text-sm">{method.icon} {method.label}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{method.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Coupon */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Tag size={18} className="text-primary-500" /> Mã giảm giá
            </h2>
            <div className="flex gap-3">
              <input {...register('couponCode')} className="input-field flex-1" placeholder="Nhập mã giảm giá (VD: WELCOME10)" />
              <button type="button" onClick={handleApplyCoupon} disabled={couponLoading}
                className="btn-outline shrink-0">
                {couponLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
              </button>
            </div>
            {couponDiscount > 0 && (
              <p className="text-green-600 text-sm mt-2">✅ Giảm {formatCurrency(couponDiscount)}</p>
            )}
          </div>
        </div>

        {/* Order summary */}
        <div className="card h-fit sticky top-24">
          <h2 className="font-semibold text-gray-800 mb-4">Đơn hàng ({cart.itemCount} sản phẩm)</h2>
          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-2 text-sm">
                <img src={item.productImage || '/placeholder.jpg'} alt={item.productName}
                  className="w-12 h-12 object-cover rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 line-clamp-2">{item.productName}</p>
                  <p className="text-gray-500 text-xs">x{item.quantity} × {formatCurrency(item.price)}</p>
                </div>
                <span className="font-medium shrink-0">{formatCurrency(item.subTotal)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
            <div className="flex justify-between text-gray-600"><span>Tạm tính</span><span>{formatCurrency(cart.total)}</span></div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600"><span>Giảm giá ({couponApplied})</span><span>-{formatCurrency(couponDiscount)}</span></div>
            )}
            <div className="flex justify-between text-gray-600"><span>Phí ship</span><span className={shippingFee === 0 ? 'text-green-600' : ''}>{shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}</span></div>
            <div className="flex justify-between font-bold text-gray-800 text-base border-t border-gray-100 pt-2">
              <span>Tổng cộng</span>
              <span className="text-primary-600">{formatCurrency(total)}</span>
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full py-3 mt-6">
            {submitting ? 'Đang xử lý...' : 'Đặt hàng ngay'}
          </button>
        </div>
      </form>
    </div>
  )
}
