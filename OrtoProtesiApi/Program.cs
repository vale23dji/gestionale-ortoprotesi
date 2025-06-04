/*using Microsoft.EntityFrameworkCore;
using OrtoProtesiApi.Data;
using OrtoProtesiApi.Models;
using OrtoProtesiApi.Config;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System;
using BCrypt.Net;
using OrtoProtesiApi.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using System.IO;
using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options => 
{
    options.Limits.MaxRequestBodySize = null;
}); 

var config = builder.Configuration;

// Configurazione dei servizi
builder.Services.AddDbContext<DataContext>(options =>
    options.UseSqlServer(config.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.Configure<SendGridOptions>(config.GetSection("SendGrid"));



// CORS (accetta chiamate da Angular)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins",
    
      policy => policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// JWT CONFIGURATION
var jwtSettings = config.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

// In Program.cs
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.MaxDepth = 32;
    // Opzionalmente, puoi anche configurare:
    // options.JsonSerializerOptions.PropertyNamingPolicy = null;
    options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

// Crea l'app DOPO aver configurato tutti i servizi
var app = builder.Build();

// Definisci il percorso per i file di upload
string uploadsRoot = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads");

// Assicurati che la directory esista
if (!Directory.Exists(uploadsRoot))
{
    Directory.CreateDirectory(uploadsRoot);
}

// Aggiungere i ContentType per i vari tipi di file
var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".stl"] = "application/octet-stream";
provider.Mappings[".jpg"] = "image/jpeg";
provider.Mappings[".jpeg"] = "image/jpeg";
provider.Mappings[".png"] = "image/png";
provider.Mappings[".gif"] = "image/gif";
provider.Mappings[".bmp"] = "image/bmp";

// Usa il provider nella configurazione di Static Files
app.UseStaticFiles(new StaticFileOptions {
    FileProvider = new PhysicalFileProvider(uploadsRoot),
    RequestPath = "/uploads",
    ContentTypeProvider = provider
});

// MIDDLEWARE
app.UseCors("AllowAllOrigins");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();


DbSeeder.SeedAdmin(app);      // <-- aggiungi questa riga

app.Use(async (context, next) =>
{
    context.Request.EnableBuffering(); // per leggere il body più volte
    await next();

    if (context.Response.StatusCode == 400)
    {
        context.Request.Body.Position = 0;
        using var reader = new StreamReader(context.Request.Body);
        var body = await reader.ReadToEndAsync();
        Console.WriteLine(" BODY NON VALIDO:");
        Console.WriteLine(body);
    }
});


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.Run();
*/
using Microsoft.EntityFrameworkCore;
using OrtoProtesiApi.Data;
using OrtoProtesiApi.Models;
using OrtoProtesiApi.Config;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System;
using BCrypt.Net;
using OrtoProtesiApi.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using System.IO;
using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options => 
{
    options.Limits.MaxRequestBodySize = null;
}); 

var config = builder.Configuration;

// Configurazione dei servizi
builder.Services.AddDbContext<DataContext>(options =>
    options.UseSqlServer(config.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.Configure<SendGridOptions>(config.GetSection("SendGrid"));

// Configurazione CORS migliorata (accetta chiamate da Angular)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins",
        policy => 
        {
            policy.WithOrigins("http://localhost:4200")  // URL di Angular in sviluppo
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials()
                  .WithExposedHeaders("Content-Disposition"); // Necessario per il download dei file
        });
});

// JWT CONFIGURATION
var jwtSettings = config.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

// JSON options
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.MaxDepth = 32;
    // Se necessario, puoi anche configurare:
    // options.JsonSerializerOptions.PropertyNamingPolicy = null;
    options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

// Costruzione dell'app DOPO aver configurato tutti i servizi
var app = builder.Build();

// Configura il percorso per i file di upload
string uploadsRoot = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads");

// Assicura che la directory esista
if (!Directory.Exists(uploadsRoot))
{
    Directory.CreateDirectory(uploadsRoot);
}

// Configura i ContentType per i vari tipi di file
var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".stl"] = "application/octet-stream";
provider.Mappings[".jpg"] = "image/jpeg";
provider.Mappings[".jpeg"] = "image/jpeg";
provider.Mappings[".png"] = "image/png";
provider.Mappings[".gif"] = "image/gif";
provider.Mappings[".bmp"] = "image/bmp";

// Usa il provider nella configurazione di Static Files
app.UseStaticFiles(new StaticFileOptions {
    FileProvider = new PhysicalFileProvider(uploadsRoot),
    RequestPath = "/uploads",
    ContentTypeProvider = provider,
    OnPrepareResponse = ctx => {
        // Aggiungi header CORS per i file statici
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "http://localhost:4200");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, OPTIONS");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Credentials", "true");
    }
});

// MIDDLEWARE
// L'ordine è importante! CORS deve essere prima di Authentication e Authorization
app.UseCors("AllowAllOrigins");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

DbSeeder.SeedAdmin(app);      // <-- aggiungi questa riga

app.Use(async (context, next) =>
{
    context.Request.EnableBuffering(); // per leggere il body più volte
    await next();

    if (context.Response.StatusCode == 400)
    {
        context.Request.Body.Position = 0;
        using var reader = new StreamReader(context.Request.Body);
        var body = await reader.ReadToEndAsync();
        Console.WriteLine(" BODY NON VALIDO:");
        Console.WriteLine(body);
    }
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.Run();