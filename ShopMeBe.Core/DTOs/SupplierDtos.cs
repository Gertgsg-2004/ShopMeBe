namespace ShopMeBe.Core.DTOs;

public class SupplierDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? TaxCode { get; set; }
    public string? ContactPerson { get; set; }
    public decimal TotalDebt { get; set; }
    public bool IsActive { get; set; }
    public int TotalOrders { get; set; }
}

public class CreateSupplierDto
{
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? TaxCode { get; set; }
    public string? ContactPerson { get; set; }
}

public class CreatePurchaseOrderDto
{
    public int SupplierId { get; set; }
    public string? Notes { get; set; }
    public List<PurchaseOrderItemDto> Items { get; set; } = new();
}

public class PurchaseOrderItemDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
}

public class PurchaseOrderDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public int SupplierId { get; set; }
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal DebtAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public List<PurchaseOrderItemDetailDto> Items { get; set; } = new();
}

public class PurchaseOrderItemDetailDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Sku { get; set; }
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal Total { get; set; }
}
