using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.Entities;
using ShopMeBe.Infrastructure.Data;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/wallet")]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public WalletController(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet]
    public async Task<IActionResult> GetWallet()
    {
        var user = await _db.Users.FindAsync(UserId);
        if (user == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy người dùng"));

        var history = await _db.WalletTransactions
            .Where(t => t.UserId == UserId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(30)
            .Select(t => new { t.Id, t.Amount, t.BalanceBefore, t.BalanceAfter, t.Type, t.Reason, t.Reference, t.CreatedAt })
            .ToListAsync();

        var totalTopUp = await _db.WalletTransactions
            .Where(t => t.UserId == UserId && t.Type == "TopUp")
            .SumAsync(t => (decimal?)t.Amount) ?? 0;

        // Generate unique transfer code: NAP + last 6 chars of userId
        var uid = UserId ?? "000000";
        var transferCode = "NAP" + uid[^Math.Min(6, uid.Length)..].ToUpper();

        // Pending top-up requests
        var pendingTopUps = await _db.WalletTopUps
            .Where(t => t.UserId == UserId && !t.IsCompleted)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new { t.Id, t.Amount, t.CreatedAt })
            .ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(new
        {
            balance = user.WalletBalance,
            totalTopUp,
            history,
            transferCode,
            pendingTopUps
        }));
    }

    [HttpPost("topup-request")]
    public async Task<IActionResult> CreateTopUpRequest([FromBody] TopUpDto dto)
    {
        if (dto.Amount < 10000)
            return BadRequest(ApiResponseDto<object>.Fail("Số tiền nạp tối thiểu là 10.000đ"));
        if (UserId == null) return Unauthorized();

        var topUp = new WalletTopUp { UserId = UserId, Amount = dto.Amount };
        _db.WalletTopUps.Add(topUp);
        await _db.SaveChangesAsync();

        return Ok(ApiResponseDto<object>.Ok(new { topUp.Id, topUp.Amount }, "Yêu cầu nạp tiền đã được ghi nhận. Vui lòng chuyển khoản đúng số tiền và nội dung để được xử lý nhanh."));
    }
}

public class TopUpDto { public decimal Amount { get; set; } }
