using Microsoft.AspNetCore.Http;

namespace ShopMeBe.Core.Interfaces;

public interface IFileService
{
    Task<string> UploadImageAsync(IFormFile file, string folder = "products");
    Task DeleteImageAsync(string imageUrl);
    bool IsValidImage(IFormFile file);
}
