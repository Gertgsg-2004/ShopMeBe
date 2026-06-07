import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl font-bold text-primary-200 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Trang không tồn tại</h1>
      <p className="text-gray-500 mb-8">Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
      <div className="flex gap-4">
        <button onClick={() => history.back()} className="btn-secondary">
          <ArrowLeft size={18} /> Quay lại
        </button>
        <Link to="/" className="btn-primary">
          <Home size={18} /> Trang chủ
        </Link>
      </div>
    </div>
  )
}
