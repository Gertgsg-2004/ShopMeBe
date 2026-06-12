using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Interfaces;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CouponsController : ControllerBase
{
    private readonly ICouponRepository _couponRepo;

    public CouponsController(ICouponRepository couponRepo)
    {
        _couponRepo = couponRepo;
    }

    [HttpPost("validate")]
    [Authorize]
    public async Task<ActionResult<ApiResponseDto<object>>> Validate([FromBody] ValidateCouponDto dto)
    {
        var (isValid, message, discount) = await _couponRepo.ValidateAsync(dto.Code, dto.OrderAmount);
        if (!isValid)
            return BadRequest(ApiResponseDto<object>.Fail(message));

        return Ok(ApiResponseDto<object>.Ok(new { discount, message }));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<ApiResponseDto<List<Coupon>>>> GetAll()
    {
        var result = await _couponRepo.GetAllAsync();
        return Ok(ApiResponseDto<List<Coupon>>.Ok(result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponseDto<Coupon>>> Create([FromBody] SaveCouponDto dto)
    {
        var coupon = new Coupon
        {
            Code = dto.Code,
            Description = dto.Description,
            IsPercent = dto.IsPercent,
            Value = dto.Value,
            MinOrderAmount = dto.MinOrderAmount,
            MaxDiscount = dto.MaxDiscount,
            UsageLimit = dto.UsageLimit,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsActive = dto.IsActive,
        };
        var created = await _couponRepo.CreateAsync(coupon);
        return Ok(ApiResponseDto<Coupon>.Ok(created, "Tạo mã giảm giá thành công"));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponseDto<Coupon>>> Update(int id, [FromBody] SaveCouponDto dto)
    {
        var existing = await _couponRepo.GetByIdAsync(id);
        if (existing == null) return NotFound(ApiResponseDto<Coupon>.Fail("Không tìm thấy mã giảm giá"));
        existing.Code = dto.Code;
        existing.Description = dto.Description;
        existing.IsPercent = dto.IsPercent;
        existing.Value = dto.Value;
        existing.MinOrderAmount = dto.MinOrderAmount;
        existing.MaxDiscount = dto.MaxDiscount;
        existing.UsageLimit = dto.UsageLimit;
        existing.StartDate = dto.StartDate;
        existing.EndDate = dto.EndDate;
        existing.IsActive = dto.IsActive;
        var updated = await _couponRepo.UpdateAsync(existing);
        return Ok(ApiResponseDto<Coupon>.Ok(updated, "Cập nhật thành công"));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponseDto<object>>> Delete(int id)
    {
        await _couponRepo.DeleteAsync(id);
        return Ok(ApiResponseDto<object>.Ok(new { }, "Xóa thành công"));
    }
}

public class ValidateCouponDto
{
    public string Code { get; set; } = string.Empty;
    public decimal OrderAmount { get; set; }
}

public class SaveCouponDto
{
    [System.ComponentModel.DataAnnotations.Required]
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPercent { get; set; }
    [System.ComponentModel.DataAnnotations.Range(0, double.MaxValue)]
    public decimal Value { get; set; }
    public decimal? MinOrderAmount { get; set; }
    public decimal? MaxDiscount { get; set; }
    public int? UsageLimit { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; } = true;
}
