using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ShopMeBe.Core.DTOs.Product;

public class ProductCreateDto
{
    [Required(ErrorMessage = "Tên sản phẩm là bắt buộc")]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
    public string? ShortDescription { get; set; }

    [Required, Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    public decimal? SalePrice { get; set; }

    [Required, Range(0, int.MaxValue)]
    public int Stock { get; set; }

    public string? Sku { get; set; }

    [Required]
    public int CategoryId { get; set; }

    public bool IsFeatured { get; set; } = false;
    public bool IsNew { get; set; } = false;

    public List<IFormFile>? Images { get; set; }
}
