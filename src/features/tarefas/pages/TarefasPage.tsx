import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuthToken } from '../../../shared/lib/token'
import { getOrCreateDeviceId } from '../../../shared/lib/device-id'
import { getSocketClient } from '../../../shared/socket/socket-client'
import TarefasList from '../components/TarefasList'
import { useTarefasAgrupadas } from '../hooks/useTarefas'
import {
  carregarEtapaAtual,
  carregarTarefasAluno,
  type TarefaAluno,
} from '../services/tarefas-service'

type UsuarioAluno = {
  matricula: string
  nome: string
  perfil: string
}

function getUsuarioAluno() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || 'null') as UsuarioAluno | null
  } catch {
    return null
  }
}

function emitirComAck<TPayload>(
  socket: ReturnType<typeof getSocketClient>,
  evento: string,
  payload: TPayload,
  timeoutMs = 2500,
) {
  return new Promise<void>((resolve, reject) => {
    let done = false

    const timeoutId = window.setTimeout(() => {
      if (done) return
      done = true
      reject(new Error('Tempo esgotado ao sincronizar com o servidor'))
    }, timeoutMs)

    socket.emit(evento, payload, (resposta?: { ok?: boolean; error?: string }) => {
      if (done) return
      done = true
      window.clearTimeout(timeoutId)

      if (!resposta || resposta.ok !== true) {
        reject(new Error(resposta?.error || 'Falha na confirmacao do servidor'))
        return
      }

      resolve()
    })
  })
}

export default function TarefasPage() {
  const navigate = useNavigate()
  const socket = useMemo(() => getSocketClient(), [])
  const [usuario] = useState<UsuarioAluno | null>(() => getUsuarioAluno())
  const [tarefas, setTarefas] = useState<TarefaAluno[]>([])
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)
  const [tarefaIdEmAndamento, setTarefaIdEmAndamento] = useState<number | null>(null)
  const [loadingTaskId, setLoadingTaskId] = useState<number | null>(null)

  const tarefasAgrupadas = useTarefasAgrupadas(tarefas)

  const carregar = useCallback(async () => {
    if (!usuario?.matricula) return

    try {
      setMensagemErro(null)
      const [etapaAtual, tarefasAluno] = await Promise.all([
        carregarEtapaAtual(),
        carregarTarefasAluno(usuario.matricula),
      ])

      setTarefaIdEmAndamento(etapaAtual?.tarefa_id || null)
      setTarefas(tarefasAluno || [])
    } catch (error) {
      setMensagemErro(error instanceof Error ? error.message : 'Nao foi possivel carregar tarefas')
    }
  }, [usuario?.matricula])

  useEffect(() => {
    if (
      !usuario ||
      !usuario.matricula ||
      (usuario.perfil !== 'Aluno' && usuario.perfil !== 'Monitor')
    ) {
      navigate('/login', { replace: true })
      return
    }

    void carregar()
  }, [carregar, navigate, usuario])

  useEffect(() => {
    const onEtapaAtualizada = ({ tarefa_id }: { tarefa_id: number | null }) => {
      if (!tarefa_id) return
      setTarefaIdEmAndamento(tarefa_id)
    }

    socket.on('etapaAtualizada', onEtapaAtualizada)
    return () => {
      socket.off('etapaAtualizada', onEtapaAtualizada)
    }
  }, [socket])

  async function handleIniciarTarefa(tarefa: TarefaAluno) {
    if (!usuario) return

    try {
      setMensagemErro(null)
      setLoadingTaskId(tarefa.id)

      const deviceId = getOrCreateDeviceId()

      await emitirComAck(socket, 'alunoEntrou', {
        nome: usuario.nome,
        deviceId,
      })
      await emitirComAck(socket, 'marcarPresenca', { nome: usuario.nome })
      await emitirComAck(socket, 'mudarStatus', {
        nome: usuario.nome,
        status: 'fazendo',
      })

      sessionStorage.setItem('acomp_nome_autofill', usuario.nome || '')
      sessionStorage.setItem('acomp_tarefa_ativa', String(tarefa.id))

      navigate('/aluno')
    } catch (error) {
      setMensagemErro(error instanceof Error ? error.message : 'Nao foi possivel iniciar a tarefa')
      setLoadingTaskId(null)
    }
  }

  function handleSair() {
    clearAuthToken()
    navigate('/login', { replace: true })
  }

  function handleIrAcompanhamento() {
    if (usuario?.nome) {
      sessionStorage.setItem('acomp_nome_autofill', usuario.nome)
    }
    navigate('/aluno')
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#314a5f_0%,#1e272e_45%,#161d23_100%)] text-[#ecf0f1]">
      <header className="prof-header sticky top-0 z-10 border-b border-white/8 bg-[rgba(44,62,80,0.92)] px-4 py-4 shadow-[0_14px_40px_rgba(0,0,0,0.28)] backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7fc7ff]">
              {usuario?.perfil === 'Monitor' ? 'Painel de tarefas do monitor' : 'Painel do aluno'}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">📚 Minhas Tarefas</h1>
          </div>

          <div className="header-info flex flex-wrap items-center justify-end gap-2">
            <strong id="nome-aluno-tarefas" className="text-sm text-[#ecf0f1]">
              {usuario?.nome || 'Aluno'}
            </strong>

            <button
              id="btn-ir-acompanhamento"
              type="button"
              onClick={handleIrAcompanhamento}
              className="btn btn-outline rounded-xl border-2 border-[#ecf0f1] px-3 py-2 text-sm font-medium text-[#ecf0f1] transition hover:bg-white/10"
            >
              📋 Acompanhamento
            </button>

            <button
              id="btn-sair"
              type="button"
              onClick={handleSair}
              className="btn btn-outline rounded-xl border-2 border-[#ecf0f1] px-3 py-2 text-sm font-medium text-[#ecf0f1] transition hover:bg-white/10"
            >
              🚪 Sair
            </button>
          </div>
        </div>
      </header>

      <section className="tarefas-main mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 md:px-8">
        <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(52,152,219,0.18),rgba(255,255,255,0.04))] px-6 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#a7dcff]">
            Acesso rapido
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Escolha a tarefa liberada pelo professor e siga para o acompanhamento.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#d4dde3]">
            As tarefas ficam organizadas por unidade curricular. Quando uma atividade estiver
            em andamento, o botao sera habilitado para voce entrar diretamente na tela do aluno.
          </p>
        </div>

        <div
          id="mensagem-tarefas"
          className={`msg-erro rounded-2xl border border-[#f5c6cb] bg-[#f8d7da] px-4 py-3 text-sm text-[#721c24] shadow-[0_10px_25px_rgba(114,28,36,0.12)] ${
            mensagemErro ? '' : 'hidden'
          }`}
        >
          {mensagemErro || ''}
        </div>

        <div id="tarefas-container" className="tarefas-grid grid grid-cols-1 gap-5">
          <TarefasList
            tarefasAgrupadas={tarefasAgrupadas}
            tarefaIdEmAndamento={tarefaIdEmAndamento}
            loadingTaskId={loadingTaskId}
            onIniciarTarefa={(tarefa) => {
              void handleIniciarTarefa(tarefa)
            }}
          />
        </div>
      </section>
    </main>
  )
}
