namespace OrtoProtesiApi.DTOs;
using System.ComponentModel.DataAnnotations;

public class ChangePasswordDTO
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }

    [Required]
    public string VecchiaPassword { get; set; }

    [Required]
    [MinLength(8)]
    public string NuovaPassword { get; set; }
}