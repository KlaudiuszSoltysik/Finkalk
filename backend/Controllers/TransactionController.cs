using backend.Dtos;
using backend.Mappers;
using backend.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[Route("transaction")]
[ApiController]
public class TransactionController(PostgresContext postgresContext) : ControllerBase
{
    [Authorize]
    [HttpPost("get-transactions")]
    public async Task<IActionResult> GetTransactions([FromBody] TransactionFilterDto transactionFilterDto)
    {
        var userDto = await UserUtils.GetLoggedUser(User, postgresContext);

        var (start, end) = GetMonthRange(transactionFilterDto.Month, transactionFilterDto.Year);

        var query = postgresContext.Transactions
            .Include(t => t.Shop)
            .Where(t => t.Timestamp >= start && t.Timestamp <= end && t.UserId == userDto.Id);

        var filters = transactionFilterDto.Filters;

        if (!string.IsNullOrWhiteSpace(filters.ShopName))
        {
            var shopName = filters.ShopName.ToLower().Trim();
            query = query.Where(t => t.Shop != null && t.Shop.Name.Contains(shopName));
        }

        if (filters.ItemSubcategoryId.HasValue)
            query = query.Where(t => t.ItemSubcategoryId == filters.ItemSubcategoryId.Value);

        if (!string.IsNullOrWhiteSpace(filters.Source)) query = query.Where(t => t.Source == filters.Source);

        if (!string.IsNullOrWhiteSpace(filters.Note))
        {
            var note = filters.Note.ToLower().Trim();
            query = query.Where(t => t.Note != null && t.Note.Contains(note));
        }

        query = transactionFilterDto.Sort switch
        {
            "total" => query.OrderByDescending(t => t.Total).ThenByDescending(t => t.Timestamp),
            "timestamp" => query.OrderByDescending(t => t.Timestamp).ThenByDescending(t => t.Total),
            _ => query.OrderByDescending(t => t.Timestamp).ThenByDescending(t => t.Total)
        };

        var transactions = await query.ToListAsync();

        var transactionDtos = TransactionMappers.GetTransactionDtoListMapper(transactions, postgresContext);

        return Ok(transactionDtos);
    }

    [Authorize]
    [HttpPost("save-transaction")]
    public async Task<IActionResult> SaveTransaction([FromBody] PostTransactionDto transactionDto)
    {
        var userDto = await UserUtils.GetLoggedUser(User, postgresContext);

        var shopName = transactionDto.ShopName?.ToLower().Trim();
        int? shopId = null;

        if (!string.IsNullOrWhiteSpace(shopName))
        {
            var existingShop = await postgresContext.Shops
                .FirstOrDefaultAsync(s => s.Name == shopName);

            shopId = existingShop?.Id;

            if (existingShop == null)
            {
                var newShop = new Shop { Name = shopName };
                await postgresContext.Shops.AddAsync(newShop);
                await postgresContext.SaveChangesAsync();

                shopId = newShop.Id;
            }
        }

        var transaction = new Transaction
        {
            ShopId = shopId,
            Source = transactionDto.Source ?? "",
            Total = transactionDto.Total,
            Timestamp = transactionDto.Timestamp,
            Note = transactionDto.Note?.ToLower(),
            ItemSubcategoryId = transactionDto.ItemSubcategoryId,
            UserId = userDto.Id
        };

        var month = transactionDto.Timestamp.Month - 1;
        var year = transactionDto.Timestamp.Year;

        var budget = await postgresContext.MonthlyBudgets
            .Include(b => b.Entries)
            .FirstOrDefaultAsync(b => b.Month == month && b.Year == year && b.UserId == userDto.Id);

        var entry = budget?.Entries.FirstOrDefault(e => e.ItemSubcategoryId == transactionDto.ItemSubcategoryId);

        if (entry != null)
        {
            entry.Real += transactionDto.Total;
        }
        else
        {
            if (budget == null)
            {
                budget = new MonthlyBudget
                {
                    UserId = userDto.Id,
                    Month = month,
                    Year = year,
                    Entries = []
                };

                await postgresContext.MonthlyBudgets.AddAsync(budget);
            }

            budget.Entries.Add(new BudgetEntry
            {
                ItemSubcategoryId = transactionDto.ItemSubcategoryId,
                Planned = 0,
                Real = transactionDto.Total
            });
        }

        await postgresContext.Transactions.AddAsync(transaction);
        await postgresContext.SaveChangesAsync();

        return Ok();
    }

    [Authorize]
    [HttpDelete("delete-transaction")]
    public async Task<IActionResult> DeleteTransaction([FromBody] int id)
    {
        var userDto = await UserUtils.GetLoggedUser(User, postgresContext);

        var transaction = await postgresContext.Transactions
            .FirstOrDefaultAsync(t => t.Id == id);

        if (transaction == null) return NotFound();

        postgresContext.Transactions.Remove(transaction);
        await postgresContext.SaveChangesAsync();

        var month = transaction.Timestamp.Month - 1;
        var year = transaction.Timestamp.Year;

        var budget = await postgresContext.MonthlyBudgets
            .Include(b => b.Entries)
            .FirstOrDefaultAsync(b => b.Month == month && b.Year == year && b.UserId == userDto.Id);

        if (budget == null) return Ok();

        var entry = budget.Entries.FirstOrDefault(e => e.ItemSubcategoryId == transaction.ItemSubcategoryId);

        if (entry == null) return Ok();

        entry.Real -= transaction.Total;

        if (entry is { Real: 0, Planned: 0 }) budget.Entries.Remove(entry);

        await postgresContext.SaveChangesAsync();

        return Ok();
    }

    [Authorize]
    [HttpGet("filter-shops")]
    public async Task<IActionResult> FilterShops([FromQuery] string? name)
    {
        List<string> shops;

        if (name != null)
        {
            var nameFilter = name.ToLower().Trim();

            shops = await postgresContext.Shops
                .Where(s => s.Name.ToLower().Contains(nameFilter))
                .Select(s => string.IsNullOrEmpty(s.DisplayName) ? s.Name : s.DisplayName)
                .OrderBy(s => s)
                .ToListAsync();
        }
        else
        {
            shops = await postgresContext.Shops
                .Select(s => string.IsNullOrEmpty(s.DisplayName) ? s.Name : s.DisplayName)
                .OrderBy(s => s)
                .ToListAsync();
        }

        return Ok(shops);
    }

    private static (DateTimeOffset Start, DateTimeOffset End) GetMonthRange(int month, int year)
    {
        month += 1;

        var startLocal = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Unspecified);
        var endLocal = startLocal.AddMonths(1).AddTicks(-1);

        var polishZone = TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time");

        var startUtc = TimeZoneInfo.ConvertTimeToUtc(startLocal, polishZone);
        var endUtc = TimeZoneInfo.ConvertTimeToUtc(endLocal, polishZone);

        return (startUtc, endUtc);
    }
}