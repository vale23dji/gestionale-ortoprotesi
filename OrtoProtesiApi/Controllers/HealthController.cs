using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc;
using OrtoProtesiApi.Data;
using OrtoProtesiApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using OrtoProtesiApi.DTOs;
using OrtoProtesiApi.Services;

namespace OrtoProtesiApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        [AllowAnonymous]
        public IActionResult Index()
        {
            return Ok(new { status = "API online", timestamp = DateTime.UtcNow });
        }
    }
}
