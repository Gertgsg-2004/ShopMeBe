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
    public async Task<ActionResult<ApiResponseDto<Coupon>>> Create([FromBody] Coupon coupon)
    {
        var created = await _couponRepo.CreateAsync(coupon);
        return Ok(ApiResponseDto<Coupon>.Ok(created, "Tạo mã giảm giá thành công"));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponseDto<Coupon>>> Update(int id, [FromBody] Coupon coupon)
    {
        coupon.Id = id;
        var updated = await _couponRepo.UpdateAsync(coupon);
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
