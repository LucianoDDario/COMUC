using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ComucAPI.Models
{
    [Table("professor")]
    public class Professor
    {
        [Key]
        [Column("id_professor")]
        public int IdProfessor { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("nome")]
        public string Nome { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("senha")]
        public string Senha { get; set; }
    }
}
