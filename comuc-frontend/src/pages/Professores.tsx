import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import api from '@/lib/api'

interface Professor {
  idProfessor: number
  nome: string
}

async function fetchProfessores(): Promise<Professor[]> {
  const res = await api.get('/Professors')
  return res.data
}

export default function Professores() {
  const queryClient = useQueryClient()

  const [modalAdicionar, setModalAdicionar] = useState(false)
  const [modalEditar, setModalEditar] = useState<Professor | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [nomeEditar, setNomeEditar] = useState('')

  const { data: professores = [], isLoading } = useQuery<Professor[]>({
    queryKey: ['professores'],
    queryFn: fetchProfessores,
  })

  const criarMutation = useMutation({
    mutationFn: () => api.post('/Professors', { nome, senha }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professores'] })
      setModalAdicionar(false)
      setNome('')
      setSenha('')
    },
  })

  const editarMutation = useMutation({
    mutationFn: (professor: Professor) =>
      api.put(`/Professors/${professor.idProfessor}`, { nome: nomeEditar }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professores'] })
      setModalEditar(null)
      setNomeEditar('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/Professors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professores'] })
      setConfirmDelete(null)
    },
  })

  function abrirEditar(professor: Professor) {
    setModalEditar(professor)
    setNomeEditar(professor.nome)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Professores</h1>
        <button
          onClick={() => setModalAdicionar(true)}
          className="flex items-center gap-1.5 text-sm font-semibold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus size={15} />
          Adicionar Novo Professor
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="text-sm text-gray-500 p-5">Carregando professores...</p>
        ) : professores.length === 0 ? (
          <p className="text-sm text-gray-500 p-5">Nenhum professor cadastrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-700">Nome</th>
                {/* TODO: CPF, Telefone, DataNascimento — aguardando campos no backend */}
                <th className="text-left px-5 py-3 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {professores.map(professor => (
                <tr key={professor.idProfessor} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{professor.nome}</td>
                  {/* TODO: CPF, Telefone, DataNascimento — aguardando campos no backend */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => abrirEditar(professor)}
                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(professor.idProfessor)}
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

      {/* Modal Adicionar Professor */}
      {modalAdicionar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Adicionar Novo Professor</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                />
              </div>
              {/* TODO: CPF, RG, Telefone, DataNascimento, Endereco — aguardando campos no backend */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Senha de acesso"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => { setModalAdicionar(false); setNome(''); setSenha('') }}
                className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => criarMutation.mutate()}
                disabled={!nome.trim() || !senha.trim() || criarMutation.isPending}
                className="text-sm bg-gray-900 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {criarMutation.isPending ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Professor */}
      {modalEditar !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Editar Professor</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={nomeEditar}
                  onChange={e => setNomeEditar(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                />
              </div>
              {/* TODO: CPF, RG, Telefone, DataNascimento, Endereco — aguardando campos no backend */}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => { setModalEditar(null); setNomeEditar('') }}
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
            <h2 className="text-base font-semibold text-gray-900 mb-2">Excluir professor</h2>
            <p className="text-sm text-gray-500 mb-5">
              Tem certeza que deseja excluir este professor? Esta ação não pode ser desfeita.
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
