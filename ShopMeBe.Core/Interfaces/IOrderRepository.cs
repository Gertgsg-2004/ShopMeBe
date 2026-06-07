using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.DTOs.Order;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Enums;

namespace ShopMeBe.Core.Interfaces;

public interface IOrderRepository
{
    Task<PagedResultDto<OrderDto>> GetOrdersAsync(string? userId, int page, int pageSize);
    Task<OrderDto?> GetByIdAsync(int id);
    Task<OrderDto?> GetByCodeAsync(string code);
    Task<Order> CreateAsync(Order order);
    Task UpdateStatusAsync(int id, OrderStatus status);
    Task UpdatePaymentStatusAsync(int id, PaymentStatus status);
}
