import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import api from '@/lib/api'

interface Banda {
  idBanda: number
  nome: string
}

const alunoSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  dataNascimento: z.string().min(1, 'Data de nascimento obrigatória'),
  telefone: z.string().min(1, 'Telefone obrigatório').max(11, 'Telefone deve ter no máximo 11 dígitos'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(11, 'CPF deve ter 11 dígitos'),
  rg: z.string().max(9, 'RG deve ter no máximo 9 caracteres').optional(),
  endereco: z.string().min(1, 'Endereço obrigatório'),
  nomePai: z.string().optional(),
  nomeMae: z.string().optional(),
  bolsista: z.enum(['sim', 'nao']),
  dataInicio: z.string().optional(),
  possuiInstrumento: z.enum(['sim', 'nao']),
  tamanhoVestimenta: z.string().optional(),
  idBandas: z.array(z.number()),
})

type AlunoFormData = z.infer<typeof alunoSchema>

const ETAPA_1_FIELDS: (keyof AlunoFormData)[] = ['nome', 'dataNascimento', 'telefone', 'cpf', 'endereco']

async function fetchBandas(): Promise<Banda[]> {
  const res = await api.get('/Banda')
  return res.data
}

async function fetchAluno(id: number) {
  const res = await api.get(`/Aluno/${id}`)
  return res.data
}

