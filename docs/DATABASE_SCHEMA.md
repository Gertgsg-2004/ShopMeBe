# ShopMeBe - Database Schema

## ERD Overview

### Bảng AspNetUsers (ApplicationUser)
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| Id | nvarchar(450) | PK | ID người dùng |
| FullName | nvarchar(max) | NOT NULL | Họ tên |
| Avatar | nvarchar(max) | NULL | URL ảnh đại diện |
| Address | nvarchar(max) | NULL | Địa chỉ |
| Phone | nvarchar(max) | NULL | Số điện thoại |
| DateOfBirth | datetime2 | NULL | Ngày sinh |
| IsActive | bit | NOT NULL, DEFAULT 1 | Trạng thái tài khoản |
| CreatedAt | datetime2 | NOT NULL | Ngày tạo |
| Email | nvarchar(256) | UNIQUE | Email |
| UserName | nvarchar(256) | UNIQUE | Tên đăng nhập |

### Bảng Categories
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| Id | int | PK, IDENTITY | ID danh mục |
| Name | nvarchar(200) | NOT NULL | Tên danh mục |
| Slug | nvarchar(200) | NOT NULL, UNIQUE | Đường dẫn SEO |
| Description | nvarchar(max) | NULL | Mô tả |
| ImageUrl | nvarchar(max) | NULL | Ảnh danh mục |
| ParentId | int | NULL, FK | ID danh mục cha |
| SortOrder | int | NOT NULL, DEFAULT 0 | Thứ tự hiển thị |
| IsActive | bit | NOT NULL, DEFAULT 1 | Trạng thái |
| CreatedAt | datetime2 | NOT NULL | Ngày tạo |

### Bảng Products
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| Id | int | PK, IDENTITY | ID sản phẩm |
| Name | nvarchar(500) | NOT NULL | Tên sản phẩm |
| Slug | nvarchar(500) | NOT NULL, UNIQUE | Đường dẫn SEO |
| Description | nvarchar(max) | NULL | Mô tả đầy đủ |
| ShortDescription | nvarchar(max) | NULL | Mô tả ngắn |
| Price | decimal(18,2) | NOT NULL | Giá gốc |
| SalePrice | decimal(18,2) | NULL | Giá khuyến mãi |
| Stock | int | NOT NULL, DEFAULT 0 | Tồn kho |
| Sku | nvarchar(max) | NULL | Mã SKU |
| CategoryId | int | NOT NULL, FK | ID danh mục |
| IsFeatured | bit | NOT NULL, DEFAULT 0 | Sản phẩm nổi bật |
| IsNew | bit | NOT NULL, DEFAULT 0 | Sản phẩm mới |
| IsActive | bit | NOT NULL, DEFAULT 1 | Trạng thái |
| SoldCount | int | NOT NULL, DEFAULT 0 | Số lượng đã bán |
| AverageRating | float | NOT NULL, DEFAULT 0 | Đánh giá trung bình |
| ReviewCount | int | NOT NULL, DEFAULT 0 | Số lượng đánh giá |
| CreatedAt | datetime2 | NOT NULL | Ngày tạo |
| UpdatedAt | datetime2 | NOT NULL | Ngày cập nhật |

### Bảng ProductImages
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| Id | int | PK, IDENTITY | ID ảnh |
| ProductId | int | NOT NULL, FK | ID sản phẩm |
| ImageUrl | nvarchar(max) | NOT NULL | URL ảnh |
| IsMain | bit | NOT NULL, DEFAULT 0 | Ảnh chính |
| SortOrder | int | NOT NULL, DEFAULT 0 | Thứ tự |

### Bảng Reviews
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| Id | int | PK, IDENTITY | ID đánh giá |
| ProductId | int | NOT NULL, FK | ID sản phẩm |
| UserId | nvarchar(450) | NOT NULL, FK | ID người dùng |
| Rating | int | NOT NULL | Điểm đánh giá (1-5) |
| Comment | nvarchar(max) | NULL | Nội dung đánh giá |
| IsApproved | bit | NOT NULL, DEFAULT 1 | Đã duyệt |
| CreatedAt | datetime2 | NOT NULL | Ngày tạo |

### Bảng Carts
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| Id | int | PK, IDENTITY | ID giỏ hàng |
| UserId | nvarchar(450) | NOT NULL, FK, UNIQUE | ID người dùng |
| UpdatedAt | datetime2 | NOT NULL | Ngày cập nhật |

### Bảng CartItems
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| Id | int | PK, IDENTITY | ID mục giỏ hàng |
| CartId | int | NOT NULL, FK | ID giỏ hàng |
| ProductId | int | NOT NULL, FK | ID sản phẩm |
| Quantity | int | NOT NULL, DEFAULT 1 | Số lượng |
| Price | decimal(18,2) | NOT NULL | Giá tại thời điểm thêm |

