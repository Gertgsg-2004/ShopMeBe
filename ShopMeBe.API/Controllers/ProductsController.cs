using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.DTOs.Product;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Interfaces;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductRepository _productRepo;
    private readonly ICategoryRepository _categoryRepo;
    private readonly IFileService _fileService;

    public ProductsController(IProductRepository productRepo, ICategoryRepository categoryRepo, IFileService fileService)
    {
        _productRepo = productRepo;
        _categoryRepo = categoryRepo;
        _fileService = fileService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponseDto<PagedResultDto<ProductDto>>>> GetProducts([FromQuery] ProductFilterDto filter)
    {
        var result = await _productRepo.GetProductsAsync(filter);
        return Ok(ApiResponseDto<PagedResultDto<ProductDto>>.Ok(result));
    }

    [HttpGet("featured")]
    public async Task<ActionResult<ApiResponseDto<List<ProductDto>>>> GetFeatured([FromQuery] int count = 8)
    {
        var result = await _productRepo.GetFeaturedProductsAsync(count);
        return Ok(ApiResponseDto<List<ProductDto>>.Ok(result));
    }

    [HttpGet("new")]
    public async Task<ActionResult<ApiResponseDto<List<ProductDto>>>> GetNew([FromQuery] int count = 8)
    {
        var result = await _productRepo.GetNewProductsAsync(count);
        return Ok(ApiResponseDto<List<ProductDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponseDto<ProductDto>>> GetById(int id)
    {
        var product = await _productRepo.GetProductByIdAsync(id);
        if (product == null) return NotFound(ApiResponseDto<ProductDto>.Fail("Không tìm thấy sản phẩm"));
        return Ok(ApiResponseDto<ProductDto>.Ok(product));
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<ApiResponseDto<ProductDto>>> GetBySlug(string slug)
    {
        var product = await _productRepo.GetProductBySlugAsync(slug);
        if (product == null) return NotFound(ApiResponseDto<ProductDto>.Fail("Không tìm thấy sản phẩm"));
        return Ok(ApiResponseDto<ProductDto>.Ok(product));
    }

    [HttpGet("{id:int}/related")]
    public async Task<ActionResult<ApiResponseDto<List<ProductDto>>>> GetRelated(int id, [FromQuery] int categoryId, [FromQuery] int count = 4)
    {
        var result = await _productRepo.GetRelatedProductsAsync(id, categoryId, count);
        return Ok(ApiResponseDto<List<ProductDto>>.Ok(result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponseDto<ProductDto>>> Create([FromForm] ProductCreateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<ProductDto>.Fail("Dữ liệu không hợp lệ"));

        var slug = GenerateSlug(dto.Name);
        var product = new Product
        {
            Name = dto.Name,
            Slug = slug,
            Description = dto.Description,
            ShortDescription = dto.ShortDescription,
            Price = dto.Price,
            SalePrice = dto.SalePrice,
            Stock = dto.Stock,
            Sku = dto.Sku,
            CategoryId = dto.CategoryId,
            IsFeatured = dto.IsFeatured,
            IsNew = dto.IsNew,
            IsActive = true
        };

        if (dto.Images != null && dto.Images.Any())
        {
            var isFirst = true;
            foreach (var file in dto.Images)
            {
                if (_fileService.IsValidImage(file))
                {
                    var url = await _fileService.UploadImageAsync(file, "products");
                    product.Images.Add(new ProductImage { ImageUrl = url, IsMain = isFirst });
                    isFirst = false;
                }
            }
        }

        var created = await _productRepo.CreateAsync(product);
        var result = await _productRepo.GetProductByIdAsync(created.Id);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponseDto<ProductDto>.Ok(result!, "Tạo sản phẩm thành công"));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponseDto<ProductDto>>> Update(int id, [FromForm] ProductUpdateDto dto)
    {
        var existing = await _productRepo.GetProductByIdAsync(id);
        if (existing == null) return NotFound(ApiResponseDto<ProductDto>.Fail("Không tìm thấy sản phẩm"));

        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<ProductDto>.Fail("Dữ liệu không hợp lệ"));

        var product = new Product
        {
            Id = id,
            Name = dto.Name,
            Slug = GenerateSlug(dto.Name),
            Description = dto.Description,
            ShortDescription = dto.ShortDescription,
            Price = dto.Price,
            SalePrice = dto.SalePrice,
            Stock = dto.Stock,
            Sku = dto.Sku,
            CategoryId = dto.CategoryId,
            IsFeatured = dto.IsFeatured,
            IsNew = dto.IsNew,
            IsActive = dto.IsActive
        };

        var updated = await _productRepo.UpdateAsync(product);
        var result = await _productRepo.GetProductByIdAsync(updated.Id);
        return Ok(ApiResponseDto<ProductDto>.Ok(result!, "Cập nhật sản phẩm thành công"));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponseDto<object>>> Delete(int id)
    {
        if (!await _productRepo.ExistsAsync(id))
            return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy sản phẩm"));

        await _productRepo.DeleteAsync(id);
        return Ok(ApiResponseDto<object>.Ok(new { }, "Xóa sản phẩm thành công"));
    }

    private static string GenerateSlug(string name)
    {
        var slug = name.ToLower()
            .Replace("à", "a").Replace("á", "a").Replace("ả", "a").Replace("ã", "a").Replace("ạ", "a")
            .Replace("ă", "a").Replace("ắ", "a").Replace("ặ", "a").Replace("ằ", "a").Replace("ẳ", "a").Replace("ẵ", "a")
            .Replace("â", "a").Replace("ấ", "a").Replace("ậ", "a").Replace("ầ", "a").Replace("ẩ", "a").Replace("ẫ", "a")
            .Replace("è", "e").Replace("é", "e").Replace("ẻ", "e").Replace("ẽ", "e").Replace("ẹ", "e")
            .Replace("ê", "e").Replace("ế", "e").Replace("ệ", "e").Replace("ề", "e").Replace("ể", "e").Replace("ễ", "e")
            .Replace("ì", "i").Replace("í", "i").Replace("ỉ", "i").Replace("ĩ", "i").Replace("ị", "i")
            .Replace("ò", "o").Replace("ó", "o").Replace("ỏ", "o").Replace("õ", "o").Replace("ọ", "o")
            .Replace("ô", "o").Replace("ố", "o").Replace("ộ", "o").Replace("ồ", "o").Replace("ổ", "o").Replace("ỗ", "o")
            .Replace("ơ", "o").Replace("ớ", "o").Replace("ợ", "o").Replace("ờ", "o").Replace("ở", "o").Replace("ỡ", "o")
            .Replace("ù", "u").Replace("ú", "u").Replace("ủ", "u").Replace("ũ", "u").Replace("ụ", "u")
            .Replace("ư", "u").Replace("ứ", "u").Replace("ự", "u").Replace("ừ", "u").Replace("ử", "u").Replace("ữ", "u")
            .Replace("ỳ", "y").Replace("ý", "y").Replace("ỷ", "y").Replace("ỹ", "y").Replace("ỵ", "y")
            .Replace("đ", "d")
            .Replace(" ", "-");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-+", "-").Trim('-');
        return slug + "-" + Guid.NewGuid().ToString("N")[..6];
    }
}
