using ShopMeBe.Core.Enums;

namespace ShopMeBe.Core.Entities;

public class Order
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;
    public string ShippingAddress { get; set; } = string.Empty;
    public decimal SubTotal { get; set; }
    public decimal ShippingFee { get; set; } = 0;
    public decimal DiscountAmount { get; set; } = 0;
    public decimal Total { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.COD;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;
    public string? Note { get; set; }
    public string? CouponCode { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int? PosSessionId { get; set; }
    public PosSession? PosSession { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
