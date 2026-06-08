import { CheckCircle, Home, Package } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

export default function PaymentSuccessPage() {
  const [params] = useSearchParams()
  const method = params.get('method') || ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md w-full mx-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={44} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thành công!</h1>
        <p className="text-gray-500 mb-2">
          {method === 'vnpay' ? 'Đơn hàng đã được xác nhận qua VNPay.' : 'Đơn hàng của bạn đã được đặt thành công.'}
        </p>
        <p className="text-sm text-gray-400 mb-8">Chúng tôi sẽ xử lý và giao hàng sớm nhất có thể.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium">
            <Home size={16} /> Trang chủ
          </Link>
          <Link to="/don-hang" className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 text-sm font-medium">
            <Package size={16} /> Đơn hàng của tôi
          </Link>
        </div>
      </div>
    </div>
  )
}
