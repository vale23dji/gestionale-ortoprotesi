using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using OrtoProtesiApi.Data;
using OrtoProtesiApi.Models;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace OrtoProtesiApi.Services
{
    public class AuditService
    {
        private readonly DataContext _context;
        private readonly ILogger<AuditService> _logger;
        
        public AuditService(DataContext context, ILogger<AuditService> logger)
        {
            _context = context;
            _logger = logger;
        }
        
        public void LogSecurityEvent(HttpContext context, string eventType, string description, bool success)
        {
            try
            {
                var userId = GetUserId(context.User);
                var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                var userAgent = context.Request.Headers["User-Agent"].ToString();
                
                _logger.LogInformation(
                    "Security: {EventType} - User: {UserId} - IP: {IpAddress} - Success: {Success} - {Description}",
                    eventType, userId, ipAddress, success, description);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Errore durante il logging di sicurezza");
            }
        }
        
        private int? GetUserId(ClaimsPrincipal user)
        {
            var claim = user.FindFirst(ClaimTypes.NameIdentifier);
            if (claim != null && int.TryParse(claim.Value, out var userId))
            {
                return userId;
            }
            return null;
        }
    }
}