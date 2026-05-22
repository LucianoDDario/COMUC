using System;

namespace ComucAPI.DTOs
{
    public class PresencaEditDTO
    {
        public bool Presente { get; set; }
        public string Nome { get; set; } // Permite alterar o tipo/nome do evento (Ex: Ensaio, Apresentação)
        public DateTime Data { get; set; }
    }
}