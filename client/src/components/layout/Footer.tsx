import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Facebook, Youtube, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">M</div>
              <span className="text-xl font-bold text-white">ShopMeBe</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 mb-4">
              Cửa hàng mẹ và bé uy tín hàng đầu. Chuyên cung cấp đồ dùng cho bà bầu, trẻ sơ sinh và đồ chơi trẻ em chất lượng cao.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-gray-700 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors">
                <Facebook size={16} />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-700 hover:bg-red-500 rounded-lg flex items-center justify-center transition-colors">
                <Youtube size={16} />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-700 hover:bg-pink-500 rounded-lg flex items-center justify-center transition-colors">
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Danh mục sản phẩm</h4>
            <ul className="space-y-2 text-sm">
              {['Đồ bà bầu', 'Đồ sơ sinh', 'Đồ chơi', 'Sữa và thực phẩm', 'Phụ kiện'].map((item, i) => (
                <li key={i}>
                  <Link to={`/danh-muc/${item.toLowerCase().replace(/ /g, '-')}`}
                    className="hover:text-primary-400 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Thông tin</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-400 transition-colors">Về chúng tôi</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Chính sách giao hàng</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Chính sách đổi trả</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Điều khoản sử dụng</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="shrink-0 mt-0.5 text-primary-400" />
                <span>Số nahf 189,Mai Sơn,Sơn La
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-primary-400" />
                <a href="tel:0986844108" className="hover:text-primary-400 transition-colors">0986844108</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="shrink-0 text-primary-400" />
                <a href="mailto:T@gmail.com" className="hover:text-primary-400 transition-colors">hello@shopmebe.vn</a>
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Giờ làm việc: 7:30 - 19:00 (T2 - CN)</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-xs text-gray-500">
          <p>© 2026 ShopMeBeAnhTuyet. code by Gertgsg_2004.</p>
        </div>
      </div>
    </footer>
  )
}
