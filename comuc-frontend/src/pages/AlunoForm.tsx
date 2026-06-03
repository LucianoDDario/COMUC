import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import api from '@/lib/api'

interface SubTurma {
  idBanda: number
  nome: string
}

interface BandaHierarquia {
  idBanda: number
  nome: string
  subTurmas: SubTurma[]
}

function isMenorDeIdade(dataNascimento: string): boolean {
  if (!dataNascimento) return false
  const hoje = new Date()
  const nascimento = new Date(dataNascimento + 'T00:00:00')
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const m = hoje.getMonth() - nascimento.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--
  return idade < 18
}

const baseSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  dataNascimento: z.string()
    .min(1, 'Data de nascimento obrigatória')
    .refine(d => new Date(d + 'T00:00:00') <= new Date(), 'Data de nascimento não pode ser no futuro')
    .refine(d => new Date(d + 'T00:00:00').getFullYear() <= 9999, 'Ano inválido'),
  telefone: z.string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos')
    .max(11, 'Telefone deve ter no máximo 11 dígitos')
    .regex(/^\d+$/, 'Telefone deve conter apenas números'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(11, 'CPF deve ter 11 dígitos'),
  rg: z.string()
    .min(7, 'RG deve ter no mínimo 7 dígitos')
    .max(9, 'RG deve ter no máximo 9 dígitos')
    .regex(/^\d+$/, 'RG deve conter apenas números'),
  endereco: z.string().min(1, 'Endereço obrigatório'),
  nomePai: z.string().optional(),
  nomeMae: z.string().optional(),
  documentoResponsavel: z.string().max(50, 'Documento deve ter no máximo 50 caracteres').optional(),
  bolsista: z.enum(['sim', 'nao']),
  dataInicio: z.string().min(1, 'Data de início obrigatória'),
  motivoSaida: z.string().max(100, 'Motivo deve ter no máximo 100 caracteres').optional(),
  possuiInstrumento: z.enum(['sim', 'nao']),
  tamanhoVestimenta: z.string().min(1, 'Tamanho da vestimenta obrigatório'),
  idBandas: z.array(z.number()),
})

const menorRefine = (data: z.infer<typeof baseSchema>, ctx: z.RefinementCtx) => {
  if (isMenorDeIdade(data.dataNascimento)) {
    if (!data.nomePai?.trim())
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nome do pai obrigatório para menores de idade', path: ['nomePai'] })
    if (!data.nomeMae?.trim())
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nome da mãe obrigatório para menores de idade', path: ['nomeMae'] })
    if (!data.documentoResponsavel?.trim())
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Documento do responsável obrigatório para menores de idade', path: ['documentoResponsavel'] })
  }
}

const createSchema = baseSchema.superRefine((data, ctx) => {
  menorRefine(data, ctx)
  if (data.idBandas.length === 0)
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecione ao menos uma banda', path: ['idBandas'] })
})

const editSchema = baseSchema.superRefine((data, ctx) => {
  menorRefine(data, ctx)
  if (data.idBandas.length === 0 && !data.motivoSaida?.trim())
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Informe o motivo de saída ao remover todas as bandas', path: ['motivoSaida'] })
})

type AlunoFormData = z.infer<typeof baseSchema>

const ETAPA_1_FIELDS: (keyof AlunoFormData)[] = ['nome', 'dataNascimento', 'telefone', 'cpf', 'rg', 'endereco']

