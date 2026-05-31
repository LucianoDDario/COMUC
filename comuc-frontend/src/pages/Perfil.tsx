import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'

export default function Perfil() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [editando, setEditando] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  async function salvar() {
    if (novaSenha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    setSalvando(true)
    setErro('')
    setSucesso('')

    try {
      const endpoint = user?.tipoUsuario === 'Professor'
        ? `/Professors/${user.id}/senha`
        : `/Funcionario/${user?.id}/senha`

      await api.put(endpoint, { novaSenha })
      setSucesso('Senha alterada com sucesso!')
      setEditando(false)
      setNovaSenha('')
      setMostrarSenha(false)
    } catch (error: any) {
      if (error.response?.status === 400) {
        setErro('A nova senha não pode ser igual à senha atual.')
      } else {
        setErro('Erro ao alterar senha. Tente novamente.')
      }
    } finally {
      setSalvando(false)
    }
  }

  function cancelarEdicao() {
    setEditando(false)
    setNovaSenha('')
    setErro('')
    setMostrarSenha(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={16} />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Nome</label>
          <input
            type="text"
            value={user?.nome ?? ''}
            disabled
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed capitalize"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Tipo de Usuário</label>
          <input
            type="text"
            value={user?.tipoUsuario === 'Professor' ? 'Professor' : 'Funcionário'}
            disabled
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            {editando ? 'Nova Senha' : 'Senha'}
          </label>
          <div className="relative">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={editando ? novaSenha : '••••••••'}
              onChange={editando ? e => setNovaSenha(e.target.value) : undefined}
              disabled={!editando}
              placeholder={editando ? 'Digite a nova senha' : ''}
              className={`w-full border rounded-lg px-3 py-2 pr-10 text-sm outline-none transition ${
                editando
                  ? 'border-gray-300 focus:ring-2 focus:ring-gray-900'
                  : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
              }`}
            />
            {editando && (
              <button
                type="button"
                onClick={() => setMostrarSenha(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
        </div>

        {erro && <p className="text-xs text-red-500">{erro}</p>}
        {sucesso && <p className="text-xs text-green-600">{sucesso}</p>}

        <div className="flex justify-between pt-2">
          {editando ? (
            <>
              <button
                type="button"
                onClick={cancelarEdicao}
                className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvar}
                disabled={salvando}
                className="text-sm font-semibold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => { setEditando(true); setSucesso('') }}
              className="text-sm font-semibold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Alterar Senha
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
