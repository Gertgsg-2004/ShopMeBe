import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import api from '../../services/api'
import { useAppSelector } from '../../hooks/useAppSelector'

interface Notif {
  id: number
  title: string
  content: string
  type: string
  createdAt: string
  isRead: boolean
}

export default function NotificationBell() {
  const { isAuthenticated } = useAppSelector((s) => s.auth)
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count')
      if (data?.data) setUnread(data.data.unread)
    } catch {}
  }

  const fetchNotifs = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notifications')
      if (data?.data) setNotifs(data.data)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    fetchCount()
    const interval = setInterval(fetchCount, 60000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    if (!open) fetchNotifs()
    setOpen(!open)
  }

  const markRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnread(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnread(0)
    } catch {}
  }

  const timeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
    if (diff < 60) return 'Vừa xong'
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
    return `${Math.floor(diff / 86400)} ngày trước`
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 hover:bg-pink-50 rounded-xl transition-colors"
        title="Thông báo"
      >
        <Bell size={22} className={open ? 'text-primary-500' : 'text-gray-600'} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel — slides down */}
      <div
        className={`absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden
          transition-all duration-300 origin-top
          ${open ? 'opacity-100 scale-y-100 translate-y-0' : 'opacity-0 scale-y-95 -translate-y-2 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Thông báo</h3>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary-500 hover:text-primary-700 font-medium">
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-500 rounded-full animate-spin mx-auto" />
            </div>
          ) : notifs.length === 0 ? (
            <div className="py-10 text-center">
              <Bell size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Chưa có thông báo nào</p>
            </div>
          ) : (
            notifs.map(n => (
              <button
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={`w-full text-left px-4 py-3 transition-colors hover:bg-pink-50 ${!n.isRead ? 'bg-primary-50/60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Dot */}
                  <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${!n.isRead ? 'bg-primary-500' : 'bg-gray-200'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-800' : 'font-medium text-gray-600'} line-clamp-1`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
