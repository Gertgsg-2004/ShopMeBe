using System.ComponentModel.DataAnnotations;

namespace ShopMeBe.Core.DTOs.Auth;

public class UpdateProfileDto
{
    [Required]
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public DateTime? DateOfBirth { get; set; }
}
