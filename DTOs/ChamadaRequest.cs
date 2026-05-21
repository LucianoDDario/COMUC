using System;

namespace ComucAPI.DTOs
{
    public class ChamadaRequestDTO
    {
        public int IdAluno { get; set; }
        public int IdProfessor { get; set; }
        public DateTime Data { get; set; }
        public bool Presente { get; set; }
    }
}