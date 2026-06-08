using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.Enums;
using ShopMeBe.Infrastructure.Data;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = "Admin")]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ReportsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("revenue")]
    public async Task<ActionResult<ApiResponseDto<object>>> GetRevenue(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string groupBy = "day")
    {
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
        var toDate = to ?? DateTime.UtcNow;

        var orders = await _db.Orders
            .Where(o => o.Status == OrderStatus.Completed
                        && o.CreatedAt >= fromDate
                        && o.CreatedAt <= toDate)
            .Select(o => new { o.CreatedAt, o.Total })
            .ToListAsync();

        List<RevenueReportDto> result;
        if (groupBy == "month")
        {
            result = orders
                .GroupBy(o => new DateTime(o.CreatedAt.Year, o.CreatedAt.Month, 1))
                .Select(g => new RevenueReportDto
                {
                    Date = g.Key,
                    Revenue = g.Sum(o => o.Total),
                    Cost = 0,
                    Profit = g.Sum(o => o.Total),
                    OrderCount = g.Count()
                })
                .OrderBy(r => r.Date)
                .ToList();
        }
        else
        {
            result = orders
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => new RevenueReportDto
                {
                    Date = g.Key,
                    Revenue = g.Sum(o => o.Total),
                    Cost = 0,
                    Profit = g.Sum(o => o.Total),
                    OrderCount = g.Count()
                })
                .OrderBy(r => r.Date)
                .ToList();
        }

        return Ok(ApiResponseDto<object>.Ok(result));
    }

    [HttpGet("top-products")]
    public async Task<ActionResult<ApiResponseDto<object>>> GetTopProducts(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int limit = 10)
    {
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
        var toDate = to ?? DateTime.UtcNow;

        var result = await _db.OrderItems
            .Include(i => i.Order)
            .Include(i => i.Product)
            .Where(i => i.Order.Status == OrderStatus.Completed
                        && i.Order.CreatedAt >= fromDate
                        && i.Order.CreatedAt <= toDate)
            .GroupBy(i => new { i.ProductId, i.Product.Name, i.Product.Sku })
            .Select(g => new TopProductReportDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.Name,
                Sku = g.Key.Sku,
                QuantitySold = g.Sum(i => i.Quantity),
                Revenue = g.Sum(i => i.Price * i.Quantity)
            })
            .OrderByDescending(r => r.QuantitySold)
            .Take(limit)
            .ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(result));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponseDto<ReportSummaryDto>>> GetSummary(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
        var toDate = to ?? DateTime.UtcNow;

        var orders = await _db.Orders
            .Where(o => o.Status == OrderStatus.Completed
                        && o.CreatedAt >= fromDate
                        && o.CreatedAt <= toDate)
            .ToListAsync();

        var totalRevenue = orders.Sum(o => o.Total);
        var totalOrders = orders.Count;
        var totalProducts = await _db.Products.CountAsync(p => p.IsActive);

        var summary = new ReportSummaryDto
        {
            TotalRevenue = totalRevenue,
            TotalCost = 0,
            TotalProfit = totalRevenue,
            TotalOrders = totalOrders,
            TotalProducts = totalProducts,
            ProfitMargin = totalRevenue > 0 ? 100 : 0
        };

        return Ok(ApiResponseDto<ReportSummaryDto>.Ok(summary));
    }

    [HttpGet("stock-value")]
    public async Task<ActionResult<ApiResponseDto<object>>> GetStockValue()
    {
        var products = await _db.Products
            .Where(p => p.IsActive)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Sku,
                p.Stock,
                p.Price,
                StockValue = p.Stock * p.Price
            })
            .ToListAsync();

        var totalValue = products.Sum(p => p.StockValue);
        var totalItems = products.Sum(p => p.Stock);

        return Ok(ApiResponseDto<object>.Ok(new
        {
            TotalStockValue = totalValue,
            TotalItems = totalItems,
            ProductCount = products.Count,
            Products = products
        }));
    }
}
