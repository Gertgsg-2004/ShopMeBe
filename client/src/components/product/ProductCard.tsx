import { Link } from 'react-router-dom'
import { ShoppingCart, Star, Heart } from 'lucide-react'
import { Product } from '../../types'
import { formatCurrency, calculateDiscount } from '../../utils/format'
import { useAppDispatch } from '../../hooks/useAppSelector'
import { useAppSelector } from '../../hooks/useAppSelector'
import { addToCart } from '../../store/cartSlice'
import toast from 'react-hot-toast'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAppSelector((s) => s.auth)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng')
      return
    }
    if (product.stock === 0) {
      toast.error('Sản phẩm đã hết hàng')
      return
    }
    const result = await dispatch(addToCart({ productId: product.id, quantity: 1 }))
    if (addToCart.fulfilled.match(result)) {
      toast.success('Đã thêm vào giỏ hàng!')
    } else {
      toast.error(result.payload as string || 'Thêm vào giỏ thất bại')
    }
  }

  const discount = product.salePrice ? calculateDiscount(product.price, product.salePrice) : 0
  const imageUrl = product.mainImageUrl || '/placeholder.jpg'

  return (
    <Link to={`/san-pham/${product.slug}`} className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative overflow-hidden aspect-square bg-gray-50">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg' }}
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            -{discount}%
          </span>
        )}
        {product.isNew && (
          <span className="absolute top-2 right-10 bg-secondary-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            Mới
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg">Hết hàng</span>
          </div>
        )}
        <button
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm hover:bg-pink-50 transition-colors opacity-0 group-hover:opacity-100"
          onClick={(e) => e.preventDefault()}
        >
          <Heart size={14} className="text-gray-400 hover:text-primary-500" />
        </button>
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <p className="text-xs text-gray-400 mb-1">{product.categoryName}</p>
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 flex-1 mb-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>

        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={12} className={s <= Math.round(product.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
              ))}
            </div>
            <span className="text-xs text-gray-400">({product.reviewCount})</span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <span className="text-base font-bold text-primary-600">
            {formatCurrency(product.displayPrice)}
          </span>
          {product.salePrice && product.salePrice < product.price && (
            <span className="text-xs text-gray-400 line-through">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="w-full flex items-center justify-center gap-2 bg-primary-50 hover:bg-primary-100 text-primary-600 font-medium text-sm py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart size={14} />
          {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
        </button>
      </div>
    </Link>
  )
}
