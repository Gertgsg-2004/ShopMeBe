using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.Entities;

namespace ShopMeBe.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        await context.Database.MigrateAsync();

        // Seed roles
        string[] roles = { "Admin", "Customer" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // Seed admin user
        var adminEmail = "admin@shopmebe.vn";
        var admin = await userManager.FindByEmailAsync(adminEmail);
        if (admin == null)
        {
            admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "Quản trị viên",
                IsActive = true,
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(admin, "Admin@123456");
            if (result.Succeeded)
                await userManager.AddToRoleAsync(admin, "Admin");
        }

        // Seed sample coupon
        if (!await context.Coupons.AnyAsync())
        {
            context.Coupons.AddRange(
                new Core.Entities.Coupon
                {
                    Code = "WELCOME10",
                    Description = "Giảm 10% cho đơn hàng đầu tiên",
                    IsPercent = true,
                    Value = 10,
                    MinOrderAmount = 200000,
                    MaxDiscount = 100000,
                    IsActive = true,
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddYears(1)
                },
                new Core.Entities.Coupon
                {
                    Code = "FREESHIP",
                    Description = "Miễn phí vận chuyển",
                    IsPercent = false,
                    Value = 30000,
                    MinOrderAmount = 300000,
                    IsActive = true,
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddYears(1)
                }
            );
            await context.SaveChangesAsync();
        }
    }
}
