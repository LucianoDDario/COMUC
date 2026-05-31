using ComucAPI.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using dotenv.net;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
DotEnv.Load();



var builder = WebApplication.CreateBuilder(args);

var connectionString = Environment.GetEnvironmentVariable("SUPABASE_CONNECTION");




builder.Services.AddDbContext<ComucDbContext>(options =>
    options.UseNpgsql(connectionString!));

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontEnd", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

if (app.Environment.IsDevelopment())
{

}

//app.UseHttpsRedirection();
app.UseCors("FrontEnd");
app.UseAuthorization();
app.MapControllers();
app.Run();

