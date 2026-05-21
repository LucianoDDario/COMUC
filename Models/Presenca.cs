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
        public bool Presente {  get; set; }

        [ForeignKey("id_aluno")]
        public virtual Aluno Aluno { get; set; }

        [ForeignKey("id_professor")]
        public virtual Professor Professor { get; set; }
    }
}
