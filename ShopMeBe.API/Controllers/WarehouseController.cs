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
    public async Task<ActionResult<ApiResponseDto<object>>> GetStock(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _db.Products.Include(p => p.Images).Where(p => p.IsActive);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search) || (p.Sku != null && p.Sku.Contains(search)));

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new StockSummaryDto
            {
                ProductId = p.Id,
                ProductName = p.Name,
                Sku = p.Sku,
                CurrentStock = p.Stock,
                Price = p.Price,
                MainImage = p.Images.Where(i => i.IsMain).Select(i => i.ImageUrl).FirstOrDefault()
                            ?? p.Images.Select(i => i.ImageUrl).FirstOrDefault()
            })
            .ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(new { total, page, pageSize, items }));
    }

    [HttpGet("transactions")]
    public async Task<ActionResult<ApiResponseDto<object>>> GetTransactions(
        [FromQuery] int? productId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _db.StockTransactions.Include(t => t.Product).AsQueryable();
        if (productId.HasValue) query = query.Where(t => t.ProductId == productId);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new StockTransactionDto
            {
                Id = t.Id,
                ProductId = t.ProductId,
                ProductName = t.Product.Name,
                Sku = t.Product.Sku,
                Type = t.Type.ToString(),
                Quantity = t.Quantity,
                StockBefore = t.StockBefore,
                StockAfter = t.StockAfter,
                Reference = t.Reference,
                Notes = t.Notes,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(new { total, page, pageSize, items }));
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

    [HttpPost("inventory-check")]
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
    public async Task<ActionResult<ApiResponseDto<object>>> GetInventoryChecks(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var total = await _db.InventoryChecks.CountAsync();
        var items = await _db.InventoryChecks
            .OrderByDescending(c => c.CheckDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new InventoryCheckDto
            {
                Id = c.Id,
                Code = c.Code,
                CheckDate = c.CheckDate,
                Notes = c.Notes,
                IsCompleted = c.IsCompleted,
                Items = new()
            })
            .ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(new { total, page, pageSize, items }));
    }

    [HttpGet("inventory-checks/{id:int}")]
    public async Task<ActionResult<ApiResponseDto<InventoryCheckDto>>> GetInventoryCheck(int id)
    {
        var dto = await MapInventoryCheck(id);
        if (dto == null) return NotFound(ApiResponseDto<InventoryCheckDto>.Fail("Không tìm thấy phiếu kiểm kê"));
        return Ok(ApiResponseDto<InventoryCheckDto>.Ok(dto));
    }

    [HttpPut("inventory-checks/{id:int}/complete")]
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
