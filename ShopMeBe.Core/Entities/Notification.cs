namespace ShopMeBe.Core.Entities;

public class Notification
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "System"; // System, Group, Personal
    public string? TargetUserId { get; set; }
    public string? TargetGroup { get; set; }
    public string CreatedById { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public ICollection<NotificationRead> ReadBy { get; set; } = new List<NotificationRead>();
}

public class NotificationRead
{
    public int Id { get; set; }
    public int NotificationId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTime ReadAt { get; set; } = DateTime.UtcNow;
    public Notification? Notification { get; set; }
}
