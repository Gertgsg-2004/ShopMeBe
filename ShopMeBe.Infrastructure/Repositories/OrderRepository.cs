using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.DTOs.Order;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Enums;
using ShopMeBe.Core.Interfaces;
using ShopMeBe.Infrastructure.Data;

namespace ShopMeBe.Infrastructure.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly ApplicationDbContext _context;

    public OrderRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    private static string GetStatusText(OrderStatus status) => status switch
    {
        OrderStatus.Pending => "Chờ xác nhận",
        OrderStatus.Confirmed => "Đã xác nhận",
        OrderStatus.Shipping => "Đang giao hàng",
        OrderStatus.Completed => "Hoàn thành",
        OrderStatus.Cancelled => "Đã hủy",
        _ => "Không xác định"
    };

    private static string GetPaymentText(PaymentMethod method) => method switch
    {
        PaymentMethod.COD => "Tiền mặt khi nhận hàng",
        PaymentMethod.BankTransfer => "Chuyển khoản ngân hàng",
        PaymentMethod.EWallet => "Ví điện tử",
        _ => "Không xác định"
    };

    private static OrderDto MapToDto(Order o) => new()
    {
        Id = o.Id,
        UserId = o.UserId,
        OrderCode = o.OrderCode,
        ReceiverName = o.ReceiverName,
        ReceiverPhone = o.ReceiverPhone,
        ShippingAddress = o.ShippingAddress,
        SubTotal = o.SubTotal,
        ShippingFee = o.ShippingFee,
        DiscountAmount = o.DiscountAmount,
        Total = o.Total,
        Status = o.Status,
        StatusText = GetStatusText(o.Status),
        PaymentMethod = o.PaymentMethod,
        PaymentMethodText = GetPaymentText(o.PaymentMethod),
        PaymentStatus = o.PaymentStatus,
        Note = o.Note,
        CouponCode = o.CouponCode,
        CreatedAt = o.CreatedAt,
        Items = o.Items.Select(i => new OrderItemDto
        {
            Id = i.Id,
            ProductId = i.ProductId,
            ProductName = i.ProductName,
            ProductImage = i.ProductImage,
            Price = i.Price,
            Quantity = i.Quantity,
            SubTotal = i.Price * i.Quantity
        }).ToList()
    };

    public async Task<PagedResultDto<OrderDto>> GetOrdersAsync(string? userId, int page, int pageSize)
    {
        var query = _context.Orders.Include(o => o.Items).AsQueryable();

        if (!string.IsNullOrEmpty(userId))
            query = query.Where(o => o.UserId == userId);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResultDto<OrderDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<OrderDto?> GetByIdAsync(int id)
    {
        var o = await _context.Orders.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id);
        return o == null ? null : MapToDto(o);
    }

    public async Task<OrderDto?> GetByCodeAsync(string code)
    {
        var o = await _context.Orders.Include(x => x.Items).FirstOrDefaultAsync(x => x.OrderCode == code);
        return o == null ? null : MapToDto(o);
    }

    public async Task<Order> CreateAsync(Order order)
    {
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();
        return order;
    }

    public async Task UpdateStatusAsync(int id, OrderStatus status)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order != null)
        {
            order.Status = status;
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task UpdatePaymentStatusAsync(int id, PaymentStatus status)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order != null)
        {
            order.PaymentStatus = status;
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}
