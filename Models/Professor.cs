using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ComucAPI.Models
{
    [Table("professor")]
    public class Professor
    {
        [Key]
        [Column("id_professor")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdProfessor { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("nome")]
        public string Nome { get; set; }

        [Required]
        [MaxLength(255)]
        [Column("senha")]
        public string Senha { get; set; }

        [MaxLength(11)]
        [Column("cpf")]
        public string? CPF { get; set; }

        [MaxLength(20)]
        [Column("telefone")]
        public string? Telefone { get; set; }

        [MaxLength(9)]
        [Column("rg")]
        public string? RG { get; set; }

        [Column("data_nascimento")]
        public DateTime? DataNascimento { get; set; }

        [MaxLength(255)]
        [Column("endereco")]
        public string? Endereco { get; set; }
    }
}
