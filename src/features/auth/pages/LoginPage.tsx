import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, trocarSenha, validarSessao } from '../../../shared/api/auth-api'
import { clearAuthToken, getAuthToken, setAuthToken } from '../../../shared/lib/token'
import {
  getStrongPasswordMessage,
  isStrongPassword,
} from '../../../shared/lib/password-policy'
import type { AuthUser } from '../../../shared/types/auth.types'
import ChangePasswordForm from '../components/ChangePasswordForm'
import LoginForm from '../components/LoginForm'
import { useAuthSession } from '../hooks/useAuthSession'

type MessageType = 'error' | 'success' | 'info'
type ViewMode = 'login' | 'change-password'

function routeByRole(perfil?: string) {
  if (perfil === 'Monitor') return '/tarefas'
  if (perfil === 'Professor') return '/admin'
  return '/tarefas'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { setSession, clearSession } = useAuthSession()

  const [mode, setMode] = useState<ViewMode>('login')
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [senhaAtualInicial, setSenhaAtualInicial] = useState('')
  const [message, setMessage] = useState<{
    text: string
    type: MessageType
  } | null>(null)

  function showMessage(text: string, type: MessageType = 'error') {
    setMessage({ text, type })
  }

  useEffect(() => {
    if (!message) return

    const timerId = window.setTimeout(() => setMessage(null), 5000)
    return () => window.clearTimeout(timerId)
  }, [message])

  useEffect(() => {
    async function autoLoginIfValid() {
      const savedUser = localStorage.getItem('currentUser')
      const token = getAuthToken()

      if (!savedUser || !token) {
        return
      }

      try {
        const parsedUser = JSON.parse(savedUser) as AuthUser
        setAuthToken(token)

        const isSessionValid = await validarSessao()
        if (!isSessionValid) {
          clearSession()
          return
        }

        setSession(parsedUser, token)
        if (parsedUser.primeiro_acesso) {
          setCurrentUser(parsedUser)
          setMode('change-password')
          setSenhaAtualInicial('')
          showMessage('Primeiro acesso detectado. Defina uma nova senha para continuar.', 'info')
          return
        }

        navigate(routeByRole(parsedUser.perfil), { replace: true })
      } catch {
        clearSession()
        clearAuthToken()
      }
    }

    void autoLoginIfValid()
  }, [clearSession, navigate, setSession])

  async function handleLogin(values: { matricula: string; senha: string }) {
    if (!values.matricula || !values.senha) {
      showMessage('Preencha todos os campos')
      return
    }

    try {
      setLoading(true)
      const user = await login(values)

      setCurrentUser(user)
      setSession(user, user.token)

      if (user.primeiro_acesso) {
        setSenhaAtualInicial(values.senha)
        setMode('change-password')
        showMessage('Primeiro acesso detectado. Por favor, altere sua senha.', 'info')
        return
      }

      showMessage('Login realizado com sucesso!', 'success')
      window.setTimeout(() => {
        navigate(routeByRole(user.perfil), { replace: true })
      }, 500)
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Erro ao conectar ao servidor')
    } finally {
      setLoading(false)
    }
  }

  async function handleChangePassword(values: {
    senhaAtual: string
    novaSenha: string
    confirmarSenha: string
  }) {
    if (!currentUser) {
      showMessage('Sessao invalida. Faca login novamente.')
      setMode('login')
      return
    }

    if (values.novaSenha === values.senhaAtual) {
      showMessage('A nova senha nao pode ser igual a senha provisoria/anterior')
      return
    }

    if (values.novaSenha !== values.confirmarSenha) {
      showMessage('As senhas nao coincidem')
      return
    }

    if (!isStrongPassword(values.novaSenha)) {
      showMessage(getStrongPasswordMessage())
      return
    }

    try {
      setLoading(true)
      const response = await trocarSenha(currentUser.matricula, {
        senha_atual: values.senhaAtual,
        nova_senha: values.novaSenha,
      })

      const mergedUser = { ...currentUser, ...response }
      setSession(mergedUser, response.token)
      setCurrentUser(mergedUser)

      showMessage('Senha alterada com sucesso! Redirecionando...', 'success')
      window.setTimeout(() => {
        navigate(routeByRole(response.perfil), { replace: true })
      }, 1200)
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Erro ao conectar ao servidor')
    } finally {
      setLoading(false)
    }
  }

  const messageStyle = useMemo(() => {
    if (!message) return ''
    if (message.type === 'error') return 'border-red-200 bg-red-50 text-red-700'
    if (message.type === 'success') {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    }
    return 'border-sky-200 bg-sky-50 text-sky-700'
  }, [message])

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-700 px-4 py-8">
      <section className="mx-auto mt-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:mt-14 sm:p-10">
        <h1 className="text-center text-3xl font-bold text-slate-800">
          Sistema de Acompanhamento
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Bem-vindo ao sistema
        </p>

        {message && (
          <div className={`mt-6 rounded-lg border px-3 py-2 text-sm ${messageStyle}`}>
            {message.text}
          </div>
        )}

        <div className="mt-6">
          {mode === 'login' ? (
            <LoginForm onSubmit={handleLogin} loading={loading} />
          ) : (
            <ChangePasswordForm
              senhaAtualInicial={senhaAtualInicial}
              onSubmit={handleChangePassword}
              loading={loading}
            />
          )}
        </div>
      </section>
    </main>
  )
}
