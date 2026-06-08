namespace ShopMeBe.Core.DTOs;

public class StockTransactionDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Sku { get; set; }
    public string Type { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int StockBefore { get; set; }
    public int StockAfter { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdjustStockDto
{
    public int ProductId { get; set; }
    public int NewStock { get; set; }
    public string? Notes { get; set; }
}

public class CreateInventoryCheckDto
{
    public string? Notes { get; set; }
    public List<InventoryCheckItemDto> Items { get; set; } = new();
}

public class InventoryCheckItemDto
{
    public int ProductId { get; set; }
    public int ActualStock { get; set; }
}

public class InventoryCheckDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public DateTime CheckDate { get; set; }
    public string? Notes { get; set; }
    public bool IsCompleted { get; set; }
    public List<InventoryCheckItemDetailDto> Items { get; set; } = new();
}

public class InventoryCheckItemDetailDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Sku { get; set; }
    public int SystemStock { get; set; }
    public int ActualStock { get; set; }
    public int Difference { get; set; }
}

public class StockSummaryDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Sku { get; set; }
    public int CurrentStock { get; set; }
    public decimal Price { get; set; }
    public string? MainImage { get; set; }
}
