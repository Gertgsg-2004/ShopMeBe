using ShopMeBe.Core.Entities;

namespace ShopMeBe.Core.Interfaces;

public interface ITokenService
{
    Task<string> GenerateAccessTokenAsync(ApplicationUser user);
    string GenerateRefreshToken();
}
