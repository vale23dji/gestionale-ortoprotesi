using System.Threading.Tasks;

namespace OrtoProtesiApi.Services
{
    public interface IEmailService
    {
        Task InviaEmailAsync(string destinatario, string oggetto, string messaggio);
        Task SendVerificationEmail(string toEmail, string nome, string token);
    }
}