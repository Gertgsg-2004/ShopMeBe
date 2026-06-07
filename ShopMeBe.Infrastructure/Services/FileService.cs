using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using ShopMeBe.Core.Interfaces;

namespace ShopMeBe.Infrastructure.Services;

public class FileService : IFileService
{
    private readonly IWebHostEnvironment _env;
    private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB

    public FileService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> UploadImageAsync(IFormFile file, string folder = "products")
    {
        var uploadsPath = Path.Combine(_env.WebRootPath, "uploads", folder);
        if (!Directory.Exists(uploadsPath))
            Directory.CreateDirectory(uploadsPath);

        var ext = Path.GetExtension(file.FileName).ToLower();
        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsPath, fileName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"/uploads/{folder}/{fileName}";
    }

    public Task DeleteImageAsync(string imageUrl)
    {
        if (string.IsNullOrEmpty(imageUrl)) return Task.CompletedTask;

        var filePath = Path.Combine(_env.WebRootPath, imageUrl.TrimStart('/'));
        if (File.Exists(filePath))
            File.Delete(filePath);

        return Task.CompletedTask;
    }

    public bool IsValidImage(IFormFile file)
    {
        if (file.Length == 0 || file.Length > MaxFileSize) return false;
        var ext = Path.GetExtension(file.FileName).ToLower();
        return _allowedExtensions.Contains(ext);
    }
}
