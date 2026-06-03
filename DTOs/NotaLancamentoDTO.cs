using System;
using System.Collections.Generic;

namespace ComucAPI.DTOs
{
    public class NotaLancamentoDTO
    {
        public DateTime Mes { get; set; }
        public List<AlunoNotaItemDTO> Alunos { get; set; }
    }

    public class AlunoNotaItemDTO
    {
        public int IdAluno { get; set; }
        public decimal ValorNota { get; set; }
        public string Musica { get; set; }
        public string? Descricao { get; set; }
    }
}
