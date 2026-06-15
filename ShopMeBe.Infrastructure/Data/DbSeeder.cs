using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.Entities;

namespace ShopMeBe.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        // Step 1: Ensure database exists (connect to master, create if missing)
        var connStr = context.Database.GetConnectionString()!;
        var masterConnStr = System.Text.RegularExpressions.Regex.Replace(
            connStr, @"Database=[^;]+", "Database=master", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        await using (var masterConn = new SqlConnection(masterConnStr))
        {
            await masterConn.OpenAsync();
            await using var checkCmd = masterConn.CreateCommand();
            checkCmd.CommandText = "SELECT COUNT(*) FROM sys.databases WHERE name = 'ShopMeBeDb_Dev'";
            var exists = (int)(await checkCmd.ExecuteScalarAsync())! > 0;
            if (!exists)
            {
                await using var createCmd = masterConn.CreateCommand();
                createCmd.CommandText = "CREATE DATABASE [ShopMeBeDb_Dev]";
                await createCmd.ExecuteNonQueryAsync();
            }
        }

        // Step 2: Create all tables if this is a fresh database
        await context.Database.EnsureCreatedAsync();

        // Step 3: Add CostPrice column if missing (schema update for existing DBs)
        await using (var conn = new SqlConnection(connStr))
        {
            await conn.OpenAsync();
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'CostPrice')
                BEGIN
                    ALTER TABLE Products ADD CostPrice decimal(18,2) NOT NULL DEFAULT 0
                END";
            await cmd.ExecuteNonQueryAsync();
        }

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

        // Seed staff roles
        string[] staffRoles = { "CSKH", "Ketoan", "Kho" };
        foreach (var role in staffRoles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // Seed sample products
        if (!await context.Products.AnyAsync())
        {
            var now = DateTime.UtcNow;
            context.Products.AddRange(
                // Đồ bà bầu (categoryId=1)
                new Core.Entities.Product { Name = "Váy bầu hoa nhí dáng suông", Slug = "vay-bau-hoa-nhi-dang-suong", CategoryId = 1, Price = 185000, SalePrice = 155000, Stock = 50, Description = "Váy bầu thoáng mát, họa tiết hoa nhí xinh xắn, phù hợp mặc hàng ngày.", IsActive = true, CreatedAt = now },
                new Core.Entities.Product { Name = "Quần bầu lưng thun co giãn", Slug = "quan-bau-lung-thun-co-gian", CategoryId = 1, Price = 120000, Stock = 80, Description = "Quần bầu lưng thun mềm, thoải mái, phù hợp cho mọi giai đoạn thai kỳ.", IsActive = true, CreatedAt = now },
                new Core.Entities.Product { Name = "Áo bầu công sở tay lỡ", Slug = "ao-bau-cong-so-tay-lo", CategoryId = 1, Price = 220000, SalePrice = 190000, Stock = 30, Description = "Áo bầu lịch sự, phù hợp đi làm văn phòng.", IsActive = true, CreatedAt = now },

                // Đồ sơ sinh (categoryId=2)
                new Core.Entities.Product { Name = "Bộ bodysuit sơ sinh cài nút", Slug = "bo-bodysuit-so-sinh-cai-nut", CategoryId = 2, Price = 95000, SalePrice = 79000, Stock = 100, Description = "Bodysuit cotton mềm mại, an toàn cho da bé sơ sinh.", IsActive = true, CreatedAt = now },
                new Core.Entities.Product { Name = "Khăn xô sơ sinh 3 lớp (hộp 10 cái)", Slug = "khan-xo-so-sinh-3-lop-hop-10-cai", CategoryId = 2, Price = 150000, Stock = 60, Description = "Khăn xô cotton 3 lớp mềm, thấm hút tốt cho bé.", IsActive = true, CreatedAt = now },
                new Core.Entities.Product { Name = "Bộ quần áo sơ sinh gift set 10 món", Slug = "bo-quan-ao-so-sinh-gift-set-10-mon", CategoryId = 2, Price = 450000, SalePrice = 390000, Stock = 25, Description = "Bộ quà tặng sơ sinh đầy đủ 10 món thiết yếu.", IsActive = true, CreatedAt = now },

                // Đồ chơi (categoryId=3)
                new Core.Entities.Product { Name = "Thảm chơi nhạc nước cho bé", Slug = "tham-choi-nhac-nuoc-cho-be", CategoryId = 3, Price = 280000, SalePrice = 249000, Stock = 40, Description = "Thảm chơi nhạc nước kích thích vận động và phát triển giác quan.", IsActive = true, CreatedAt = now },
                new Core.Entities.Product { Name = "Bộ xếp hình gỗ 50 chi tiết", Slug = "bo-xep-hinh-go-50-chi-tiet", CategoryId = 3, Price = 195000, Stock = 35, Description = "Bộ xếp hình gỗ màu sắc giúp phát triển tư duy sáng tạo.", IsActive = true, CreatedAt = now },

                // Sữa và thực phẩm (categoryId=4)
                new Core.Entities.Product { Name = "Sữa Nan Optipro 1 900g (0-6 tháng)", Slug = "sua-nan-optipro-1-900g", CategoryId = 4, Price = 520000, SalePrice = 489000, Stock = 45, Description = "Sữa bột Nestlé NAN Optipro 1 cho trẻ 0-6 tháng.", IsActive = true, CreatedAt = now },
                new Core.Entities.Product { Name = "Sữa Similac IQ Plus số 2 900g", Slug = "sua-similac-iq-plus-so-2-900g", CategoryId = 4, Price = 610000, Stock = 30, Description = "Sữa Similac IQ Plus công thức thông minh cho bé 6-12 tháng.", IsActive = true, CreatedAt = now },
                new Core.Entities.Product { Name = "Cháo dinh dưỡng ăn dặm hữu cơ (hộp 200g)", Slug = "chao-dinh-duong-an-dam-huu-co", CategoryId = 4, Price = 85000, SalePrice = 72000, Stock = 70, Description = "Cháo ăn dặm hữu cơ cho bé từ 6 tháng, không chất bảo quản.", IsActive = true, CreatedAt = now },

                // Phụ kiện (categoryId=5)
                new Core.Entities.Product { Name = "Địu em bé ergonomic 4 tư thế", Slug = "diu-em-be-ergonomic-4-tu-the", CategoryId = 5, Price = 650000, SalePrice = 590000, Stock = 20, Description = "Địu ergonomic hỗ trợ 4 tư thế địu, an toàn cột sống bé.", IsActive = true, CreatedAt = now },
                new Core.Entities.Product { Name = "Xe đẩy em bé gấp gọn du lịch", Slug = "xe-day-em-be-gap-gon-du-lich", CategoryId = 5, Price = 1850000, SalePrice = 1590000, Stock = 10, Description = "Xe đẩy gấp gọn nhỏ nhẹ, tiện mang theo máy bay.", IsActive = true, CreatedAt = now },

                // Bỉm (categoryId=6)
                new Core.Entities.Product { Name = "Bỉm Merries size S 80 miếng (4-8kg)", Slug = "bim-merries-size-s-80-mieng", CategoryId = 6, Price = 285000, SalePrice = 259000, Stock = 80, Description = "Bỉm Merries Nhật Bản size S siêu mềm, thấm hút nhanh.", IsActive = true, CreatedAt = now },
                new Core.Entities.Product { Name = "Bỉm Huggies DryPants size M 62 miếng", Slug = "bim-huggies-drypants-size-m-62-mieng", CategoryId = 6, Price = 265000, Stock = 60, Description = "Bỉm quần Huggies DryPants size M cho bé 7-12kg.", IsActive = true, CreatedAt = now },
                new Core.Entities.Product { Name = "Bỉm Bobby Newborn size NB 60 miếng", Slug = "bim-bobby-newborn-size-nb-60-mieng", CategoryId = 6, Price = 185000, SalePrice = 165000, Stock = 100, Description = "Bỉm Bobby cho trẻ sơ sinh dưới 5kg, mềm mịn an toàn.", IsActive = true, CreatedAt = now },

                // Quần áo hè (categoryId=8)
                new Core.Entities.Product { Name = "Bộ đồ thun ngắn tay bé gái hoa nhí mùa hè", Slug = "bo-do-thun-ngan-tay-be-gai-hoa-nhi-mua-he", CategoryId = 8, Price = 155000, SalePrice = 129000, Stock = 60, Description = "Bộ đồ mùa hè cotton mỏng nhẹ, họa tiết hoa nhí xinh cho bé gái.", IsActive = true, CreatedAt = now },
                new Core.Entities.Product { Name = "Quần short jean bé trai hè 2-8 tuổi", Slug = "quan-short-jean-be-trai-he-2-8-tuoi", CategoryId = 8, Price = 125000, Stock = 55, Description = "Quần short jean thoáng mát, thời trang cho bé trai mùa hè.", IsActive = true, CreatedAt = now },
                new Core.Entities.Product { Name = "Đầm hè bé gái cổ vuông thêu hoa", Slug = "dam-he-be-gai-co-vuong-theu-hoa", CategoryId = 8, Price = 185000, SalePrice = 159000, Stock = 40, Description = "Đầm hè nhẹ nhàng, cổ vuông thêu hoa tinh tế cho bé gái từ 1-6 tuổi.", IsActive = true, CreatedAt = now },

                // Quần áo thu đông (categoryId=7)
                new Core.Entities.Product { Name = "Bộ áo khoác lót lông bé trai 0-2 tuổi", Slug = "bo-ao-khoac-lot-long-be-trai-0-2-tuoi", CategoryId = 7, Price = 245000, SalePrice = 209000, Stock = 45, Description = "Bộ áo khoác lót lông ấm áp cho bé trai mùa đông.", IsActive = true, CreatedAt = now },
                new Core.Entities.Product { Name = "Bộ đồ nỉ thu đông bé gái họa tiết gấu", Slug = "bo-do-ni-thu-dong-be-gai-hoa-tiet-gau", CategoryId = 7, Price = 220000, Stock = 50, Description = "Bộ đồ nỉ mềm mịn, ấm áp, họa tiết gấu cute cho bé gái.", IsActive = true, CreatedAt = now },
                new Core.Entities.Product { Name = "Áo hoodie thu đông cho mẹ và bé (cặp đôi)", Slug = "ao-hoodie-thu-dong-cap-doi-me-va-be", CategoryId = 7, Price = 390000, SalePrice = 349000, Stock = 30, Description = "Áo hoodie đôi mẹ và bé thiết kế phối màu dễ thương.", IsActive = true, CreatedAt = now }
            );
            await context.SaveChangesAsync();
        }

        // Seed giá vốn mặc định (~70% giá bán) cho sản phẩm chưa có, để báo cáo lợi nhuận có số liệu
        var productsWithoutCost = await context.Products.Where(p => p.CostPrice == 0).ToListAsync();
        if (productsWithoutCost.Count > 0)
        {
            foreach (var p in productsWithoutCost)
                p.CostPrice = Math.Round(p.Price * 0.7m, 0);
            await context.SaveChangesAsync();
        }

        // Seed placeholder images for products that have none (demo/testing)
        var productsWithoutImages = await context.Products
            .Include(p => p.Images)
            .Where(p => !p.Images.Any())
            .ToListAsync();
        if (productsWithoutImages.Count > 0)
        {
            foreach (var p in productsWithoutImages)
                p.Images.Add(new Core.Entities.ProductImage
                {
                    ImageUrl = $"https://picsum.photos/seed/{p.Slug}/600/600",
                    IsMain = true
                });
            await context.SaveChangesAsync();
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
