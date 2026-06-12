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
[Route("api/suppliers")]
[Authorize(Roles = "Admin")]
public class SuppliersController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public SuppliersController(ApplicationDbContext db)
    {
        _db = db;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<ApiResponseDto<object>>> GetAll([FromQuery] string? search)
    {
        var query = _db.Suppliers.Include(s => s.PurchaseOrders).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(s => s.Name.Contains(search) || (s.Phone != null && s.Phone.Contains(search)));

        var items = await query
            .OrderBy(s => s.Name)
            .Select(s => new SupplierDto
            {
                Id = s.Id,
                Name = s.Name,
                Phone = s.Phone,
                Email = s.Email,
                Address = s.Address,
                TaxCode = s.TaxCode,
                ContactPerson = s.ContactPerson,
                TotalDebt = s.TotalDebt,
                IsActive = s.IsActive,
                TotalOrders = s.PurchaseOrders.Count
            })
            .ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(items));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponseDto<SupplierDto>>> GetById(int id)
    {
        var s = await _db.Suppliers.Include(x => x.PurchaseOrders).FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return NotFound(ApiResponseDto<SupplierDto>.Fail("Không tìm thấy nhà cung cấp"));

        return Ok(ApiResponseDto<SupplierDto>.Ok(new SupplierDto
        {
            Id = s.Id,
            Name = s.Name,
            Phone = s.Phone,
            Email = s.Email,
            Address = s.Address,
            TaxCode = s.TaxCode,
            ContactPerson = s.ContactPerson,
            TotalDebt = s.TotalDebt,
            IsActive = s.IsActive,
            TotalOrders = s.PurchaseOrders.Count
        }));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponseDto<SupplierDto>>> Create([FromBody] CreateSupplierDto dto)
    {
        var supplier = new Supplier
        {
            Name = dto.Name,
            Phone = dto.Phone,
            Email = dto.Email,
            Address = dto.Address,
            TaxCode = dto.TaxCode,
            ContactPerson = dto.ContactPerson
        };
        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = supplier.Id }, ApiResponseDto<SupplierDto>.Ok(new SupplierDto
        {
            Id = supplier.Id,
            Name = supplier.Name,
            Phone = supplier.Phone,
            Email = supplier.Email,
            Address = supplier.Address,
            TaxCode = supplier.TaxCode,
            ContactPerson = supplier.ContactPerson,
            TotalDebt = supplier.TotalDebt,
            IsActive = supplier.IsActive
        }, "Tạo nhà cung cấp thành công"));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponseDto<SupplierDto>>> Update(int id, [FromBody] CreateSupplierDto dto)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null) return NotFound(ApiResponseDto<SupplierDto>.Fail("Không tìm thấy nhà cung cấp"));

        supplier.Name = dto.Name;
        supplier.Phone = dto.Phone;
        supplier.Email = dto.Email;
        supplier.Address = dto.Address;
        supplier.TaxCode = dto.TaxCode;
        supplier.ContactPerson = dto.ContactPerson;
        supplier.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponseDto<SupplierDto>.Ok(new SupplierDto
        {
            Id = supplier.Id,
            Name = supplier.Name,
            Phone = supplier.Phone,
            Email = supplier.Email,
            Address = supplier.Address,
            TaxCode = supplier.TaxCode,
            ContactPerson = supplier.ContactPerson,
            TotalDebt = supplier.TotalDebt,
            IsActive = supplier.IsActive
        }, "Cập nhật thành công"));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponseDto<object>>> Delete(int id)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy nhà cung cấp"));

        supplier.IsActive = false;
        supplier.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(ApiResponseDto<object>.Ok(new { }, "Đã vô hiệu hóa nhà cung cấp"));
    }

    [HttpGet("{id:int}/purchase-orders")]
    public async Task<ActionResult<ApiResponseDto<object>>> GetPurchaseOrders(int id)
    {
        var orders = await _db.PurchaseOrders
            .Where(o => o.SupplierId == id)
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new PurchaseOrderDto
            {
                Id = o.Id,
                Code = o.Code,
                SupplierName = o.Supplier.Name,
                SupplierId = o.SupplierId,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                PaidAmount = o.PaidAmount,
                DebtAmount = o.TotalAmount - o.PaidAmount,
                Status = o.Status.ToString(),
                Notes = o.Notes
            })
            .ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(orders));
    }
}

