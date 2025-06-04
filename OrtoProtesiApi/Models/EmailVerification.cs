using OrtoProtesiApi.Models;
using System.ComponentModel.DataAnnotations;

public class EmailVerification
{
    public int Id { get; set; }
    public string Email { get; set;  } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime Expiration { get; set; }
    public bool IsVerified { get; set; } = false;
}