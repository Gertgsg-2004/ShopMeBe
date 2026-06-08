namespace ShopMeBe.Core.DTOs;

public class RevenueReportDto
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
    public decimal Cost { get; set; }
    public decimal Profit { get; set; }
    public int OrderCount { get; set; }
}

public class TopProductReportDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Sku { get; set; }
    public int QuantitySold { get; set; }
    public decimal Revenue { get; set; }
}

public class ReportSummaryDto
{
    public decimal TotalRevenue { get; set; }
    public decimal TotalCost { get; set; }
    public decimal TotalProfit { get; set; }
    public int TotalOrders { get; set; }
    public int TotalProducts { get; set; }
    public decimal ProfitMargin { get; set; }
}
