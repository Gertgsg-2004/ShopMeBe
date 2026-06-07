namespace ShopMeBe.Core.Entities;

public class FlashSaleItem
{
    public int Id { get; set; }
    public int FlashSaleId { get; set; }
    public FlashSale FlashSale { get; set; } = null!;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public decimal SalePrice { get; set; }
    public int Quantity { get; set; }
    public int SoldQuantity { get; set; } = 0;
}
