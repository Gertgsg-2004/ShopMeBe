using ShopMeBe.Core.Enums;

namespace ShopMeBe.Core.Entities;

public class PurchaseOrder
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public int SupplierId { get; set; }
    public Supplier Supplier { get; set; } = null!;
    public string? CreatedById { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal DebtAmount => TotalAmount - PaidAmount;
    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
    public ICollection<StockTransaction> StockTransactions { get; set; } = new List<StockTransaction>();
}
