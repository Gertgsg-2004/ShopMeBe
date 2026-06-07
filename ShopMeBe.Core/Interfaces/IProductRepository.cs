using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.DTOs.Product;
using ShopMeBe.Core.Entities;

namespace ShopMeBe.Core.Interfaces;

public interface IProductRepository
{
    Task<PagedResultDto<ProductDto>> GetProductsAsync(ProductFilterDto filter);
    Task<ProductDto?> GetProductByIdAsync(int id);
    Task<ProductDto?> GetProductBySlugAsync(string slug);
    Task<Product> CreateAsync(Product product);
    Task<Product> UpdateAsync(Product product);
    Task DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task<List<ProductDto>> GetFeaturedProductsAsync(int count = 8);
    Task<List<ProductDto>> GetNewProductsAsync(int count = 8);
    Task<List<ProductDto>> GetRelatedProductsAsync(int productId, int categoryId, int count = 4);
    Task UpdateStockAsync(int productId, int quantity);
    Task UpdateRatingAsync(int productId);
}
