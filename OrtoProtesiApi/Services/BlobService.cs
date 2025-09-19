using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using OrtoProtesiApi.Services;

namespace OrtoProtesiApi.Services
{
    public class BlobService
{
    private readonly BlobContainerClient _container;
    private readonly string _baseUrl;

    public BlobService(IConfiguration cfg)
    {
        var cs = cfg["Blob:ConnectionString"] ?? throw new InvalidOperationException("Blob:ConnectionString missing");
        var container = cfg["Blob:Container"] ?? "uploads";
        _baseUrl = cfg["Blob:BaseUrl"] ?? throw new InvalidOperationException("Blob:BaseUrl missing");
        _container = new BlobContainerClient(cs, container);
        _container.CreateIfNotExists(PublicAccessType.None);
    }

    public async Task<string> UploadAsync(string fileName, Stream content, string contentType)
    {
        var blob = _container.GetBlobClient(fileName);
        await blob.UploadAsync(content, overwrite: true);
        await blob.SetHttpHeadersAsync(new BlobHttpHeaders { ContentType = contentType });
        return fileName; // id logico
    }

    public async Task StreamAsync(string fileName, HttpResponse response)
    {
        var blob = _container.GetBlobClient(fileName);
        var dl = await blob.DownloadStreamingAsync();
        response.ContentType = dl.Value.Details.ContentType ?? "application/octet-stream";
        await dl.Value.Content.CopyToAsync(response.Body);
    }

    public Uri GetSasReadUrl(string fileName, TimeSpan ttl)
    {
        var blob = _container.GetBlobClient(fileName);
        var sas = blob.GenerateSasUri(Azure.Storage.Sas.BlobSasPermissions.Read, DateTimeOffset.UtcNow.Add(ttl));
        return sas;
    }
}


}
