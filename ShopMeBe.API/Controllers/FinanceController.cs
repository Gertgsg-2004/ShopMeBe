using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Infrastructure.Data;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/admin/finance")]
[Authorize(Roles = "Admin,Ketoan")]
public class FinanceController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public FinanceController(ApplicationDbContext db) => _db = db;

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] string? from, [FromQuery] string? to)
    {
        var fromDate = from != null ? DateTime.Parse(from) : DateTime.UtcNow.AddDays(-30);
        var toDate = to != null ? DateTime.Parse(to).AddDays(1) : DateTime.UtcNow.AddDays(1);

        var totalRevenue = await _db.Orders
            .Where(o => o.CreatedAt >= fromDate && o.CreatedAt < toDate)
            .SumAsync(o => (decimal?)o.Total) ?? 0;

        var totalTopUp = await _db.WalletTransactions
            .Where(t => t.Type == "TopUp" && t.CreatedAt >= fromDate && t.CreatedAt < toDate)
            .SumAsync(t => (decimal?)t.Amount) ?? 0;

        var totalOrders = await _db.Orders
            .CountAsync(o => o.CreatedAt >= fromDate && o.CreatedAt < toDate);

        var totalWalletBalance = await _db.Users.SumAsync(u => (decimal?)u.WalletBalance) ?? 0;

        return Ok(ApiResponseDto<object>.Ok(new
        {
            TotalRevenue = totalRevenue,
            TotalTopUp = totalTopUp,
            TotalOrders = totalOrders,
            TotalWalletBalance = totalWalletBalance
        }));
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? from = null, [FromQuery] string? to = null)
    {
        var fromDate = from != null ? DateTime.Parse(from) : DateTime.MinValue;
        var toDate = to != null ? DateTime.Parse(to).AddDays(1) : DateTime.MaxValue;

        var query = _db.Orders
            .Where(o => o.CreatedAt >= fromDate && o.CreatedAt < toDate)
            .OrderByDescending(o => o.CreatedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(o => new
            {
                o.Id, o.OrderCode, o.UserId,
                CustomerName = _db.Users.Where(u => u.Id == o.UserId).Select(u => u.FullName).FirstOrDefault(),
                o.Total, o.Status, o.PaymentMethod, o.CreatedAt
            }).ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(new { items, total, page, pageSize }));
    }

    [HttpGet("wallet-transactions")]
    public async Task<IActionResult> GetWalletTransactions(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? type = null, [FromQuery] string? userId = null,
        [FromQuery] string? from = null, [FromQuery] string? to = null)
    {
        var fromDate = from != null ? DateTime.Parse(from) : DateTime.MinValue;
        var toDate = to != null ? DateTime.Parse(to).AddDays(1) : DateTime.MaxValue;

        var query = _db.WalletTransactions
            .Where(t => t.CreatedAt >= fromDate && t.CreatedAt < toDate)
            .AsQueryable();

        if (!string.IsNullOrEmpty(type)) query = query.Where(t => t.Type == type);
        if (!string.IsNullOrEmpty(userId)) query = query.Where(t => t.UserId == userId);

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(t => new
            {
                t.Id, t.UserId, t.Amount, t.BalanceBefore, t.BalanceAfter,
                t.Type, t.Reason, t.AdminId, t.Reference, t.CreatedAt,
                UserName = _db.Users.Where(u => u.Id == t.UserId).Select(u => u.FullName).FirstOrDefault(),
                AdminName = t.AdminId != null ? _db.Users.Where(u => u.Id == t.AdminId).Select(u => u.FullName).FirstOrDefault() : null
            }).ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(new { items, total, page, pageSize }));
    }
}
