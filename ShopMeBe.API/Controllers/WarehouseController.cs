using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Enums;
using ShopMeBe.Infrastructure.Data;
using System.Security.Claims;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/warehouse")]
[Authorize(Roles = "Admin")]
public class WarehouseController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public WarehouseController(ApplicationDbContext db)
    {
        _db = db;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet("stock")]
    public async Task<ActionResult<ApiResponseDto<object>>> GetStock([FromQuery] string? search)
    {
        var query = _db.Products.Include(p => p.Images).Where(p => p.IsActive);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search) || (p.Sku != null && p.Sku.Contains(search)));

        var items = await query
            .OrderBy(p => p.Name)
            .Select(p => new
            {
                productId = p.Id,
                productName = p.Name,
                sku = p.Sku,
                currentStock = p.Stock,
                price = p.Price,
                costPrice = p.CostPrice,
                stockValue = p.Stock * (p.CostPrice > 0 ? p.CostPrice : p.Price),
                mainImageUrl = p.Images.Where(i => i.IsMain).Select(i => i.ImageUrl).FirstOrDefault()
                               ?? p.Images.Select(i => i.ImageUrl).FirstOrDefault()
            })
            .ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(items));
    }

    [HttpGet("transactions")]
    public async Task<ActionResult<ApiResponseDto<object>>> GetTransactions(
        [FromQuery] string? type,
        [FromQuery] int? productId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _db.StockTransactions.Include(t => t.Product).AsQueryable();
        if (productId.HasValue) query = query.Where(t => t.ProductId == productId);
        if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<StockTransactionType>(type, out var typeEnum))
            query = query.Where(t => t.Type == typeEnum);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                id = t.Id,
                productId = t.ProductId,
                productName = t.Product.Name,
                sku = t.Product.Sku,
                type = t.Type.ToString(),
                quantity = t.Quantity,
                stockBefore = t.StockBefore,
                stockAfter = t.StockAfter,
                reference = t.Reference,
                notes = t.Notes,
                createdAt = t.CreatedAt
            })
            .ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(new { items, totalCount, page, pageSize, totalPages, hasPrevious = page > 1, hasNext = page < totalPages }));
    }

    [HttpPost("adjust")]
    public async Task<ActionResult<ApiResponseDto<object>>> AdjustStock([FromBody] AdjustStockDto dto)
    {
        var product = await _db.Products.FindAsync(dto.ProductId);
        if (product == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy sản phẩm"));

        var before = product.Stock;
        var diff = dto.NewStock - before;

        product.Stock = dto.NewStock;
        product.UpdatedAt = DateTime.UtcNow;

        _db.StockTransactions.Add(new StockTransaction
        {
            ProductId = dto.ProductId,
            Type = StockTransactionType.Adjustment,
            Quantity = Math.Abs(diff),
            StockBefore = before,
            StockAfter = dto.NewStock,
            Notes = dto.Notes ?? "Điều chỉnh tồn kho thủ công",
            CreatedById = UserId
        });

        await _db.SaveChangesAsync();
        return Ok(ApiResponseDto<object>.Ok(new { ProductId = dto.ProductId, OldStock = before, NewStock = dto.NewStock }, "Điều chỉnh tồn kho thành công"));
    }

    [HttpPost("inventory-checks")]
    public async Task<ActionResult<ApiResponseDto<InventoryCheckDto>>> CreateInventoryCheck([FromBody] CreateInventoryCheckDto dto)
    {
        var count = await _db.InventoryChecks.CountAsync() + 1;
        var check = new InventoryCheck
        {
            Code = $"KK{count:D3}",
            Notes = dto.Notes,
            CreatedById = UserId
        };

        foreach (var item in dto.Items)
        {
            var product = await _db.Products.FindAsync(item.ProductId);
            if (product == null) continue;
            check.Items.Add(new InventoryCheckItem
            {
                ProductId = item.ProductId,
                SystemStock = product.Stock,
                ActualStock = item.ActualStock
            });
        }

        _db.InventoryChecks.Add(check);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetInventoryCheck), new { id = check.Id },
            ApiResponseDto<InventoryCheckDto>.Ok(await MapInventoryCheck(check.Id), "Tạo kiểm kê thành công"));
    }

    [HttpGet("inventory-checks")]
    public async Task<ActionResult<ApiResponseDto<object>>> GetInventoryChecks()
    {
        var items = await _db.InventoryChecks
            .Include(c => c.Items).ThenInclude(i => i.Product)
            .OrderByDescending(c => c.CheckDate)
            .Take(50)
            .Select(c => new
            {
                id = c.Id,
                checkCode = c.Code,
                status = c.IsCompleted ? "Completed" : "Draft",
                notes = c.Notes,
                createdAt = c.CheckDate,
                completedAt = c.IsCompleted ? (DateTime?)c.UpdatedAt : null,
                items = c.Items.Select(i => new
                {
                    id = i.Id,
                    productId = i.ProductId,
                    productName = i.Product.Name,
                    sku = i.Product.Sku,
                    systemStock = i.SystemStock,
                    actualStock = i.ActualStock,
                    difference = i.ActualStock - i.SystemStock
                }).ToList()
            })
            .ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(items));
    }

    [HttpGet("inventory-checks/{id:int}")]
    public async Task<ActionResult<ApiResponseDto<InventoryCheckDto>>> GetInventoryCheck(int id)
    {
        var dto = await MapInventoryCheck(id);
        if (dto == null) return NotFound(ApiResponseDto<InventoryCheckDto>.Fail("Không tìm thấy phiếu kiểm kê"));
        return Ok(ApiResponseDto<InventoryCheckDto>.Ok(dto));
    }

    [HttpPost("inventory-checks/{id:int}/complete")]
    public async Task<ActionResult<ApiResponseDto<object>>> CompleteInventoryCheck(int id)
    {
        var check = await _db.InventoryChecks
            .Include(c => c.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (check == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy phiếu kiểm kê"));
        if (check.IsCompleted) return BadRequest(ApiResponseDto<object>.Fail("Phiếu kiểm kê đã hoàn thành"));

        foreach (var item in check.Items)
        {
            if (item.ActualStock == item.SystemStock) continue;

            var product = item.Product;
            var before = product.Stock;
            product.Stock = item.ActualStock;
            product.UpdatedAt = DateTime.UtcNow;

            _db.StockTransactions.Add(new StockTransaction
            {
                ProductId = item.ProductId,
                Type = StockTransactionType.Adjustment,
                Quantity = Math.Abs(item.ActualStock - before),
                StockBefore = before,
                StockAfter = item.ActualStock,
                Reference = check.Code,
                Notes = $"Điều chỉnh từ kiểm kê {check.Code}",
                CreatedById = UserId
            });
        }

        check.IsCompleted = true;
        check.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponseDto<object>.Ok(new { }, "Hoàn thành kiểm kê, tồn kho đã được cập nhật"));
    }

    private async Task<InventoryCheckDto?> MapInventoryCheck(int id)
    {
        var check = await _db.InventoryChecks
            .Include(c => c.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (check == null) return null;

        return new InventoryCheckDto
        {
            Id = check.Id,
            Code = check.Code,
            CheckDate = check.CheckDate,
            Notes = check.Notes,
            IsCompleted = check.IsCompleted,
            Items = check.Items.Select(i => new InventoryCheckItemDetailDto
            {
                ProductId = i.ProductId,
                ProductName = i.Product.Name,
                Sku = i.Product.Sku,
                SystemStock = i.SystemStock,
                ActualStock = i.ActualStock,
                Difference = i.ActualStock - i.SystemStock
            }).ToList()
        };
    }
}
