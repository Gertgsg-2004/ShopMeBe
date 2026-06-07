import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Search, Image } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { categoryService } from '../../services/categoryService'
import { productService } from '../../services/productService'
import { Product, Category } from '../../types'
import { formatCurrency } from '../../utils/format'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Pagination from '../../components/ui/Pagination'
import toast from 'react-hot-toast'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '', description: '', shortDescription: '',
    price: '', salePrice: '', stock: '', sku: '',
    categoryId: '', isFeatured: false, isNew: false, isActive: true,
  })

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await productService.getProducts({ search: search || undefined, page, pageSize: 15 })
      if (res.data) {
        setProducts(res.data.items)
        setTotal(res.data.totalCount)
        setTotalPages(res.data.totalPages)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [page, search])

  useEffect(() => {
    categoryService.getCategories().then((res) => {
      if (res.data) setCategories(res.data.filter((c) => c.isActive))
    })
  }, [])

  const openCreate = () => {
    setEditingProduct(null)
    setForm({ name: '', description: '', shortDescription: '', price: '', salePrice: '', stock: '', sku: '', categoryId: '', isFeatured: false, isNew: false, isActive: true })
    setPreviewImages([])
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditingProduct(p)
    setForm({
      name: p.name, description: p.description || '', shortDescription: p.shortDescription || '',
      price: p.price.toString(), salePrice: p.salePrice?.toString() || '', stock: p.stock.toString(),
      sku: p.sku || '', categoryId: p.categoryId.toString(), isFeatured: p.isFeatured, isNew: p.isNew, isActive: p.isActive,
    })
    setPreviewImages(p.imageUrls)
    setShowModal(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviewImages(urls)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
      if (fileInputRef.current?.files) {
        Array.from(fileInputRef.current.files).forEach((f) => fd.append('images', f))
      }
      let res
      if (editingProduct) {
        res = await adminService.updateProduct(editingProduct.id, fd)
      } else {
        res = await adminService.createProduct(fd)
      }
      if (res.success) {
        toast.success(editingProduct ? 'Cập nhật thành công!' : 'Tạo sản phẩm thành công!')
        setShowModal(false)
        fetchProducts()
      } else {
        toast.error(res.message || 'Thao tác thất bại')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Xóa sản phẩm "${name}"?`)) return
    const res = await adminService.deleteProduct(id)
    if (res.success) {
      toast.success('Đã xóa sản phẩm')
      fetchProducts()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý sản phẩm</h2>
          <p className="text-sm text-gray-500 mt-1">{total} sản phẩm</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={18} /> Thêm sản phẩm
        </button>
      </div>

      <div className="card mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm kiếm sản phẩm..." className="input-field pl-9" />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Đã bán', 'Trạng thái', 'Thao tác'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {p.mainImageUrl ? (
                          <img src={p.mainImageUrl} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                            <Image size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800 max-w-[200px] truncate">{p.name}</p>
                          {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{p.categoryName}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-primary-600">{formatCurrency(p.displayPrice)}</p>
                      {p.salePrice && p.salePrice < p.price && (
                        <p className="text-xs text-gray-400 line-through">{formatCurrency(p.price)}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${p.stock <= 5 ? 'bg-red-100 text-red-600' : p.stock <= 20 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{p.soldCount}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${p.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Đang bán' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-800">{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-field" placeholder="Tên sản phẩm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá gốc *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá khuyến mãi</label>
                  <input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} min="0" className="input-field" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho *</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required min="0" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input-field" placeholder="SP001" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required className="input-field">
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                <input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} className="input-field" placeholder="Mô tả ngắn hiển thị trên trang sản phẩm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả đầy đủ</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="input-field resize-none" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded" />
                  <span className="text-sm text-gray-700">Nổi bật</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isNew} onChange={(e) => setForm({ ...form, isNew: e.target.checked })} className="rounded" />
                  <span className="text-sm text-gray-700">Mới</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                  <span className="text-sm text-gray-700">Đang bán</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh</label>
                <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageChange} className="input-field" />
                {previewImages.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {previewImages.map((url, i) => (
                      <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-xl shrink-0" />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Đang lưu...' : editingProduct ? 'Cập nhật' : 'Tạo sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
