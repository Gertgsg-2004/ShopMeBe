using ShopMeBe.Core.Enums;

namespace ShopMeBe.Core.Entities;

public class StockTransaction
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public StockTransactionType Type { get; set; }
    public int Quantity { get; set; }
    public int StockBefore { get; set; }
    public int StockAfter { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public string? CreatedById { get; set; }
    public int? PurchaseOrderId { get; set; }
    public PurchaseOrder? PurchaseOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
