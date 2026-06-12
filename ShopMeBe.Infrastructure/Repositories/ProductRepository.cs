using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.DTOs.Product;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Interfaces;
using ShopMeBe.Infrastructure.Data;

namespace ShopMeBe.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly ApplicationDbContext _context;

    public ProductRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    private IQueryable<Product> BaseQuery() =>
        _context.Products
            .Include(p => p.Category)
            .Include(p => p.Images);

    private static ProductDto MapToDto(Product p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Slug = p.Slug,
        Description = p.Description,
        ShortDescription = p.ShortDescription,
        Price = p.Price,
        SalePrice = p.SalePrice,
        Stock = p.Stock,
        Sku = p.Sku,
        CategoryId = p.CategoryId,
        CategoryName = p.Category?.Name ?? "",
        IsFeatured = p.IsFeatured,
        IsNew = p.IsNew,
        IsActive = p.IsActive,
        SoldCount = p.SoldCount,
        AverageRating = p.AverageRating,
        ReviewCount = p.ReviewCount,
        MainImageUrl = p.Images.FirstOrDefault(i => i.IsMain)?.ImageUrl ?? p.Images.FirstOrDefault()?.ImageUrl,
        ImageUrls = p.Images.OrderBy(i => i.SortOrder).Select(i => i.ImageUrl).ToList(),
        CreatedAt = p.CreatedAt
    };

    public async Task<PagedResultDto<ProductDto>> GetProductsAsync(ProductFilterDto filter)
    {
        var query = BaseQuery().Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(filter.Search))
            query = query.Where(p => p.Name.Contains(filter.Search) || (p.Description != null && p.Description.Contains(filter.Search)));

        if (filter.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == filter.CategoryId.Value);

        if (filter.MinPrice.HasValue)
            query = query.Where(p => (p.SalePrice ?? p.Price) >= filter.MinPrice.Value);

        if (filter.MaxPrice.HasValue)
            query = query.Where(p => (p.SalePrice ?? p.Price) <= filter.MaxPrice.Value);

        if (filter.IsFeatured.HasValue)
            query = query.Where(p => p.IsFeatured == filter.IsFeatured.Value);

        if (filter.IsNew.HasValue)
            query = query.Where(p => p.IsNew == filter.IsNew.Value);

        query = filter.SortBy?.ToLower() switch
        {
            "price" => filter.SortOrder == "asc" ? query.OrderBy(p => p.SalePrice ?? p.Price) : query.OrderByDescending(p => p.SalePrice ?? p.Price),
            "name" => filter.SortOrder == "asc" ? query.OrderBy(p => p.Name) : query.OrderByDescending(p => p.Name),
            "sold" => query.OrderByDescending(p => p.SoldCount),
            "rating" => query.OrderByDescending(p => p.AverageRating),
            _ => query.OrderByDescending(p => p.CreatedAt)
        };

        var total = await query.CountAsync();
        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResultDto<ProductDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = total,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<ProductDto?> GetProductByIdAsync(int id)
    {
        var p = await BaseQuery().FirstOrDefaultAsync(x => x.Id == id);
        return p == null ? null : MapToDto(p);
    }

    public async Task<ProductDto?> GetProductBySlugAsync(string slug)
    {
        var p = await BaseQuery().FirstOrDefaultAsync(x => x.Slug == slug && x.IsActive);
        return p == null ? null : MapToDto(p);
    }

    public async Task<Product> CreateAsync(Product product)
    {
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return product;
    }

    public async Task<Product> UpdateAsync(Product product)
    {
        product.UpdatedAt = DateTime.UtcNow;
        _context.Products.Update(product);
        await _context.SaveChangesAsync();
        return product;
    }

    public async Task DeleteAsync(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product != null)
        {
            // Soft delete: keep row for order history, hide from all queries via global filter
            product.IsDeleted = true;
            product.IsActive = false;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(int id) =>
        await _context.Products.AnyAsync(p => p.Id == id);

    public async Task<List<ProductDto>> GetFeaturedProductsAsync(int count = 8)
    {
        var items = await BaseQuery()
            .Where(p => p.IsActive && p.IsFeatured)
            .OrderByDescending(p => p.CreatedAt)
            .Take(count)
            .ToListAsync();
        return items.Select(MapToDto).ToList();
    }

    public async Task<List<ProductDto>> GetNewProductsAsync(int count = 8)
    {
        var items = await BaseQuery()
            .Where(p => p.IsActive && p.IsNew)
            .OrderByDescending(p => p.CreatedAt)
            .Take(count)
            .ToListAsync();
        return items.Select(MapToDto).ToList();
    }

    public async Task<List<ProductDto>> GetRelatedProductsAsync(int productId, int categoryId, int count = 4)
    {
        var items = await BaseQuery()
            .Where(p => p.IsActive && p.CategoryId == categoryId && p.Id != productId)
            .OrderByDescending(p => p.SoldCount)
            .Take(count)
            .ToListAsync();
        return items.Select(MapToDto).ToList();
    }

    public async Task UpdateStockAsync(int productId, int quantity)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product != null)
        {
            product.Stock -= quantity;
            product.SoldCount += quantity;
            await _context.SaveChangesAsync();
        }
    }

    public async Task UpdateRatingAsync(int productId)
    {
        var reviews = await _context.Reviews
            .Where(r => r.ProductId == productId && r.IsApproved)
            .ToListAsync();

        var product = await _context.Products.FindAsync(productId);
        if (product != null)
        {
            product.ReviewCount = reviews.Count;
            product.AverageRating = reviews.Count > 0 ? reviews.Average(r => r.Rating) : 0;
            await _context.SaveChangesAsync();
        }
    }
}
