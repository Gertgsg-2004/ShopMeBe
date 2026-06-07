import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import ProductCard from '../components/product/ProductCard'
import Pagination from '../components/ui/Pagination'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'
import { Product, Category } from '../types'

const sortOptions = [
  { value: 'createdAt_desc', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
  { value: 'sold_desc', label: 'Bán chạy nhất' },
  { value: 'rating_desc', label: 'Đánh giá cao nhất' },
]

export default function CategoryPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showFilter, setShowFilter] = useState(false)

  const page = parseInt(searchParams.get('page') || '1')
  const sort = searchParams.get('sort') || 'createdAt_desc'
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''

  useEffect(() => {
    if (!slug) return
    categoryService.getCategory(slug).then((res) => {
      if (res.data) setCategory(res.data)
    })
  }, [slug])

  useEffect(() => {
    if (!category) return
    setLoading(true)
    const [sortBy, sortOrder] = sort.split('_')
    productService.getProducts({
      categoryId: category.id,
      page,
      pageSize: 12,
      sortBy,
      sortOrder,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    }).then((res) => {
      if (res.data) {
        setProducts(res.data.items)
        setTotal(res.data.totalCount)
        setTotalPages(res.data.totalPages)
      }
    }).finally(() => setLoading(false))
  }, [category, page, sort, minPrice, maxPrice])

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    params.set('page', '1')
    setSearchParams(params)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <span>Trang chủ</span> / <span className="text-primary-600">{category?.name}</span>
      </div>

      <div className="flex items-start gap-6">
        {/* Filter Sidebar */}
        <aside className={`${showFilter ? 'block' : 'hidden'} md:block w-56 shrink-0`}>
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Bộ lọc</h3>

            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Khoảng giá</p>
              <div className="space-y-2">
                <input type="number" placeholder="Từ (đ)" value={minPrice}
                  onChange={(e) => updateParam('minPrice', e.target.value)}
                  className="input-field text-sm" />
                <input type="number" placeholder="Đến (đ)" value={maxPrice}
                  onChange={(e) => updateParam('maxPrice', e.target.value)}
                  className="input-field text-sm" />
              </div>
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{category?.name}</h1>
              {!loading && <p className="text-sm text-gray-500 mt-1">{total} sản phẩm</p>}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="md:hidden flex items-center gap-2 text-sm font-medium text-gray-700 px-3 py-2 border border-gray-200 rounded-xl"
              >
                <SlidersHorizontal size={16} /> Bộ lọc
              </button>
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="input-field text-sm w-auto"
              >
                {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
            <EmptyState title="Không có sản phẩm" description="Danh mục này chưa có sản phẩm nào." />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              <Pagination page={page} totalPages={totalPages} onPageChange={(p) => updateParam('page', String(p))} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
