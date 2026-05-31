import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import api from '@/lib/api'

interface Professor {
  idProfessor: number
  nome: string
  cpf?: string
  telefone?: string
}

async function fetchProfessores(): Promise<Professor[]> {
  const res = await api.get('/Professors')
  return res.data
}

export default function Professores() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [erroDelete, setErroDelete] = useState('')

  const { data: professores = [], isLoading, isError } = useQuery<Professor[]>({
    queryKey: ['professores-list'],
    queryFn: fetchProfessores,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/Professors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professores-list'] })
      setConfirmDelete(null)
      setErroDelete('')
    },
    onError: () => setErroDelete('Erro ao excluir professor. Tente novamente.'),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Professores</h1>
        <button
          onClick={() => navigate('/professores/novo')}
          className="flex items-center gap-1.5 text-sm font-semibold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus size={15} />
          Adicionar Novo Professor
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="text-sm text-gray-500 p-5">Carregando professores...</p>
        ) : isError ? (
          <p className="text-sm text-red-500 p-5">Erro ao carregar professores. Verifique a conexão e tente novamente.</p>
        ) : professores.length === 0 ? (
          <p className="text-sm text-gray-500 p-5">Nenhum professor cadastrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-700">Nome</th>
                <th className="text-left px-5 py-3 font-medium text-gray-700">CPF</th>
                <th className="text-left px-5 py-3 font-medium text-gray-700">Telefone</th>
                <th className="text-left px-5 py-3 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {professores.map(professor => (
                <tr key={professor.idProfessor} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{professor.nome}</td>
                  <td className="px-5 py-3 text-gray-600">{professor.cpf ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{professor.telefone || '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/professores/${professor.idProfessor}/editar`)}
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

      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Excluir professor</h2>
            <p className="text-sm text-gray-500 mb-5">
              Tem certeza que deseja excluir este professor? Esta ação não pode ser desfeita.
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
