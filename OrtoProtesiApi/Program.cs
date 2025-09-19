using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AspNetCoreRateLimit;
using OrtoProtesiApi.Config;
using OrtoProtesiApi.Data;
using OrtoProtesiApi.Services;
using Microsoft.AspNetCore.Mvc; // RequestSizeLimitAttribute

var builder = WebApplication.CreateBuilder(args);

// ---------- CONFIG ----------
builder.Configuration
    .SetBasePath(builder.Environment.ContentRootPath)
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
    .AddEnvironmentVariables();

// ---------- KESTREL ----------
builder.WebHost.ConfigureKestrel(o => { o.Limits.MaxRequestBodySize = null; });

// ---------- LOGGING ----------
builder.Logging.SetMinimumLevel(LogLevel.Warning);

// ---------- SERVICES ----------
var config = builder.Configuration;

builder.Services.AddDbContext<DataContext>(opt =>
    opt.UseSqlServer(config.GetConnectionString("DefaultConnection")));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<FileSecurityService>();
builder.Services.AddSingleton<BlobService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<AuditService>();

builder.Services.Configure<SendGridOptions>(config.GetSection("SendGrid"));
builder.Services.AddApplicationInsightsTelemetry();

// ---------- CORS ----------
var allowedOrigins = config.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
Console.WriteLine("🔥 CORS Origins: " + string.Join(", ", allowedOrigins));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .WithExposedHeaders("Content-Disposition"));
});

// ---------- JWT ----------
var jwtSection = config.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSection["Key"] ?? throw new InvalidOperationException("JWT Key missing"));

builder.Services.AddAuthentication(o =>
{
    o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    o.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(o =>
{
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = jwtSection["Issuer"],
        ValidAudience            = jwtSection["Audience"],
        IssuerSigningKey         = new SymmetricSecurityKey(key)
    };
});

builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.ReferenceHandler       = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    o.JsonSerializerOptions.MaxDepth               = 32;
    o.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    o.JsonSerializerOptions.PropertyNamingPolicy   = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// ---------- Rate limiting ----------
builder.Services.AddMemoryCache();
builder.Services.AddInMemoryRateLimiting();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();

builder.Services.Configure<IpRateLimitOptions>(o =>
{
    o.GeneralRules = new List<RateLimitRule>
    {
        new() { Endpoint = "*:/api/*",                    Period = "1m", Limit = 60 },
        new() { Endpoint = "*:/api/auth/login",           Period = "1m", Limit = 5  },
        new() { Endpoint = "*:/api/auth/register",        Period = "1m", Limit = 3  },
        new() { Endpoint = "*:/api/auth/cambia-password", Period = "5m", Limit = 3  },
        new() { Endpoint = "POST:/api/upload",            Period = "1m", Limit = 20 },
        new() { Endpoint = "GET:/api/upload/*",           Period = "1m", Limit = 60 }
    };
    o.EnableEndpointRateLimiting = true;
    o.HttpStatusCode             = 429;
    o.RealIpHeader               = "X-Real-IP";
    o.ClientIdHeader             = "X-ClientId";
});

// ---------- Forwarded headers ----------
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownNetworks.Clear();
    o.KnownProxies.Clear();
});

// ---------- Cookie policy ----------
builder.Services.Configure<CookiePolicyOptions>(o =>
{
    o.MinimumSameSitePolicy = SameSiteMode.Strict;
    o.HttpOnly              = HttpOnlyPolicy.Always;
    o.Secure                = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
});

// Health checks
builder.Services.AddHealthChecks();

var app = builder.Build();
Console.WriteLine("🏁 Build completata");

// Log incoming requests (utile per vedere l’Origin)
app.Use(async (ctx, next) =>
{
    Console.WriteLine($"[{DateTime.UtcNow:o}] {ctx.Request.Method} {ctx.Request.Path} Origin={ctx.Request.Headers["Origin"]}");
    await next();
});

// ---------- PIPELINE ----------
app.UseForwardedHeaders();
app.MapHealthChecks("/healthz");

// 1) Routing
app.UseRouting();

