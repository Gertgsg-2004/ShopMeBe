import { useState, useEffect, useRef } from 'react'
import { Settings, Upload, Save } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

interface BankInfo {
  bankName: string
  bankBranch: string
  accountNo: string
  accountName: string
  qrImageUrl: string
}

export default function AdminSettingsPage() {
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bankName: '', bankBranch: '', accountNo: '', accountName: '', qrImageUrl: ''
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [shipping, setShipping] = useState({ shippingFee: 30000, freeShipThreshold: 500000 })
  const [savingShip, setSavingShip] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get('/settings/bank-info').then(res => {
      if (res.data?.data) setBankInfo(res.data.data)
    }).catch(() => {})
    api.get('/settings/shipping').then(res => {
      if (res.data?.data) setShipping(res.data.data)
    }).catch(() => {})
  }, [])

  const handleSaveShipping = async () => {
    setSavingShip(true)
    try {
      await api.put('/settings/shipping', shipping)
      toast.success('Đã lưu cài đặt phí vận chuyển')
    } catch {
      toast.error('Lưu thất bại')
    } finally {
      setSavingShip(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/settings/bank-info', {
        bankName: bankInfo.bankName,
        bankBranch: bankInfo.bankBranch,
        accountNo: bankInfo.accountNo,
        accountName: bankInfo.accountName,
        qrImageUrl: bankInfo.qrImageUrl,
      })
      toast.success('Đã lưu thông tin ngân hàng')
    } catch {
      toast.error('Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleUploadQr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/settings/upload-qr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data?.data?.url) {
        setBankInfo(prev => ({ ...prev, qrImageUrl: res.data.data.url }))
        toast.success('Upload QR thành công')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload thất bại')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Settings size={20} className="text-primary-500" /> Cài đặt hệ thống
      </h1>

      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-4">Thông tin ngân hàng (chuyển khoản)</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên ngân hàng</label>
              <input className="input-field" value={bankInfo.bankName}
                onChange={e => setBankInfo(p => ({ ...p, bankName: e.target.value }))}
                placeholder="Vietcombank" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh</label>
              <input className="input-field" value={bankInfo.bankBranch}
                onChange={e => setBankInfo(p => ({ ...p, bankBranch: e.target.value }))}
                placeholder="Chi nhánh Mai Sơn Sơn La" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
            <input className="input-field font-mono" value={bankInfo.accountNo}
              onChange={e => setBankInfo(p => ({ ...p, accountNo: e.target.value }))}
              placeholder="1234567890" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ tài khoản</label>
            <input className="input-field" value={bankInfo.accountName}
              onChange={e => setBankInfo(p => ({ ...p, accountName: e.target.value }))}
              placeholder="Đỗ Thị Ánh Tuyết" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh QR chuyển khoản</label>
            <div className="flex items-start gap-4">
              {bankInfo.qrImageUrl && (
                <div className="border border-gray-200 rounded-xl p-2 bg-white">
                  <img src={bankInfo.qrImageUrl.split('?')[0]}
                    alt="QR hiện tại" className="w-32 h-32 object-contain rounded-lg" />
                  <p className="text-xs text-gray-400 text-center mt-1">QR hiện tại</p>
                </div>
              )}
              <div>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
                  onChange={handleUploadQr} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="btn-outline flex items-center gap-2">
                  <Upload size={16} /> {uploading ? 'Đang tải...' : 'Tải ảnh QR lên'}
                </button>
                <p className="text-xs text-gray-400 mt-2">Hỗ trợ: JPG, PNG, WEBP</p>
                <p className="text-xs text-gray-400">Nếu có ảnh QR tĩnh, upload lên đây thay vì dùng VietQR tự động</p>
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="btn-primary flex items-center gap-2">
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold text-gray-700 mb-4">Phí vận chuyển</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phí ship (đ)</label>
            <input type="number" min={0} className="input-field" value={shipping.shippingFee}
              onChange={e => setShipping(p => ({ ...p, shippingFee: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Miễn phí ship từ (đ)</label>
            <input type="number" min={0} className="input-field" value={shipping.freeShipThreshold}
              onChange={e => setShipping(p => ({ ...p, freeShipThreshold: Number(e.target.value) }))} />
          </div>
        </div>
        <button onClick={handleSaveShipping} disabled={savingShip}
          className="btn-primary flex items-center gap-2">
          <Save size={16} /> {savingShip ? 'Đang lưu...' : 'Lưu phí vận chuyển'}
        </button>
      </div>
    </div>
  )
}
