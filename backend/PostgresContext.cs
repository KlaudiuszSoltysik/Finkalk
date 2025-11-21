using Microsoft.EntityFrameworkCore;

namespace backend;

public class PostgresContext(DbContextOptions<PostgresContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }

    public DbSet<Shop> Shops { get; set; }
    public DbSet<ItemCategory> ItemCategories { get; set; }
    public DbSet<ItemSubcategory> ItemSubcategories { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<MonthlyBudget> MonthlyBudgets { get; set; }
    public DbSet<BudgetEntry> BudgetEntries { get; set; }


    public DbSet<Instrument> Instruments { get; set; }
    public DbSet<InstrumentPrice> InstrumentPrices { get; set; }
    public DbSet<InstrumentDividend> InstrumentDividends { get; set; }
    public DbSet<Currency> Currencies { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasMany(u => u.MonthlyBudgets)
            .WithOne(m => m.User)
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Transaction>()
            .HasOne(p => p.ItemSubcategory)
            .WithMany()
            .HasForeignKey(s => s.ItemSubcategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Transaction>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ItemSubcategory>()
            .HasOne(sc => sc.ItemCategory)
            .WithMany()
            .HasForeignKey(sc => sc.ItemCategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Transaction>()
            .HasOne(p => p.Shop)
            .WithMany()
            .HasForeignKey(p => p.ShopId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<MonthlyBudget>()
            .HasMany(mb => mb.Entries)
            .WithOne(e => e.MonthlyBudget)
            .HasForeignKey(e => e.MonthlyBudgetId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<BudgetEntry>()
            .HasOne(e => e.ItemSubcategory)
            .WithMany()
            .HasForeignKey(e => e.ItemSubcategoryId)
            .OnDelete(DeleteBehavior.Restrict);


        modelBuilder.Entity<Instrument>()
            .HasOne(i => i.Currency)
            .WithMany()
            .HasForeignKey(i => i.CurrencyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Instrument>()
            .HasMany(i => i.Prices)
            .WithOne()
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Instrument>()
            .HasMany(i => i.Dividends)
            .WithOne()
            .OnDelete(DeleteBehavior.Cascade);
    }
}