namespace ShopMeBe.Core.DTOs.Admin;

public class DashboardDto
{
    public int TotalOrders { get; set; }
    public int TotalOrdersToday { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalRevenueToday { get; set; }
    public int TotalCustomers { get; set; }
    public int TotalProducts { get; set; }
    public int PendingOrders { get; set; }
    public int LowStockProducts { get; set; }
    public List<RevenueByDateDto> RevenueChart { get; set; } = new();
    public List<TopProductDto> TopProducts { get; set; } = new();
    public List<RecentOrderDto> RecentOrders { get; set; } = new();
}

public class RevenueByDateDto
{
    public string Date { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
}

public class TopProductDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImage { get; set; }
    public int SoldCount { get; set; }
    public decimal Revenue { get; set; }
}

public class RecentOrderDto
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
