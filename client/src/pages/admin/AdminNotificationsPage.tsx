import { useState, useEffect } from 'react'
import { Bell, Plus, Trash2, Eye } from 'lucide-react'
import api from '../../services/api'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface Notification {
  id: number
  title: string
  content: string
  type: string
  targetUserId?: string
  targetGroup?: string
  createdAt: string
  isActive: boolean
  readCount: number
  isRead: boolean
}

const TYPE_OPTIONS = [
  { value: 'System', label: '🌐 Toàn hệ thống', desc: 'Gửi đến tất cả người dùng' },
  { value: 'Group', label: '👥 Nhóm khách', desc: 'Gửi đến nhóm khách hàng' },
  { value: 'Personal', label: '👤 Cá nhân', desc: 'Gửi đến 1 khách hàng cụ thể' },
]

const TYPE_BADGE: Record<string, string> = {
  System: 'bg-blue-100 text-blue-600',
  Group: 'bg-purple-100 text-purple-600',
  Personal: 'bg-amber-100 text-amber-600',
  AdminAlert: 'bg-red-100 text-red-600',
}

const TYPE_LABEL: Record<string, string> = {
  System: 'Toàn hệ thống',
  Group: 'Nhóm',
  Personal: 'Cá nhân',
  AdminAlert: '⚡ Yêu cầu khách',
}

const TYPE_ICON: Record<string, string> = {
  AdminAlert: '🔔',
  System: '📢',
  Group: '👥',
  Personal: '👤',
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', type: 'System', targetUserId: '', targetGroup: '' })

  const fetch = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notifications/admin')
      if (data.data) setNotifications(data.data)
      // Mark all as read when admin opens the page
      await api.put('/notifications/read-all').catch(() => {})
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body: any = { title: form.title, content: form.content, type: form.type }
      if (form.type === 'Personal' && form.targetUserId) body.targetUserId = form.targetUserId
      if (form.type === 'Group' && form.targetGroup) body.targetGroup = form.targetGroup

      const { data } = await api.post('/notifications/admin', body)
      if (data.success) {
        toast.success('Đã tạo thông báo!')
        setShowModal(false)
        setForm({ title: '', content: '', type: 'System', targetUserId: '', targetGroup: '' })
        fetch()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa thông báo này?')) return
    try {
      await api.delete(`/notifications/admin/${id}`)
      toast.success('Đã xóa')
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch {
      toast.error('Có lỗi xảy ra')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Thông báo hệ thống</h2>
          <p className="text-sm text-gray-500 mt-1">{notifications.filter(n => n.isActive).length} thông báo đang hiển thị</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={18} /> Tạo thông báo
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {notifications.length === 0 && (
            <div className="card text-center py-12 text-gray-400">
              <Bell size={40} className="mx-auto mb-3 opacity-30" />
              <p>Chưa có thông báo nào</p>
            </div>
          )}
          {notifications.map(n => (
            <div key={n.id} className={`card transition-opacity ${!n.isActive ? 'opacity-50' : ''} ${n.type === 'AdminAlert' && !n.isRead ? 'border-l-4 border-l-red-400' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg ${n.type === 'AdminAlert' ? 'bg-red-50' : 'bg-primary-50'}`}>
                    {TYPE_ICON[n.type] ?? '📌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className={`font-semibold ${n.type === 'AdminAlert' && !n.isRead ? 'text-red-700' : 'text-gray-800'}`}>{n.title}</p>
                      <span className={`badge text-xs ${TYPE_BADGE[n.type] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABEL[n.type] || n.type}
                      </span>
                      {n.type === 'AdminAlert' && !n.isRead && <span className="badge bg-red-500 text-white text-xs">Mới</span>}
                      {!n.isActive && <span className="badge bg-gray-100 text-gray-400 text-xs">Đã xóa</span>}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{n.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{new Date(n.createdAt).toLocaleString('vi-VN')}</span>
                      <span className="flex items-center gap-1"><Eye size={12} /> {n.readCount} lượt đọc</span>
                    </div>
                  </div>
                </div>
                {n.isActive && (
                  <button onClick={() => handleDelete(n.id)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Tạo thông báo mới</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại thông báo</label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPE_OPTIONS.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm({ ...form, type: opt.value })}
                      className={`p-3 rounded-xl border text-left transition-all ${form.type === opt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="text-xs font-medium text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {form.type === 'Personal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID khách hàng</label>
                  <input value={form.targetUserId} onChange={e => setForm({ ...form, targetUserId: e.target.value })}
                    className="input-field" placeholder="Dán User ID vào đây" required />
                </div>
              )}

              {form.type === 'Group' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm khách</label>
                  <input value={form.targetGroup} onChange={e => setForm({ ...form, targetGroup: e.target.value })}
                    className="input-field" placeholder="VD: VIP, Mới, ..." />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  required className="input-field" placeholder="Tiêu đề thông báo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung *</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  required rows={4} className="input-field resize-none" placeholder="Nội dung thông báo..." />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Đang gửi...' : 'Gửi thông báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