async function fetchBandas(): Promise<BandaHierarquia[]> {
  const res = await api.get('/Banda/hierarquia')
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

  const { data: bandas = [] } = useQuery<BandaHierarquia[]>({
    queryKey: ['bandas'],
    queryFn: fetchBandas,
  })

  const { data: alunoExistente, isError: erroCarregarAluno } = useQuery({
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
    resolver: zodResolver(isEdit ? editSchema : createSchema),
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
        documentoResponsavel: alunoExistente.documentoResponsavel ?? '',
        bolsista: alunoExistente.bolsista ? 'sim' : 'nao',
        dataInicio: alunoExistente.dataInicio?.split('T')[0] ?? '',
        motivoSaida: alunoExistente.motivoSaida ?? '',
        possuiInstrumento: alunoExistente.possuiInstrumento ? 'sim' : 'nao',
        tamanhoVestimenta: alunoExistente.tamanhoVestimenta ?? '',
        idBandas: alunoExistente.bandas?.map((b: Banda) => b.idBanda) ?? [],
      })
    }
  }, [alunoExistente, reset])

  const idBandasSelecionadas = watch('idBandas') ?? []
  const dataNascimentoWatch = watch('dataNascimento')
  const eMenor = isMenorDeIdade(dataNascimentoWatch)

  function toggleBandaSimples(idBanda: number) {
    if (idBandasSelecionadas.includes(idBanda)) {
      setValue('idBandas', idBandasSelecionadas.filter(id => id !== idBanda))
    } else {
      setValue('idBandas', [...idBandasSelecionadas, idBanda])
    }
  }

  function togglePeriodo(subBandaId: number, todosSubIds: number[]) {
    const semIrmaos = idBandasSelecionadas.filter(id => !todosSubIds.includes(id))
    if (idBandasSelecionadas.includes(subBandaId)) {
      setValue('idBandas', semIrmaos)
    } else {
      setValue('idBandas', [...semIrmaos, subBandaId])
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
          documentoResponsavel: data.documentoResponsavel ?? '',
          bolsista: data.bolsista === 'sim',
          dataInicio: data.dataInicio ? new Date(data.dataInicio + 'T00:00:00Z').toISOString() : null,
          motivoSaida: data.motivoSaida ?? '',
          possuiInstrumento: data.possuiInstrumento === 'sim',
          tamanhoVestimenta: data.tamanhoVestimenta ?? '',
          idBandas: data.idBandas,
        })
      } else {
        await api.post('/Aluno', {
          Nome: data.nome,
          DataNascimento: new Date(data.dataNascimento + 'T00:00:00Z').toISOString(),
          CPF: data.cpf,
          rg: data.rg,
          Telefone: data.telefone,
          Endereco: data.endereco,
          NomePai: data.nomePai ?? '',
          NomeMae: data.nomeMae ?? '',
          DocumentoResponsavel: data.documentoResponsavel ?? '',
          Bolsista: data.bolsista === 'sim',
          DataInicio: data.dataInicio ? new Date(data.dataInicio + 'T00:00:00Z').toISOString() : null,
          MotivoSaida: '',
          PossuiInstrumento: data.possuiInstrumento === 'sim',
          TamanhoVestimenta: data.tamanhoVestimenta ?? '',
          IdBandas: data.idBandas,
        })
      }
      navigate('/alunos')
    } catch (error: any) {
      if (error.response?.status === 409) {
        setErro(error.response.data?.mensagem ?? 'CPF ou RG já cadastrado para outro aluno.')
      } else {
        setErro('Erro ao salvar aluno. Verifique os dados e tente novamente.')
      }
    } finally {
      setSalvando(false)
    }
  }

  if (isEdit && erroCarregarAluno) {
    return (
      <div className="max-w-2xl">
        <p className="text-sm text-red-500">Erro ao carregar dados do aluno. Verifique a conexão e tente novamente.</p>
      </div>
    )
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
                max="9999-12-31"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                {...register('dataNascimento')}
              />
              {errors.dataNascimento && <span className="text-xs text-red-500">{errors.dataNascimento.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Telefone</label>
              <input
                type="text"
                placeholder="11987654321"
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
                placeholder="12345678900"
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
                placeholder="123456789"
                maxLength={9}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                {...register('rg')}
              />
              {errors.rg && <span className="text-xs text-red-500">{errors.rg.message}</span>}
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
              <label className="text-sm font-medium text-gray-700">
                Nome do Pai
                {eMenor
                  ? <span className="ml-1 text-red-500">*</span>
                  : <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
                }
              </label>
              <input
                type="text"
                placeholder="Digite o nome do pai"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                {...register('nomePai')}
              />
              {errors.nomePai && <span className="text-xs text-red-500">{errors.nomePai.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Nome da Mãe
                {eMenor
                  ? <span className="ml-1 text-red-500">*</span>
                  : <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
                }
              </label>
              <input
                type="text"
                placeholder="Digite o nome da mãe"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                {...register('nomeMae')}
              />
              {errors.nomeMae && <span className="text-xs text-red-500">{errors.nomeMae.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Documento do Responsável
                {eMenor
                  ? <span className="ml-1 text-red-500">*</span>
                  : <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
                }
              </label>
              <input
                type="text"
                placeholder="CPF ou RG do responsável"
                maxLength={50}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                {...register('documentoResponsavel')}
              />
              {errors.documentoResponsavel && (
                <span className="text-xs text-red-500">{errors.documentoResponsavel.message}</span>
              )}
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
                max="9999-12-31"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                {...register('dataInicio')}
              />
              {errors.dataInicio && <span className="text-xs text-red-500">{errors.dataInicio.message}</span>}
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
              {errors.tamanhoVestimenta && <span className="text-xs text-red-500">{errors.tamanhoVestimenta.message}</span>}
            </div>

            {bandas.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Bandas</label>
                <div className="flex flex-wrap gap-2">
                  {bandas.flatMap(banda => {
                    if (banda.subTurmas.length === 0) {
                      const selecionada = idBandasSelecionadas.includes(banda.idBanda)
                      return [(
                        <button
                          key={banda.idBanda}
                          type="button"
                          onClick={() => toggleBandaSimples(banda.idBanda)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            selecionada
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {banda.nome}
                        </button>
                      )]
                    }
                    const todosSubIds = banda.subTurmas.map(s => s.idBanda)
                    return banda.subTurmas.map(sub => {
                      const selecionado = idBandasSelecionadas.includes(sub.idBanda)
                      return (
                        <button
                          key={sub.idBanda}
                          type="button"
                          onClick={() => togglePeriodo(sub.idBanda, todosSubIds)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            selecionado
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {banda.nome} - {sub.nome}
                        </button>
                      )
                    })
                  })}
                </div>
                {errors.idBandas && <span className="text-xs text-red-500">{errors.idBandas.message}</span>}
              </div>
            )}

            {isEdit && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Motivo de Saída
                  {idBandasSelecionadas.length === 0
                    ? <span className="ml-1 text-red-500">*</span>
                    : <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
                  }
                </label>
                <input
                  type="text"
                  placeholder="Preencha caso o aluno tenha saído"
                  maxLength={100}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
                  {...register('motivoSaida')}
                />
                {errors.motivoSaida && <span className="text-xs text-red-500">{errors.motivoSaida.message}</span>}
              </div>
            )}

            {erro && <p className="text-xs text-red-500">{erro}</p>}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setEtapa(1)}
                className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                Voltar
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
