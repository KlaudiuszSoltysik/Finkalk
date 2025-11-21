using backend.Dtos;

namespace backend.Mappers;

public static class TransactionMappers
{
    public static List<GetTransactionDto> GetTransactionDtoListMapper(List<Transaction> transactions,
        PostgresContext postgresContext)
    {
        return (from transaction in transactions
            let shop = postgresContext.Shops.FirstOrDefault(s => s.Id == transaction.ShopId)
            select new GetTransactionDto
            {
                Id = transaction.Id,
                ShopName = shop?.DisplayName ?? shop?.Name,
                Source = transaction.Source,
                Total = transaction.Total,
                Timestamp = transaction.Timestamp,
                Note = transaction.Note,
                ItemSubcategoryId = transaction.ItemSubcategoryId
            }).ToList();
    }
}