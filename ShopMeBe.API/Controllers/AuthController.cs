using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.DTOs.Auth;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Interfaces;
using System.Security.Claims;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ITokenService _tokenService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ITokenService tokenService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponseDto<AuthResponseDto>>> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<AuthResponseDto>.Fail("Dữ liệu không hợp lệ",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()));

        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
            return BadRequest(ApiResponseDto<AuthResponseDto>.Fail("Email đã được sử dụng"));

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FullName = dto.FullName,
            Phone = dto.Phone,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(ApiResponseDto<AuthResponseDto>.Fail("Đăng ký thất bại",
                result.Errors.Select(e => e.Description).ToList()));

        await _userManager.AddToRoleAsync(user, "Customer");

        var token = await _tokenService.GenerateAccessTokenAsync(user);
        var roles = await _userManager.GetRolesAsync(user);

        return Ok(ApiResponseDto<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token = token,
            RefreshToken = _tokenService.GenerateRefreshToken(),
            Expiration = DateTime.UtcNow.AddHours(24),
            UserId = user.Id,
            Email = user.Email!,
            FullName = user.FullName,
            Roles = roles
        }, "Đăng ký thành công"));
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponseDto<AuthResponseDto>>> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<AuthResponseDto>.Fail("Dữ liệu không hợp lệ"));

        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null || !user.IsActive)
            return Unauthorized(ApiResponseDto<AuthResponseDto>.Fail("Email hoặc mật khẩu không đúng"));

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
        if (!result.Succeeded)
            return Unauthorized(ApiResponseDto<AuthResponseDto>.Fail("Email hoặc mật khẩu không đúng"));

        var token = await _tokenService.GenerateAccessTokenAsync(user);
        var roles = await _userManager.GetRolesAsync(user);

        return Ok(ApiResponseDto<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token = token,
            RefreshToken = _tokenService.GenerateRefreshToken(),
            Expiration = DateTime.UtcNow.AddHours(24),
            UserId = user.Id,
            Email = user.Email!,
            FullName = user.FullName,
            Avatar = user.Avatar,
            Roles = roles
        }, "Đăng nhập thành công"));
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<ActionResult<ApiResponseDto<object>>> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null) return NotFound(ApiResponseDto<object>.Fail("Người dùng không tồn tại"));

        return Ok(ApiResponseDto<object>.Ok(new
        {
            user.Id,
            user.FullName,
            user.Email,
            user.Phone,
            user.Address,
            user.Avatar,
            user.DateOfBirth,
            user.CreatedAt
        }));
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<ApiResponseDto<object>>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy người dùng"));

        user.FullName = dto.FullName;
        user.Phone = dto.Phone;
        user.Address = dto.Address;
        user.DateOfBirth = dto.DateOfBirth;

        await _userManager.UpdateAsync(user);
        return Ok(ApiResponseDto<object>.Ok(new { }, "Cập nhật hồ sơ thành công"));
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<ActionResult<ApiResponseDto<object>>> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy người dùng"));

        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded)
            return BadRequest(ApiResponseDto<object>.Fail("Đổi mật khẩu thất bại",
                result.Errors.Select(e => e.Description).ToList()));

        return Ok(ApiResponseDto<object>.Ok(new { }, "Đổi mật khẩu thành công"));
    }
}
