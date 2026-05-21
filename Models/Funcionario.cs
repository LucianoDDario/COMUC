using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ComucAPI.Models
{
    [Table("funcionario")]
    public class Funcionario
    {
        [Key]
        [Column("id_funcionario")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdFuncionario { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("nome")]
        public string nome { get; set; }

        [Required]
        [MaxLength(255)]
        [Column("senha")]
        public string senha { get; set; }
    }
}
