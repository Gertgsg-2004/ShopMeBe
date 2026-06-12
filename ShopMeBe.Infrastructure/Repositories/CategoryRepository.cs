using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.DTOs.Product;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Interfaces;
using ShopMeBe.Infrastructure.Data;

namespace ShopMeBe.Infrastructure.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly ApplicationDbContext _context;

    public CategoryRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    private static CategoryDto MapToDto(Category c, int productCount = 0) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Slug = c.Slug,
        Description = c.Description,
        ImageUrl = c.ImageUrl,
        ParentId = c.ParentId,
        ParentName = c.Parent?.Name,
        SortOrder = c.SortOrder,
        IsActive = c.IsActive,
        ProductCount = productCount,
        FilterConfig = c.FilterConfig
    };

    public async Task<List<CategoryDto>> GetAllAsync()
    {
        var categories = await _context.Categories
            .Include(c => c.Parent)
            .Include(c => c.Children)
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        var productCounts = await _context.Products
            .Where(p => p.IsActive)
            .GroupBy(p => p.CategoryId)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Count);

        return categories.Select(c => MapToDto(c, productCounts.GetValueOrDefault(c.Id))).ToList();
    }

    public async Task<CategoryDto?> GetByIdAsync(int id)
    {
        var c = await _context.Categories.Include(x => x.Parent).FirstOrDefaultAsync(x => x.Id == id);
        return c == null ? null : MapToDto(c);
    }

    public async Task<CategoryDto?> GetBySlugAsync(string slug)
    {
        var c = await _context.Categories.Include(x => x.Parent).FirstOrDefaultAsync(x => x.Slug == slug && x.IsActive);
        return c == null ? null : MapToDto(c);
    }

    public async Task<Category> CreateAsync(Category category)
    {
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
        return category;
    }

    public async Task<Category> UpdateAsync(Category category)
    {
        _context.Categories.Update(category);
        await _context.SaveChangesAsync();
        return category;
    }

    public async Task DeleteAsync(int id)
    {
        var cat = await _context.Categories.FindAsync(id);
        if (cat != null)
        {
            _context.Categories.Remove(cat);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(int id) =>
        await _context.Categories.AnyAsync(c => c.Id == id);
}
