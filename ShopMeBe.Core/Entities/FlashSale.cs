namespace ShopMeBe.Core.Entities;

public class FlashSale
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<FlashSaleItem> Items { get; set; } = new List<FlashSaleItem>();
}
