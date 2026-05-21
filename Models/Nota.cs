using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ComucAPI.Models
{
    [Table("nota")]
    public class Nota
    {
        [Key]
        [Column("id_nota")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdNota { get; set; }

        [Column("valor_nota", TypeName = "decimal(10,2)")]
        public Decimal ValorNota { get; set; }

        [Column("mes")]
        public DateTime Mes {  get; set; }

        [Column("musica")]
        public string Musica { get; set; }

        [Column("descricao")]
        public string Descricao { get; set; }

        [ForeignKey("id_aluno")]
        public virtual Aluno Aluno { get; set; }

        [ForeignKey("id_professor")]
        public virtual Professor Professor { get; set; }
    }
}
