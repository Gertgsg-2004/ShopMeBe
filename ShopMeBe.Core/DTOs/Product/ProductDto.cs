namespace ShopMeBe.Core.DTOs.Product;

public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ShortDescription { get; set; }
    public decimal Price { get; set; }
    public decimal? SalePrice { get; set; }
    public decimal? CostPrice { get; set; } // Giá vốn - chỉ trả về cho Admin
    public decimal DisplayPrice => SalePrice.HasValue && SalePrice < Price ? SalePrice.Value : Price;
    public int Stock { get; set; }
    public string? Sku { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public bool IsFeatured { get; set; }
    public bool IsNew { get; set; }
    public bool IsActive { get; set; }
    public int SoldCount { get; set; }
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public string? MainImageUrl { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}
