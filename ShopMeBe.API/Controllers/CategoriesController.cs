using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.DTOs.Product;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Interfaces;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryRepository _categoryRepo;
    private readonly IFileService _fileService;

    public CategoriesController(ICategoryRepository categoryRepo, IFileService fileService)
    {
        _categoryRepo = categoryRepo;
        _fileService = fileService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponseDto<List<CategoryDto>>>> GetAll()
    {
        var result = await _categoryRepo.GetAllAsync();
        return Ok(ApiResponseDto<List<CategoryDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponseDto<CategoryDto>>> GetById(int id)
    {
        var cat = await _categoryRepo.GetByIdAsync(id);
        if (cat == null) return NotFound(ApiResponseDto<CategoryDto>.Fail("Không tìm thấy danh mục"));
        return Ok(ApiResponseDto<CategoryDto>.Ok(cat));
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<ApiResponseDto<CategoryDto>>> GetBySlug(string slug)
    {
        var cat = await _categoryRepo.GetBySlugAsync(slug);
        if (cat == null) return NotFound(ApiResponseDto<CategoryDto>.Fail("Không tìm thấy danh mục"));
        return Ok(ApiResponseDto<CategoryDto>.Ok(cat));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponseDto<CategoryDto>>> Create([FromForm] CategoryCreateDto dto)
    {
        var slug = dto.Name.ToLower().Replace(" ", "-");
        var category = new Category
        {
            Name = dto.Name,
            Slug = slug,
            Description = dto.Description,
            ParentId = dto.ParentId,
            SortOrder = dto.SortOrder,
            IsActive = true
        };

        if (dto.Image != null && _fileService.IsValidImage(dto.Image))
            category.ImageUrl = await _fileService.UploadImageAsync(dto.Image, "categories");

        var created = await _categoryRepo.CreateAsync(category);
        var result = await _categoryRepo.GetByIdAsync(created.Id);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponseDto<CategoryDto>.Ok(result!, "Tạo danh mục thành công"));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponseDto<CategoryDto>>> Update(int id, [FromForm] CategoryCreateDto dto)
    {
        if (!await _categoryRepo.ExistsAsync(id))
            return NotFound(ApiResponseDto<CategoryDto>.Fail("Không tìm thấy danh mục"));

        var existing = await _categoryRepo.GetByIdAsync(id);
        var category = new Category
        {
            Id = id,
            Name = dto.Name,
            Slug = dto.Name.ToLower().Replace(" ", "-"),
            Description = dto.Description,
            ParentId = dto.ParentId,
            SortOrder = dto.SortOrder,
            IsActive = dto.IsActive,
            ImageUrl = existing!.ImageUrl
        };

        if (dto.Image != null && _fileService.IsValidImage(dto.Image))
            category.ImageUrl = await _fileService.UploadImageAsync(dto.Image, "categories");

        var updated = await _categoryRepo.UpdateAsync(category);
        var result = await _categoryRepo.GetByIdAsync(updated.Id);
        return Ok(ApiResponseDto<CategoryDto>.Ok(result!, "Cập nhật danh mục thành công"));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponseDto<object>>> Delete(int id)
    {
        if (!await _categoryRepo.ExistsAsync(id))
            return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy danh mục"));

        await _categoryRepo.DeleteAsync(id);
        return Ok(ApiResponseDto<object>.Ok(new { }, "Xóa danh mục thành công"));
    }
}

public class CategoryCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ParentId { get; set; }
    public int SortOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public Microsoft.AspNetCore.Http.IFormFile? Image { get; set; }
}
