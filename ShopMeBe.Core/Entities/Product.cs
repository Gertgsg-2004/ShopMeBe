namespace ShopMeBe.Core.Entities;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ShortDescription { get; set; }
    public decimal Price { get; set; }
    public decimal? SalePrice { get; set; }
    public int Stock { get; set; } = 0;
    public string? Sku { get; set; }
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public bool IsFeatured { get; set; } = false;
    public bool IsNew { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public int SoldCount { get; set; } = 0;
    public double AverageRating { get; set; } = 0;
    public int ReviewCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<FlashSaleItem> FlashSaleItems { get; set; } = new List<FlashSaleItem>();
}
