using System.Security.Claims;
using backend;
using backend.Utils;
using Hangfire;
using Hangfire.Redis.StackExchange;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddDbContext<PostgresContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PostgresConnection")));

builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = "Cookies";
        options.DefaultChallengeScheme = "Google";
    })
    .AddCookie("Cookies", options =>
    {
        options.Cookie.SameSite = SameSiteMode.None;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    })
    .AddGoogle("Google", options =>
    {
        options.ClientId = builder.Configuration["Authentication:Google:ClientId"]!;
        options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;
        options.SaveTokens = true;

        options.ClaimActions.MapJsonKey("urn:google:picture", "picture");

        options.Events.OnCreatingTicket = async context =>
        {
            var db = context.HttpContext.RequestServices.GetRequiredService<PostgresContext>();

            var googleId = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = context.Principal?.FindFirst(ClaimTypes.Email)?.Value;
            var name = context.Principal?.Identity?.Name;

            if (googleId == null || email == null || name == null)
                throw new Exception("No Google data.");

            var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId);

            if (user == null)
                db.Users.Add(new User
                {
                    GoogleId = googleId,
                    Email = email,
                    Name = name,
                    PictureUrl = context.Principal?.FindFirst("urn:google:picture")?.Value!
                });
            else
                user.PictureUrl = context.Principal?.FindFirst("urn:google:picture")?.Value ?? null;
            await db.SaveChangesAsync();
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
builder.WebHost.UseUrls("https://localhost:6101");


var redisConnection = ConnectionMultiplexer.Connect("localhost:6002,abortConnect=false");

builder.Services.AddHangfire(config =>
{
    config.UseRedisStorage(redisConnection);
});

builder.Services.AddHangfireServer();
builder.Services.AddScoped<CurrencyUpdater>();


var app = builder.Build();

app.UseHttpsRedirection();
app.MapOpenApi();
app.MapScalarApiReference();
app.UseCors();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.UseHangfireDashboard();
// RecurringJob.AddOrUpdate("update-currencies", () => CurrencyUpdater.UpdateCurrencies(), "0 0,6,12,18 * * *");
RecurringJob.AddOrUpdate<CurrencyUpdater>("update-currencies", updater => updater.UpdateCurrencies(), "*/1 * * * *");

app.Run();