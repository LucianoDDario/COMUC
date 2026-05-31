import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'

const loginSchema = z.object({
  usuario: z.string().min(1, 'Informe o nome de usuário'),
  senha: z.string().min(1, 'Informe a senha'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [erro, setErro] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setErro('')
    try {
      const response = await api.post('/Auth/login', {
        Nome: data.usuario,
        Senha: data.senha,
      })
      login({
        id: response.data.id,
        nome: response.data.nome,
        tipoUsuario: response.data.tipoUsuario,
      })
      navigate('/presenca', {replace: true})
    } catch (error: any) {
      if (!error.response) {
        setErro('Erro de conexão com o servidor. Tente novamente.')
      } else {
        setErro('Usuário ou senha inválidos.')
      }
    }
  }
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Sistema de Gestão da Banda
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Por favor, faça login para continuar.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div className="flex flex-col gap-1">
            <label htmlFor="usuario" className="text-sm font-medium text-gray-700">
              Nome de Usuário
            </label>
            <input
              id="usuario"
              type="text"
              placeholder="Digite seu nome de usuário"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
              {...register('usuario')}
            />
            {errors.usuario && (
              <span className="text-xs text-red-500">{errors.usuario.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="senha" className="text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              placeholder="Digite sua senha"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900 transition"
              {...register('senha')}
            />
            {errors.senha && (
              <span className="text-xs text-red-500">{errors.senha.message}</span>
            )}
          </div>

          {erro && (
            <p className="text-xs text-red-500 text-center">{erro}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition cursor-pointer"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
