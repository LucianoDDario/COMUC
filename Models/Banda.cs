using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ComucAPI.Models
{
    [Table("banda")]
    public class Banda
    {
   
        [Key]
        [Column("id_banda")]
        public int IdBanda { get; set; }

        [Column("nome")]
        public string Nome { get; set; }

        [Column("id_professor")]
        public int id_professor { get; set; }

        [ForeignKey("id_professor")]
        public virtual Professor Professor { get; set; }

        public virtual ICollection<Aluno> Alunos { get; set; } = new List<Aluno>(); 
    }
}
