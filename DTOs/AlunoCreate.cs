using System;
using System.Collections.Generic;

namespace ComucAPI.DTOs
{
    public class AlunoCreateDTO
    {
        public string Nome { get; set; }
        public DateTime DataNascimento { get; set; }
        public string Telefone { get; set; }
        public string CPF { get; set; }
        public string RG { get; set; }
        public string Endereco { get; set; }
        public string NomePai { get; set; }
        public string NomeMae { get; set; }
        public bool Bolsista { get; set; }
        public DateTime? DataInicio { get; set; }
        public string MotivoSaida { get; set; }
        public bool PossuiInstrumento { get; set; }
        public string TamanhoVestimenta { get; set; }

        // Aqui o front-end passará um array de IDs, ex: [1, 3]
        public List<int> IdBandas { get; set; } = new List<int>();
    }
}