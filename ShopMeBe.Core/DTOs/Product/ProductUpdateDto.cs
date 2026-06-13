using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ShopMeBe.Core.DTOs.Product;

public class ProductUpdateDto
{
    [Required]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ShortDescription { get; set; }

    [Required, Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    public decimal? SalePrice { get; set; }

    [Range(0, double.MaxValue)]
    public decimal CostPrice { get; set; } = 0;

    [Required, Range(0, int.MaxValue)]
    public int Stock { get; set; }

    public string? Sku { get; set; }

    [Required]
    public int CategoryId { get; set; }

    public bool IsFeatured { get; set; }
    public bool IsNew { get; set; }
    public bool IsActive { get; set; } = true;

    public List<IFormFile>? NewImages { get; set; }
    public List<int>? DeleteImageIds { get; set; }
}
