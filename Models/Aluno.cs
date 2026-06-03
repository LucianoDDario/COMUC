using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ComucAPI.Models
{
    [Table("aluno")]
    public class Aluno
    {
        [Key]
        [Column("id_aluno")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdAluno { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("nome")]
        public string Nome { get; set; }

        [Required]
        [Column("data_de_nascimento")]
        public DateTime DataNascimento  { get; set; }

        [Required]
        [MaxLength(11)]
        [Column("telefone")]
        public string Telefone { get; set; }

        [Required]
        [MaxLength(11)]
        [Column("cpf")]
        public string CPF { get; set; }

        [Required]
        [MaxLength(9)]
        [Column("rg")]
        public string RG { get; set; }

        [Required]
        [MaxLength(200)]
        [Column("endereco")]
        public string Endereco { get; set; }

        [MaxLength(50)]
        [Column("nome_do_pai")]
        public string NomePai { get; set; }

        [MaxLength(50)]
        [Column("nome_da_mae")]
        public string NomeMae { get; set; }

        [MaxLength(50)]
        [Column("documento_responsavel")]
        public string? DocumentoResponsavel { get; set; }

        [Required]
        [Column("bolsista")]
        public bool Bolsista { get; set; }

        [Column("data_de_inicio")]
        public DateTime? DataInicio { get; set; }

        [MaxLength(100)]
        [Column("motivo_de_saida")]
        public string MotivoSaida { get; set; }

        [Column("possui_instrumento_proprio")]
        public bool PossuiInstrumento { get; set; }

        [MaxLength(50)]
        [Column("tamanho_da_vestimenta")]
        public string TamanhoVestimenta { get; set; }

        public virtual ICollection<Banda> Bandas {  get; set; } = new List<Banda>();
    }
}
