import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Check, X, Printer } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface DetalheNota {
  idNota: number
  professor: string
  nota: number
}

interface NotaMedia {
  idAluno: number
  nomeAluno: string
  mesAno: string
  musica: string
  detalhesNotas: DetalheNota[]
  media: number
}

interface AlunoSimples {
  idAluno: number
  nome: string
}

const MESES = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

const anoAtual = new Date().getFullYear()
const ANOS = Array.from({ length: anoAtual - 2023 }, (_, i) => 2024 + i)

async function fetchMedias(mes: number, ano: number): Promise<NotaMedia[]> {
  const res = await api.get('/Nota/medias', { params: { mes, ano } })
  return res.data
}

async function fetchBolsistas(): Promise<AlunoSimples[]> {
  const res = await api.get('/Aluno', { params: { bolsista: true } })
  return res.data
}

export default function Notas() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const now = new Date()

  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(anoAtual)
  const [editingAluno, setEditingAluno] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<number, string>>({})
  const [erroEditar, setErroEditar] = useState('')

  const [modoLancamento, setModoLancamento] = useState(false)
  const [musica, setMusica] = useState('')
  const [notasInput, setNotasInput] = useState<Record<number, string>>({})
  const [erroLancamento, setErroLancamento] = useState('')

  const { data: medias = [], isLoading, isError } = useQuery<NotaMedia[]>({
    queryKey: ['notas-medias', mes, ano],
    queryFn: () => fetchMedias(mes, ano),
  })

  const { data: bolsistas = [], isLoading: carregandoBolsistas } = useQuery<AlunoSimples[]>({
    queryKey: ['alunos-bolsistas'],
    queryFn: fetchBolsistas,
    enabled: modoLancamento,
  })

  const editarMutation = useMutation({
    mutationFn: async (row: NotaMedia) => {
      const [mesStr, anoStr] = row.mesAno.split('/')
      const mesDate = new Date(Number(anoStr), Number(mesStr) - 1, 1).toISOString()

      await Promise.all(
        row.detalhesNotas.map(d =>
          api.put(`/Nota/${d.idNota}`, {
            valorNota: parseFloat(editValues[d.idNota] ?? String(d.nota)),
            mes: mesDate,
            musica: row.musica,
            descricao: '',
          })
        )
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas-medias'] })
      setEditingAluno(null)
      setEditValues({})
      setErroEditar('')
    },
    onError: () => setErroEditar('Erro ao salvar notas. Tente novamente.'),
  })

  const lancamentoMutation = useMutation({
    mutationFn: () => {
      const mesDate = new Date(ano, mes - 1, 1).toISOString()
      return api.post('/Nota/lancamento-lote', {
        mes: mesDate,
        musica: musica.trim(),
        alunos: bolsistas.map(a => ({
          idAluno: a.idAluno,
          valorNota: parseFloat(notasInput[a.idAluno]),
        })),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas-medias'] })
      setModoLancamento(false)
      setMusica('')
      setNotasInput({})
      setErroLancamento('')
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        setErroLancamento('Você já lançou notas para este período. Use a opção de editar.')
      } else {
        setErroLancamento('Erro ao lançar notas. Tente novamente.')
      }
    },
  })

  function iniciarEdicao(row: NotaMedia) {
    setEditingAluno(row.idAluno)
    const values: Record<number, string> = {}
    row.detalhesNotas.forEach(d => { values[d.idNota] = String(d.nota) })
    setEditValues(values)
  }

  function cancelarEdicao() {
    setEditingAluno(null)
    setEditValues({})
  }

  function handleNotaChange(idNota: number, value: string) {
    if (value === '') {
      setEditValues(prev => ({ ...prev, [idNota]: '' }))
      return
    }
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 0 && num <= 10) {
      setEditValues(prev => ({ ...prev, [idNota]: value }))
    }
  }

  function handleNotaLancamentoChange(idAluno: number, value: string) {
    if (value === '') {
      setNotasInput(prev => ({ ...prev, [idAluno]: '' }))
      return
    }
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 0 && num <= 10) {
      setNotasInput(prev => ({ ...prev, [idAluno]: value }))
    }
  }

  function handleLancamento() {
    setErroLancamento('')

    if (!musica.trim()) {
      setErroLancamento('A música/peça avaliada é obrigatória.')
      return
    }

    const semNota = bolsistas.filter(a => {
      const val = notasInput[a.idAluno]
      if (!val || val === '') return true
      const num = parseFloat(val)
      return isNaN(num) || num < 0 || num > 10
    })

    if (semNota.length > 0) {
      setErroLancamento(`Preencha a nota de todos os alunos (0 a 10).`)
      return
    }

    lancamentoMutation.mutate()
  }

  function cancelarLancamento() {
    setModoLancamento(false)
    setMusica('')
    setNotasInput({})
    setErroLancamento('')
  }

  const prof1 = medias[0]?.detalhesNotas[0]?.professor ?? 'Professor 1'
  const prof2 = medias[0]?.detalhesNotas[1]?.professor ?? 'Professor 2'
  const isProfessor = user?.tipoUsuario === 'Professor'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notas dos Alunos Bolsistas</h1>
        {!modoLancamento && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            <Printer size={15} />
            Imprimir
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <select
          value={mes}
          onChange={e => { setMes(Number(e.target.value)); setModoLancamento(false) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition bg-white"
        >
          {MESES.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select
          value={ano}
          onChange={e => { setAno(Number(e.target.value)); setModoLancamento(false) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition bg-white"
        >
          {ANOS.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Modo lançamento */}
      {modoLancamento && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Lançamento de Notas — {MESES.find(m => m.value === mes)?.label} {ano}
            </h2>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Música / Peça avaliada <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={musica}
                onChange={e => setMusica(e.target.value)}
                placeholder="Ex: Hino Nacional, Abertura..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition max-w-sm"
              />
            </div>
          </div>

          {carregandoBolsistas ? (
            <p className="text-sm text-gray-500 p-5">Carregando alunos bolsistas...</p>
          ) : bolsistas.length === 0 ? (
            <p className="text-sm text-gray-500 p-5">Nenhum aluno bolsista cadastrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-700">Nome do Aluno</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-700">
                    Nota <span className="text-xs font-normal text-gray-400">(0 a 10)</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bolsistas.map(aluno => (
                  <tr key={aluno.idAluno} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900 capitalize">{aluno.nome}</td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={notasInput[aluno.idAluno] ?? ''}
                        onChange={e => handleNotaLancamentoChange(aluno.idAluno, e.target.value)}
                        placeholder="0.0"
                        className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {erroLancamento && (
            <p className="text-xs text-red-500 px-5 py-3 border-t border-gray-100">{erroLancamento}</p>
          )}

          {bolsistas.length > 0 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={cancelarLancamento}
                className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLancamento}
                disabled={lancamentoMutation.isPending}
                className="text-sm font-semibold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {lancamentoMutation.isPending ? 'Salvando...' : 'Salvar Lançamento'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modo visualização */}
      {!modoLancamento && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <p className="text-sm text-gray-500 p-5">Carregando notas...</p>
          ) : isError ? (
            <p className="text-sm text-red-500 p-5">Erro ao carregar notas. Verifique a conexão e tente novamente.</p>
          ) : medias.length === 0 ? (
            <div className="p-5 flex items-center justify-between">
              <p className="text-sm text-gray-500">Nenhuma nota registrada para este período.</p>
              {isProfessor && (
                <button
                  type="button"
                  onClick={() => setModoLancamento(true)}
                  className="text-sm font-semibold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Lançar Notas
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-700">Nome do Aluno</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-700">{prof1}</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-700">{prof2}</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-700">Média <span className="text-xs font-normal text-gray-400">(mín. 7)</span></th>
                  <th className="text-left px-5 py-3 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {medias.map(row => {
                  const isEditing = editingAluno === row.idAluno
                  const nota1 = row.detalhesNotas[0]
                  const nota2 = row.detalhesNotas[1]

                  return (
                    <tr key={row.idAluno} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{row.nomeAluno}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {isEditing && nota1 ? (
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={editValues[nota1.idNota] ?? ''}
                            onChange={e => handleNotaChange(nota1.idNota, e.target.value)}
                            className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        ) : (
                          nota1 ? nota1.nota.toFixed(1) : '—'
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {isEditing && nota2 ? (
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={editValues[nota2.idNota] ?? ''}
                            onChange={e => handleNotaChange(nota2.idNota, e.target.value)}
                            className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        ) : (
                          nota2 ? nota2.nota.toFixed(1) : '—'
                        )}
                      </td>
                      <td className="px-5 py-3 font-medium">
                        <span className={row.media >= 7 ? 'text-green-600' : 'text-red-500'}>
                          {row.media.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => editarMutation.mutate(row)}
                              disabled={editarMutation.isPending}
                              className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Salvar"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              onClick={cancelarEdicao}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Cancelar"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => iniciarEdicao(row)}
                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {erroEditar && (
            <p className="text-xs text-red-500 px-5 py-3 border-t border-gray-100">{erroEditar}</p>
          )}
        </div>
      )}
    </div>
  )
}
