using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ComucAPI.Models
{
    [Table("presenca")]
    public class Presenca
    {
        [Key]
        [Column("id_presenca")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdPresenca { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("nome")]
        public string Nome { get; set; }

        [Column("data")]
        public DateTime Data { get; set; }

        [Column("presenca")]
        public bool Presente { get; set; }

        [Column("id_banda")]
        public int? IdBanda { get; set; }

        [Column("id_aluno")]
        public int IdAluno { get; set; }

        [Column("id_professor")]
        public int IdProfessor { get; set; }

        [ForeignKey("IdBanda")]
        public virtual Banda Banda { get; set; }

        [ForeignKey("IdAluno")]
        public virtual Aluno Aluno { get; set; }

        [ForeignKey("IdProfessor")]
        public virtual Professor Professor { get; set; }
    }
}