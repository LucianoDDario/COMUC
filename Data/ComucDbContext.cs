using ComucAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ComucAPI.Data
{
    public class ComucDbContext : DbContext
    {
        public ComucDbContext(DbContextOptions<ComucDbContext> options) : base(options)
        {
        }

        public DbSet<Aluno> Alunos { get; set; }
        public DbSet<Banda> Bandas { get; set; }
        public DbSet<Funcionario> Funcionarios { get; set; }
        public DbSet<Nota> Notas { get; set; }
        public DbSet<Presenca> Presencas { get; set; }
        public DbSet<Professor> Professores {  get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configurando a relação N:N entre Aluno e Banda
            modelBuilder.Entity<Aluno>()
                .HasMany(a => a.Bandas)
                .WithMany(b => b.Alunos)
                .UsingEntity<Dictionary<string, object>>(
                    "banda_aluno", 
                    j => j.HasOne<Banda>().WithMany().HasForeignKey("id_banda"),
                    j => j.HasOne<Aluno>().WithMany().HasForeignKey("id_aluno")
                );
        }
    }
}
