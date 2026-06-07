import { PackageOpen } from 'lucide-react'

interface Props {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export default function EmptyState({
  title = 'Không có dữ liệu',
  description = 'Chưa có nội dung nào để hiển thị.',
  icon,
  action
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
        {icon || <PackageOpen size={28} className="text-primary-400" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-6 max-w-xs">{description}</p>
      {action}
    </div>
  )
}
