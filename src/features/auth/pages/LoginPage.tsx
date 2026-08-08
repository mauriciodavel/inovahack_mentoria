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
import './login.css'

type MessageType = 'error' | 'success' | 'info'
type ViewMode = 'login' | 'change-password'

function routeByRole(perfil?: string) {
  if (perfil === 'Monitor') return '/tarefas'
  if (perfil === 'Professor') return '/admin'
  if (perfil === 'Avaliador') return '/avaliador'
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
    if (message.type === 'error') return 'login-alert--error'
    if (message.type === 'success') return 'login-alert--success'
    return 'login-alert--info'
  }, [message])

  return (
    <main className="login-page">
      <div className="login-glow login-glow--one" />
      <div className="login-glow login-glow--two" />

      <svg className="login-circuit login-circuit--top" viewBox="0 0 560 180" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M0 28h116l28 28h94l32-32h166" />
          <path d="M0 76h78l22 22h162l30-30h96l30 30h142" />
          <path d="M22 142h114l26-26h94l32 32h170" />
        </g>
        <g fill="currentColor"><circle cx="116" cy="28" r="5"/><circle cx="238" cy="56" r="5"/><circle cx="388" cy="68" r="5"/><circle cx="136" cy="142" r="5"/><circle cx="458" cy="148" r="5"/></g>
      </svg>

      <section className="login-shell">
        <aside className="login-identity">
          <div className="login-brand">
            <div className="login-brand__mark" aria-hidden="true">
              <span>&lt;</span><span>/</span><span>&gt;</span>
            </div>
            <div className="login-brand__name">
              <span>inova</span>
              <strong>HACK</strong>
            </div>
          </div>

          <div className="login-identity__content">
            <span className="login-eyebrow">SENAI PORTO</span>
            <h1>Ideias que<br /><em>movem</em> o futuro.</h1>
            <p>
              Tecnologia, indústria e pessoas conectadas em um só ambiente.
            </p>
          </div>

          <div className="login-pillars" aria-label="Valores do evento">
            <span>Inove</span><i /><span>Conecte</span><i /><span>Transforme</span>
          </div>

          <svg className="login-port" viewBox="0 0 700 190" aria-hidden="true">
            <path className="login-port__water" d="M0 163c90-22 130 17 226-5 97-23 154 21 264-2 74-16 127-11 210 2v32H0z" />
            <g className="login-port__line">
              <path d="M31 157h630M79 156v-29h207v29M101 126l18-44h139l20 44M116 82h130M149 82V53h70v29M183 53V25M183 25h147M289 25v131M330 25l108 131M330 25h147M477 25v131M438 156V86h118v70M477 25l92 131M523 86l35-25M558 61v95" />
              <path d="M310 75h64v23h-64zM315 80h14m7 0h14m7 0h12M315 91h14m7 0h14m7 0h12" />
            </g>
          </svg>
        </aside>

        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-panel__topline"><span /></div>
          <div className="login-mobile-brand" aria-label="Inova Hack, SENAI Porto">
            <strong>inova<span>HACK</span></strong>
            <small>SENAI PORTO</small>
          </div>

          <div className="login-panel__content">
            <span className="login-panel__eyebrow">
              {mode === 'login' ? 'Bem-vindo de volta' : 'Primeiro acesso'}
            </span>
            <h2 id="login-title">
              {mode === 'login' ? 'Acesse sua conta' : 'Crie uma nova senha'}
            </h2>
            <p>
              {mode === 'login'
                ? 'Entre com sua matrícula e senha para continuar.'
                : 'Atualize sua senha para acessar o ambiente com segurança.'}
            </p>

            {message && (
              <div className={`login-alert ${messageStyle}`} role="status" aria-live="polite">
                {message.text}
              </div>
            )}

            <div className="login-form-wrap">
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
          </div>

          <footer className="login-footer">
            <span className="login-footer__senai">SENAI</span>
            <span>Serviço Nacional de Aprendizagem Industrial</span>
          </footer>
        </section>
      </section>
    </main>
  )
}
