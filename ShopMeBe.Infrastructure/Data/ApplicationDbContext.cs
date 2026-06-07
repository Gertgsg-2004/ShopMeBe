using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.Entities;

namespace ShopMeBe.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<FlashSale> FlashSales => Set<FlashSale>();
    public DbSet<FlashSaleItem> FlashSaleItems => Set<FlashSaleItem>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Category
        builder.Entity<Category>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.Property(x => x.Slug).IsRequired().HasMaxLength(200);
            e.HasIndex(x => x.Slug).IsUnique();
            e.HasOne(x => x.Parent)
                .WithMany(x => x.Children)
                .HasForeignKey(x => x.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Product
        builder.Entity<Product>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(500);
            e.Property(x => x.Slug).IsRequired().HasMaxLength(500);
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Price).HasColumnType("decimal(18,2)");
            e.Property(x => x.SalePrice).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.Category)
                .WithMany(x => x.Products)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ProductImage
        builder.Entity<ProductImage>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Product)
                .WithMany(x => x.Images)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Review
        builder.Entity<Review>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Product)
                .WithMany(x => x.Reviews)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User)
                .WithMany(x => x.Reviews)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Cart
        builder.Entity<Cart>(e =>
        {
            e.HasKey(x => x.Id);
            e.Ignore(x => x.Total);
            e.HasOne(x => x.User)
                .WithOne(x => x.Cart)
                .HasForeignKey<Cart>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // CartItem
        builder.Entity<CartItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Ignore(x => x.SubTotal);
            e.Property(x => x.Price).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.Cart)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.CartId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Product)
                .WithMany(x => x.CartItems)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Order
        builder.Entity<Order>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.OrderCode).IsRequired().HasMaxLength(50);
            e.HasIndex(x => x.OrderCode).IsUnique();
            e.Property(x => x.SubTotal).HasColumnType("decimal(18,2)");
            e.Property(x => x.ShippingFee).HasColumnType("decimal(18,2)");
            e.Property(x => x.DiscountAmount).HasColumnType("decimal(18,2)");
            e.Property(x => x.Total).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.User)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // OrderItem
        builder.Entity<OrderItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Ignore(x => x.SubTotal);
            e.Property(x => x.Price).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.Order)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Product)
                .WithMany(x => x.OrderItems)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Coupon
        builder.Entity<Coupon>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).IsRequired().HasMaxLength(50);
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Value).HasColumnType("decimal(18,2)");
            e.Property(x => x.MinOrderAmount).HasColumnType("decimal(18,2)");
            e.Property(x => x.MaxDiscount).HasColumnType("decimal(18,2)");
        });

        // FlashSale
        builder.Entity<FlashSale>(e =>
        {
            e.HasKey(x => x.Id);
        });

        // FlashSaleItem
        builder.Entity<FlashSaleItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.SalePrice).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.FlashSale)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.FlashSaleId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Product)
                .WithMany(x => x.FlashSaleItems)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Seed data
        builder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Đồ bà bầu", Slug = "do-ba-bau", Description = "Thời trang và phụ kiện cho bà bầu", SortOrder = 1, IsActive = true },
            new Category { Id = 2, Name = "Đồ sơ sinh", Slug = "do-so-sinh", Description = "Sản phẩm dành cho trẻ sơ sinh", SortOrder = 2, IsActive = true },
            new Category { Id = 3, Name = "Đồ chơi", Slug = "do-choi", Description = "Đồ chơi giáo dục cho trẻ", SortOrder = 3, IsActive = true },
            new Category { Id = 4, Name = "Sữa và thực phẩm", Slug = "sua-va-thuc-pham", Description = "Sữa bột và thực phẩm bổ sung", SortOrder = 4, IsActive = true },
            new Category { Id = 5, Name = "Phụ kiện", Slug = "phu-kien", Description = "Phụ kiện mẹ và bé", SortOrder = 5, IsActive = true }
        );
    }
}
