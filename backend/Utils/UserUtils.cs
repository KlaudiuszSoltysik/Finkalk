using System.Security.Claims;
using backend.Dtos;
using Microsoft.EntityFrameworkCore;

namespace backend.Utils;

public static class UserUtils
{
    public static async Task<GetUserDto> GetLoggedUser(ClaimsPrincipal user, PostgresContext postgresContext)
    {
        var googleId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (googleId == null)
            throw new Exception("GoogleId not found.");

        var u = await postgresContext.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId);

        if (u == null)
            throw new Exception("User not found.");

        var userDto = new GetUserDto
        {
            Id = u.Id,
            Name = u.Name,
            PictureUrl = u.PictureUrl ?? null
        };

        return userDto;
    }
}