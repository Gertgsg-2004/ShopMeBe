import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingCart, Minus, Plus, Star, Package, ChevronRight } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ProductCard from '../components/product/ProductCard'
import StarRating from '../components/ui/StarRating'
import { productService } from '../services/productService'
import { Product, Review } from '../types'
import { formatCurrency, calculateDiscount } from '../utils/format'
import { useAppDispatch, useAppSelector } from '../hooks/useAppSelector'
import { addToCart } from '../store/cartSlice'
import toast from 'react-hot-toast'
import { usePageTitle } from '../hooks/usePageTitle'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAppSelector((s) => s.auth)
  const [product, setProduct] = useState<Product | null>(null)
  usePageTitle(product?.name, product?.shortDescription || product?.description?.slice(0, 160))
  const [related, setRelated] = useState<Product[]>([])

  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews'>('desc')

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    productService.getProduct(slug).then(async (res) => {
      if (res.data) {
        setProduct(res.data)
        const [relatedRes, reviewsRes] = await Promise.all([
          productService.getRelated(res.data.id, res.data.categoryId),
          productService.getReviews(res.data.id),
        ])
        if (relatedRes.data) setRelated(relatedRes.data)
        if (reviewsRes.data) setReviews(reviewsRes.data)
      }
    }).finally(() => setLoading(false))
  }, [slug])

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Vui lòng đăng nhập'); return }
    if (!product || product.stock === 0) return
    const result = await dispatch(addToCart({ productId: product.id, quantity }))
    if (addToCart.fulfilled.match(result)) toast.success('Đã thêm vào giỏ hàng!')
    else toast.error(result.payload as string || 'Thêm thất bại')
  }

  const handleSubmitReview = async () => {
    if (!isAuthenticated) { toast.error('Vui lòng đăng nhập để đánh giá'); return }
    if (!product) return
    setSubmittingReview(true)
    try {
      const res = await productService.createReview(product.id, newRating, newComment)
      if (res.success) {
        toast.success('Đánh giá thành công!')
        const reviewsRes = await productService.getReviews(product.id)
        if (reviewsRes.data) setReviews(reviewsRes.data)
        setNewComment('')
        setNewRating(5)
      } else {
        toast.error(res.message || 'Đánh giá thất bại')
      }
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <div className="py-20"><LoadingSpinner size="lg" /></div>
  if (!product) return <div className="text-center py-20 text-gray-500">Không tìm thấy sản phẩm</div>

  const discount = product.salePrice ? calculateDiscount(product.price, product.salePrice) : 0
  const images = product.imageUrls.length > 0 ? product.imageUrls : ['/placeholder.jpg']

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
        <ChevronRight size={14} />
        <Link to={`/danh-muc/${product.categoryId}`} className="hover:text-primary-600">{product.categoryName}</Link>
        <ChevronRight size={14} />
        <span className="text-gray-800 line-clamp-1">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-3">
            <img src={images[activeImage]} alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg' }} />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-colors ${i === activeImage ? 'border-primary-500' : 'border-transparent'}`}>
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-primary-500 font-medium mb-2">{product.categoryName}</p>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{product.name}</h1>

          {product.reviewCount > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <StarRating rating={Math.round(product.averageRating)} />
              <span className="text-sm text-gray-500">{product.averageRating.toFixed(1)} ({product.reviewCount} đánh giá)</span>
              <span className="text-sm text-gray-400">• {product.soldCount} đã bán</span>
            </div>
          )}

          <div className="flex items-end gap-3 mb-6">
            <span className="text-3xl font-bold text-primary-600">{formatCurrency(product.displayPrice)}</span>
            {product.salePrice && product.salePrice < product.price && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatCurrency(product.price)}</span>
                <span className="badge bg-red-100 text-red-600">-{discount}%</span>
              </>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-gray-600 text-sm leading-relaxed mb-6 p-4 bg-pink-50 rounded-xl">{product.shortDescription}</p>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2 mb-6">
            <Package size={16} className="text-gray-400" />
            <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0 ? `Còn hàng (${product.stock} sản phẩm)` : 'Hết hàng'}
            </span>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium text-gray-700">Số lượng:</span>
            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 hover:bg-gray-100 transition-colors">
                <Minus size={16} />
              </button>
              <span className="px-5 py-2 font-medium min-w-[50px] text-center">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-2.5 hover:bg-gray-100 transition-colors">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <button onClick={handleAddToCart} disabled={product.stock === 0}
            className="btn-primary w-full py-3 text-base mb-3">
            <ShoppingCart size={20} />
            {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-12">
        <div className="flex border-b border-gray-200 mb-6">
          {[{ key: 'desc', label: 'Mô tả sản phẩm' }, { key: 'reviews', label: `Đánh giá (${reviews.length})` }].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as 'desc' | 'reviews')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'desc' ? (
          <div className="prose max-w-none text-gray-700 text-sm leading-relaxed">
            {product.description || <p className="text-gray-400">Chưa có mô tả sản phẩm.</p>}
          </div>
        ) : (
          <div>
            {reviews.length > 0 ? (
              <div className="space-y-4 mb-8">
                {reviews.map((r) => (
                  <div key={r.id} className="card">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center font-medium text-primary-600 shrink-0">
                        {r.userName[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{r.userName}</span>
                          <StarRating rating={r.rating} size={12} />
                        </div>
                        <p className="text-sm text-gray-600">{r.comment}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm mb-8">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
            )}

            {isAuthenticated && (
              <div className="card border-2 border-primary-100">
                <h3 className="font-semibold text-gray-800 mb-4">Viết đánh giá của bạn</h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Chất lượng:</p>
                  <StarRating rating={newRating} size={28} onChange={setNewRating} />
                </div>
                <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Nhập nhận xét của bạn về sản phẩm..."
                  rows={4} className="input-field resize-none mb-4" />
                <button onClick={handleSubmitReview} disabled={submittingReview} className="btn-primary">
                  {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="section-title">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
