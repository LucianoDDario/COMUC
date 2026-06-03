import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface SubTurma {
  idBanda: number
  nome: string
}

interface Banda {
  idBanda: number
  nome: string
  subTurmas?: SubTurma[]
}

interface AlunoItem {
  idAluno: number
  nome: string
  presente: boolean
}

async function fetchBandas(): Promise<Banda[]> {
  const res = await api.get('/Banda/hierarquia')
  return res.data
}

async function fetchAlunosDaBanda(idBanda: number): Promise<AlunoItem[]> {
  const res = await api.get(`/Banda/${idBanda}/alunos`)
  return res.data.map((a: { idAluno: number; nome: string }) => ({
    ...a,
    presente: false,
  }))
}

export default function Presenca() {
  const { user } = useAuth()
  const [bandaId, setBandaId] = useState<number | null>(null)
  const [data, setData] = useState('')
  const [alunos, setAlunos] = useState<AlunoItem[]>([])
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  const { data: bandas = [], isLoading: carregandoBandas, isError: erroBandas } = useQuery({
    queryKey: ['bandas'],
    queryFn: fetchBandas,
  })

  const opcoesSelect = bandas.flatMap(banda =>
    (banda.subTurmas ?? []).length > 0
      ? (banda.subTurmas ?? []).map(sub => ({ idBanda: sub.idBanda, nome: `${banda.nome} - ${sub.nome}` }))
      : [{ idBanda: banda.idBanda, nome: banda.nome }]
  )

  const { data: alunosDaBanda, isLoading: carregandoAlunos } = useQuery({
    queryKey: ['alunos-banda', bandaId],
    queryFn: () => fetchAlunosDaBanda(bandaId!),
    enabled: bandaId !== null,
  })

  useEffect(() => {
    if (alunosDaBanda) setAlunos(alunosDaBanda)
  }, [alunosDaBanda])

  const todosMarcados = alunos.length > 0 && alunos.every(a => a.presente)
  const algunsMarcados = alunos.some(a => a.presente) && !todosMarcados
  const checkboxTodosRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (checkboxTodosRef.current) {
      checkboxTodosRef.current.indeterminate = algunsMarcados
    }
  }, [algunsMarcados])

  function toggleTodos() {
    setAlunos(prev => prev.map(a => ({ ...a, presente: !todosMarcados })))
  }

  function togglePresenca(idAluno: number) {
    setAlunos(prev =>
      prev.map(a => (a.idAluno === idAluno ? { ...a, presente: !a.presente } : a))
    )
  }

  async function salvar() {
    if (!bandaId || !data) {
      setMensagem({ tipo: 'erro', texto: 'Selecione a banda e a data antes de salvar.' })
      return
    }

    if (alunos.every(a => !a.presente)) {
      setMensagem({ tipo: 'erro', texto: 'Selecione ao menos um aluno presente antes de salvar.' })
      return
    }

    const bandaNome = opcoesSelect.find(b => b.idBanda === bandaId)?.nome ?? 'Chamada'

    setSalvando(true)
    setMensagem(null)
    try {
      await api.post('/Presencas/registrar-lote', {
        IdProfessor: user!.id,
        IdBanda: bandaId,
        Data: new Date(data + "T00:00:00Z").toISOString(),
        NomeChamada: `${bandaNome} - ${new Date(data).toLocaleDateString('pt-BR')}`,
        Alunos: alunos.map(a => ({ IdAluno: a.idAluno, Presente: a.presente })),
      })
      setMensagem({ tipo: 'ok', texto: 'Presença salva com sucesso!' })
    } catch (error: any) {
      if (error.response?.status === 403) {
        setMensagem({ tipo: 'erro', texto: 'Você não tem permissão para realizar esta ação.' })
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao salvar presença. Tente novamente.' })
      }
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lançamento de Presença</h1>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          <Printer size={15} />
          Imprimir
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Banda</label>
            <select
              value={bandaId ?? ''}
              onChange={e => {
                setBandaId(Number(e.target.value) || null)
                setAlunos([])
                setMensagem(null)
              }}
              className={`border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition ${bandaId === null ? 'text-gray-400' : 'text-gray-900'}`}
            >
              <option value="" style={{ color: '#9CA3AF' }}>Selecione a banda</option>
              {carregandoBandas ? (
                <option disabled style={{ color: '#111827' }}>Carregando...</option>
              ) : erroBandas ? (
                <option disabled style={{ color: '#111827' }}>Erro ao carregar bandas</option>
              ) : (
                opcoesSelect.map(b => (
                  <option key={b.idBanda} value={b.idBanda} style={{ color: '#111827' }}>
                    {b.nome}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Data da Aula</label>
            <input
              type="date"
              value={data}
              onChange={e => {
                setData(e.target.value)
                setAlunos(prev => prev.map(a => ({ ...a, presente: false })))
                setMensagem(null)
              }}
              className={`border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition ${data ? 'text-gray-900' : 'text-gray-400'}`}
            />
          </div>
        </div>
      </div>

      {bandaId && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {carregandoAlunos ? (
            <p className="text-sm text-gray-500 p-5">Carregando alunos...</p>
          ) : alunos.length === 0 ? (
            <p className="text-sm text-gray-500 p-5">Nenhum aluno encontrado nesta banda.</p>
          ) : (
            <>
              <div className="flex items-center justify-end px-5 py-3 border-b border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <span>Selecionar Todos</span>
                  <input
                    ref={checkboxTodosRef}
                    type="checkbox"
                    checked={todosMarcados}
                    onChange={toggleTodos}
                    aria-label="Selecionar todos"
                    className="w-4 h-4 cursor-pointer accent-gray-900"
                  />
                </label>
              </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-700">Nome do Aluno</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-700">Presença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alunos.map(aluno => (
                  <tr key={aluno.idAluno} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{aluno.nome}</td>
                    <td className="px-5 py-3 text-right">
                      <input
                        type="checkbox"
                        checked={aluno.presente}
                        onChange={() => togglePresenca(aluno.idAluno)}
                        aria-label={`Presença de ${aluno.nome}`}
                        className="w-4 h-4 cursor-pointer accent-gray-900"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </>
          )}

          {alunos.length > 0 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">
              {mensagem ? (
                <span className={`text-sm ${mensagem.tipo === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
                  {mensagem.texto}
                </span>
              ) : (
                <span />
              )}
              {user?.tipoUsuario === 'Professor' && (
                <button
                  onClick={salvar}
                  disabled={salvando}
                  className="bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  {salvando ? 'Salvando...' : 'Salvar Presença da Aula'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
