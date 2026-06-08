import { XCircle, Home, RefreshCw } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

const vnpayErrors: Record<string, string> = {
  '07': 'Giao dịch bị nghi ngờ gian lận.',
  '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ.',
  '10': 'Xác thực thông tin thẻ quá 3 lần.',
  '11': 'Đã hết hạn chờ thanh toán.',
  '12': 'Thẻ/Tài khoản bị khóa.',
  '13': 'Sai mật khẩu OTP.',
  '24': 'Khách hàng hủy giao dịch.',
  '51': 'Tài khoản không đủ số dư.',
  '65': 'Vượt quá hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng thanh toán đang bảo trì.',
  '79': 'Sai mật khẩu quá số lần quy định.',
  '99': 'Lỗi không xác định.',
}

export default function PaymentFailedPage() {
  const [params] = useSearchParams()
  const code = params.get('code') || '99'
  const errorMsg = vnpayErrors[code] || 'Thanh toán không thành công.'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md w-full mx-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={44} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thất bại</h1>
        <p className="text-gray-500 mb-2">{errorMsg}</p>
        <p className="text-xs text-gray-400 mb-8">Mã lỗi: {code}</p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium">
            <Home size={16} /> Trang chủ
          </Link>
          <Link to="/gio-hang" className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 text-sm font-medium">
            <RefreshCw size={16} /> Thử lại
          </Link>
        </div>
      </div>
    </div>
  )
}
