using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Dtos;

public class GetMonthlyBudgetDto
{
    [Required] public int Month { get; set; }
    [Required] public int Year { get; set; }
    public List<GetBudgetEntryDto> Entries { get; set; } = null!;
}

public class GetBudgetEntryDto
{
    [Required] public int ItemSubcategoryId { get; init; }

    [Column(TypeName = "decimal(9,2)")] public decimal Planned { get; init; }

    [Column(TypeName = "decimal(9,2)")] public decimal Real { get; init; }
}

public class PostMonthlyBudgetDto
{
    [Required] public int Month { get; set; }
    [Required] public int Year { get; set; }
    [Required] public List<GetBudgetEntryDto> BudgetEntries { get; set; } = null!;
}