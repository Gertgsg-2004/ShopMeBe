import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, Package, ArrowRight, Copy } from 'lucide-react'
import { orderService } from '../services/orderService'
import { Order } from '../types'
import { formatCurrency, formatDate } from '../utils/format'
import api from '../services/api'
import toast from 'react-hot-toast'

interface BankInfo {
  bankName: string
  bankBranch: string
  accountNo: string
  accountName: string
  qrImageUrl: string
}

const BANK_ID_MAP: Record<string, string> = {
  'Vietcombank': 'VCB',
  'Techcombank': 'TCB',
  'BIDV': 'BIDV',
  'Agribank': 'AGRIBANK',
  'VPBank': 'VPBANK',
  'MBBank': 'MB',
  'ACB': 'ACB',
}

export default function OrderSuccessPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)

  useEffect(() => {
    if (id) orderService.getOrder(parseInt(id)).then((res) => { if (res.data) setOrder(res.data) })
    api.get('/settings/bank-info').then(res => { if (res.data?.data) setBankInfo(res.data.data) }).catch(() => {})
  }, [id])

  const isBankTransfer = order && (order.paymentMethod === 1 || order.paymentMethod === 2)

  const qrUrl = isBankTransfer && bankInfo
    ? bankInfo.qrImageUrl && bankInfo.qrImageUrl.startsWith('/uploads')
      ? bankInfo.qrImageUrl
      : (() => {
          const bankId = BANK_ID_MAP[bankInfo.bankName] || bankInfo.bankName.toUpperCase().replace(/\s/g, '')
          return `https://img.vietqr.io/image/${bankId}-${bankInfo.accountNo}-compact2.png?amount=${order.total}&addInfo=${encodeURIComponent(order.orderCode)}&accountName=${encodeURIComponent(bankInfo.accountName)}`
        })()
    : null

  return (
    <div className="container mx-auto px-4 py-16 text-center max-w-lg">
      <div className="card">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={44} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Đặt hàng thành công! 🎉</h1>
        <p className="text-gray-500 mb-6">Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ xác nhận sớm nhất.</p>

        {order && (
          <div className="bg-pink-50 rounded-xl p-4 text-left mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Mã đơn hàng:</span>
              <span className="font-bold text-primary-600">#{order.orderCode}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Ngày đặt:</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Thanh toán:</span>
              <span>{order.paymentMethodText}</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span>Tổng tiền:</span>
              <span className="text-primary-600">{formatCurrency(order.total)}</span>
            </div>
          </div>
        )}

        {isBankTransfer && bankInfo && (
          <div className="text-left mb-6 border border-primary-200 rounded-2xl p-4 bg-primary-50">
            <p className="font-semibold text-primary-700 mb-3 text-center">Thông tin chuyển khoản</p>

            {qrUrl && (
              <div className="flex justify-center mb-4">
                <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                  <img src={qrUrl} alt="QR chuyển khoản" className="w-48 h-48 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  <p className="text-xs text-gray-400 text-center mt-1">Quét mã QR bằng app ngân hàng</p>
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm bg-white rounded-xl p-3 border border-gray-100">
              <div className="flex justify-between"><span className="text-gray-500">Ngân hàng</span><span className="font-medium">{bankInfo.bankName}</span></div>
              {bankInfo.bankBranch && <div className="flex justify-between"><span className="text-gray-500">Chi nhánh</span><span className="font-medium">{bankInfo.bankBranch}</span></div>}
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Số tài khoản</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-primary-600">{bankInfo.accountNo}</span>
                  <button onClick={() => { navigator.clipboard.writeText(bankInfo.accountNo); toast.success('Đã sao chép') }}
                    className="text-gray-400 hover:text-primary-500"><Copy size={14} /></button>
                </div>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Chủ tài khoản</span><span className="font-medium">{bankInfo.accountName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Số tiền</span><span className="font-bold text-green-600">{order && formatCurrency(order.total)}</span></div>
              <div className="border-t pt-2">
                <p className="text-gray-500 mb-1">Nội dung chuyển khoản <span className="text-red-500">(bắt buộc)</span></p>
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  <span className="font-mono font-bold text-yellow-800 flex-1">{order?.orderCode}</span>
                  <button onClick={() => { if (order) { navigator.clipboard.writeText(order.orderCode); toast.success('Đã sao chép') } }}
                    className="text-xs text-yellow-700 border border-yellow-300 rounded px-2 py-0.5 hover:bg-yellow-100">Sao chép</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link to={`/don-hang/${id}`} className="btn-primary justify-center">
            <Package size={18} /> Xem chi tiết đơn hàng
          </Link>
          <Link to="/" className="btn-secondary justify-center">
            Tiếp tục mua sắm <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  )
}
