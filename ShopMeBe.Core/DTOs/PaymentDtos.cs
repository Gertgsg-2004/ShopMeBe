namespace ShopMeBe.Core.DTOs;

public class VnPayCreateDto
{
    public int OrderId { get; set; }
    public decimal Amount { get; set; }
    public string? OrderInfo { get; set; }
}
