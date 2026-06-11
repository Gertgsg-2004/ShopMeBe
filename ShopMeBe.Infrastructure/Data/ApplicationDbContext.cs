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
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<PurchaseOrderItem> PurchaseOrderItems => Set<PurchaseOrderItem>();
    public DbSet<StockTransaction> StockTransactions => Set<StockTransaction>();
    public DbSet<InventoryCheck> InventoryChecks => Set<InventoryCheck>();
    public DbSet<InventoryCheckItem> InventoryCheckItems => Set<InventoryCheckItem>();
    public DbSet<PosSession> PosSessions => Set<PosSession>();
    public DbSet<WalletTopUp> WalletTopUps => Set<WalletTopUp>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationRead> NotificationReads => Set<NotificationRead>();
    public DbSet<PasswordResetRequest> PasswordResetRequests => Set<PasswordResetRequest>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Category>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.Property(x => x.Slug).IsRequired().HasMaxLength(200);
            e.HasIndex(x => x.Slug).IsUnique();
            e.HasOne(x => x.Parent).WithMany(x => x.Children).HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Product>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(500);
            e.Property(x => x.Slug).IsRequired().HasMaxLength(500);
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Price).HasColumnType("decimal(18,2)");
            e.Property(x => x.SalePrice).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.Category).WithMany(x => x.Products).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<ProductImage>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Product).WithMany(x => x.Images).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Review>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Product).WithMany(x => x.Reviews).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany(x => x.Reviews).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Cart>(e =>
        {
            e.HasKey(x => x.Id);
            e.Ignore(x => x.Total);
            e.HasOne(x => x.User).WithOne(x => x.Cart).HasForeignKey<Cart>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<CartItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Ignore(x => x.SubTotal);
            e.Property(x => x.Price).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.Cart).WithMany(x => x.Items).HasForeignKey(x => x.CartId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Product).WithMany(x => x.CartItems).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Order>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.OrderCode).IsRequired().HasMaxLength(50);
            e.HasIndex(x => x.OrderCode).IsUnique();
            e.Property(x => x.SubTotal).HasColumnType("decimal(18,2)");
            e.Property(x => x.ShippingFee).HasColumnType("decimal(18,2)");
            e.Property(x => x.DiscountAmount).HasColumnType("decimal(18,2)");
            e.Property(x => x.Total).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.User).WithMany(x => x.Orders).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.PosSession).WithMany(x => x.Orders).HasForeignKey(x => x.PosSessionId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<OrderItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Ignore(x => x.SubTotal);
            e.Property(x => x.Price).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.Order).WithMany(x => x.Items).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Product).WithMany(x => x.OrderItems).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Coupon>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).IsRequired().HasMaxLength(50);
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Value).HasColumnType("decimal(18,2)");
            e.Property(x => x.MinOrderAmount).HasColumnType("decimal(18,2)");
            e.Property(x => x.MaxDiscount).HasColumnType("decimal(18,2)");
        });

        builder.Entity<FlashSale>(e => e.HasKey(x => x.Id));

        builder.Entity<FlashSaleItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.SalePrice).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.FlashSale).WithMany(x => x.Items).HasForeignKey(x => x.FlashSaleId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Product).WithMany(x => x.FlashSaleItems).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Supplier>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(300);
            e.Property(x => x.TotalDebt).HasColumnType("decimal(18,2)");
        });

        builder.Entity<PurchaseOrder>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).IsRequired().HasMaxLength(50);
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.TotalAmount).HasColumnType("decimal(18,2)");
            e.Property(x => x.PaidAmount).HasColumnType("decimal(18,2)");
            e.Ignore(x => x.DebtAmount);
            e.HasOne(x => x.Supplier).WithMany(x => x.PurchaseOrders).HasForeignKey(x => x.SupplierId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PurchaseOrderItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.UnitCost).HasColumnType("decimal(18,2)");
            e.Ignore(x => x.Total);
            e.HasOne(x => x.PurchaseOrder).WithMany(x => x.Items).HasForeignKey(x => x.PurchaseOrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<StockTransaction>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.PurchaseOrder).WithMany(x => x.StockTransactions).HasForeignKey(x => x.PurchaseOrderId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<InventoryCheck>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).IsRequired().HasMaxLength(50);
        });

        builder.Entity<InventoryCheckItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Ignore(x => x.Difference);
            e.HasOne(x => x.InventoryCheck).WithMany(x => x.Items).HasForeignKey(x => x.InventoryCheckId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PosSession>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.OpeningCash).HasColumnType("decimal(18,2)");
            e.Property(x => x.ClosingCash).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.Cashier).WithMany().HasForeignKey(x => x.CashierId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<WalletTopUp>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Amount).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<WalletTransaction>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Amount).HasColumnType("decimal(18,2)");
            e.Property(x => x.BalanceBefore).HasColumnType("decimal(18,2)");
            e.Property(x => x.BalanceAfter).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ApplicationUser>(e =>
        {
            e.Property(x => x.WalletBalance).HasColumnType("decimal(18,2)");
        });

        builder.Entity<Notification>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).IsRequired().HasMaxLength(300);
        });

        builder.Entity<NotificationRead>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Notification).WithMany(x => x.ReadBy).HasForeignKey(x => x.NotificationId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PasswordResetRequest>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Đồ bà bầu", Slug = "do-ba-bau", Description = "Thời trang và phụ kiện cho bà bầu", SortOrder = 1, IsActive = true },
            new Category { Id = 2, Name = "Đồ sơ sinh", Slug = "do-so-sinh", Description = "Sản phẩm dành cho trẻ sơ sinh", SortOrder = 2, IsActive = true },
            new Category { Id = 3, Name = "Đồ chơi", Slug = "do-choi", Description = "Đồ chơi giáo dục cho trẻ", SortOrder = 3, IsActive = true },
            new Category { Id = 4, Name = "Sữa và thực phẩm", Slug = "sua-va-thuc-pham", Description = "Sữa bột và thực phẩm bổ sung", SortOrder = 4, IsActive = true },
            new Category { Id = 5, Name = "Phụ kiện", Slug = "phu-kien", Description = "Phụ kiện mẹ và bé", SortOrder = 5, IsActive = true },
            new Category { Id = 6, Name = "Bỉm", Slug = "bim", Description = "Bỉm tã cho bé các loại", SortOrder = 6, IsActive = true },
            new Category { Id = 7, Name = "Quần áo thu đông", Slug = "quan-ao-thu-dong", Description = "Quần áo thu đông ấm áp cho mẹ và bé", SortOrder = 7, IsActive = true }
        );
    }
}
