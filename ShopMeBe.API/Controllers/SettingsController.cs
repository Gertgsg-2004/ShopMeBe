using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Infrastructure.Data;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _env;

    public SettingsController(ApplicationDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpGet("bank-info")]
    public async Task<IActionResult> GetBankInfo()
    {
        var settings = await _context.ShopSettings.ToListAsync();
        var dict = settings.ToDictionary(s => s.Key, s => s.Value);
        return Ok(ApiResponseDto<object>.Ok(new
        {
            bankName = dict.GetValueOrDefault("bank_name", ""),
            bankBranch = dict.GetValueOrDefault("bank_branch", ""),
            accountNo = dict.GetValueOrDefault("bank_account_no", ""),
            accountName = dict.GetValueOrDefault("bank_account_name", ""),
            qrImageUrl = dict.GetValueOrDefault("bank_qr_url", "")
        }));
    }

    [HttpGet("shipping")]
    public async Task<IActionResult> GetShipping()
    {
        var settings = await _context.ShopSettings
            .Where(s => s.Key == "shipping_fee" || s.Key == "free_ship_threshold")
            .ToListAsync();
        var dict = settings.ToDictionary(s => s.Key, s => s.Value);
        return Ok(ApiResponseDto<object>.Ok(new
        {
            shippingFee = decimal.TryParse(dict.GetValueOrDefault("shipping_fee"), out var fee) ? fee : 30000,
            freeShipThreshold = decimal.TryParse(dict.GetValueOrDefault("free_ship_threshold"), out var th) ? th : 500000
        }));
    }

    [HttpPut("shipping")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateShipping([FromBody] ShippingSettingsDto dto)
    {
        if (dto.ShippingFee < 0 || dto.FreeShipThreshold < 0)
            return BadRequest(ApiResponseDto<object>.Fail("Giá trị không hợp lệ"));

        var updates = new Dictionary<string, string>
        {
            ["shipping_fee"] = dto.ShippingFee.ToString("0"),
            ["free_ship_threshold"] = dto.FreeShipThreshold.ToString("0"),
        };
        var settings = await _context.ShopSettings.Where(s => updates.Keys.Contains(s.Key)).ToListAsync();
        foreach (var kv in updates)
        {
            var s = settings.FirstOrDefault(x => x.Key == kv.Key);
            if (s != null) s.Value = kv.Value;
            else _context.ShopSettings.Add(new Core.Entities.ShopSettings { Key = kv.Key, Value = kv.Value });
        }
        await _context.SaveChangesAsync();
        return Ok(ApiResponseDto<object>.Ok(new { }, "Cập nhật phí vận chuyển thành công"));
    }

    [HttpPut("bank-info")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateBankInfo([FromBody] BankInfoDto dto)
    {
        var updates = new Dictionary<string, string>
        {
            ["bank_name"] = dto.BankName ?? "",
            ["bank_branch"] = dto.BankBranch ?? "",
            ["bank_account_no"] = dto.AccountNo ?? "",
            ["bank_account_name"] = dto.AccountName ?? "",
            ["bank_qr_url"] = dto.QrImageUrl ?? "",
        };

        var settings = await _context.ShopSettings.ToListAsync();
        foreach (var kv in updates)
        {
            var s = settings.FirstOrDefault(x => x.Key == kv.Key);
            if (s != null) s.Value = kv.Value;
        }
        await _context.SaveChangesAsync();
        return Ok(ApiResponseDto<object>.Ok(new { }, "Cập nhật thông tin ngân hàng thành công"));
    }

    [HttpPost("upload-qr")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UploadQr([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponseDto<object>.Fail("Không có file"));

        var ext = Path.GetExtension(file.FileName).ToLower();
        if (!new[] { ".jpg", ".jpeg", ".png", ".webp" }.Contains(ext))
            return BadRequest(ApiResponseDto<object>.Fail("Chỉ hỗ trợ ảnh JPG, PNG, WEBP"));
        var allowedMimes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedMimes.Contains(file.ContentType.ToLower()))
            return BadRequest(ApiResponseDto<object>.Fail("File không hợp lệ"));
        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(ApiResponseDto<object>.Fail("Ảnh không được vượt quá 5MB"));

        var uploadsPath = Path.Combine(_env.WebRootPath, "uploads", "qr");
        Directory.CreateDirectory(uploadsPath);

        var fileName = $"bank-qr{ext}";
        var filePath = Path.Combine(uploadsPath, fileName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var url = $"/uploads/qr/{fileName}?t={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";

        var setting = await _context.ShopSettings.FirstOrDefaultAsync(s => s.Key == "bank_qr_url");
        if (setting != null) { setting.Value = url; await _context.SaveChangesAsync(); }

        return Ok(ApiResponseDto<object>.Ok(new { url }, "Upload QR thành công"));
    }
}

public class ShippingSettingsDto
{
    public decimal ShippingFee { get; set; }
    public decimal FreeShipThreshold { get; set; }
}

public class BankInfoDto
{
    public string? BankName { get; set; }
    public string? BankBranch { get; set; }
    public string? AccountNo { get; set; }
    public string? AccountName { get; set; }
    public string? QrImageUrl { get; set; }
}
