using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Interfaces;
using ShopMeBe.Infrastructure.Data;

namespace ShopMeBe.Infrastructure.Repositories;

public class CouponRepository : ICouponRepository
{
    private readonly ApplicationDbContext _context;

    public CouponRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Coupon>> GetAllAsync() =>
        await _context.Coupons.OrderByDescending(c => c.CreatedAt).ToListAsync();

    public async Task<Coupon?> GetByCodeAsync(string code) =>
        await _context.Coupons.FirstOrDefaultAsync(c => c.Code == code.ToUpper());

    public async Task<Coupon?> GetByIdAsync(int id) =>
        await _context.Coupons.FindAsync(id);

    public async Task<Coupon> CreateAsync(Coupon coupon)
    {
        coupon.Code = coupon.Code.ToUpper();
        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync();
        return coupon;
    }

    public async Task<Coupon> UpdateAsync(Coupon coupon)
    {
        coupon.Code = coupon.Code.ToUpper();
        _context.Coupons.Update(coupon);
        await _context.SaveChangesAsync();
        return coupon;
    }

    public async Task DeleteAsync(int id)
    {
        var coupon = await _context.Coupons.FindAsync(id);
        if (coupon != null)
        {
            _context.Coupons.Remove(coupon);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<(bool IsValid, string Message, decimal Discount)> ValidateAsync(string code, decimal orderAmount)
    {
        var coupon = await GetByCodeAsync(code);
        if (coupon == null)
            return (false, "Mã giảm giá không tồn tại", 0);

        if (!coupon.IsActive)
            return (false, "Mã giảm giá không còn hiệu lực", 0);

        if (coupon.StartDate.HasValue && DateTime.UtcNow < coupon.StartDate.Value)
            return (false, "Mã giảm giá chưa đến thời gian sử dụng", 0);

        if (coupon.EndDate.HasValue && DateTime.UtcNow > coupon.EndDate.Value)
            return (false, "Mã giảm giá đã hết hạn", 0);

        if (coupon.UsageLimit.HasValue && coupon.UsedCount >= coupon.UsageLimit.Value)
            return (false, "Mã giảm giá đã hết lượt sử dụng", 0);

        if (coupon.MinOrderAmount.HasValue && orderAmount < coupon.MinOrderAmount.Value)
            return (false, $"Đơn hàng tối thiểu {coupon.MinOrderAmount:N0}đ để dùng mã này", 0);

        decimal discount;
        if (coupon.IsPercent)
        {
            discount = orderAmount * coupon.Value / 100;
            if (coupon.MaxDiscount.HasValue && discount > coupon.MaxDiscount.Value)
                discount = coupon.MaxDiscount.Value;
        }
        else
        {
            discount = coupon.Value;
        }

        return (true, "Áp dụng mã giảm giá thành công", discount);
    }
}
