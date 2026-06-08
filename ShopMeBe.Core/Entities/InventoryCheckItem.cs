namespace ShopMeBe.Core.Entities;

public class InventoryCheckItem
{
    public int Id { get; set; }
    public int InventoryCheckId { get; set; }
    public InventoryCheck InventoryCheck { get; set; } = null!;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int SystemStock { get; set; }
    public int ActualStock { get; set; }
    public int Difference => ActualStock - SystemStock;
}
