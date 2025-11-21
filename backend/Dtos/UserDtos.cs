namespace backend.Dtos;

public class GetUserDto
{
    public int Id { get; init; }
    public string Name { get; set; } = null!;
    public string? PictureUrl { get; set; }
}