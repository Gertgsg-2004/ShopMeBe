namespace ShopMeBe.Core.Entities;

public class InventoryCheck
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public DateTime CheckDate { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
    public string? CreatedById { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<InventoryCheckItem> Items { get; set; } = new List<InventoryCheckItem>();
}
