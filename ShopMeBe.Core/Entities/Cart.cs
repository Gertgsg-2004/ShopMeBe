namespace ShopMeBe.Core.Entities;

public class Cart
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public decimal Total => Items.Sum(i => i.SubTotal);
}
