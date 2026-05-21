
namespace ComucAPI.DTOs
{
    public class LoteChamadaRequest
    {
        public int IdProfessor { get; set; }
        public DateTime Data { get; set; }
        public string NomeChamada { get; set; } 
        public List<AlunoChamada> Alunos { get; set; }
    }
}
