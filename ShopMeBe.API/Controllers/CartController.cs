using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.DTOs.Cart;
using ShopMeBe.Core.Interfaces;
using System.Security.Claims;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly ICartRepository _cartRepo;
    private readonly IProductRepository _productRepo;

    public CartController(ICartRepository cartRepo, IProductRepository productRepo)
    {
        _cartRepo = cartRepo;
        _productRepo = productRepo;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<ApiResponseDto<CartDto>>> GetCart()
    {
        var cart = await _cartRepo.GetCartAsync(UserId);
        return Ok(ApiResponseDto<CartDto>.Ok(cart ?? new CartDto()));
    }

    [HttpPost("add")]
    public async Task<ActionResult<ApiResponseDto<CartDto>>> AddToCart([FromBody] AddToCartDto dto)
    {
        var product = await _productRepo.GetProductByIdAsync(dto.ProductId);
        if (product == null)
            return NotFound(ApiResponseDto<CartDto>.Fail("Không tìm thấy sản phẩm"));

        if (product.Stock < dto.Quantity)
            return BadRequest(ApiResponseDto<CartDto>.Fail($"Chỉ còn {product.Stock} sản phẩm trong kho"));

        var price = product.SalePrice ?? product.Price;
        await _cartRepo.AddItemAsync(UserId, dto.ProductId, dto.Quantity, price);
        var cart = await _cartRepo.GetCartAsync(UserId);
        return Ok(ApiResponseDto<CartDto>.Ok(cart!, "Thêm vào giỏ hàng thành công"));
    }

    [HttpPut("items/{itemId:int}")]
    public async Task<ActionResult<ApiResponseDto<CartDto>>> UpdateItem(int itemId, [FromBody] UpdateCartItemDto dto)
    {
        if (dto.Quantity <= 0)
        {
            await _cartRepo.RemoveItemAsync(itemId);
        }
        else
        {
            await _cartRepo.UpdateItemAsync(itemId, dto.Quantity);
        }

        var cart = await _cartRepo.GetCartAsync(UserId);
        return Ok(ApiResponseDto<CartDto>.Ok(cart ?? new CartDto(), "Cập nhật giỏ hàng thành công"));
    }

    [HttpDelete("items/{itemId:int}")]
    public async Task<ActionResult<ApiResponseDto<CartDto>>> RemoveItem(int itemId)
    {
        await _cartRepo.RemoveItemAsync(itemId);
        var cart = await _cartRepo.GetCartAsync(UserId);
        return Ok(ApiResponseDto<CartDto>.Ok(cart ?? new CartDto(), "Đã xóa sản phẩm khỏi giỏ hàng"));
    }

    [HttpDelete]
    public async Task<ActionResult<ApiResponseDto<object>>> ClearCart()
    {
        await _cartRepo.ClearCartAsync(UserId);
        return Ok(ApiResponseDto<object>.Ok(new { }, "Đã xóa giỏ hàng"));
    }
}