### Bảng Orders
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| Id | int | PK, IDENTITY | ID đơn hàng |
| OrderCode | nvarchar(50) | NOT NULL, UNIQUE | Mã đơn hàng |
| UserId | nvarchar(450) | NOT NULL, FK | ID người dùng |
| ReceiverName | nvarchar(max) | NOT NULL | Tên người nhận |
| ReceiverPhone | nvarchar(max) | NOT NULL | SĐT người nhận |
| ShippingAddress | nvarchar(max) | NOT NULL | Địa chỉ giao hàng |
| SubTotal | decimal(18,2) | NOT NULL | Tạm tính |
| ShippingFee | decimal(18,2) | NOT NULL, DEFAULT 0 | Phí vận chuyển |
| DiscountAmount | decimal(18,2) | NOT NULL, DEFAULT 0 | Số tiền giảm giá |
| Total | decimal(18,2) | NOT NULL | Tổng cộng |
| Status | int | NOT NULL, DEFAULT 0 | Trạng thái đơn hàng |
| PaymentMethod | int | NOT NULL, DEFAULT 0 | Phương thức thanh toán |
| PaymentStatus | int | NOT NULL, DEFAULT 0 | Trạng thái thanh toán |
| Note | nvarchar(max) | NULL | Ghi chú |
| CouponCode | nvarchar(max) | NULL | Mã giảm giá đã dùng |
| CreatedAt | datetime2 | NOT NULL | Ngày tạo |
| UpdatedAt | datetime2 | NOT NULL | Ngày cập nhật |

### Bảng OrderItems
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| Id | int | PK, IDENTITY | ID mục đơn hàng |
| OrderId | int | NOT NULL, FK | ID đơn hàng |
| ProductId | int | NOT NULL, FK | ID sản phẩm |
| ProductName | nvarchar(max) | NOT NULL | Tên SP (snapshot) |
| ProductImage | nvarchar(max) | NULL | Ảnh SP (snapshot) |
| Price | decimal(18,2) | NOT NULL | Giá tại thời điểm mua |
| Quantity | int | NOT NULL | Số lượng |

### Bảng Coupons
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| Id | int | PK, IDENTITY | ID mã giảm giá |
| Code | nvarchar(50) | NOT NULL, UNIQUE | Mã coupon |
| Description | nvarchar(max) | NULL | Mô tả |
| IsPercent | bit | NOT NULL | Giảm theo % hay số tiền |
| Value | decimal(18,2) | NOT NULL | Giá trị giảm |
| MinOrderAmount | decimal(18,2) | NULL | Đơn hàng tối thiểu |
| MaxDiscount | decimal(18,2) | NULL | Giảm tối đa |
| UsageLimit | int | NULL | Giới hạn sử dụng |
| UsedCount | int | NOT NULL, DEFAULT 0 | Số lần đã dùng |
| StartDate | datetime2 | NULL | Ngày bắt đầu |
| EndDate | datetime2 | NULL | Ngày kết thúc |
| IsActive | bit | NOT NULL, DEFAULT 1 | Trạng thái |
| CreatedAt | datetime2 | NOT NULL | Ngày tạo |

## Quan hệ bảng
- Categories (self-reference): ParentId → Categories.Id
- Products.CategoryId → Categories.Id
- ProductImages.ProductId → Products.Id (CASCADE DELETE)
- Reviews.ProductId → Products.Id (CASCADE DELETE)
- Reviews.UserId → AspNetUsers.Id
- Carts.UserId → AspNetUsers.Id (CASCADE DELETE, 1-1)
- CartItems.CartId → Carts.Id (CASCADE DELETE)
- CartItems.ProductId → Products.Id
- Orders.UserId → AspNetUsers.Id
- OrderItems.OrderId → Orders.Id (CASCADE DELETE)
- OrderItems.ProductId → Products.Id
- FlashSaleItems.FlashSaleId → FlashSales.Id (CASCADE DELETE)
- FlashSaleItems.ProductId → Products.Id

## Enum Values

### OrderStatus
- 0: Pending (Chờ xác nhận)
- 1: Confirmed (Đã xác nhận)
- 2: Shipping (Đang giao hàng)
- 3: Completed (Hoàn thành)
- 4: Cancelled (Đã hủy)

### PaymentMethod
- 0: COD (Tiền mặt khi nhận)
- 1: BankTransfer (Chuyển khoản)
- 2: EWallet (Ví điện tử)

### PaymentStatus
- 0: Unpaid (Chưa thanh toán)
- 1: Paid (Đã thanh toán)
- 2: Refunded (Đã hoàn tiền)
