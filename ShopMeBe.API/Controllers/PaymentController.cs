using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.Enums;
using ShopMeBe.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly ApplicationDbContext _db;

    public PaymentController(IConfiguration config, ApplicationDbContext db)
    {
        _config = config;
        _db = db;
    }

    [HttpPost("vnpay/create")]
    [Authorize]
    public IActionResult CreateVnPayUrl([FromBody] VnPayCreateDto dto)
    {
        var vnpConfig = _config.GetSection("VNPay");
        string tmnCode = vnpConfig["TmnCode"] ?? "DEMO";
        string hashSecret = vnpConfig["HashSecret"] ?? "DEMOSECRETKEY";
        string payUrl = vnpConfig["PayUrl"] ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        string returnUrl = vnpConfig["ReturnUrl"] ?? $"{Request.Scheme}://{Request.Host}/thanh-toan/vnpay-return";

        var now = DateTime.UtcNow.AddHours(7); // Vietnam time
        var txnRef = $"{dto.OrderId}_{now:yyyyMMddHHmmss}";

        var vnpParams = new SortedDictionary<string, string>
        {
            ["vnp_Version"] = "2.1.0",
            ["vnp_Command"] = "pay",
            ["vnp_TmnCode"] = tmnCode,
            ["vnp_Amount"] = ((long)(dto.Amount * 100)).ToString(),
            ["vnp_CurrCode"] = "VND",
            ["vnp_TxnRef"] = txnRef,
            ["vnp_OrderInfo"] = $"Thanh toan don hang {dto.OrderId}",
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

    [HttpGet("vnpay/return")]
    public async Task<IActionResult> VnPayReturn([FromQuery] Dictionary<string, string> queryParams)
    {
        var vnpConfig = _config.GetSection("VNPay");
        string hashSecret = vnpConfig["HashSecret"] ?? "DEMOSECRETKEY";

        var vnpParams = new SortedDictionary<string, string>();
        string? secureHash = null;

        foreach (var kv in queryParams)
        {
            if (kv.Key == "vnp_SecureHash" || kv.Key == "vnp_SecureHashType") { secureHash ??= kv.Value; continue; }
            if (kv.Key.StartsWith("vnp_")) vnpParams[kv.Key] = kv.Value;
        }

        var signData = string.Join("&", vnpParams.Select(kv => $"{kv.Key}={kv.Value}"));
        var checkHash = HmacSha512(hashSecret, signData);

        bool isValid = secureHash != null && checkHash.Equals(secureHash, StringComparison.OrdinalIgnoreCase);
        bool isPaid = isValid && queryParams.GetValueOrDefault("vnp_ResponseCode") == "00";

        if (isPaid && queryParams.TryGetValue("vnp_TxnRef", out var txnRef))
        {
            var parts = txnRef.Split('_');
            if (parts.Length > 0 && int.TryParse(parts[0], out var orderId))
            {
                var order = await _db.Orders.FindAsync(orderId);
                if (order != null && order.Status == OrderStatus.Pending)
                {
                    order.Status = OrderStatus.Confirmed;
                    order.PaymentMethod = PaymentMethod.EWallet;
                    await _db.SaveChangesAsync();
                }
            }
        }

        var frontendUrl = vnpConfig["FrontendUrl"] ?? "http://localhost:5173";
        var redirectUrl = isPaid
            ? $"{frontendUrl}/thanh-toan/thanh-cong?method=vnpay"
            : $"{frontendUrl}/thanh-toan/that-bai?method=vnpay&code={queryParams.GetValueOrDefault("vnp_ResponseCode")}";

        return Redirect(redirectUrl);
    }

    private static string HmacSha512(string key, string data)
    {
        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }
}
