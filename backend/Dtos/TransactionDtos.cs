using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Dtos;

public class PostTransactionDto
{
    public string? ShopName { get; init; }

    [AllowedValues("online", "stationary", "")]
    [MaxLength(10)]
    public string? Source { get; init; } = "";

    [Required]
    [Column(TypeName = "decimal(9,2)")]
    public decimal Total { get; init; }

    [Required] public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    [MaxLength(300)] public string? Note { get; init; }
    public int ItemSubcategoryId { get; init; }
}

public class GetTransactionDto
{
    [Key] public int Id { get; init; }
    public string? ShopName { get; init; }

    [Required]
    [AllowedValues("online", "stationary", "")]
    [MaxLength(10)]
    public string Source { get; init; } = "";

    [Required]
    [Column(TypeName = "decimal(9,2)")]
    public decimal Total { get; init; }

    [Required] public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    [MaxLength(300)] public string? Note { get; init; }
    public int ItemSubcategoryId { get; init; }
}

public class TransactionFilterDto
{
    [Required] public int Month { get; init; }
    [Required] public int Year { get; init; }

    [Required]
    [AllowedValues("timestamp", "total")]
    [MaxLength(10)]
    public string Sort { get; init; } = "timestamp";

    public FiltersDto Filters { get; init; } = new();
}

public class FiltersDto
{
    public string? ShopName { get; init; }
    public int? ItemSubcategoryId { get; init; }
    public string? Source { get; init; }
    public string? Note { get; init; }
}