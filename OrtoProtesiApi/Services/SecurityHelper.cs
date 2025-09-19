using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Linq;

namespace OrtoProtesiApi.Services
{
    public class FileSecurityService
    {
        private readonly ILogger<FileSecurityService> _logger;

        // Estensioni consentite (puoi ridurle/espanderle a piacere)
        private static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };
        private static readonly string[] AllowedModelExtensions = { ".stl" };
        private static readonly string[] AllowedOtherExtensions = { ".txt", ".pdf" };

        // Dimensione massima per i file (20MB)
        private const long MaxFileSizeBytes = 20 * 1024 * 1024;

        public FileSecurityService(ILogger<FileSecurityService> logger)
        {
            _logger = logger;
        }

        // --- Metodo richiesto da Program.cs ---
        public bool IsSafe(IFormFile file)
        {
            if (file == null || file.Length == 0 || file.Length > MaxFileSizeBytes)
            {
                _logger.LogWarning("File non valido (null/size): {Filename}, size={Size}", file?.FileName, file?.Length);
                return false;
            }

            var fileName = Path.GetFileName(file.FileName);
            if (ContainsPathTraversal(fileName))
            {
                _logger.LogWarning("Nome file non sicuro (path traversal/invalid chars): {Filename}", fileName);
                return false;
            }

            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            var allowed = AllowedImageExtensions.Concat(AllowedModelExtensions).Concat(AllowedOtherExtensions);
            if (!allowed.Contains(ext))
            {
                _logger.LogWarning("Estensione non consentita: {Extension} (file: {Filename})", ext, fileName);
                return false;
            }

            return true;
        }

        // --- Metodi che avevi già ---

        public bool IsValidImage(IFormFile file)
        {
            if (file == null || file.Length == 0 || file.Length > MaxFileSizeBytes)
            {
                _logger.LogWarning("File immagine non valido: {Filename}, dimensione: {Size}",
                    file?.FileName, file?.Length);
                return false;
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var result = AllowedImageExtensions.Contains(extension);

            if (!result)
                _logger.LogWarning("Estensione file non consentita: {Extension}", extension);

            return result;
        }

        public bool IsValidStlFile(IFormFile file)
        {
            if (file == null || file.Length == 0 || file.Length > MaxFileSizeBytes)
            {
                _logger.LogWarning("File STL non valido: {Filename}, dimensione: {Size}",
                    file?.FileName, file?.Length);
                return false;
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var result = AllowedModelExtensions.Contains(extension);

            if (!result)
                _logger.LogWarning("Estensione file non consentita: {Extension}", extension);

            return result;
        }

        public string GenerateSecureFileName(string originalFileName)
        {
            var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
            return $"{Guid.NewGuid():N}{extension}";
        }

        public bool ContainsPathTraversal(string filename)
        {
            if (string.IsNullOrEmpty(filename))
                return true;

            var hasTraversal =
                filename.Contains("..") ||
                filename.Contains('/') ||
                filename.Contains('\\') ||
                Path.GetInvalidFileNameChars().Any(c => filename.Contains(c));

            if (hasTraversal)
                _logger.LogWarning("Rilevato tentativo di path traversal: {Filename}", filename);

            return hasTraversal;
        }
    }
}
