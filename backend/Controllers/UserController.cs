using backend.Utils;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("user")]
[ApiController]
public class UserController(PostgresContext postgresContext) : ControllerBase
{
    [HttpGet("login")]
    public IActionResult Login([FromQuery] string? endpoint)
    {
        return Challenge(new AuthenticationProperties { RedirectUri = $"https://localhost:6102/{endpoint}" }, "Google");
    }

    [HttpGet("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync("Cookies");
        return Ok("Logged out.");
    }

    [Authorize]
    [HttpGet("get-user")]
    public async Task<IActionResult> GetUser()
    {
        try
        {
            var userDto = await UserUtils.GetLoggedUser(User, postgresContext);

            return Ok(userDto);
        }
        catch (Exception ex)
        {
            return Unauthorized(ex.Message);
        }
    }

    [AllowAnonymous]
    [HttpGet("check-login")]
    public async Task<IActionResult> CheckLogin()
    {
        try
        {
            await UserUtils.GetLoggedUser(User, postgresContext);
            return Ok(true);
        }
        catch
        {
            return Ok(false);
        }
    }
}