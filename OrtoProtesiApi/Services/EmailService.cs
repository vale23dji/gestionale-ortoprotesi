using SendGrid;
using SendGrid.Helpers.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using OrtoProtesiApi.Config;

namespace OrtoProtesiApi.Services
{
    public class EmailService : IEmailService
    {
        private readonly SendGridOptions _options;

        public EmailService(IOptions<SendGridOptions> options)
        {
            _options = options.Value;
        }

        public async Task InviaEmailAsync(string destinatario, string oggetto, string messaggio)
        {
            var client = new SendGridClient(_options.ApiKey);
            var from = new EmailAddress("djiggi23@gmail.com", "OrtoProtesi App");
            var to = new EmailAddress(destinatario);
            var msg = MailHelper.CreateSingleEmail(from, to, oggetto, messaggio, messaggio);
            var response = await client.SendEmailAsync(msg);
            Console.WriteLine($"SendGrid Response: {response.StatusCode}");
        }

        public async Task SendVerificationEmail(string toEmail, string nome, string token)
        {
            var client = new SendGridClient(_options.ApiKey);
            var from = new EmailAddress("djiggi23@gmail.com", "OrtoProtesi App");
            var subject = "Conferma la tua registrazione";
            var to = new EmailAddress(toEmail, nome);

            var urlConferma =  $"http://localhost:4200/verifica-email?token={token}";

            var plainTextContent = $"Ciao {nome}, conferma la tua registrazione cliccando questo link: {urlConferma}";
            var htmlContent = $"<p>Ciao {nome}, </p><p>Conferma la tua registrazione cliccando il seguente link: </p><p><a href=\"{urlConferma}\">Conferma Email</a></p>";
            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
            await client.SendEmailAsync(msg);
        }
    }
}