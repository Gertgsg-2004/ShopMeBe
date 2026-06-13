using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.DTOs.Auth;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Interfaces;
using ShopMeBe.Infrastructure.Data;
using System.Security.Claims;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly ApplicationDbContext _context;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ITokenService tokenService,
        ApplicationDbContext context)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _context = context;
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

        if (!string.IsNullOrWhiteSpace(dto.Phone))
        {
            var phoneExists = _userManager.Users.Any(u => u.Phone == dto.Phone);
            if (phoneExists)
                return BadRequest(ApiResponseDto<AuthResponseDto>.Fail("Số điện thoại đã được sử dụng"));
        }

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

        return Ok(ApiResponseDto<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token = "",
            RefreshToken = "",
            Expiration = DateTime.UtcNow,
            UserId = user.Id,
            Email = user.Email!,
            FullName = user.FullName,
            Roles = new List<string>()
        }, "Đăng ký thành công! Vui lòng đăng nhập để tiếp tục."));
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

        var refreshToken = _tokenService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        return Ok(ApiResponseDto<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            Expiration = DateTime.UtcNow.AddHours(24),
            UserId = user.Id,
            Email = user.Email!,
            FullName = user.FullName,
            Avatar = user.Avatar,
            Roles = roles
        }, "Đăng nhập thành công"));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponseDto<AuthResponseDto>>> Refresh([FromBody] RefreshRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RefreshToken))
            return BadRequest(ApiResponseDto<AuthResponseDto>.Fail("Thiếu refresh token"));

        var user = await _userManager.Users.FirstOrDefaultAsync(u =>
            u.RefreshToken == dto.RefreshToken && u.RefreshTokenExpiry > DateTime.UtcNow && u.IsActive);
        if (user == null)
            return Unauthorized(ApiResponseDto<AuthResponseDto>.Fail("Refresh token không hợp lệ hoặc đã hết hạn"));

        var token = await _tokenService.GenerateAccessTokenAsync(user);
        var roles = await _userManager.GetRolesAsync(user);

        // Rotate refresh token on every use
        var newRefreshToken = _tokenService.GenerateRefreshToken();
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        return Ok(ApiResponseDto<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token = token,
            RefreshToken = newRefreshToken,
            Expiration = DateTime.UtcNow.AddHours(24),
            UserId = user.Id,
            Email = user.Email!,
            FullName = user.FullName,
            Avatar = user.Avatar,
            Roles = roles
        }));
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

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponseDto<object>>> ForgotPassword([FromBody] ForgotPasswordRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Phone))
            return BadRequest(ApiResponseDto<object>.Fail("Vui lòng nhập số điện thoại"));

        var user = _userManager.Users.FirstOrDefault(u => u.Phone == dto.Phone);
        if (user == null)
            return BadRequest(ApiResponseDto<object>.Fail("Số điện thoại không tồn tại trong hệ thống"));

        var existing = await _context.PasswordResetRequests
            .Where(r => r.UserId == user.Id && r.Status == "Pending")
            .FirstOrDefaultAsync();
        if (existing != null)
            return Ok(ApiResponseDto<object>.Ok(new { }, "Yêu cầu đặt lại mật khẩu đã được gửi, vui lòng chờ admin xử lý"));

        _context.PasswordResetRequests.Add(new PasswordResetRequest { UserId = user.Id });

        _context.Notifications.Add(new Notification
        {
            Title = "Yêu cầu đặt lại mật khẩu",
            Content = $"Khách hàng {user.FullName ?? user.Phone} (SĐT: {user.Phone}) yêu cầu đặt lại mật khẩu",
            Type = "AdminAlert",
            CreatedById = user.Id
        });

        await _context.SaveChangesAsync();

        return Ok(ApiResponseDto<object>.Ok(new { }, "Yêu cầu đã được gửi. Admin sẽ xử lý và thông báo qua số điện thoại của bạn."));
    }
}

public class ForgotPasswordRequestDto { public string Phone { get; set; } = string.Empty; }
public class RefreshRequestDto { public string RefreshToken { get; set; } = string.Empty; }
