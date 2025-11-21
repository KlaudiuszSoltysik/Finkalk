using Newtonsoft.Json.Linq;

namespace backend.Utils;

internal class AlphaVantageClient(string apiKey)
{
    private readonly HttpClient _httpClient = new();

    public async Task GetCurrencies(string from, string to)
    {
        var url = $"https://www.alphavantage.co/query?function=FX_DAILY&from_symbol={from}&to_symbol={to}&interval=5min&apikey={apiKey}";
        Console.WriteLine(url);

        using var http = new HttpClient();
        var response = await http.GetAsync(url);

        if (!response.IsSuccessStatusCode)
            throw new Exception($"AlphaVantage returned {(int)response.StatusCode} {response.ReasonPhrase}");

        var json = await response.Content.ReadAsStringAsync();
        var obj = JObject.Parse(json);

        Console.WriteLine(obj);
    }
}
