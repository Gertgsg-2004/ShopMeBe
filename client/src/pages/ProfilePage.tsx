import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { User, Phone, MapPin, Calendar, Lock, Save } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../hooks/useAppSelector'
import { updateUser } from '../store/authSlice'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

interface ProfileForm {
  fullName: string
  phone: string
  address: string
  dateOfBirth: string
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfilePage() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      address: user?.address || '',
      dateOfBirth: user?.dateOfBirth?.split('T')[0] || '',
    }
  })

  const passwordForm = useForm<PasswordForm>()

  const onSaveProfile = async (data: ProfileForm) => {
    setSavingProfile(true)
    try {
      const res = await authService.updateProfile(data)
      if (res.success) {
        dispatch(updateUser({ ...user!, ...data }))
        toast.success('Cập nhật hồ sơ thành công!')
      } else {
        toast.error(res.message || 'Cập nhật thất bại')
      }
    } catch {
      toast.error('Có lỗi xảy ra')
    } finally {
      setSavingProfile(false)
    }
  }

  const onSavePassword = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }
    setSavingPassword(true)
    try {
      const res = await authService.changePassword(data.currentPassword, data.newPassword, data.confirmPassword)
      if (res.success) {
        toast.success('Đổi mật khẩu thành công!')
        passwordForm.reset()
      } else {
        toast.error(res.message || 'Đổi mật khẩu thất bại')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Hồ sơ cá nhân</h1>

      {/* Avatar */}
      <div className="card mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {user?.fullName?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{user?.fullName}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[{ key: 'profile', label: 'Thông tin cá nhân' }, { key: 'password', label: 'Đổi mật khẩu' }].map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key as 'profile' | 'password')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' ? (
        <div className="card">
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...profileForm.register('fullName', { required: 'Họ tên là bắt buộc' })} className="input-field pl-9" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...profileForm.register('phone')} className="input-field pl-9" placeholder="0901234567" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...profileForm.register('address')} className="input-field pl-9" placeholder="Địa chỉ của bạn" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...profileForm.register('dateOfBirth')} type="date" className="input-field pl-9" />
              </div>
            </div>
            <button type="submit" disabled={savingProfile} className="btn-primary">
              <Save size={16} /> {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        </div>
      ) : (
        <div className="card">
          <form onSubmit={passwordForm.handleSubmit(onSavePassword)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...passwordForm.register('currentPassword', { required: true })} type="password" className="input-field pl-9" placeholder="••••••••" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...passwordForm.register('newPassword', { required: true, minLength: 6 })} type="password" className="input-field pl-9" placeholder="••••••••" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...passwordForm.register('confirmPassword', { required: true })} type="password" className="input-field pl-9" placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" disabled={savingPassword} className="btn-primary">
              <Lock size={16} /> {savingPassword ? 'Đang lưu...' : 'Đổi mật khẩu'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
