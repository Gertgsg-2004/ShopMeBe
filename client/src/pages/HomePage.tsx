import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Headphones } from 'lucide-react'
import ProductCard from '../components/product/ProductCard'
import { ProductGridSkeleton } from '../components/ui/ProductCardSkeleton'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'
import { Product, Category } from '../types'
import { usePageTitle } from '../hooks/usePageTitle'

const banners = [
  {
    title: 'Chào mừng Mẹ & Bé',
    subtitle: 'Sản phẩm chất lượng cho mẹ bầu và bé yêu',
    cta: 'Khám phá ngay',
    link: '/danh-muc/do-ba-bau',
    bg: 'from-pink-100 to-rose-50',
    emoji: '🤰',
  },
  {
    title: 'Đồ Sơ Sinh Cao Cấp',
    subtitle: 'An toàn, mềm mại và dễ chịu cho bé',
    cta: 'Xem sản phẩm',
    link: '/danh-muc/do-so-sinh',
    bg: 'from-blue-100 to-sky-50',
    emoji: '👶',
  },
  {
    title: 'Đồ Chơi Giáo Dục',
    subtitle: 'Phát triển trí tuệ và sáng tạo cho con',
    cta: 'Mua ngay',
    link: '/danh-muc/do-choi',
    bg: 'from-yellow-100 to-amber-50',
    emoji: '🧸',
  },
]

const features = [
  { icon: Truck, label: 'Miễn phí vận chuyển', desc: 'Đơn từ 500.000đ' },
  { icon: ShieldCheck, label: 'Hàng chính hãng', desc: 'Cam kết 100%' },
  { icon: RefreshCw, label: 'Đổi trả dễ dàng', desc: 'Trong vòng 7 ngày' },
  { icon: Headphones, label: 'Hỗ trợ 24/7', desc: 'Tư vấn miễn phí' },
]

export default function HomePage() {
  usePageTitle(undefined, 'Shop Mẹ & Bé Ánh Tuyết - đồ bà bầu, đồ sơ sinh, bỉm sữa, đồ chơi chính hãng. Miễn phí vận chuyển đơn từ 500.000đ.')
  const [featured, setFeatured] = useState<Product[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [bannerIndex, setBannerIndex] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, newRes, catRes] = await Promise.all([
          productService.getFeatured(8),
          productService.getNew(8),
          categoryService.getCategories(),
        ])
        if (featuredRes.data) setFeatured(featuredRes.data)
        if (newRes.data) setNewProducts(newRes.data)
        if (catRes.data) setCategories(catRes.data.filter((c) => c.isActive))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setBannerIndex((i) => (i + 1) % banners.length), 5000)
    return () => clearInterval(timer)
  }, [])

  const banner = banners[bannerIndex]

  return (
    <div>
      {/* Hero Banner */}
      <section className={`bg-gradient-to-r ${banner.bg} py-16 px-4 transition-all duration-500`}>
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">{banner.title}</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md">{banner.subtitle}</p>
            <Link to={banner.link} className="btn-primary inline-flex">
              {banner.cta} <ArrowRight size={18} />
            </Link>
          </div>
          <div className="hidden md:block text-8xl">{banner.emoji}</div>
        </div>
        <div className="flex justify-center gap-2 mt-8">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setBannerIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === bannerIndex ? 'bg-primary-500 w-6' : 'bg-primary-200'}`} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                  <f.icon size={20} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{f.label}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 container mx-auto px-4">
        <h2 className="section-title">Danh mục sản phẩm</h2>
        <p className="section-subtitle">Tìm kiếm theo danh mục bạn cần</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/danh-muc/${cat.slug}`}
              className="group flex flex-col items-center p-4 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl flex items-center justify-center mb-3 text-3xl group-hover:scale-110 transition-transform">
                {({'do-ba-bau':'🤰','do-so-sinh':'👶','do-choi':'🧸','sua-va-thuc-pham':'🍼','phu-kien':'🎒','bim':'🧷','quan-ao-thu-dong':'🧥','quan-ao-he':'👗'} as Record<string,string>)[cat.slug] ?? '🏷️'}
              </div>
              <p className="text-sm font-medium text-gray-700 text-center group-hover:text-primary-600 transition-colors">{cat.name}</p>
              <p className="text-xs text-gray-400 mt-1">{cat.productCount} sản phẩm</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-pastel-pink/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title mb-1">Sản phẩm nổi bật</h2>
              <p className="text-gray-500 text-sm">Được nhiều mẹ yêu thích nhất</p>
            </div>
            <Link to="/tim-kiem?isFeatured=true" className="btn-outline text-sm">
              Xem tất cả <ArrowRight size={16} />
            </Link>
          </div>
          {loading ? <ProductGridSkeleton count={8} /> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* New Products */}
      <section className="py-12 container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="section-title mb-1">Sản phẩm mới</h2>
            <p className="text-gray-500 text-sm">Hàng mới về liên tục mỗi ngày</p>
          </div>
          <Link to="/tim-kiem?isNew=true" className="btn-outline text-sm">
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>
        {loading ? <ProductGridSkeleton count={8} /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {newProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Promo Banner */}
      <section className="py-8 bg-gradient-to-r from-primary-500 to-primary-400 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-2">🎁 Ưu đãi đặc biệt cho thành viên mới</h2>
          <p className="text-primary-100 mb-6">Đăng ký ngay để nhận mã giảm 10% cho đơn hàng đầu tiên</p>
          <Link to="/dang-ky" className="bg-white text-primary-600 hover:bg-primary-50 font-semibold px-8 py-3 rounded-xl inline-block transition-colors">
            Đăng ký ngay
          </Link>
        </div>
      </section>
    </div>
  )
}
