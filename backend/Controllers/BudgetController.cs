using backend.Dtos;
using backend.Mappers;
using backend.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[Route("budget")]
[ApiController]
public class BudgetController(PostgresContext postgresContext) : ControllerBase
{
    [Authorize]
    [HttpGet("get-budget")]
    public async Task<IActionResult> GetBudget([FromQuery] int month, [FromQuery] int year)
    {
        var userDto = await UserUtils.GetLoggedUser(User, postgresContext);

        var budget = await postgresContext.MonthlyBudgets
            .Where(m => m.Month == month && m.Year == year && m.UserId == userDto.Id)
            .Include(m => m.Entries)
            .ThenInclude(e => e.ItemSubcategory)
            .FirstOrDefaultAsync();

        if (budget != null) return Ok(BudgetMappers.GetMonthlyBudgetDtoMapper(budget));

        var latestBudget = await postgresContext.MonthlyBudgets
            .Where(m => m.UserId == userDto.Id)
            .Include(m => m.Entries)
            .ThenInclude(e => e.ItemSubcategory)
            .OrderByDescending(m => m.Year)
            .ThenByDescending(m => m.Month)
            .FirstOrDefaultAsync();

        if (latestBudget == null) return Ok();

        latestBudget.Month = month;
        latestBudget.Year = year;

        return Ok(BudgetMappers.GetMonthlyBudgetDtoMapper(latestBudget));
    }

    [Authorize]
    [HttpGet("get-history")]
    public async Task<IActionResult> GetHistory([FromQuery] int startMonth, [FromQuery] int startYear,
        [FromQuery] int endMonth, [FromQuery] int endYear)
    {
        var userDto = await UserUtils.GetLoggedUser(User, postgresContext);

        var start = startYear * 100 + startMonth;
        var end = endYear * 100 + endMonth;

        var budgets = await postgresContext.MonthlyBudgets
            .Where(m => m.Year * 100 + m.Month >= start && m.Year * 100 + m.Month <= end && m.UserId == userDto.Id)
            .Include(m => m.Entries)
            .ThenInclude(e => e.ItemSubcategory)
            .OrderBy(e => e.Year)
            .ThenBy(e => e.Month)
            .ToListAsync();

        var budgetDtos = budgets.Select(BudgetMappers.GetMonthlyBudgetDtoMapper).ToList();

        return Ok(budgetDtos);
    }

    [Authorize]
    [HttpGet("get-social-stats")]
    public async Task<IActionResult> GetSocialStats([FromQuery] int startMonth, [FromQuery] int startYear,
        [FromQuery] int endMonth, [FromQuery] int endYear)
    {
        var start = startYear * 100 + startMonth;
        var end = endYear * 100 + endMonth;

        var categories = await postgresContext.ItemCategories.ToListAsync();
        var subcategories = await postgresContext.ItemSubcategories.ToListAsync();

        var budgets = await postgresContext.MonthlyBudgets
            .Where(m => m.Year * 100 + m.Month >= start && m.Year * 100 + m.Month <= end)
            .Include(m => m.Entries)
            .ThenInclude(e => e.ItemSubcategory)
            .OrderBy(e => e.Year)
            .ThenBy(e => e.Month)
            .ToListAsync();

        var entries = budgets.SelectMany(b => b.Entries).ToList();

        var medians = new Dictionary<int, decimal?>();

        foreach (var cat in categories)
        {
            var subs = subcategories
                .Where(s => s.ItemCategoryId == cat.Id)
                .Select(s => s.Id)
                .ToHashSet();

            var relevantValues = entries
                .Where(e => subs.Contains(e.ItemSubcategoryId))
                .Select(e => e.Real)
                .OrderBy(x => x)
                .ToList();

            decimal? median;
            var count = relevantValues.Count;

            if (count == 0)
                median = null;
            else if (count % 2 == 1)
                median = relevantValues[count / 2];
            else
                median = (relevantValues[count / 2 - 1] + relevantValues[count / 2]) / 2;

            medians.Add(cat.Id, median);
        }

        return Ok(medians);
    }

    [Authorize]
    [HttpPost("save-budget")]
    public async Task<IActionResult> SaveBudget([FromBody] PostMonthlyBudgetDto monthlyBudgetDto)
    {
        var userDto = await UserUtils.GetLoggedUser(User, postgresContext);

        var budget = await postgresContext.MonthlyBudgets
            .FirstOrDefaultAsync(m =>
                m.Month == monthlyBudgetDto.Month && m.Year == monthlyBudgetDto.Year && m.UserId == userDto.Id);

        if (budget == null)
        {
            var newBudget = new MonthlyBudget
            {
                Month = monthlyBudgetDto.Month,
                Year = monthlyBudgetDto.Year,
                UserId = userDto.Id
            };

            await postgresContext.MonthlyBudgets.AddAsync(newBudget);
            await postgresContext.SaveChangesAsync();

            budget = newBudget;
        }

        await postgresContext.BudgetEntries
            .Where(b => b.MonthlyBudgetId == budget.Id)
            .ExecuteDeleteAsync();

        var newEntries = monthlyBudgetDto.BudgetEntries.Select(entry => new BudgetEntry
        {
            ItemSubcategoryId = entry.ItemSubcategoryId,
            MonthlyBudgetId = budget.Id,
            Planned = entry.Planned,
            Real = entry.Real
        }).ToList();

        if (newEntries.Count == 0)
            postgresContext.MonthlyBudgets.Remove(budget);
        else
            await postgresContext.BudgetEntries.AddRangeAsync(newEntries);

        await postgresContext.SaveChangesAsync();

        return Ok();
    }
}