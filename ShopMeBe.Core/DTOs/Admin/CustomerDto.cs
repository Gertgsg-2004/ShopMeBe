namespace ShopMeBe.Core.DTOs.Admin;

public class CustomerDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? Avatar { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal TotalTopUp { get; set; }
    public decimal WalletBalance { get; set; }
    public DateTime? LastOrderAt { get; set; }
}
