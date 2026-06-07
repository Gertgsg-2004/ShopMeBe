using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.DTOs.Admin;
using ShopMeBe.Core.Enums;
using ShopMeBe.Core.Interfaces;
using ShopMeBe.Infrastructure.Data;

namespace ShopMeBe.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly ApplicationDbContext _context;

    public AdminService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardDto> GetDashboardAsync()
    {
        var today = DateTime.UtcNow.Date;
        var last7Days = today.AddDays(-6);

        var totalOrders = await _context.Orders.CountAsync();
        var todayOrders = await _context.Orders.CountAsync(o => o.CreatedAt.Date == today);
        var totalRevenue = await _context.Orders
            .Where(o => o.Status == OrderStatus.Completed)
            .SumAsync(o => (decimal?)o.Total) ?? 0;
        var todayRevenue = await _context.Orders
            .Where(o => o.Status == OrderStatus.Completed && o.CreatedAt.Date == today)
            .SumAsync(o => (decimal?)o.Total) ?? 0;
        var totalCustomers = await _context.Users.CountAsync();
        var totalProducts = await _context.Products.CountAsync(p => p.IsActive);
        var pendingOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Pending);
        var lowStock = await _context.Products.CountAsync(p => p.IsActive && p.Stock <= 5);

        var revenueChart = await _context.Orders
            .Where(o => o.Status == OrderStatus.Completed && o.CreatedAt.Date >= last7Days)
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new RevenueByDateDto
            {
                Date = g.Key.ToString("dd/MM"),
                Revenue = g.Sum(o => o.Total),
                Orders = g.Count()
            })
            .OrderBy(x => x.Date)
            .ToListAsync();

        var topProducts = await _context.OrderItems
            .Include(i => i.Product).ThenInclude(p => p.Images)
            .GroupBy(i => new { i.ProductId, i.ProductName })
            .Select(g => new TopProductDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.ProductName,
                SoldCount = g.Sum(i => i.Quantity),
                Revenue = g.Sum(i => i.Price * i.Quantity)
            })
            .OrderByDescending(x => x.SoldCount)
            .Take(5)
            .ToListAsync();

        var recentOrders = await _context.Orders
            .Include(o => o.User)
            .OrderByDescending(o => o.CreatedAt)
            .Take(10)
            .Select(o => new RecentOrderDto
            {
                Id = o.Id,
                OrderCode = o.OrderCode,
                CustomerName = o.User.FullName,
                Total = o.Total,
                Status = o.Status.ToString(),
                CreatedAt = o.CreatedAt
            })
            .ToListAsync();

        return new DashboardDto
        {
            TotalOrders = totalOrders,
            TotalOrdersToday = todayOrders,
            TotalRevenue = totalRevenue,
            TotalRevenueToday = todayRevenue,
            TotalCustomers = totalCustomers,
            TotalProducts = totalProducts,
            PendingOrders = pendingOrders,
            LowStockProducts = lowStock,
            RevenueChart = revenueChart,
            TopProducts = topProducts,
            RecentOrders = recentOrders
        };
    }
}
