import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone, CheckCircle2 } from 'lucide-react'
import api from '../services/api'

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await api.post('/auth/forgot-password', { phone })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-pink-50 to-blue-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold">M</div>
          <h1 className="text-2xl font-bold text-gray-800">Quên mật khẩu</h1>
          <p className="text-gray-500 mt-1">Nhập số điện thoại đã đăng ký để yêu cầu đặt lại mật khẩu</p>
        </div>

        <div className="card shadow-lg">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-800 mb-1">Yêu cầu đã được gửi!</p>
              <p className="text-sm text-gray-500 mb-4">
                Admin sẽ xem xét và đặt lại mật khẩu cho bạn. Mật khẩu mới sẽ được thông báo qua số điện thoại <strong>{phone}</strong>.
              </p>
              <Link to="/dang-nhap" className="text-primary-600 text-sm underline">Quay lại đăng nhập</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="input-field pl-9"
                    placeholder="0901234567"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Nhập đúng số điện thoại đã đăng ký tài khoản</p>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu đặt lại mật khẩu'}
              </button>

              <div className="text-center text-sm">
                <Link to="/dang-nhap" className="text-primary-600 hover:underline">Quay lại đăng nhập</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
