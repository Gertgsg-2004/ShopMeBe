using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using Microsoft.AspNetCore.Authorization;
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
    private readonly IConfiguration _config;

    public WalletController(ApplicationDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet]
    public async Task<IActionResult> GetWallet()
    {
        var user = await _db.Users.FindAsync(UserId);
        if (user == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy người dùng"));

        var history = await _db.WalletTopUps
            .Where(t => t.UserId == UserId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(20)
            .Select(t => new { t.Id, t.Amount, t.IsCompleted, t.CreatedAt, t.CompletedAt })
            .ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(new { balance = user.WalletBalance, history }));
    }

    [HttpPost("topup")]
    public async Task<IActionResult> CreateTopUp([FromBody] TopUpDto dto)
    {
        if (dto.Amount < 10000)
            return BadRequest(ApiResponseDto<object>.Fail("Số tiền nạp tối thiểu là 10.000đ"));
        if (UserId == null) return Unauthorized();

        var topUp = new WalletTopUp { UserId = UserId, Amount = dto.Amount };
        _db.WalletTopUps.Add(topUp);
        await _db.SaveChangesAsync();

        var vnpConfig = _config.GetSection("VNPay");
        string tmnCode = vnpConfig["TmnCode"] ?? "DEMO";
        string hashSecret = vnpConfig["HashSecret"] ?? "DEMOSECRETKEY";
        string payUrl = vnpConfig["PayUrl"] ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        string returnUrl = vnpConfig["ReturnUrl"] ?? $"{Request.Scheme}://{Request.Host}/api/payment/vnpay/return";

        var now = DateTime.UtcNow.AddHours(7);
        var txnRef = $"W{topUp.Id}_{now:yyyyMMddHHmmss}";

        var vnpParams = new SortedDictionary<string, string>
        {
            ["vnp_Version"] = "2.1.0",
            ["vnp_Command"] = "pay",
            ["vnp_TmnCode"] = tmnCode,
            ["vnp_Amount"] = ((long)(dto.Amount * 100)).ToString(),
            ["vnp_CurrCode"] = "VND",
            ["vnp_TxnRef"] = txnRef,
            ["vnp_OrderInfo"] = $"Nap tien vi {topUp.Id}",
            ["vnp_OrderType"] = "other",
            ["vnp_Locale"] = "vn",
            ["vnp_ReturnUrl"] = returnUrl,
            ["vnp_IpAddr"] = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            ["vnp_CreateDate"] = now.ToString("yyyyMMddHHmmss"),
            ["vnp_ExpireDate"] = now.AddMinutes(15).ToString("yyyyMMddHHmmss"),
        };

        var queryString = string.Join("&", vnpParams.Select(kv => $"{kv.Key}={HttpUtility.UrlEncode(kv.Value)}"));
        var signData = string.Join("&", vnpParams.Select(kv => $"{kv.Key}={kv.Value}"));
        var secureHash = HmacSha512(hashSecret, signData);

        var paymentUrl = $"{payUrl}?{queryString}&vnp_SecureHash={secureHash}";
        return Ok(new ApiResponseDto<string> { Success = true, Data = paymentUrl });
    }

    private static string HmacSha512(string key, string data)
    {
        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }
}

public class TopUpDto
{
    public decimal Amount { get; set; }
}
