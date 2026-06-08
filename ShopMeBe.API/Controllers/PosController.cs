using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Enums;
using ShopMeBe.Infrastructure.Data;
using System.Security.Claims;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/pos")]
[Authorize(Roles = "Admin")]
public class PosController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PosController(ApplicationDbContext db)
    {
        _db = db;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpPost("order")]
    public async Task<ActionResult<ApiResponseDto<PosReceiptDto>>> CreatePosOrder([FromBody] PosOrderDto dto)
    {
        if (!dto.Items.Any())
            return BadRequest(ApiResponseDto<PosReceiptDto>.Fail("Không có sản phẩm trong đơn hàng"));

        decimal subTotal = 0;
        var receiptItems = new List<PosReceiptItemDto>();
        var orderItems = new List<OrderItem>();

        foreach (var item in dto.Items)
        {
            var product = await _db.Products.FindAsync(item.ProductId);
            if (product == null)
                return BadRequest(ApiResponseDto<PosReceiptDto>.Fail($"Sản phẩm ID {item.ProductId} không tồn tại"));
            if (product.Stock < item.Quantity)
                return BadRequest(ApiResponseDto<PosReceiptDto>.Fail($"Sản phẩm '{product.Name}' không đủ tồn kho (còn {product.Stock})"));

            var lineTotal = item.UnitPrice * item.Quantity;
            subTotal += lineTotal;

            orderItems.Add(new OrderItem
            {
                ProductId = item.ProductId,
                ProductName = product.Name,
                ProductImage = null,
                Price = item.UnitPrice,
                Quantity = item.Quantity
            });

            receiptItems.Add(new PosReceiptItemDto
            {
                ProductName = product.Name,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Total = lineTotal
            });
        }

        var discount = dto.Discount;
        var total = subTotal - discount;
        var change = dto.CashReceived - total;

        var order = new Order
        {
            OrderCode = GeneratePosOrderCode(),
            UserId = UserId,
            ReceiverName = dto.CustomerName ?? "Khách lẻ",
            ReceiverPhone = dto.CustomerPhone ?? "",
            ShippingAddress = "Tại quầy",
            SubTotal = subTotal,
            ShippingFee = 0,
            DiscountAmount = discount,
            Total = total,
            PaymentMethod = dto.PaymentMethod == "Cash" ? PaymentMethod.COD : PaymentMethod.EWallet,
            PaymentStatus = PaymentStatus.Paid,
            Status = OrderStatus.Completed,
            Note = dto.Notes,
            CouponCode = dto.CouponCode
        };

        foreach (var oi in orderItems)
            order.Items.Add(oi);

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        // Deduct stock
        foreach (var item in dto.Items)
        {
            var product = await _db.Products.FindAsync(item.ProductId);
            if (product == null) continue;
            var before = product.Stock;
            product.Stock -= item.Quantity;
            if (product.Stock < 0) product.Stock = 0;
            product.SoldCount += item.Quantity;
            product.UpdatedAt = DateTime.UtcNow;

            _db.StockTransactions.Add(new StockTransaction
            {
                ProductId = item.ProductId,
                Type = StockTransactionType.SaleDeduction,
                Quantity = item.Quantity,
                StockBefore = before,
                StockAfter = product.Stock,
                Reference = order.OrderCode,
                Notes = $"Bán POS đơn {order.OrderCode}",
                CreatedById = UserId
            });
        }

        await _db.SaveChangesAsync();

        var receipt = new PosReceiptDto
        {
            OrderId = order.Id,
            OrderCode = order.OrderCode,
            CreatedAt = order.CreatedAt,
            CustomerName = dto.CustomerName,
            Items = receiptItems,
            SubTotal = subTotal,
            Discount = discount,
            Total = total,
            CashReceived = dto.CashReceived,
            Change = change,
            PaymentMethod = dto.PaymentMethod
        };

        return Ok(ApiResponseDto<PosReceiptDto>.Ok(receipt, "Tạo đơn hàng POS thành công"));
    }

    [HttpGet("products")]
    public async Task<ActionResult<ApiResponseDto<object>>> SearchProducts([FromQuery] string? q)
    {
        var query = _db.Products.Include(p => p.Images).Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(p => p.Name.Contains(q) || (p.Sku != null && p.Sku.Contains(q)));

        var items = await query
            .OrderBy(p => p.Name)
            .Take(50)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Sku,
                p.Price,
                p.SalePrice,
                p.Stock,
                MainImage = p.Images.Where(i => i.IsMain).Select(i => i.ImageUrl).FirstOrDefault()
                            ?? p.Images.Select(i => i.ImageUrl).FirstOrDefault()
            })
            .ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(items));
    }

    private static string GeneratePosOrderCode()
    {
        var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
        return $"POS{ts[^8..]}";
    }
}
