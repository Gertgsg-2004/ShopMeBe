namespace ShopMeBe.Core.Entities;

public class PosSession
{
    public int Id { get; set; }
    public string CashierId { get; set; } = string.Empty;
    public ApplicationUser Cashier { get; set; } = null!;
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
    public decimal OpeningCash { get; set; }
    public decimal ClosingCash { get; set; }
    public bool IsOpen { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
