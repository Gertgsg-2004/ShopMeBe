using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.DTOs.Cart;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Interfaces;
using ShopMeBe.Infrastructure.Data;

namespace ShopMeBe.Infrastructure.Repositories;

public class CartRepository : ICartRepository
{
    private readonly ApplicationDbContext _context;

    public CartRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CartDto?> GetCartAsync(string userId)
    {
        var cart = await _context.Carts
            .Include(c => c.Items)
            .ThenInclude(i => i.Product)
            .ThenInclude(p => p.Images)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null) return null;

        return new CartDto
        {
            Id = cart.Id,
            Items = cart.Items.Select(i => new CartItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product.Name,
                ProductImage = i.Product.Images.FirstOrDefault(img => img.IsMain)?.ImageUrl ?? i.Product.Images.FirstOrDefault()?.ImageUrl,
                Price = i.Price,
                Quantity = i.Quantity,
                SubTotal = i.Price * i.Quantity,
                Stock = i.Product.Stock
            }).ToList(),
            Total = cart.Items.Sum(i => i.Price * i.Quantity),
            ItemCount = cart.Items.Sum(i => i.Quantity)
        };
    }

    public async Task<Cart> GetOrCreateCartAsync(string userId)
    {
        var cart = await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
        {
            cart = new Cart { UserId = userId };
            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();
        }

        return cart;
    }

    public async Task AddItemAsync(string userId, int productId, int quantity, decimal price)
    {
        var cart = await GetOrCreateCartAsync(userId);
        var existing = cart.Items.FirstOrDefault(i => i.ProductId == productId);

        if (existing != null)
        {
            existing.Quantity += quantity;
        }
        else
        {
            cart.Items.Add(new CartItem { CartId = cart.Id, ProductId = productId, Quantity = quantity, Price = price });
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task UpdateItemAsync(int cartItemId, int quantity)
    {
        var item = await _context.CartItems.FindAsync(cartItemId);
        if (item != null)
        {
            item.Quantity = quantity;
            await _context.SaveChangesAsync();
        }
    }

    public async Task RemoveItemAsync(int cartItemId)
    {
        var item = await _context.CartItems.FindAsync(cartItemId);
        if (item != null)
        {
            _context.CartItems.Remove(item);
            await _context.SaveChangesAsync();
        }
    }

    public async Task ClearCartAsync(string userId)
    {
        var cart = await _context.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == userId);
        if (cart != null)
        {
            _context.CartItems.RemoveRange(cart.Items);
            await _context.SaveChangesAsync();
        }
    }
}
