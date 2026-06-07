import { Star } from 'lucide-react'

interface Props {
  rating: number
  max?: number
  size?: number
  onChange?: (rating: number) => void
}

export default function StarRating({ rating, max = 5, size = 16, onChange }: Props) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <Star
          key={star}
          size={size}
          onClick={() => onChange?.(star)}
          className={`${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-200'} ${onChange ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
        />
      ))}
    </div>
  )
}
