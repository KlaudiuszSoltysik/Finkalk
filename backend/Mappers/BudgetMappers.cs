using backend.Dtos;

namespace backend.Mappers;

public static class BudgetMappers
{
    public static GetMonthlyBudgetDto GetMonthlyBudgetDtoMapper(MonthlyBudget budget)
    {
        var entriesDto = budget.Entries
            .Select(entry => new GetBudgetEntryDto
                { ItemSubcategoryId = entry.ItemSubcategoryId, Planned = entry.Planned, Real = entry.Real })
            .ToList();

        return new GetMonthlyBudgetDto
        {
            Month = budget.Month,
            Year = budget.Year,
            Entries = entriesDto
        };
    }
}