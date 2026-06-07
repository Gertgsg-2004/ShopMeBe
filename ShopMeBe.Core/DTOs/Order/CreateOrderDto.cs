using System.ComponentModel.DataAnnotations;
using ShopMeBe.Core.Enums;

namespace ShopMeBe.Core.DTOs.Order;

public class CreateOrderDto
{
    [Required]
    public string ReceiverName { get; set; } = string.Empty;

    [Required]
    public string ReceiverPhone { get; set; } = string.Empty;

    [Required]
    public string ShippingAddress { get; set; } = string.Empty;

    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.COD;
    public string? Note { get; set; }
    public string? CouponCode { get; set; }
}