[ApiController]
[Route("api/purchase-orders")]
[Authorize(Roles = "Admin")]
public class PurchaseOrdersController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PurchaseOrdersController(ApplicationDbContext db)
    {
        _db = db;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<ApiResponseDto<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? supplierId = null,
        [FromQuery] string? status = null)
    {
        var query = _db.PurchaseOrders.Include(o => o.Supplier).AsQueryable();
        if (supplierId.HasValue) query = query.Where(o => o.SupplierId == supplierId);
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PurchaseOrderStatus>(status, out var s))
            query = query.Where(o => o.Status == s);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(o => o.OrderDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new PurchaseOrderDto
            {
                Id = o.Id,
                Code = o.Code,
                SupplierName = o.Supplier.Name,
                SupplierId = o.SupplierId,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                PaidAmount = o.PaidAmount,
                DebtAmount = o.TotalAmount - o.PaidAmount,
                Status = o.Status.ToString(),
                Notes = o.Notes
            })
            .ToListAsync();

        return Ok(ApiResponseDto<object>.Ok(new { total, page, pageSize, items }));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponseDto<PurchaseOrderDto>>> GetById(int id)
    {
        var o = await _db.PurchaseOrders
            .Include(x => x.Supplier)
            .Include(x => x.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (o == null) return NotFound(ApiResponseDto<PurchaseOrderDto>.Fail("Không tìm thấy đơn nhập hàng"));

        return Ok(ApiResponseDto<PurchaseOrderDto>.Ok(MapOrder(o)));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponseDto<PurchaseOrderDto>>> Create([FromBody] CreatePurchaseOrderDto dto)
    {
        var supplier = await _db.Suppliers.FindAsync(dto.SupplierId);
        if (supplier == null) return BadRequest(ApiResponseDto<PurchaseOrderDto>.Fail("Nhà cung cấp không tồn tại"));

        var order = new PurchaseOrder
        {
            Code = GenerateCode(),
            SupplierId = dto.SupplierId,
            Notes = dto.Notes,
            CreatedById = UserId,
            Status = PurchaseOrderStatus.Draft
        };

        decimal total = 0;
        foreach (var item in dto.Items)
        {
            var product = await _db.Products.FindAsync(item.ProductId);
            if (product == null) continue;
            var lineTotal = item.Quantity * item.UnitCost;
            total += lineTotal;
            order.Items.Add(new PurchaseOrderItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitCost = item.UnitCost
            });
        }
        order.TotalAmount = total;

        _db.PurchaseOrders.Add(order);
        await _db.SaveChangesAsync();

        var result = await _db.PurchaseOrders
            .Include(x => x.Supplier)
            .Include(x => x.Items).ThenInclude(i => i.Product)
            .FirstAsync(x => x.Id == order.Id);

        return CreatedAtAction(nameof(GetById), new { id = order.Id },
            ApiResponseDto<PurchaseOrderDto>.Ok(MapOrder(result), "Tạo đơn nhập hàng thành công"));
    }

    [HttpPut("{id:int}/receive")]
    public async Task<ActionResult<ApiResponseDto<object>>> Receive(int id)
    {
        var order = await _db.PurchaseOrders
            .Include(x => x.Items).ThenInclude(i => i.Product)
            .Include(x => x.Supplier)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (order == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy đơn nhập hàng"));
        if (order.Status == PurchaseOrderStatus.Received)
            return BadRequest(ApiResponseDto<object>.Fail("Đơn hàng đã được nhận"));
        if (order.Status == PurchaseOrderStatus.Cancelled)
            return BadRequest(ApiResponseDto<object>.Fail("Đơn hàng đã bị hủy"));

        foreach (var item in order.Items)
        {
            var product = item.Product;
            var before = product.Stock;
            product.Stock += item.Quantity;
            product.UpdatedAt = DateTime.UtcNow;

            _db.StockTransactions.Add(new StockTransaction
            {
                ProductId = item.ProductId,
                Type = StockTransactionType.Import,
                Quantity = item.Quantity,
                StockBefore = before,
                StockAfter = product.Stock,
                Reference = order.Code,
                Notes = $"Nhập hàng từ đơn {order.Code}",
                CreatedById = UserId,
                PurchaseOrderId = order.Id
            });
        }

        order.Status = PurchaseOrderStatus.Received;
        order.UpdatedAt = DateTime.UtcNow;

        // Update supplier debt
        var debt = order.TotalAmount - order.PaidAmount;
        order.Supplier.TotalDebt += debt;
        order.Supplier.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(ApiResponseDto<object>.Ok(new { }, "Nhận hàng thành công, tồn kho đã được cập nhật"));
    }

    [HttpPost("{id:int}/pay")]
    public async Task<ActionResult<ApiResponseDto<object>>> Pay(int id, [FromBody] PayPurchaseOrderDto dto)
    {
        var order = await _db.PurchaseOrders.Include(x => x.Supplier).FirstOrDefaultAsync(x => x.Id == id);
        if (order == null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy đơn nhập hàng"));

        var remaining = order.TotalAmount - order.PaidAmount;
        if (dto.Amount <= 0 || dto.Amount > remaining)
            return BadRequest(ApiResponseDto<object>.Fail($"Số tiền không hợp lệ. Còn nợ: {remaining}"));

        order.PaidAmount += dto.Amount;
        order.UpdatedAt = DateTime.UtcNow;

        // Update supplier debt if already received
        if (order.Status == PurchaseOrderStatus.Received)
        {
            order.Supplier.TotalDebt -= dto.Amount;
            if (order.Supplier.TotalDebt < 0) order.Supplier.TotalDebt = 0;
            order.Supplier.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponseDto<object>.Ok(new
        {
            PaidAmount = order.PaidAmount,
            Remaining = order.TotalAmount - order.PaidAmount
        }, "Ghi nhận thanh toán thành công"));
    }

    private static PurchaseOrderDto MapOrder(PurchaseOrder o) => new()
    {
        Id = o.Id,
        Code = o.Code,
        SupplierName = o.Supplier.Name,
        SupplierId = o.SupplierId,
        OrderDate = o.OrderDate,
        TotalAmount = o.TotalAmount,
        PaidAmount = o.PaidAmount,
        DebtAmount = o.TotalAmount - o.PaidAmount,
        Status = o.Status.ToString(),
        Notes = o.Notes,
        Items = o.Items.Select(i => new PurchaseOrderItemDetailDto
        {
            ProductId = i.ProductId,
            ProductName = i.Product.Name,
            Sku = i.Product.Sku,
            Quantity = i.Quantity,
            UnitCost = i.UnitCost,
            Total = i.Quantity * i.UnitCost
        }).ToList()
    };

    private string GenerateCode()
    {
        var count = _db.PurchaseOrders.Count() + 1;
        return $"NK{count:D3}";
    }
}

public class PayPurchaseOrderDto
{
    public decimal Amount { get; set; }
}
