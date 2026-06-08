namespace ShopMeBe.Core.DTOs;

public class PosOrderDto
{
    public List<PosOrderItemDto> Items { get; set; } = new();
    public string? CouponCode { get; set; }
    public decimal Discount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public decimal CashReceived { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? Notes { get; set; }
}

public class PosOrderItemDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class PosReceiptDto
{
    public int OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? CustomerName { get; set; }
    public List<PosReceiptItemDto> Items { get; set; } = new();
    public decimal SubTotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public decimal CashReceived { get; set; }
    public decimal Change { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
}

public class PosReceiptItemDto
{
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Total { get; set; }
}
