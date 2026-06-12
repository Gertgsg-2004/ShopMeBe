using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.DTOs.Admin;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Interfaces;
using ShopMeBe.Infrastructure.Data;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin,CSKH,Ketoan,Kho")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ApplicationDbContext _context;

    public AdminController(IAdminService adminService, UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager, ApplicationDbContext context)
    {
        _adminService = adminService;
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
    }

    private string? AdminId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet("dashboard")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponseDto<DashboardDto>>> GetDashboard()
    {
        var result = await _adminService.GetDashboardAsync();
        return Ok(ApiResponseDto<DashboardDto>.Ok(result));
    }

    // ── Customers ──────────────────────────────────────────────────────────────

    [HttpGet("customers")]
    [Authorize(Roles = "Admin,CSKH")]
    public async Task<ActionResult<ApiResponseDto<List<CustomerDto>>>> GetCustomers(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
    {
        var query = _context.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(u => u.FullName.Contains(search) || (u.Email != null && u.Email.Contains(search)) || (u.Phone != null && u.Phone.Contains(search)));

        var users = await query.OrderByDescending(u => u.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        var ids = users.Select(u => u.Id).ToList();

        var orderStats = await _context.Orders
            .Where(o => ids.Contains(o.UserId))
            .GroupBy(o => o.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count(), Total = g.Sum(o => o.Total), Last = g.Max(o => o.CreatedAt) })
            .ToDictionaryAsync(x => x.UserId);

        var topupStats = await _context.WalletTransactions
            .Where(t => ids.Contains(t.UserId) && t.Type == "TopUp")
            .GroupBy(t => t.UserId)
            .Select(g => new { UserId = g.Key, Total = g.Sum(t => t.Amount) })
            .ToDictionaryAsync(x => x.UserId);

        var customers = users.Select(u => new CustomerDto
        {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email ?? "",
            Phone = u.Phone,
            Address = u.Address,
            Avatar = u.Avatar,
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt,
            TotalOrders = orderStats.GetValueOrDefault(u.Id)?.Count ?? 0,
            TotalSpent = orderStats.GetValueOrDefault(u.Id)?.Total ?? 0,
            TotalTopUp = topupStats.GetValueOrDefault(u.Id)?.Total ?? 0,
            LastOrderAt = orderStats.GetValueOrDefault(u.Id)?.Last,
            WalletBalance = u.WalletBalance
        }).ToList();

        return Ok(ApiResponseDto<List<CustomerDto>>.Ok(customers));
    }

    [HttpGet("customers/{userId}/profile")]
    [Authorize(Roles = "Admin,CSKH")]
    public async Task<IActionResult> GetCustomerProfile(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy người dùng"));

        var orders = await _context.Orders.Where(o => o.UserId == userId).ToListAsync();
        var topups = await _context.WalletTransactions.Where(t => t.UserId == userId && t.Type == "TopUp").SumAsync(t => t.Amount);
        var walletLog = await _context.WalletTransactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .Select(t => new { t.Id, t.Amount, t.Type, t.Reason, t.BalanceBefore, t.BalanceAfter, t.CreatedAt })
            .ToListAsync();

        var totalOrders = orders.Count;
        var totalSpent = orders.Sum(o => o.Total);
        var avgOrder = totalOrders > 0 ? totalSpent / totalOrders : 0;
        var lastOrder = orders.Any() ? orders.Max(o => o.CreatedAt) : (DateTime?)null;

        return Ok(ApiResponseDto<object>.Ok(new
        {
            user.Id, user.FullName, user.Email, user.Phone, user.Address, user.Avatar, user.IsActive, user.CreatedAt,
            WalletBalance = user.WalletBalance,
            TotalOrders = totalOrders,
            TotalSpent = totalSpent,
            TotalTopUp = topups,
            AvgOrderValue = avgOrder,
            LastOrderAt = lastOrder,
            WalletLog = walletLog
        }));
    }

    [HttpPut("customers/{userId}/toggle-active")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleUserActive(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy người dùng"));
        user.IsActive = !user.IsActive;
        await _userManager.UpdateAsync(user);
        return Ok(ApiResponseDto<object>.Ok(new { user.IsActive }, user.IsActive ? "Đã kích hoạt tài khoản" : "Đã khóa tài khoản"));
    }

    [HttpPost("customers/{userId}/reset-password")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResetPassword(string userId, [FromBody] ResetPasswordDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy người dùng"));
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);
        if (!result.Succeeded)
            return BadRequest(ApiResponseDto<object>.Fail(string.Join(", ", result.Errors.Select(e => e.Description))));
        return Ok(ApiResponseDto<object>.Ok(new { }, "Đặt lại mật khẩu thành công"));
    }

    [HttpPost("customers/{userId}/adjust-balance")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AdjustBalance(string userId, [FromBody] AdjustBalanceDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy người dùng"));
        if (dto.Amount == 0) return BadRequest(ApiResponseDto<object>.Fail("Số tiền không được bằng 0"));

        var before = user.WalletBalance;
        if (dto.Amount < 0 && user.WalletBalance + dto.Amount < 0)
            return BadRequest(ApiResponseDto<object>.Fail("Số dư không đủ để trừ"));

        user.WalletBalance += dto.Amount;
        await _userManager.UpdateAsync(user);

        _context.WalletTransactions.Add(new WalletTransaction
        {
            UserId = userId,
            Amount = dto.Amount,
            BalanceBefore = before,
            BalanceAfter = user.WalletBalance,
            Type = dto.Amount > 0 ? "AdminCredit" : "AdminDebit",
            Reason = dto.Reason,
            AdminId = AdminId
        });
        await _context.SaveChangesAsync();

        return Ok(ApiResponseDto<object>.Ok(new { user.WalletBalance },
            dto.Amount > 0 ? $"Đã cộng {dto.Amount:N0}đ vào tài khoản" : $"Đã trừ {Math.Abs(dto.Amount):N0}đ khỏi tài khoản"));
    }

    // ── Staff management ───────────────────────────────────────────────────────

    [HttpGet("staff")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetStaff()
    {
        var staffRoles = new[] { "Admin", "CSKH", "Ketoan", "Kho" };
        var staffUsers = new Dictionary<string, ApplicationUser>();
        foreach (var role in staffRoles)
        {
            foreach (var u in await _userManager.GetUsersInRoleAsync(role))
                staffUsers.TryAdd(u.Id, u);
        }

        var result = new List<object>();
        foreach (var u in staffUsers.Values.OrderBy(u => u.FullName))
        {
            var roles = await _userManager.GetRolesAsync(u);
            result.Add(new { u.Id, u.FullName, u.Email, u.Phone, u.IsActive, u.CreatedAt, Roles = roles });
        }
        return Ok(ApiResponseDto<object>.Ok(result));
    }

    [HttpPost("staff/{userId}/assign-role")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AssignRole(string userId, [FromBody] AssignRoleDto dto)
    {
        var allowed = new[] { "Admin", "CSKH", "Ketoan", "Kho" };
        if (!allowed.Contains(dto.Role)) return BadRequest(ApiResponseDto<object>.Fail("Vai trò không hợp lệ"));

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy người dùng"));

        if (!await _roleManager.RoleExistsAsync(dto.Role))
            await _roleManager.CreateAsync(new IdentityRole(dto.Role));

        await _userManager.AddToRoleAsync(user, dto.Role);
        return Ok(ApiResponseDto<object>.Ok(new { }, $"Đã gán vai trò {dto.Role}"));
    }

    [HttpDelete("staff/{userId}/role/{role}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RemoveRole(string userId, string role)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy người dùng"));
        await _userManager.RemoveFromRoleAsync(user, role);
        return Ok(ApiResponseDto<object>.Ok(new { }, $"Đã xóa vai trò {role}"));
    }

    // ── Top-up requests ───────────────────────────────────────────────────────

    [HttpGet("topup-requests")]
    [Authorize(Roles = "Admin,Ketoan")]
    public async Task<IActionResult> GetTopUpRequests([FromQuery] bool pendingOnly = false)
    {
        var q = _context.WalletTopUps.Include(t => t.User).AsQueryable();
        if (pendingOnly) q = q.Where(t => !t.IsCompleted);
        var raw = await q.OrderByDescending(t => t.CreatedAt).ToListAsync();
        var list = raw.Select(t => new
        {
            t.Id, t.Amount, t.IsCompleted, t.CreatedAt, t.CompletedAt,
            UserId = t.UserId,
            FullName = t.User.FullName,
            Phone = t.User.Phone,
            TransferCode = "NAP" + t.UserId[^Math.Min(6, t.UserId.Length)..].ToUpper()
        }).ToList();
        return Ok(ApiResponseDto<object>.Ok(list));
    }

    [HttpPost("topup-requests/{id}/approve")]
    [Authorize(Roles = "Admin,Ketoan")]
    public async Task<IActionResult> ApproveTopUp(int id)
    {
        var topUp = await _context.WalletTopUps.Include(t => t.User).FirstOrDefaultAsync(t => t.Id == id);
        if (topUp == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy yêu cầu nạp tiền"));
        if (topUp.IsCompleted) return BadRequest(ApiResponseDto<object>.Fail("Yêu cầu đã được xử lý"));

        var user = topUp.User;
        var before = user.WalletBalance;
        user.WalletBalance += topUp.Amount;
        topUp.IsCompleted = true;
        topUp.CompletedAt = DateTime.UtcNow;

        _context.WalletTransactions.Add(new WalletTransaction
        {
            UserId = user.Id,
            Amount = topUp.Amount,
            BalanceBefore = before,
            BalanceAfter = user.WalletBalance,
            Type = "TopUp",
            Reason = $"Nạp tiền chuyển khoản - Yêu cầu #{topUp.Id}",
            AdminId = AdminId,
            Reference = $"TOPUP-{topUp.Id}"
        });
        await _context.SaveChangesAsync();

        return Ok(ApiResponseDto<object>.Ok(new { user.WalletBalance }, $"Đã duyệt nạp {topUp.Amount:N0}đ cho {user.FullName}"));
    }

    [HttpDelete("topup-requests/{id}")]
    [Authorize(Roles = "Admin,Ketoan")]
    public async Task<IActionResult> RejectTopUp(int id)
    {
        var topUp = await _context.WalletTopUps.FindAsync(id);
        if (topUp == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy yêu cầu"));
        if (topUp.IsCompleted) return BadRequest(ApiResponseDto<object>.Fail("Không thể hủy yêu cầu đã được duyệt"));
        _context.WalletTopUps.Remove(topUp);
        await _context.SaveChangesAsync();
        return Ok(ApiResponseDto<object>.Ok(new { }, "Đã từ chối yêu cầu nạp tiền"));
    }

    // ── Password reset requests ────────────────────────────────────────────────

    [HttpGet("password-reset-requests")]
    [Authorize(Roles = "Admin,CSKH")]
    public async Task<IActionResult> GetPasswordResetRequests()
    {
        var requests = await _context.PasswordResetRequests
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.Status,
                r.CreatedAt,
                r.CompletedAt,
                UserId = r.UserId,
                FullName = r.User.FullName,
                Phone = r.User.Phone,
                Email = r.User.Email
            })
            .ToListAsync();
        return Ok(ApiResponseDto<object>.Ok(requests));
    }

    [HttpPost("password-reset-requests/{id}/complete")]
    [Authorize(Roles = "Admin,CSKH")]
    public async Task<IActionResult> CompletePasswordReset(int id, [FromBody] CompleteResetDto dto)
    {
        var req = await _context.PasswordResetRequests.Include(r => r.User).FirstOrDefaultAsync(r => r.Id == id);
        if (req == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy yêu cầu"));
        if (req.Status == "Completed") return BadRequest(ApiResponseDto<object>.Fail("Yêu cầu đã được xử lý"));

        var token = await _userManager.GeneratePasswordResetTokenAsync(req.User);
        var result = await _userManager.ResetPasswordAsync(req.User, token, dto.NewPassword);
        if (!result.Succeeded)
            return BadRequest(ApiResponseDto<object>.Fail(string.Join(", ", result.Errors.Select(e => e.Description))));

        req.Status = "Completed";
        req.AdminId = AdminId;
        req.CompletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ApiResponseDto<object>.Ok(new { Phone = req.User.Phone, NewPassword = dto.NewPassword },
            $"Đã đặt lại mật khẩu và thông báo qua SĐT {req.User.Phone}"));
    }

    [HttpDelete("password-reset-requests/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePasswordResetRequest(int id)
    {
        var req = await _context.PasswordResetRequests.FindAsync(id);
        if (req == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy yêu cầu"));
        _context.PasswordResetRequests.Remove(req);
        await _context.SaveChangesAsync();
        return Ok(ApiResponseDto<object>.Ok(new { }, "Đã xóa yêu cầu"));
    }
}

public class ResetPasswordDto { public string NewPassword { get; set; } = string.Empty; }
public class AdjustBalanceDto
{
    public decimal Amount { get; set; }
    public string? Reason { get; set; }
}
public class AssignRoleDto { public string Role { get; set; } = string.Empty; }
public class CompleteResetDto { public string NewPassword { get; set; } = string.Empty; }
