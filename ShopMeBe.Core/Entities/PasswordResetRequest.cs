namespace ShopMeBe.Core.Entities;

public class PasswordResetRequest
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Completed
    public string? AdminId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public ApplicationUser User { get; set; } = null!;
}
