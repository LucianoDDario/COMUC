namespace ComucAPI.DTOs
{
    public class ChamadaResponseDTO
    {
        public int IdPresenca { get; set; }
        public string NomeAluno { get; set; }
        public DateTime Data { get; set; }
        public bool Presente { get; set; }
        public string NomeProfessor { get; set; }
    }
}