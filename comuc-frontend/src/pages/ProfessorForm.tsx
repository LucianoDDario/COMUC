import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import api from '@/lib/api'

const createSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

const editSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  senha: z.string().optional(),
})

type ProfessorFormData = { nome: string; senha?: string }

const MOCK_PROFESSOR = { idProfessor: 1, nome: 'Carlos Mendes' }

async function fetchProfessor(id: number) {
  const res = await api.get(`/Professors/${id}`)
  return res.data
}

export default function ProfessorForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const professorId = id ? Number(id) : null

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const { data: professorExistente } = useQuery({
    queryKey: ['professor', professorId],
    queryFn: () => fetchProfessor(professorId!),
    enabled: isEdit && professorId !== null,
    initialData: isEdit ? MOCK_PROFESSOR : undefined,
    staleTime: Infinity,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfessorFormData>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: { nome: '', senha: '' },
  })

  useEffect(() => {
    if (professorExistente) {
      reset({ nome: professorExistente.nome ?? '' })
    }
  }, [professorExistente, reset])

  async function onSubmit(data: ProfessorFormData) {
    setSalvando(true)
    setErro('')
    try {
      if (isEdit && professorId) {
        await api.put(`/Professors/${professorId}`, { nome: data.nome })
      } else {
        await api.post('/Professors', { nome: data.nome, senha: data.senha })
      }
      navigate('/professores')
    } catch {
      setErro('Erro ao salvar professor. Verifique os dados e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/professores')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={16} />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Editar Professor' : 'Cadastrar Novo Professor'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Dados do Professor</h2>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nome Completo</label>
            <input
              type="text"
              placeholder="Digite o nome completo"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
              {...register('nome')}
            />
            {errors.nome && <span className="text-xs text-red-500">{errors.nome.message}</span>}
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <input
                type="password"
                placeholder="Senha de acesso"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                {...register('senha')}
              />
              {errors.senha && <span className="text-xs text-red-500">{errors.senha.message}</span>}
            </div>
          )}

          {/* TODO: CPF, RG, Telefone, DataNascimento, Endereco — aguardando campos no backend */}

          {erro && <p className="text-xs text-red-500">{erro}</p>}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={salvando}
              className="text-sm font-semibold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {salvando ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Salvar Cadastro'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
