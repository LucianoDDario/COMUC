using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ComucAPI.Models
{
    [Table("banda")]
    public class Banda
    {
   
        [Key]
        [Column("id_banda")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdBanda { get; set; }

        [Column("nome")]
        public string Nome { get; set; }

        [Column("id_professor")]
        public int id_professor { get; set; }

        [Column("banda_pai_id")]
        public int? banda_pai_id { get; set; }

        // Navegação para a Banda Pai
        [ForeignKey("banda_pai_id")]
        public virtual Banda BandaPai { get; set; }

        // Navegação para as Bandas Filhas (As sub-turmas)
        public virtual ICollection<Banda> SubTurmas { get; set; }

        [ForeignKey("id_professor")]
        public virtual Professor Professor { get; set; }

        public virtual ICollection<Aluno> Alunos { get; set; } = new List<Aluno>(); 
    }
}
