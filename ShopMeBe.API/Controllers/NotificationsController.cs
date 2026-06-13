using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.Entities;
using ShopMeBe.Infrastructure.Data;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public NotificationsController(ApplicationDbContext db) => _db = db;

    private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    // ── Customer endpoints ──────────────────────────────────────────────────

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetMyNotifications()
    {
        var uid = UserId;
        var notifications = await _db.Notifications
            .Where(n => n.IsActive && (
                n.Type == "System" ||
                (n.Type == "Personal" && n.TargetUserId == uid) ||
                n.Type == "Group"))
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();

        var readIds = (await _db.NotificationReads
            .Where(r => r.UserId == uid)
            .Select(r => r.NotificationId)
            .ToListAsync()).ToHashSet();

        var result = notifications.Select(n => new
        {
            n.Id, n.Title, n.Content, n.Type, n.CreatedAt,
            IsRead = readIds.Contains(n.Id)
        });

        return Ok(ApiResponseDto<object>.Ok(result));
    }

    [HttpGet("unread-count")]
    [Authorize]
    public async Task<IActionResult> GetUnreadCount()
    {
        var uid = UserId;
        var total = await _db.Notifications.CountAsync(n => n.IsActive && (
            n.Type == "System" ||
            (n.Type == "Personal" && n.TargetUserId == uid) ||
            n.Type == "Group"));

        var read = await _db.NotificationReads.CountAsync(r => r.UserId == uid);
        return Ok(ApiResponseDto<object>.Ok(new { unread = Math.Max(0, total - read) }));
    }

    [HttpPut("{id}/read")]
    [Authorize]
    public async Task<IActionResult> MarkRead(int id)
    {
        var uid = UserId!;
        var exists = await _db.NotificationReads.AnyAsync(r => r.NotificationId == id && r.UserId == uid);
        if (!exists)
        {
            _db.NotificationReads.Add(new NotificationRead { NotificationId = id, UserId = uid });
            await _db.SaveChangesAsync();
        }
        return Ok(ApiResponseDto<object>.Ok(new { }));
    }

    [HttpPut("read-all")]
    [Authorize]
    public async Task<IActionResult> MarkAllRead()
    {
        var uid = UserId!;
        var notifIds = await _db.Notifications
            .Where(n => n.IsActive && (n.Type == "System" || (n.Type == "Personal" && n.TargetUserId == uid) || n.Type == "Group"))
            .Select(n => n.Id).ToListAsync();

        var readIds = (await _db.NotificationReads.Where(r => r.UserId == uid).Select(r => r.NotificationId).ToListAsync()).ToHashSet();
        var toAdd = notifIds.Where(id => !readIds.Contains(id))
            .Select(id => new NotificationRead { NotificationId = id, UserId = uid });

        _db.NotificationReads.AddRange(toAdd);
        await _db.SaveChangesAsync();
        return Ok(ApiResponseDto<object>.Ok(new { }));
    }

    // ── Admin endpoints ─────────────────────────────────────────────────────

    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.Notifications
            .Where(n => n.IsActive)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new
            {
                n.Id, n.Title, n.Content, n.Type, n.TargetUserId, n.TargetGroup,
                n.CreatedById, n.CreatedAt, n.IsActive,
                ReadCount = n.ReadBy.Count
            }).ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(items));
    }

    [HttpPost("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateNotificationDto dto)
    {
        var notif = new Notification
        {
            Title = dto.Title,
            Content = dto.Content,
            Type = dto.Type,
            TargetUserId = dto.TargetUserId,
            TargetGroup = dto.TargetGroup,
            CreatedById = UserId!
        };
        _db.Notifications.Add(notif);
        await _db.SaveChangesAsync();
        return Ok(ApiResponseDto<object>.Ok(new { notif.Id }, "Đã tạo thông báo"));
    }

    [HttpDelete("admin/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var notif = await _db.Notifications.FindAsync(id);
        if (notif == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy thông báo"));
        notif.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(ApiResponseDto<object>.Ok(new { }, "Đã xóa thông báo"));
    }
}

public class CreateNotificationDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "System"; // System, Group, Personal
    public string? TargetUserId { get; set; }
    public string? TargetGroup { get; set; }
}
