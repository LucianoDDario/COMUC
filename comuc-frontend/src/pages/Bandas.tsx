import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, UserPlus, Pencil, Trash2, Users } from 'lucide-react'
import api from '@/lib/api'

interface Banda {
  idBanda: number
  nome: string
  idProfessor: number
  nomeProfessor: string
  totalAlunos: number
}

interface Professor {
  idProfessor: number
  nome: string
}

interface Aluno {
  idAluno: number
  nome: string
}


async function fetchBandas(): Promise<Banda[]> {
  const res = await api.get('/Banda')
  return res.data
}

async function fetchProfessores(): Promise<Professor[]> {
  const res = await api.get('/Professors')
  return res.data
}

async function fetchAlunos(): Promise<Aluno[]> {
  const res = await api.get('/Aluno')
  return res.data
}

export default function Bandas() {
  const queryClient = useQueryClient()

  const [modalAdicionar, setModalAdicionar] = useState(false)
  const [modalVincular, setModalVincular] = useState<number | null>(null)
  const [modalEditar, setModalEditar] = useState<Banda | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const [nomeBanda, setNomeBanda] = useState('')
  const [idProfessor, setIdProfessor] = useState('')
  const [nomeEditar, setNomeEditar] = useState('')
  const [idAlunoVincular, setIdAlunoVincular] = useState('')
  const [erroCriar, setErroCriar] = useState('')
  const [erroEditar, setErroEditar] = useState('')
  const [erroVincular, setErroVincular] = useState('')
  const [erroDelete, setErroDelete] = useState('')

  const { data: bandas = [], isLoading, isError } = useQuery<Banda[]>({
    queryKey: ['bandas'],
    queryFn: fetchBandas,
  })

  const { data: professores = [] } = useQuery<Professor[]>({
    queryKey: ['professores'],
    queryFn: fetchProfessores,
  })

  const { data: alunos = [] } = useQuery<Aluno[]>({
    queryKey: ['alunos'],
    queryFn: fetchAlunos,
  })

  const criarMutation = useMutation({
    mutationFn: () => api.post('/Banda', { nome: nomeBanda, idProfessor: Number(idProfessor) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bandas'] })
      setModalAdicionar(false)
      setNomeBanda('')
      setIdProfessor('')
      setErroCriar('')
    },
    onError: () => setErroCriar('Erro ao adicionar banda. Tente novamente.'),
  })

  const editarMutation = useMutation({
    mutationFn: (banda: Banda) =>
      api.put(`/Banda/${banda.idBanda}`, {
        idBanda: banda.idBanda,
        nome: nomeEditar,
        id_professor: banda.idProfessor,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bandas'] })
      setModalEditar(null)
      setNomeEditar('')
      setErroEditar('')
    },
    onError: () => setErroEditar('Erro ao salvar banda. Tente novamente.'),
  })

  const vincularMutation = useMutation({
    mutationFn: (idBanda: number) =>
      api.post(`/Banda/${idBanda}/vincular-aluno`, { idAluno: Number(idAlunoVincular) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bandas'] })
      setModalVincular(null)
      setIdAlunoVincular('')
      setErroVincular('')
    },
    onError: () => setErroVincular('Erro ao vincular aluno. Verifique se ele já não está na banda.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/Banda/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bandas'] })
      setConfirmDelete(null)
      setErroDelete('')
    },
    onError: () => setErroDelete('Erro ao excluir banda. Tente novamente.'),
  })

  function abrirEditar(banda: Banda) {
    setModalEditar(banda)
    setNomeEditar(banda.nome)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Bandas</h1>
        <button
          onClick={() => setModalAdicionar(true)}
          className="flex items-center gap-1.5 text-sm font-semibold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus size={15} />
          Adicionar Nova Banda
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Carregando bandas...</p>
      ) : isError ? (
        <p className="text-sm text-red-500">Erro ao carregar bandas. Verifique a conexão e tente novamente.</p>
      ) : bandas.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma banda cadastrada.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bandas.map(banda => (
            <div key={banda.idBanda} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
              <div>
                <h2 className="font-semibold text-gray-900 text-base">{banda.nome}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{banda.nomeProfessor}</p>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                  <Users size={13} />
                  {banda.totalAlunos} {banda.totalAlunos === 1 ? 'membro' : 'membros'}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setModalVincular(banda.idBanda)}
                  className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
                >
                  <UserPlus size={13} />
                  Vincular Aluno
                </button>
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => abrirEditar(banda)}
                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(banda.idBanda)}
                    className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Adicionar Nova Banda */}
      {modalAdicionar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Adicionar Nova Banda</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Banda</label>
                <input
                  type="text"
                  value={nomeBanda}
                  onChange={e => setNomeBanda(e.target.value)}
                  placeholder="Ex: Banda Mirim"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professor Responsável</label>
                <select
                  value={idProfessor}
                  onChange={e => setIdProfessor(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition bg-white"
                >
                  <option value="">Selecionar professor...</option>
                  {professores.map(p => (
                    <option key={p.idProfessor} value={p.idProfessor}>{p.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            {erroCriar && <p className="text-xs text-red-500 mt-3">{erroCriar}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => { setModalAdicionar(false); setNomeBanda(''); setIdProfessor(''); setErroCriar('') }}
                className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => criarMutation.mutate()}
                disabled={!nomeBanda.trim() || !idProfessor || criarMutation.isPending}
                className="text-sm bg-gray-900 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {criarMutation.isPending ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vincular Aluno */}
      {modalVincular !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Vincular Aluno</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selecionar Aluno</label>
              <select
                value={idAlunoVincular}
                onChange={e => setIdAlunoVincular(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition bg-white"
              >
                <option value="">Selecionar aluno...</option>
                {alunos.map(a => (
                  <option key={a.idAluno} value={a.idAluno}>{a.nome}</option>
                ))}
              </select>
            </div>
            {erroVincular && <p className="text-xs text-red-500 mt-3">{erroVincular}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => { setModalVincular(null); setIdAlunoVincular(''); setErroVincular('') }}
                className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => vincularMutation.mutate(modalVincular)}
                disabled={!idAlunoVincular || vincularMutation.isPending}
                className="text-sm bg-gray-900 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {vincularMutation.isPending ? 'Vinculando...' : 'Vincular'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Banda */}
      {modalEditar !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Editar Banda</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Banda</label>
              <input
                type="text"
                value={nomeEditar}
                onChange={e => setNomeEditar(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
              />
            </div>
            {erroEditar && <p className="text-xs text-red-500 mt-3">{erroEditar}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => { setModalEditar(null); setNomeEditar(''); setErroEditar('') }}
                className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => editarMutation.mutate(modalEditar)}
                disabled={!nomeEditar.trim() || editarMutation.isPending}
                className="text-sm bg-gray-900 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {editarMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de exclusão */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Excluir banda</h2>
            <p className="text-sm text-gray-500 mb-5">
              Tem certeza que deseja excluir esta banda? Esta ação não pode ser desfeita.
            </p>
            {erroDelete && <p className="text-xs text-red-500 mb-3">{erroDelete}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setConfirmDelete(null); setErroDelete('') }}
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
