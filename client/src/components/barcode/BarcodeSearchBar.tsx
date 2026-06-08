import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ScanLine, X } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';

interface BarcodeSearchBarProps {
  placeholder?: string;
  className?: string;
}

export default function BarcodeSearchBar({ placeholder = 'Tìm kiếm hoặc quét mã vạch...', className = '' }: BarcodeSearchBarProps) {
  const [query, setQuery] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSearch = (value: string) => {
    const q = value.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch(query);
  };

  const handleScan = useCallback((code: string) => {
    setShowCamera(false);
    setQuery(code);
    // Tìm theo mã vạch — nếu trùng SKU sản phẩm sẽ tìm thấy ngay
    navigate(`/search?q=${encodeURIComponent(code)}&barcode=1`);
  }, [navigate]);

  return (
    <>
      <div className={`flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all ${className}`}>
        <Search size={18} className="text-gray-400 flex-shrink-0" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
        />

        {query && (
          <button onClick={() => setQuery('')} className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400">
            <X size={15} />
          </button>
        )}

        {/* Nút quét camera */}
        <button
          onClick={() => setShowCamera(true)}
          title="Quét mã vạch bằng camera"
          className="flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-xs font-medium flex-shrink-0"
        >
          <ScanLine size={16} />
          <span className="hidden sm:inline">Quét</span>
        </button>

        <button
          onClick={() => handleSearch(query)}
          className="px-3 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-xs font-medium transition-colors flex-shrink-0"
        >
          Tìm
        </button>
      </div>

      {/* Hướng dẫn máy quét USB */}
      <p className="text-xs text-gray-400 mt-1 text-center">
        💡 Máy quét USB: bấm vào ô tìm kiếm rồi quét trực tiếp
      </p>

      {showCamera && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
}
