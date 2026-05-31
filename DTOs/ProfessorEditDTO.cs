namespace ComucAPI.DTOs
{
    public class ProfessorEditDTO
    {
        public string Nome { get; set; }
        public string? CPF { get; set; }
        public string? RG { get; set; }
        public string? Telefone { get; set; }
        public DateTime? DataNascimento { get; set; }
        public string? Endereco { get; set; }
    }
}