export default function AlunoForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const alunoId = id ? Number(id) : null

  const [etapa, setEtapa] = useState(1)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const { data: bandas = [] } = useQuery({
    queryKey: ['bandas'],
    queryFn: fetchBandas,
  })

  const { data: alunoExistente } = useQuery({
    queryKey: ['aluno', alunoId],
    queryFn: () => fetchAluno(alunoId!),
    enabled: isEdit && alunoId !== null,
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<AlunoFormData>({
    resolver: zodResolver(alunoSchema),
    defaultValues: {
      bolsista: 'nao',
      possuiInstrumento: 'nao',
      idBandas: [],
    },
  })

  useEffect(() => {
    if (alunoExistente) {
      reset({
        nome: alunoExistente.nome ?? '',
        dataNascimento: alunoExistente.dataNascimento?.split('T')[0] ?? '',
        telefone: alunoExistente.telefone ?? '',
        cpf: alunoExistente.cpf ?? '',
        rg: alunoExistente.rg ?? '',
        endereco: alunoExistente.endereco ?? '',
        nomePai: alunoExistente.nomePai ?? '',
        nomeMae: alunoExistente.nomeMae ?? '',
        bolsista: alunoExistente.bolsista ? 'sim' : 'nao',
        dataInicio: alunoExistente.dataInicio?.split('T')[0] ?? '',
        possuiInstrumento: alunoExistente.possuiInstrumento ? 'sim' : 'nao',
        tamanhoVestimenta: alunoExistente.tamanhoVestimenta ?? '',
        idBandas: alunoExistente.bandas?.map((b: Banda) => b.idBanda) ?? [],
      })
    }
  }, [alunoExistente, reset])

  const idBandasSelecionadas = watch('idBandas') ?? []

  function toggleBanda(idBanda: number) {
    const atual = idBandasSelecionadas
    if (atual.includes(idBanda)) {
      setValue('idBandas', atual.filter(id => id !== idBanda))
    } else {
      setValue('idBandas', [...atual, idBanda])
    }
  }

  async function irParaEtapa2() {
    const valid = await trigger(ETAPA_1_FIELDS)
    if (valid) setEtapa(2)
  }

  async function onSubmit(data: AlunoFormData) {
    setSalvando(true)
    setErro('')
    try {
      if (isEdit && alunoId) {
        await api.put(`/Aluno/${alunoId}`, {
          idAluno: alunoId,
          nome: data.nome,
          dataNascimento: new Date(data.dataNascimento + 'T00:00:00Z').toISOString(),
          cpf: data.cpf,
          rg: data.rg,
          telefone: data.telefone,
          endereco: data.endereco,
          nomePai: data.nomePai ?? '',
          nomeMae: data.nomeMae ?? '',
          bolsista: data.bolsista === 'sim',
          dataInicio: data.dataInicio ? new Date(data.dataInicio + 'T00:00:00Z').toISOString() : null,
          motivoSaida: '',
          possuiInstrumento: data.possuiInstrumento === 'sim',
          tamanhoVestimenta: data.tamanhoVestimenta ?? '',
        })
      } else {
        await api.post('/Aluno', {
          Nome: data.nome,
          DataNascimento: new Date(data.dataNascimento + 'T00:00:00Z').toISOString(),
          CPF: data.cpf,
          rg: data.rg ?? '',
          Telefone: data.telefone,
          Endereco: data.endereco,
          NomePai: data.nomePai ?? '',
          NomeMae: data.nomeMae ?? '',
          Bolsista: data.bolsista === 'sim',
          DataInicio: data.dataInicio ? new Date(data.dataInicio + 'T00:00:00Z').toISOString() : null,
          MotivoSaida: '',
          PossuiInstrumento: data.possuiInstrumento === 'sim',
          TamanhoVestimenta: data.tamanhoVestimenta ?? '',
          IdBandas: data.idBandas,
        })
      }
      navigate('/alunos')
    } catch {
      setErro('Erro ao salvar aluno. Verifique os dados e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/alunos')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={16} />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}
        </h1>
      </div>

      {/* Indicador de etapas */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${etapa === 1 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'}`}>
          1
        </div>
        <div className="flex-1 h-px bg-gray-300" />
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${etapa === 2 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'}`}>
          2
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {etapa === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Dados Pessoais</h2>

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

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Data de Nascimento</label>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                {...register('dataNascimento')}
              />
              {errors.dataNascimento && <span className="text-xs text-red-500">{errors.dataNascimento.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Telefone</label>
              <input
                type="text"
                placeholder="(11) 98765-4321"
                maxLength={11}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                {...register('telefone')}
              />
              {errors.telefone && <span className="text-xs text-red-500">{errors.telefone.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">CPF</label>
              <input
                type="text"
                placeholder="123.456.789-00"
                maxLength={11}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                {...register('cpf')}
              />
              {errors.cpf && <span className="text-xs text-red-500">{errors.cpf.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">RG</label>
              <input
                type="text"
                placeholder="12.345.678-9"
                maxLength={9}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                {...register('rg')}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Endereço</label>
              <textarea
                placeholder="Rua, número, complemento, cidade, estado"
                rows={3}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition resize-none"
                {...register('endereco')}
              />
              {errors.endereco && <span className="text-xs text-red-500">{errors.endereco.message}</span>}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={irParaEtapa2}
                className="text-sm font-semibold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {etapa === 2 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Informações do Aluno</h2>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Nome do Pai</label>
              <input
                type="text"
                placeholder="Digite o nome do pai"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                {...register('nomePai')}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Nome da Mãe</label>
              <input
                type="text"
                placeholder="Digite o nome da mãe"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                {...register('nomeMae')}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Bolsista?</label>
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="radio" value="sim" className="accent-gray-900" {...register('bolsista')} />
                  Sim
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="radio" value="nao" className="accent-gray-900" {...register('bolsista')} />
                  Não
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Data de Início</label>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                {...register('dataInicio')}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Possui Instrumento Próprio?</label>
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="radio" value="sim" className="accent-gray-900" {...register('possuiInstrumento')} />
                  Sim
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="radio" value="nao" className="accent-gray-900" {...register('possuiInstrumento')} />
                  Não
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Tamanho da Vestimenta</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                {...register('tamanhoVestimenta')}
              >
                <option value="">Selecione um tamanho</option>
                <option value="PP">PP</option>
                <option value="P">P</option>
                <option value="M">M</option>
                <option value="G">G</option>
                <option value="GG">GG</option>
                <option value="XGG">XGG</option>
              </select>
            </div>

            {!isEdit && bandas.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Bandas</label>
                <div className="flex flex-wrap gap-2">
                  {bandas.map(banda => {
                    const selecionada = idBandasSelecionadas.includes(banda.idBanda)
                    return (
                      <button
                        key={banda.idBanda}
                        type="button"
                        onClick={() => toggleBanda(banda.idBanda)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          selecionada
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {banda.nome}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {isEdit && alunoExistente?.bandas?.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Bandas</label>
                <div className="flex flex-wrap gap-2">
                  {alunoExistente.bandas.map((b: Banda) => (
                    <span key={b.idBanda} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 bg-gray-50">
                      {b.nome}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400">Para alterar as bandas, use a página de Gestão de Bandas.</p>
              </div>
            )}

            {erro && <p className="text-xs text-red-500">{erro}</p>}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setEtapa(1)}
                className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="text-sm font-semibold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {salvando ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Salvar Cadastro'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