// 2) CORS “fail-safe” (preflight + ensure headers con OnStarting) — **UNICO middleware custom CORS**
app.Use(async (ctx, next) =>
{
    var origin = ctx.Request.Headers.Origin.ToString();
    var isAllowed = !string.IsNullOrEmpty(origin) &&
                    allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);

    // Preflight: rispondi subito
    if (HttpMethods.IsOptions(ctx.Request.Method))
    {
        if (isAllowed)
        {
            ctx.Response.StatusCode = StatusCodes.Status204NoContent;
            ctx.Response.Headers["Access-Control-Allow-Origin"] = origin;
            ctx.Response.Headers["Vary"] = "Origin";
            ctx.Response.Headers["Access-Control-Allow-Credentials"] = "true";
            ctx.Response.Headers["Access-Control-Allow-Headers"] =
                ctx.Request.Headers["Access-Control-Request-Headers"].ToString();
            ctx.Response.Headers["Access-Control-Allow-Methods"] =
                ctx.Request.Headers["Access-Control-Request-Method"].ToString();
        }
        else
        {
            ctx.Response.StatusCode = StatusCodes.Status204NoContent;
        }
        return;
    }

    // Per tutte le altre richieste: imposta gli header prima dell'invio
    if (isAllowed)
    {
        ctx.Response.OnStarting(state =>
        {
            var http = (HttpContext)state;
            http.Response.Headers["Access-Control-Allow-Origin"] = origin;
            http.Response.Headers["Vary"] = "Origin";
            http.Response.Headers["Access-Control-Allow-Credentials"] = "true";
            http.Response.Headers["Access-Control-Expose-Headers"] = "Content-Disposition";
            return Task.CompletedTask;
        }, ctx);
    }

    await next();
});

// 3) CORS di default
app.UseCors();

// 4) Redirect /auth -> /api/auth (retrocompatibilità)
app.Use(async (ctx, next) =>
{
    if (ctx.Request.Path.StartsWithSegments("/auth", out var rest))
        ctx.Request.Path = "/api/auth" + rest;
    await next();
});

// 5) Rate limit (dopo CORS, così anche i 429 hanno gli header CORS)
app.UseIpRateLimiting();

app.UseAuthentication();
app.UseAuthorization();

// ---- Controllers ----
app.MapControllers();

// ---- Minimal APIs Upload ----
app.MapPost("/api/upload", async (HttpRequest req, BlobService svc, FileSecurityService guard) =>
{
    if (!req.HasFormContentType || req.Form.Files.Count == 0)
        return Results.BadRequest("No file");

    var f = req.Form.Files[0];
    const long MaxSize = 20L * 1024 * 1024;
    if (f.Length <= 0 || f.Length > MaxSize)
        return Results.BadRequest("File too large or empty");

    if (!guard.IsSafe(f))
        return Results.BadRequest("File type not allowed");

    await using var s = f.OpenReadStream();
    var id = await svc.UploadAsync(f.FileName, s, f.ContentType ?? "application/octet-stream");
    return Results.Ok(new { id });
})
.WithMetadata(new RequestSizeLimitAttribute(20L * 1024 * 1024));

app.MapGet("/api/upload/{id}", async (string id, HttpResponse res, BlobService svc) =>
{
    await svc.StreamAsync(id, res);
});

app.MapGet("/api/upload/{id}/sas", (string id, BlobService svc) =>
{
    var url = svc.GetSasReadUrl(id, TimeSpan.FromMinutes(15));
    return Results.Ok(new { url });
});

// ---------- DB migrations ----------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DataContext>();
    try
    {
        var strategy = db.Database.CreateExecutionStrategy();
        strategy.Execute(() => db.Database.Migrate());
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "EF migrations failed — continuing startup");
        // NON rilancio: l'app deve partire comunque per servire /api/auth e CORS
    }
}

// ---------- Headers e dev/prod ----------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
    app.Use(async (ctx, next) =>
    {
        // Questi header vengono aggiunti PRIMA del body → ok
        ctx.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        ctx.Response.Headers.Append("X-Frame-Options", "DENY");
        ctx.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
        ctx.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
        ctx.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        await next();
    });
}

app.UseCookiePolicy();

Console.WriteLine("🚀 Avvio app…");
app.Run();
