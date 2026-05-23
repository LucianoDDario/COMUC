import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Printer, Plus, Pencil, Trash2, Search, ChevronDown, Filter } from 'lucide-react'
import api from '@/lib/api'

interface Banda {
  idBanda: number
  nome: string
}

interface Aluno {
  idAluno: number
  nome: string
  bandas: Banda[]
}

async function fetchAlunos(): Promise<Aluno[]> {
  const res = await api.get('/Aluno')
  return res.data
}

export default function Alunos() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  const [filtrarAberto, setFiltrarAberto] = useState(false)
  const [bandasSelecionadas, setBandasSelecionadas] = useState<string[]>([])
  const filtrarRef = useRef<HTMLDivElement>(null)

  const { data: alunos = [], isLoading } = useQuery({
    queryKey: ['alunos'],
    queryFn: fetchAlunos,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/Aluno/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
      setConfirmDelete(null)
    },
  })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filtrarRef.current && !filtrarRef.current.contains(e.target as Node)) {
        setFiltrarAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const bandasDisponiveis = [...new Set(alunos.flatMap(a => a.bandas.map(b => b.nome)))].sort()

  function toggleBanda(banda: string) {
    setBandasSelecionadas(prev =>
      prev.includes(banda) ? prev.filter(b => b !== banda) : [...prev, banda]
    )
  }

  const alunosFiltrados = alunos.filter(a => {
    const nomesBandas = a.bandas.map(b => b.nome)
    const matchBusca = busca === '' || a.nome.includes(busca) || nomesBandas.some(n => n.includes(busca))
    const matchFiltro = bandasSelecionadas.length === 0 || nomesBandas.some(n => bandasSelecionadas.includes(n))
    return matchBusca && matchFiltro
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Alunos</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            <Printer size={15} />
            Imprimir
          </button>
          <button
            onClick={() => navigate('/alunos/novo')}
            className="flex items-center gap-1.5 text-sm font-semibold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus size={15} />
            Adicionar Novo Aluno
          </button>
        </div>
      </div>

      {/* Barra de busca + Filtrar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou banda..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition bg-white"
          />
        </div>

        {/* Botão Filtrar + dropdown */}
        <div className="relative" ref={filtrarRef}>
          <button
            onClick={() => setFiltrarAberto(prev => !prev)}
            className={`flex items-center gap-1.5 text-sm border rounded-lg px-3 py-2 transition-colors ${
              bandasSelecionadas.length > 0
                ? 'border-gray-900 text-gray-900 bg-gray-100 hover:bg-gray-200'
                : 'text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={14} />
            Filtrar
            {bandasSelecionadas.length > 0 && (
              <span className="bg-gray-900 text-white text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                {bandasSelecionadas.length}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform ${filtrarAberto ? 'rotate-180' : ''}`} />
          </button>

          {filtrarAberto && (
            <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-56">
              <div className="flex flex-wrap gap-2">
                {bandasDisponiveis.map(banda => {
                  const selecionada = bandasSelecionadas.includes(banda)
                  return (
                    <button
                      key={banda}
                      onClick={() => toggleBanda(banda)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        selecionada
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {banda}
                    </button>
                  )
                })}
              </div>
              {bandasSelecionadas.length > 0 && (
                <button
                  onClick={() => setBandasSelecionadas([])}
                  className="mt-3 text-xs text-gray-500 underline hover:text-gray-700 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="text-sm text-gray-500 p-5">Carregando alunos...</p>
        ) : alunosFiltrados.length === 0 ? (
          <p className="text-sm text-gray-500 p-5">
            {busca || bandasSelecionadas.length > 0 ? 'Nenhum resultado encontrado.' : 'Nenhum aluno cadastrado.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-700">Nome Completo</th>
                <th className="text-left px-5 py-3 font-medium text-gray-700">Banda</th>
                <th className="text-left px-5 py-3 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alunosFiltrados.map(aluno => (
                <tr key={aluno.idAluno} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{aluno.nome}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {aluno.bandas.length > 0
                      ? <div className="flex flex-col gap-0.5">{aluno.bandas.map(b => <span key={b.idBanda}>{b.nome}</span>)}</div>
                      : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/alunos/${aluno.idAluno}/editar`)}
                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(aluno.idAluno)}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Excluir aluno</h2>
            <p className="text-sm text-gray-500 mb-5">
              Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete)}
                disabled={deleteMutation.isPending}
                className="text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
