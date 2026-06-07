import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/product/ProductCard'
import Pagination from '../components/ui/Pagination'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { productService } from '../services/productService'
import { Product } from '../types'
import { Search } from 'lucide-react'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)

  const q = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const isFeatured = searchParams.get('isFeatured') === 'true' ? true : undefined
  const isNew = searchParams.get('isNew') === 'true' ? true : undefined

  useEffect(() => {
    setLoading(true)
    productService.getProducts({ search: q || undefined, page, pageSize: 12, isFeatured, isNew })
      .then((res) => {
        if (res.data) {
          setProducts(res.data.items)
          setTotal(res.data.totalCount)
          setTotalPages(res.data.totalPages)
        }
      }).finally(() => setLoading(false))
  }, [q, page, isFeatured, isNew])

  const updatePage = (p: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(p))
    setSearchParams(params)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">
          {q ? `Kết quả tìm kiếm cho "${q}"` : isFeatured ? 'Sản phẩm nổi bật' : isNew ? 'Sản phẩm mới' : 'Tất cả sản phẩm'}
        </h1>
        {!loading && <p className="text-sm text-gray-500 mt-1">Tìm thấy {total} sản phẩm</p>}
      </div>

      {loading ? <LoadingSpinner /> : products.length === 0 ? (
        <EmptyState
          title="Không tìm thấy sản phẩm"
          description={q ? `Không có kết quả cho "${q}". Thử tìm kiếm khác nhé!` : 'Chưa có sản phẩm nào.'}
          icon={<Search size={28} className="text-primary-400" />}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={updatePage} />
        </>
      )}
    </div>
  )
}
