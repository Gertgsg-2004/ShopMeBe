using ShopMeBe.Core.Entities;

namespace ShopMeBe.Core.Interfaces;

public interface ICouponRepository
{
    Task<List<Coupon>> GetAllAsync();
    Task<Coupon?> GetByCodeAsync(string code);
    Task<Coupon?> GetByIdAsync(int id);
    Task<Coupon> CreateAsync(Coupon coupon);
    Task<Coupon> UpdateAsync(Coupon coupon);
    Task DeleteAsync(int id);
    Task<(bool IsValid, string Message, decimal Discount)> ValidateAsync(string code, decimal orderAmount);
    Task IncrementUsageAsync(string code);
}
