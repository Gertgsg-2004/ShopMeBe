using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopMeBe.Core.DTOs;
using ShopMeBe.Core.DTOs.Product;
using ShopMeBe.Core.Entities;
using ShopMeBe.Core.Interfaces;
using ShopMeBe.Infrastructure.Data;
using System.Security.Claims;

namespace ShopMeBe.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IProductRepository _productRepo;

    public ReviewsController(ApplicationDbContext context, IProductRepository productRepo)
    {
        _context = context;
        _productRepo = productRepo;
    }

    [HttpGet("product/{productId:int}")]
    public async Task<ActionResult<ApiResponseDto<List<ReviewDto>>>> GetProductReviews(int productId)
    {
        var reviews = await _context.Reviews
            .Include(r => r.User)
            .Where(r => r.ProductId == productId && r.IsApproved)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto
            {
                Id = r.Id,
                ProductId = r.ProductId,
                UserId = r.UserId,
                UserName = r.User.FullName,
                UserAvatar = r.User.Avatar,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(ApiResponseDto<List<ReviewDto>>.Ok(reviews));
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ApiResponseDto<ReviewDto>>> CreateReview([FromBody] CreateReviewDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var existing = await _context.Reviews.AnyAsync(r => r.ProductId == dto.ProductId && r.UserId == userId);
        if (existing)
            return BadRequest(ApiResponseDto<ReviewDto>.Fail("Bạn đã đánh giá sản phẩm này rồi"));

        if (dto.Rating < 1 || dto.Rating > 5)
            return BadRequest(ApiResponseDto<ReviewDto>.Fail("Rating phải từ 1 đến 5"));

        var review = new Review
        {
            ProductId = dto.ProductId,
            UserId = userId,
            Rating = dto.Rating,
            Comment = dto.Comment,
            IsApproved = true
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();
        await _productRepo.UpdateRatingAsync(dto.ProductId);

        return Ok(ApiResponseDto<ReviewDto>.Ok(new ReviewDto
        {
            Id = review.Id,
            ProductId = review.ProductId,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        }, "Đánh giá thành công"));
    }
}
