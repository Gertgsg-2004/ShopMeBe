using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.DTOs.Order;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Enums;
using ShopMeBe.Core.Interfaces;
using ShopMeBe.Infrastructure.Data;
using System.Security.Claims;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderRepository _orderRepo;
    private readonly ICartRepository _cartRepo;
    private readonly IProductRepository _productRepo;
    private readonly ICouponRepository _couponRepo;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;

    public OrdersController(
        IOrderRepository orderRepo,
        ICartRepository cartRepo,
        IProductRepository productRepo,
        ICouponRepository couponRepo,
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context)
    {
        _orderRepo = orderRepo;
        _cartRepo = cartRepo;
        _productRepo = productRepo;
        _couponRepo = couponRepo;
        _userManager = userManager;
        _context = context;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<ApiResponseDto<object>>> GetMyOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _orderRepo.GetOrdersAsync(UserId, page, pageSize);
        return Ok(ApiResponseDto<object>.Ok(result));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponseDto<OrderDto>>> GetById(int id)
    {
        var order = await _orderRepo.GetByIdAsync(id);
        if (order == null) return NotFound(ApiResponseDto<OrderDto>.Fail("Không tìm thấy đơn hàng"));
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin && order.UserId != UserId) return Forbid();
        return Ok(ApiResponseDto<OrderDto>.Ok(order));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponseDto<OrderDto>>> CreateOrder([FromBody] CreateOrderDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<OrderDto>.Fail("Dữ liệu không hợp lệ"));

        var cart = await _cartRepo.GetCartAsync(UserId);
        if (cart == null || !cart.Items.Any())
            return BadRequest(ApiResponseDto<OrderDto>.Fail("Giỏ hàng trống"));

        decimal subTotal = cart.Total;
        decimal discount = 0;
        string? couponCode = null;

        if (!string.IsNullOrEmpty(dto.CouponCode))
        {
            var (isValid, message, discountAmount) = await _couponRepo.ValidateAsync(dto.CouponCode, subTotal);
            if (!isValid)
                return BadRequest(ApiResponseDto<OrderDto>.Fail(message));
            discount = discountAmount;
            couponCode = dto.CouponCode.ToUpper();
        }

        var shipSettings = await _context.ShopSettings
            .Where(s => s.Key == "shipping_fee" || s.Key == "free_ship_threshold")
            .ToDictionaryAsync(s => s.Key, s => s.Value);
        decimal baseShippingFee = decimal.TryParse(shipSettings.GetValueOrDefault("shipping_fee"), out var f) ? f : 30000;
        decimal freeShipThreshold = decimal.TryParse(shipSettings.GetValueOrDefault("free_ship_threshold"), out var t) ? t : 500000;
        decimal shippingFee = subTotal >= freeShipThreshold ? 0 : baseShippingFee;
        decimal total = subTotal - discount + shippingFee;

        // Wallet payment: check balance
        if (dto.PaymentMethod == PaymentMethod.Wallet)
        {
            var user = await _userManager.FindByIdAsync(UserId);
            if (user == null) return BadRequest(ApiResponseDto<OrderDto>.Fail("Không tìm thấy người dùng"));
            if (user.WalletBalance < total)
                return BadRequest(ApiResponseDto<OrderDto>.Fail($"Số dư ví không đủ. Cần {total:N0}đ, hiện có {user.WalletBalance:N0}đ"));
        }

        var order = new Order
        {
            OrderCode = GenerateOrderCode(),
            UserId = UserId,
            ReceiverName = dto.ReceiverName,
            ReceiverPhone = dto.ReceiverPhone,
            ShippingAddress = dto.ShippingAddress,
            SubTotal = subTotal,
            ShippingFee = shippingFee,
            DiscountAmount = discount,
            Total = total,
            PaymentMethod = dto.PaymentMethod,
            Note = dto.Note,
            CouponCode = couponCode,
            Status = OrderStatus.Pending,
            PaymentStatus = dto.PaymentMethod == PaymentMethod.Wallet ? PaymentStatus.Paid : PaymentStatus.Unpaid
        };

        foreach (var item in cart.Items)
        {
            order.Items.Add(new OrderItem
            {
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                ProductImage = item.ProductImage,
                Price = item.Price,
                Quantity = item.Quantity
            });
        }

        // Wrap everything in a transaction to prevent double-spend / oversell
        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Lock & decrement stock atomically
            foreach (var item in cart.Items)
            {
                var product = await _context.Products
                    .FromSqlRaw("SELECT * FROM Products WITH (UPDLOCK) WHERE Id = {0}", item.ProductId)
                    .FirstOrDefaultAsync();
                if (product == null || product.Stock < item.Quantity)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(ApiResponseDto<OrderDto>.Fail($"Sản phẩm '{item.ProductName}' không đủ hàng trong kho"));
                }
                product.Stock -= item.Quantity;
            }

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Deduct wallet balance inside same transaction
            if (dto.PaymentMethod == PaymentMethod.Wallet)
            {
                var walletUser = await _context.Users
                    .FromSqlRaw("SELECT * FROM AspNetUsers WITH (UPDLOCK) WHERE Id = {0}", UserId)
                    .FirstOrDefaultAsync();
                if (walletUser == null || walletUser.WalletBalance < total)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(ApiResponseDto<OrderDto>.Fail("Số dư ví không đủ"));
                }
                var before = walletUser.WalletBalance;
                walletUser.WalletBalance -= total;
                _context.WalletTransactions.Add(new WalletTransaction
                {
                    UserId = UserId,
                    Amount = -total,
                    BalanceBefore = before,
                    BalanceAfter = walletUser.WalletBalance,
                    Type = "Purchase",
                    Reason = $"Thanh toán đơn hàng #{order.OrderCode}",
                    Reference = order.OrderCode
                });
                await _context.SaveChangesAsync();
            }

            // Increment coupon usage
            if (!string.IsNullOrEmpty(couponCode))
                await _couponRepo.IncrementUsageAsync(couponCode);

            await _cartRepo.ClearCartAsync(UserId);
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        var result = await _orderRepo.GetByIdAsync(order.Id);
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, ApiResponseDto<OrderDto>.Ok(result!, "Đặt hàng thành công"));
    }

    [AllowAnonymous]
    [HttpGet("lookup")]
    public async Task<ActionResult<ApiResponseDto<object>>> LookupOrder([FromQuery] string code, [FromQuery] string phone)
    {
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(phone))
            return BadRequest(ApiResponseDto<object>.Fail("Vui lòng nhập mã đơn hàng và số điện thoại"));

        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderCode == code.Trim().ToUpper() && o.ReceiverPhone == phone.Trim());
        if (order == null)
            return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy đơn hàng. Kiểm tra lại mã đơn và số điện thoại."));

        return Ok(ApiResponseDto<object>.Ok(new
        {
            order.OrderCode,
            order.ReceiverName,
            order.ShippingAddress,
            Status = (int)order.Status,
            PaymentStatus = (int)order.PaymentStatus,
            PaymentMethod = (int)order.PaymentMethod,
            order.SubTotal,
            order.ShippingFee,
            order.DiscountAmount,
            order.Total,
            order.CreatedAt,
            Items = order.Items.Select(i => new { i.ProductName, i.ProductImage, i.Price, i.Quantity })
        }));
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<ActionResult<ApiResponseDto<object>>> CancelOrder(int id)
    {
        var order = await _orderRepo.GetByIdAsync(id);
        if (order == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy đơn hàng"));
        if (order.UserId != UserId) return Forbid();
        if (order.Status != OrderStatus.Pending)
            return BadRequest(ApiResponseDto<object>.Fail("Chỉ có thể hủy đơn hàng đang chờ xác nhận"));

        await _orderRepo.UpdateStatusAsync(id, OrderStatus.Cancelled);
        return Ok(ApiResponseDto<object>.Ok(new { }, "Hủy đơn hàng thành công"));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<ActionResult<ApiResponseDto<object>>> GetAllOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _orderRepo.GetOrdersAsync(null, page, pageSize);
        return Ok(ApiResponseDto<object>.Ok(result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}/status")]
    public async Task<ActionResult<ApiResponseDto<object>>> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        if (await _orderRepo.GetByIdAsync(id) is null)
            return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy đơn hàng"));
        await _orderRepo.UpdateStatusAsync(id, dto.Status);
        return Ok(ApiResponseDto<object>.Ok(new { }, "Cập nhật trạng thái thành công"));
    }

    private static string GenerateOrderCode()
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
        var suffix = Random.Shared.Next(100, 999);
        return $"ORD{timestamp[^7..]}{suffix}";
    }
}

public class UpdateOrderStatusDto
{
    public OrderStatus Status { get; set; }
}
