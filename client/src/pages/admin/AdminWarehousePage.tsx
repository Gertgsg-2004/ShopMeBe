import { useState, useEffect } from 'react'
import { Search, Plus, AlertTriangle, Package, History, ClipboardList } from 'lucide-react'
import { adminService, StockItem, StockTransaction, InventoryCheck } from '../../services/adminService'
import { formatCurrency, formatDate } from '../../utils/format'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

type Tab = 'stock' | 'transactions' | 'inventory'

const transactionTypeLabels: Record<string, string> = { Import: 'Nhập', Export: 'Xuất', Adjustment: 'Điều chỉnh' }
const transactionTypeColors: Record<string, string> = {
  Import: 'bg-green-100 text-green-700',
  Export: 'bg-red-100 text-red-700',
  Adjustment: 'bg-blue-100 text-blue-700',
}

export default function AdminWarehousePage() {
  const [tab, setTab] = useState<Tab>('stock')

  // Stock tab
  const [stock, setStock] = useState<StockItem[]>([])
  const [loadingStock, setLoadingStock] = useState(true)
  const [stockSearch, setStockSearch] = useState('')
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null)
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustNotes, setAdjustNotes] = useState('')
  const [submittingAdjust, setSubmittingAdjust] = useState(false)

  // Transactions tab
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [txTotal, setTxTotal] = useState(0)
  const [txTotalPages, setTxTotalPages] = useState(0)
  const [txPage, setTxPage] = useState(1)
  const [txType, setTxType] = useState('')
  const [loadingTx, setLoadingTx] = useState(false)

  // Inventory check tab
  const [inventoryChecks, setInventoryChecks] = useState<InventoryCheck[]>([])
  const [loadingChecks, setLoadingChecks] = useState(false)
  const [showCheckModal, setShowCheckModal] = useState(false)
  const [checkNotes, setCheckNotes] = useState('')
  const [checkItems, setCheckItems] = useState([{ productId: '', productName: '', actualStock: '' }])
  const [submittingCheck, setSubmittingCheck] = useState(false)

  const fetchStock = async () => {
    setLoadingStock(true)
    try {
      const res = await adminService.getStock()
      if (res.data) setStock(res.data)
    } catch {
      toast.error('Không thể tải tồn kho')
    } finally {
      setLoadingStock(false)
    }
  }

  const fetchTransactions = async () => {
    setLoadingTx(true)
    try {
      const res = await adminService.getStockTransactions({ type: txType || undefined, page: txPage, pageSize: 20 })
      if (res.data) {
        setTransactions(res.data.items)
        setTxTotal(res.data.totalCount)
        setTxTotalPages(res.data.totalPages)
      }
    } catch {
      toast.error('Không thể tải lịch sử')
    } finally {
      setLoadingTx(false)
    }
  }

  const fetchInventoryChecks = async () => {
    setLoadingChecks(true)
    try {
      const res = await adminService.getInventoryChecks()
      if (res.data) setInventoryChecks(res.data)
    } catch {
      toast.error('Không thể tải danh sách kiểm kê')
    } finally {
      setLoadingChecks(false)
    }
  }

  useEffect(() => { fetchStock() }, [])
  useEffect(() => { if (tab === 'transactions') fetchTransactions() }, [tab, txPage, txType])
  useEffect(() => { if (tab === 'inventory') fetchInventoryChecks() }, [tab])

  const openAdjust = (item: StockItem) => {
    setAdjustItem(item)
    setAdjustQty(item.currentStock.toString())
    setAdjustNotes('')
    setShowAdjustModal(true)
  }

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustItem) return
    setSubmittingAdjust(true)
    try {
      const res = await adminService.adjustStock(adjustItem.productId, Number(adjustQty), adjustNotes)
      if (res.success) {
        toast.success('Điều chỉnh tồn kho thành công!')
        setShowAdjustModal(false)
        fetchStock()
      } else {
        toast.error(res.message || 'Thất bại')
      }
    } catch {
      toast.error('Có lỗi xảy ra')
    } finally {
      setSubmittingAdjust(false)
    }
  }

  const addCheckItem = () => {
    setCheckItems(prev => [...prev, { productId: '', productName: '', actualStock: '' }])
  }

  const removeCheckItem = (i: number) => {
    setCheckItems(prev => prev.filter((_, idx) => idx !== i))
  }

  const updateCheckItem = (i: number, field: string, val: string) => {
    setCheckItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }

  const handleSubmitCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    const items = checkItems.filter(it => it.productId && it.actualStock !== '')
    if (items.length === 0) { toast.error('Vui lòng thêm ít nhất 1 sản phẩm'); return }
    setSubmittingCheck(true)
    try {
      const res = await adminService.createInventoryCheck(
        items.map(it => ({ productId: Number(it.productId), actualStock: Number(it.actualStock) })),
        checkNotes
      )
      if (res.success) {
        toast.success('Tạo phiếu kiểm kê thành công!')
        setShowCheckModal(false)
        fetchInventoryChecks()
      } else {
        toast.error(res.message || 'Thất bại')
      }
    } catch {
      toast.error('Có lỗi xảy ra')
    } finally {
      setSubmittingCheck(false)
    }
  }

  const handleCompleteCheck = async (id: number) => {
    if (!confirm('Hoàn thành kiểm kê và áp dụng điều chỉnh tồn kho?')) return
    try {
      const res = await adminService.completeInventoryCheck(id)
      if (res.success) {
        toast.success('Hoàn thành kiểm kê!')
        fetchInventoryChecks()
        fetchStock()
      } else {
        toast.error(res.message || 'Thất bại')
      }
    } catch {
      toast.error('Có lỗi xảy ra')
    }
  }

  const filteredStock = stock.filter(s =>
    s.productName.toLowerCase().includes(stockSearch.toLowerCase()) ||
    (s.sku || '').toLowerCase().includes(stockSearch.toLowerCase())
  )

  const totalStockValue = stock.reduce((sum, s) => sum + s.stockValue, 0)

  const tabs = [
    { key: 'stock' as Tab, label: 'Tồn kho', icon: Package },
    { key: 'transactions' as Tab, label: 'Lịch sử', icon: History },
    { key: 'inventory' as Tab, label: 'Kiểm kê', icon: ClipboardList },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý kho hàng</h2>
          <p className="text-sm text-gray-500 mt-1">Tổng giá trị tồn kho: <span className="font-semibold text-gray-700">{formatCurrency(totalStockValue)}</span></p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Stock */}
      {tab === 'stock' && (
        <>
          <div className="card mb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={stockSearch} onChange={e => setStockSearch(e.target.value)}
                placeholder="Tìm theo tên sản phẩm, SKU..." className="input-field pl-9" />
            </div>
          </div>

          {loadingStock ? <LoadingSpinner /> : (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Sản phẩm', 'SKU', 'Tồn kho', 'Giá bán', 'Giá vốn', 'Giá trị kho', 'Thao tác'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredStock.length === 0 && (
                      <tr><td colSpan={7} className="py-12 text-center text-gray-400">Không tìm thấy sản phẩm</td></tr>
                    )}
                    {filteredStock.map(item => {
                      const stockColor = item.currentStock < 5
                        ? 'bg-red-100 text-red-700'
                        : item.currentStock < 20
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      return (
                        <tr key={item.productId} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {item.mainImageUrl ? (
                                <img src={item.mainImageUrl} alt={item.productName} className="w-9 h-9 rounded-lg object-cover" />
                              ) : (
                                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Package size={14} className="text-gray-400" />
                                </div>
                              )}
                              <p className="font-medium text-gray-800 max-w-[180px] truncate">{item.productName}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-500 font-mono text-xs">{item.sku || '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`badge ${stockColor}`}>{item.currentStock}</span>
                              {item.currentStock < 5 && <AlertTriangle size={14} className="text-red-500" />}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-primary-600 font-medium">{formatCurrency(item.price)}</td>
                          <td className="py-3 px-4 text-gray-600">{item.costPrice > 0 ? formatCurrency(item.costPrice) : '—'}</td>
                          <td className="py-3 px-4 font-medium text-gray-700">{formatCurrency(item.stockValue)}</td>
                          <td className="py-3 px-4">
                            <button onClick={() => openAdjust(item)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors">
                              Điều chỉnh
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab 2: Transactions */}
      {tab === 'transactions' && (
        <>
          <div className="card mb-4">
            <div className="flex gap-3">
              <select value={txType} onChange={e => { setTxType(e.target.value); setTxPage(1) }} className="input-field w-48">
                <option value="">Tất cả loại</option>
                <option value="Import">Nhập kho</option>
                <option value="Export">Xuất kho</option>
                <option value="Adjustment">Điều chỉnh</option>
              </select>
              <p className="text-sm text-gray-500 self-center">{txTotal} giao dịch</p>
            </div>
          </div>

          {loadingTx ? <LoadingSpinner /> : (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Thời gian', 'Sản phẩm', 'Loại', 'Số lượng', 'Trước', 'Sau', 'Tham chiếu', 'Ghi chú'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.length === 0 && (
                      <tr><td colSpan={8} className="py-12 text-center text-gray-400">Không có dữ liệu</td></tr>
                    )}
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-800 max-w-[160px] truncate">{tx.productName}</p>
                          {tx.sku && <p className="text-xs text-gray-400">SKU: {tx.sku}</p>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`badge text-xs ${transactionTypeColors[tx.type] || 'bg-gray-100 text-gray-600'}`}>
                            {transactionTypeLabels[tx.type] || tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          <span className={tx.type === 'Import' ? 'text-green-600' : tx.type === 'Export' ? 'text-red-600' : 'text-blue-600'}>
                            {tx.type === 'Import' ? '+' : tx.type === 'Export' ? '-' : '±'}{Math.abs(tx.quantity)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">{tx.stockBefore}</td>
                        <td className="py-3 px-4 text-gray-700 font-medium">{tx.stockAfter}</td>
                        <td className="py-3 px-4 text-gray-500 text-xs">{tx.reference || '—'}</td>
                        <td className="py-3 px-4 text-gray-500 text-xs max-w-[120px] truncate">{tx.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {txTotalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: txTotalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setTxPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${txPage === p ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab 3: Inventory Check */}
      {tab === 'inventory' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setShowCheckModal(true); setCheckItems([{ productId: '', productName: '', actualStock: '' }]); setCheckNotes('') }} className="btn-primary">
              <Plus size={18} /> Tạo phiếu kiểm kê
            </button>
          </div>

          {loadingChecks ? <LoadingSpinner /> : (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Mã phiếu', 'Ngày tạo', 'Trạng thái', 'Số SP kiểm', 'Ghi chú', 'Thao tác'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {inventoryChecks.length === 0 && (
                      <tr><td colSpan={6} className="py-12 text-center text-gray-400">Chưa có phiếu kiểm kê nào</td></tr>
                    )}
                    {inventoryChecks.map(check => (
                      <tr key={check.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-primary-600">#{check.checkCode}</td>
                        <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(check.createdAt)}</td>
                        <td className="py-3 px-4">
                          <span className={`badge ${check.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {check.status === 'Completed' ? 'Hoàn thành' : 'Nháp'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{check.items.length} sản phẩm</td>
                        <td className="py-3 px-4 text-gray-500 max-w-[160px] truncate">{check.notes || '—'}</td>
                        <td className="py-3 px-4">
                          {check.status === 'Draft' && (
                            <button onClick={() => handleCompleteCheck(check.id)} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors">
                              Hoàn thành
                            </button>
                          )}
                          {check.status === 'Completed' && check.completedAt && (
                            <span className="text-xs text-gray-400">{formatDate(check.completedAt)}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && adjustItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Điều chỉnh tồn kho</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleAdjust} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-800">{adjustItem.productName}</p>
                <p className="text-xs text-gray-500">Tồn kho hiện tại: <span className="font-medium">{adjustItem.currentStock}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng mới *</label>
                <input type="number" min="0" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} required className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do điều chỉnh *</label>
                <textarea value={adjustNotes} onChange={e => setAdjustNotes(e.target.value)} required rows={3} className="input-field resize-none" placeholder="Nhập lý do điều chỉnh..." />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowAdjustModal(false)} className="btn-secondary">Hủy</button>
                <button type="submit" disabled={submittingAdjust} className="btn-primary">
                  {submittingAdjust ? 'Đang lưu...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Check Modal */}
      {showCheckModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-800">Tạo phiếu kiểm kê</h3>
              <button onClick={() => setShowCheckModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmitCheck} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea value={checkNotes} onChange={e => setCheckNotes(e.target.value)} rows={2} className="input-field resize-none" placeholder="Ghi chú kiểm kê..." />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Danh sách sản phẩm kiểm kê</label>
                  <button type="button" onClick={addCheckItem} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                    <Plus size={14} /> Thêm dòng
                  </button>
                </div>
                <div className="space-y-2">
                  {checkItems.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input className="input-field col-span-2" placeholder="ID SP" type="number" min="1"
                        value={item.productId} onChange={e => updateCheckItem(i, 'productId', e.target.value)} />
                      <input className="input-field col-span-6" placeholder="Tên sản phẩm"
                        value={item.productName} onChange={e => updateCheckItem(i, 'productName', e.target.value)} />
                      <input className="input-field col-span-3" placeholder="SL thực tế" type="number" min="0"
                        value={item.actualStock} onChange={e => updateCheckItem(i, 'actualStock', e.target.value)} />
                      <button type="button" onClick={() => removeCheckItem(i)} className="col-span-1 text-red-400 hover:text-red-600 p-1 flex justify-center">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowCheckModal(false)} className="btn-secondary">Hủy</button>
                <button type="submit" disabled={submittingCheck} className="btn-primary">
                  {submittingCheck ? 'Đang tạo...' : 'Tạo phiếu kiểm kê'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
