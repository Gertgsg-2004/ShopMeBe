using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.DTOs.Order;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Enums;
using ShopMeBe.Core.Interfaces;
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

    public OrdersController(
        IOrderRepository orderRepo,
        ICartRepository cartRepo,
        IProductRepository productRepo,
        ICouponRepository couponRepo)
    {
        _orderRepo = orderRepo;
        _cartRepo = cartRepo;
        _productRepo = productRepo;
        _couponRepo = couponRepo;
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

        decimal shippingFee = subTotal >= 500000 ? 0 : 30000;
        decimal total = subTotal - discount + shippingFee;

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
            PaymentStatus = PaymentStatus.Unpaid
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

        var created = await _orderRepo.CreateAsync(order);

        foreach (var item in cart.Items)
            await _productRepo.UpdateStockAsync(item.ProductId, item.Quantity);

        await _cartRepo.ClearCartAsync(UserId);

        var result = await _orderRepo.GetByIdAsync(created.Id);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponseDto<OrderDto>.Ok(result!, "Đặt hàng thành công"));
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<ActionResult<ApiResponseDto<object>>> CancelOrder(int id)
    {
        var order = await _orderRepo.GetByIdAsync(id);
        if (order == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy đơn hàng"));
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
        if (!await _orderRepo.GetByIdAsync(id) is null == false)
        {
            await _orderRepo.UpdateStatusAsync(id, dto.Status);
        }
        return Ok(ApiResponseDto<object>.Ok(new { }, "Cập nhật trạng thái thành công"));
    }

    private static string GenerateOrderCode()
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        return $"ORD{timestamp[^6..]}";
    }
}

public class UpdateOrderStatusDto
{
    public OrderStatus Status { get; set; }
}
