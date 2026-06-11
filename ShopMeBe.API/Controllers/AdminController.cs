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
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;

    public AdminController(IAdminService adminService, UserManager<ApplicationUser> userManager, ApplicationDbContext context)
    {
        _adminService = adminService;
        _userManager = userManager;
        _context = context;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponseDto<DashboardDto>>> GetDashboard()
    {
        var result = await _adminService.GetDashboardAsync();
        return Ok(ApiResponseDto<DashboardDto>.Ok(result));
    }

    [HttpGet("customers")]
    public async Task<ActionResult<ApiResponseDto<List<CustomerDto>>>> GetCustomers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.Users.AsQueryable();
        var total = await query.CountAsync();
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var customerIds = users.Select(u => u.Id).ToList();
        var orderStats = await _context.Orders
            .Where(o => customerIds.Contains(o.UserId))
            .GroupBy(o => o.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count(), Total = g.Sum(o => o.Total) })
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
            WalletBalance = u.WalletBalance
        }).ToList();

        return Ok(ApiResponseDto<List<CustomerDto>>.Ok(customers));
    }

    [HttpPut("customers/{userId}/toggle-active")]
    public async Task<ActionResult<ApiResponseDto<object>>> ToggleUserActive(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy người dùng"));

        user.IsActive = !user.IsActive;
        await _userManager.UpdateAsync(user);
        var status = user.IsActive ? "kích hoạt" : "khóa";
        return Ok(ApiResponseDto<object>.Ok(new { user.IsActive }, $"Đã {status} tài khoản"));
    }

    [HttpPost("customers/{userId}/reset-password")]
    public async Task<ActionResult<ApiResponseDto<object>>> ResetPassword(string userId, [FromBody] ResetPasswordDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy người dùng"));

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);
        if (!result.Succeeded)
            return BadRequest(ApiResponseDto<object>.Fail(string.Join(", ", result.Errors.Select(e => e.Description))));

        return Ok(ApiResponseDto<object>.Ok(new { }, "Đặt lại mật khẩu thành công"));
    }

    [HttpPost("customers/{userId}/add-credit")]
    public async Task<ActionResult<ApiResponseDto<object>>> AddCredit(string userId, [FromBody] AddCreditDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy người dùng"));
        if (dto.Amount <= 0) return BadRequest(ApiResponseDto<object>.Fail("Số tiền phải lớn hơn 0"));

        user.WalletBalance += dto.Amount;
        await _userManager.UpdateAsync(user);
        return Ok(ApiResponseDto<object>.Ok(new { user.WalletBalance }, $"Đã cộng {dto.Amount:N0}đ vào tài khoản"));
    }
}

public class ResetPasswordDto { public string NewPassword { get; set; } = string.Empty; }
public class AddCreditDto { public decimal Amount { get; set; } }
