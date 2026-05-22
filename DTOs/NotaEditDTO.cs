using System;

namespace ComucAPI.DTOs
{
    public class NotaEditDTO
    {
        public decimal ValorNota { get; set; }
        public DateTime Mes { get; set; }
        public string Musica { get; set; }
        public string Descricao { get; set; }
    }
}