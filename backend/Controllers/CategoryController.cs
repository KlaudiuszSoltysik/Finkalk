using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[Route("category")]
[ApiController]
public class CategoryController(PostgresContext postgresContext) : ControllerBase
{
    [Authorize]
    [HttpGet("get-categories")]
    public async Task<IActionResult> GetCategories()
    {
        return Ok(await postgresContext.ItemCategories.OrderBy(s => s.Name).ToListAsync());
    }

    [Authorize]
    [HttpGet("get-subcategories")]
    public async Task<IActionResult> GetSubcategories()
    {
        return Ok(await postgresContext.ItemSubcategories
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.ItemCategoryId
            })
            .OrderBy(s => s.Name)
            .ToListAsync());
    }
}