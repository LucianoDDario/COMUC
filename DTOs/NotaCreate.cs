using System;

namespace ComucAPI.DTOs
{
    public class NotaCreateDTO
    {
        public int IdAluno { get; set; }
        public int IdProfessor { get; set; }
        public decimal ValorNota { get; set; }
        public DateTime Mes { get; set; }
        public string Musica { get; set; }
        public string Descricao { get; set; }
    }
}