using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace backend;

public class User
{
    public int Id { get; init; }
    [MaxLength(100)] public string GoogleId { get; init; } = null!;
    [Required] [MaxLength(100)] public string Email { get; init; } = string.Empty;
    [Required] [MaxLength(100)] public string Name { get; init; } = string.Empty;
    [MaxLength(200)] public string? PictureUrl { get; set; }
    public List<MonthlyBudget>? MonthlyBudgets { get; init; }
}

public class Shop
{
    [Key] public int Id { get; init; }
    [Required] [MaxLength(100)] public string Name { get; init; } = string.Empty;
    [MaxLength(100)] public string? DisplayName { get; init; }
}

public class ItemCategory
{
    [Key] public int Id { get; init; }
    [Required] [MaxLength(100)] public string Name { get; init; } = string.Empty;
}

public class ItemSubcategory
{
    [Key] public int Id { get; init; }
    [Required] [MaxLength(100)] public string Name { get; init; } = string.Empty;
    [Required] public int ItemCategoryId { get; init; }
    [Required] public ItemCategory ItemCategory { get; init; } = null!;
}

public class Transaction
{
    [Key] public int Id { get; init; }
    public int? ShopId { get; init; }
    public Shop? Shop { get; init; }

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
    public ItemSubcategory ItemSubcategory { get; init; } = null!;

    public int UserId { get; init; }
    public User User { get; init; } = null!;
}

public class MonthlyBudget
{
    [Key] public int Id { get; init; }
    [Required] public int UserId { get; init; }
    [JsonIgnore] [Required] public User User { get; init; } = null!;
    [Required] public int Month { get; set; }
    [Required] public int Year { get; set; }
    public List<BudgetEntry> Entries { get; set; } = null!;
}

public class BudgetEntry
{
    [Key] public int Id { get; init; }
    [Required] public int MonthlyBudgetId { get; init; }
    [JsonIgnore] [Required] public MonthlyBudget MonthlyBudget { get; init; } = null!;
    public int ItemSubcategoryId { get; init; }
    public ItemSubcategory ItemSubcategory { get; init; } = null!;
    [Column(TypeName = "decimal(9,2)")] public decimal Planned { get; init; }
    [Column(TypeName = "decimal(9,2)")] public decimal Real { get; set; }
}

public class Instrument
{
    [Key] public int Id { get; init; }
    [Required] [MaxLength(50)] public string Name { get; init; }
    [Required] [MaxLength(10)] public string Ticker { get; init; }
    [Required] [MaxLength(20)] public string Isin { get; init; }
    [Required] [MaxLength(50)] public string Type { get; init; }
    [Required] [MaxLength(50)] public string Sector { get; init; }
    [Required] [MaxLength(50)] public string Region { get; init; }
    public double? Ter { get; init; }
    public int CurrencyId { get; init; }
    public Currency Currency { get; init; }
    public List<InstrumentPrice> Prices { get; set; }
    public List<InstrumentDividend> Dividends { get; set; }
}

public class InstrumentPrice
{
    [Key] public int Id { get; init; }
    [Required] public DateTime Timestamp { get; init; }
    [Column(TypeName = "decimal(18,2)")] public decimal Price { get; init; }
}

public class InstrumentDividend
{
    [Key] public int Id { get; init; }
    [Required] public DateTime ExTimestamp { get; init; }
    [Required] public DateTime PaymentTimestamp { get; init; }
    [Column(TypeName = "decimal(18,2)")] public decimal Value { get; init; }
}

public class Currency
{
    [Key] public int Id { get; init; }
    [Required] [MaxLength(3)] public string Code { get; init; }
    [Required] [MaxLength(50)] public string Name { get; init; }
    [Column(TypeName = "decimal(4,4)")] public decimal PlnPrice { get; init; }
}