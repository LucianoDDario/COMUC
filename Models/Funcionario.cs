using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ComucAPI.Models
{
    [Table("funcionario")]
    public class Funcionario
    {
        [Key]
        [Column("id_funcionario")]
        public int IdFuncionario { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("nome")]
        public string nome { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("senha")]
        public string senha { get; set; }
    }
}
