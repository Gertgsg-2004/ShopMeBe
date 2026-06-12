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
        [FromQuery] string? from,
        [FromQuery] string? to,
        [FromQuery] string groupBy = "day")
    {
        var fromDate = (from != null && DateTime.TryParse(from, out var fd)) ? fd.Date : DateTime.UtcNow.AddDays(-30).Date;
        var toDate = (to != null && DateTime.TryParse(to, out var td)) ? td.Date.AddDays(1) : DateTime.UtcNow.Date.AddDays(1);

        var orders = await _db.Orders
            .Where(o => o.Status == OrderStatus.Completed
                        && o.CreatedAt >= fromDate
                        && o.CreatedAt < toDate)
            .Select(o => new { o.CreatedAt, o.Total })
            .ToListAsync();

        List<object> result;
        if (groupBy == "month")
        {
            result = orders
                .GroupBy(o => new DateTime(o.CreatedAt.Year, o.CreatedAt.Month, 1))
                .Select(g => {
                    var rev = g.Sum(o => o.Total);
                    return (object)new { date = g.Key.ToString("yyyy-MM"), orders = g.Count(), revenue = rev, cost = 0m, profit = rev, margin = 100.0 };
                })
                .OrderBy(r => ((dynamic)r).date)
                .ToList();
        }
        else
        {
            result = orders
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => {
                    var rev = g.Sum(o => o.Total);
                    return (object)new { date = g.Key.ToString("yyyy-MM-dd"), orders = g.Count(), revenue = rev, cost = 0m, profit = rev, margin = 100.0 };
                })
                .OrderBy(r => ((dynamic)r).date)
                .ToList();
        }

        return Ok(ApiResponseDto<object>.Ok(result));
    }

    [HttpGet("top-products")]
    public async Task<ActionResult<ApiResponseDto<object>>> GetTopProducts(
        [FromQuery] string? from,
        [FromQuery] string? to,
        [FromQuery] int limit = 10)
    {
        var fromDate = (from != null && DateTime.TryParse(from, out var fd)) ? fd.Date : DateTime.UtcNow.AddDays(-30).Date;
        var toDate = (to != null && DateTime.TryParse(to, out var td)) ? td.Date.AddDays(1) : DateTime.UtcNow.Date.AddDays(1);

        var rows = await _db.OrderItems
            .Include(i => i.Order)
            .Include(i => i.Product)
            .Where(i => i.Order.Status == OrderStatus.Completed
                        && i.Order.CreatedAt >= fromDate
                        && i.Order.CreatedAt < toDate)
            .GroupBy(i => new { i.ProductId, i.Product.Name, i.Product.Sku })
            .Select(g => new { g.Key.ProductId, ProductName = g.Key.Name, Sku = g.Key.Sku, QtyTotal = g.Sum(i => i.Quantity), Rev = g.Sum(i => i.Price * i.Quantity) })
            .OrderByDescending(r => r.QtyTotal)
            .Take(limit)
            .ToListAsync();

        var result = rows.Select((r, i) => new { rank = i + 1, productId = r.ProductId, productName = r.ProductName, sku = r.Sku, qtySold = r.QtyTotal, revenue = r.Rev });
        return Ok(ApiResponseDto<object>.Ok(result));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponseDto<ReportSummaryDto>>> GetSummary(
        [FromQuery] string? from,
        [FromQuery] string? to)
    {
        var fromDate = (from != null && DateTime.TryParse(from, out var fd)) ? fd.Date : DateTime.UtcNow.AddDays(-30).Date;
        var toDate = (to != null && DateTime.TryParse(to, out var td)) ? td.Date.AddDays(1) : DateTime.UtcNow.Date.AddDays(1);

        var orders = await _db.Orders
            .Where(o => o.Status == OrderStatus.Completed
                        && o.CreatedAt >= fromDate
                        && o.CreatedAt < toDate)
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
                productId = p.Id,
                productName = p.Name,
                sku = p.Sku,
                stock = p.Stock,
                costPrice = 0m,
                value = p.Stock * p.Price
            })
            .ToListAsync();

        var totalValue = products.Sum(p => p.value);

        return Ok(ApiResponseDto<object>.Ok(new { totalValue, items = products }));
    }
}
