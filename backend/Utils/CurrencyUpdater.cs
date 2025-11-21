using System;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

namespace backend.Utils;

public class CurrencyUpdater(PostgresContext postgresContext, IConfiguration config)
{
    public async Task UpdateCurrencies()
    {
        var alphaVantage = new AlphaVantageClient(config["ApiKeys:AlphaVantage"]!);

        var currencies = postgresContext.Currencies.ToList();

        foreach (var currency in currencies)
        {
            await alphaVantage.GetCurrencies("PLN", currency.Code);
        }
    }
}