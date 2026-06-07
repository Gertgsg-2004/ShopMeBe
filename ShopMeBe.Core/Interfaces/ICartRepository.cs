using ShopMeBe.Core.DTOs.Cart;
using ShopMeBe.Core.Entities;

namespace ShopMeBe.Core.Interfaces;

public interface ICartRepository
{
    Task<CartDto?> GetCartAsync(string userId);
    Task<Cart> GetOrCreateCartAsync(string userId);
    Task AddItemAsync(string userId, int productId, int quantity, decimal price);
    Task UpdateItemAsync(int cartItemId, int quantity);
    Task RemoveItemAsync(int cartItemId);
    Task ClearCartAsync(string userId);
}
