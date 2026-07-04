import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AlunoActions from '../components/AlunoActions'
import AlunoStatusCard from '../components/AlunoStatusCard'
import AvaliacaoMonitorModal from '../components/AvaliacaoMonitorModal'
import BloqueioModal from '../components/BloqueioModal'
import { useAlunoActions } from '../hooks/useAlunoActions'
import { useAlunoRealtime } from '../hooks/useAlunoRealtime'
import { carregarEtapaAtualAluno, sincronizarConclusaoTarefa } from '../services/aluno-service'
import type {
  AlunoSessionUser,
  AlunoStatus,
  BloqueioInfo,
  EtapaAtualizadaPayload,
  SyncMessage,
  TarefaStatus,
} from '../../../shared/types/aluno.types'
import type { FilaAjudaResumoPayload } from '../../../shared/types/monitor.types'

const STATUS_LABELS: Record<AlunoStatus, string> = {
  fazendo: 'Status: Fazendo',
  terminou: 'Status: Terminei',
  aguardando_ajuda: 'Status: Aguardando ajuda...',
  em_atendimento: 'Status: Em atendimento',
  em_timeout: 'Status: Timeout ativo',
  desconectado: 'Sem conexao com o servidor...',
}

const STATUS_CLASS: Record<AlunoStatus, string> = {
  fazendo: 'mb-6 inline-block rounded-md bg-[#dfe6e9] px-3 py-1.5 text-base text-[#2d3436]',
  terminou: 'mb-6 inline-block rounded-md bg-[#d4edda] px-3 py-1.5 text-base text-[#155724]',
  aguardando_ajuda:
    'mb-6 inline-block rounded-md bg-[#f8d7da] px-3 py-1.5 text-base text-[#721c24]',
  em_atendimento:
    'mb-6 inline-block rounded-md bg-[#fef3cd] px-3 py-1.5 text-base text-[#856404]',
  em_timeout:
    'mb-6 inline-block rounded-md bg-[rgba(44,62,100,0.15)] px-3 py-1.5 text-base text-[#2c3e64]',
  desconectado:
    'mb-6 inline-block rounded-md bg-[#fff3cd] px-3 py-1.5 text-base text-[#856404]',
}

const BLOQUEIO_PADRAO: BloqueioInfo = {
  icone: '🚧',
  titulo: 'Acesso bloqueado',
  texto: '',
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || 'null') as AlunoSessionUser | null
  } catch {
    return null
  }
}

export default function AlunoPage() {
  const navigate = useNavigate()
  const [user] = useState<AlunoSessionUser | null>(() => getCurrentUser())
  const [nome, setNome] = useState(() => getCurrentUser()?.nome || '')
  const [status, setStatus] = useState<AlunoStatus>('desconectado')
  const [etapaTitulo, setEtapaTitulo] = useState('carregando...')
  const [syncMessage, setSyncMessage] = useState<SyncMessage | null>(null)
  const [queueMessage, setQueueMessage] = useState<string | null>(null)
  const [helpRequestsCount, setHelpRequestsCount] = useState(0)
  const [showBloqueio, setShowBloqueio] = useState(false)
  const [bloqueioInfo, setBloqueioInfo] = useState<BloqueioInfo>(BLOQUEIO_PADRAO)

  const [avaliacaoId, setAvaliacaoId] = useState<number | null>(null)
  const [avaliacaoMonitorNome, setAvaliacaoMonitorNome] = useState('')
  const [notaSelecionada, setNotaSelecionada] = useState(0)

  const [tarefaAtualId, setTarefaAtualId] = useState<number | null>(() => {
    const saved = Number(sessionStorage.getItem('acomp_tarefa_ativa') || '0')
    return saved > 0 ? saved : null
  })
  const [tarefaAtualStatus, setTarefaAtualStatus] = useState<TarefaStatus | null>(null)
  const [timeoutAtivo, setTimeoutAtivo] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  const statusRef = useRef<AlunoStatus>(status)
  const statusAnteriorTimeoutRef = useRef<AlunoStatus>('fazendo')

  const statusEfetivo = useMemo<AlunoStatus>(() => {
    return timeoutAtivo ? 'em_timeout' : status
  }, [status, timeoutAtivo])
  const isMonitor = user?.perfil === 'Monitor'

  const actions = useAlunoActions(statusEfetivo, tarefaAtualStatus, tarefaAtualId)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    async function carregarEtapaInicial() {
      try {
        const etapaAtual = await carregarEtapaAtualAluno()
        setEtapaTitulo(`${etapaAtual.id} - ${etapaAtual.titulo}`)
        setTarefaAtualId(etapaAtual.tarefa_id || null)
        setTarefaAtualStatus((prev) =>
          etapaAtual.tarefa_id ? prev ?? 'em_andamento' : null,
        )

        if (etapaAtual.tarefa_id) {
          sessionStorage.setItem('acomp_tarefa_ativa', String(etapaAtual.tarefa_id))
        } else {
          sessionStorage.removeItem('acomp_tarefa_ativa')
        }
      } catch {
        setEtapaTitulo('etapa indisponivel')
      }
    }

    void carregarEtapaInicial()
  }, [])

  const showSyncMessage = useCallback((message: SyncMessage, timeoutMs: number) => {
    setSyncMessage(message)
    window.setTimeout(() => setSyncMessage(null), timeoutMs)
  }, [])

  const handlers = useMemo(
    () => ({
      onRegistrado: ({ nome: serverName, status: serverStatus }: { nome: string; status: string }) => {
        setNome((prev) => prev || serverName)
        setStatus((serverStatus as AlunoStatus) || 'fazendo')
      },
      onPresencaMarcada: () => {
        setStatus('fazendo')
        setQueueMessage(null)
      },
      onStatusAtualizado: ({ status: nextStatus }: { status: string }) => {
        if (!nextStatus) return
        setStatus(nextStatus as AlunoStatus)
        if (nextStatus !== 'aguardando_ajuda') {
          setQueueMessage(null)
        }
      },
      onOutraMaquina: () => {
        setBloqueioInfo({
          icone: '💻',
          titulo: 'Acesso de outra maquina',
          texto:
            'Este nome ja esta ativo em outro computador. Saia de la ou aguarde a sessao expirar (5 minutos sem atividade).',
        })
        setShowBloqueio(true)
      },
      onOutraAba: () => {
        setBloqueioInfo({
          icone: '📄',
          titulo: 'Ja aberto em outra aba',
          texto:
            'Voce ja esta conectado em outra aba ou janela deste navegador. Feche-a e clique em Entendi para tentar novamente.',
        })
        setShowBloqueio(true)
      },
      onNaoAutorizado: () => {
        setBloqueioInfo({
          icone: '🚫',
          titulo: 'Aluno nao autorizado',
          texto: 'Seu acesso nao foi autorizado para esta turma.',
        })
        setShowBloqueio(true)
      },
      onAvaliacaoMonitor: ({ id, nomeMonitor }: { id: number; nomeMonitor: string }) => {
        setAvaliacaoId(id)
        setAvaliacaoMonitorNome(nomeMonitor)
        setNotaSelecionada(0)
      },
      onPosicaoNaFila: ({ posicao, total }: { posicao: number; total: number }) => {
        setQueueMessage(`Voce esta na posicao ${posicao} de ${total} na fila`)
      },
      onFilaAtualizada: ({ filaAjuda, atendimentos }: FilaAjudaResumoPayload) => {
        const alunosEmAtendimento = new Set(atendimentos.map((item) => item.nomeAluno))
        setHelpRequestsCount(
          filaAjuda.filter((aluno) => !alunosEmAtendimento.has(aluno.nome)).length,
        )
      },
      onEtapaAtualizada: ({
        id,
        titulo,
        tarefa_id,
        tarefa_status,
      }: EtapaAtualizadaPayload) => {
        setEtapaTitulo(`${id} - ${titulo}`)
        setTarefaAtualId(tarefa_id || null)
        setTarefaAtualStatus(tarefa_id ? tarefa_status || 'em_andamento' : null)

        if (tarefa_id) {
          sessionStorage.setItem('acomp_tarefa_ativa', String(tarefa_id))
        } else {
          sessionStorage.removeItem('acomp_tarefa_ativa')
        }

        if (status !== 'terminou') {
          setStatus('fazendo')
        }
      },
      onEstadoContador: ({ tempoFinal }: { tempoFinal: number | null }) => {
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }

        if (tempoFinal === null) {
          setTimeoutAtivo(false)
          return
        }

        const restante = Math.max(0, tempoFinal - Date.now())

        if (restante <= 0) {
          setTimeoutAtivo(false)
          return
        }

        setTimeoutAtivo(true)

        if (statusRef.current !== 'em_timeout') {
          statusAnteriorTimeoutRef.current = statusRef.current
        }

        timeoutRef.current = window.setTimeout(() => {
          timeoutRef.current = null
          setTimeoutAtivo(false)

          const statusRetorno = statusAnteriorTimeoutRef.current
          setStatus(statusRetorno === 'desconectado' ? 'fazendo' : statusRetorno)
        }, restante)
      },
      onConnect: () => {
        // noop
      },
      onDisconnect: () => {
        setStatus('desconectado')
      },
    }),
    [status],
  )

  const realtime = useAlunoRealtime(handlers)

  useEffect(() => {
    if (!realtime.connected) return
    realtime.registrarDevice()
    if (nome) realtime.registrarAluno(nome)
  }, [nome, realtime, realtime.connected])

  useEffect(() => {
    if (!nome || !realtime.connected) return
    const heartbeatId = window.setInterval(() => {
      realtime.emitirHeartbeat(nome)
    }, 30000)
    return () => window.clearInterval(heartbeatId)
  }, [nome, realtime, realtime.connected])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const executarAcaoComSync = useCallback(
    async (acao: () => Promise<void>) => {
      try {
        await acao()
      } catch (error) {
        showSyncMessage(
          {
            type: 'erro',
            text:
              error instanceof Error
                ? error.message
                : 'Nao foi possivel sincronizar agora',
          },
          3000,
        )
      }
    },
    [showSyncMessage],
  )

  const marcarConclusaoTarefa = useCallback(
    async (concluida: boolean) => {
      const user = getCurrentUser()
      if (!user?.matricula || !tarefaAtualId) return

      await sincronizarConclusaoTarefa(user.matricula, tarefaAtualId, concluida)
      showSyncMessage(
        {
          type: 'ok',
          text: concluida
            ? 'Tarefa marcada como concluida'
            : 'Tarefa marcada como pendente',
        },
        2200,
      )
    },
    [showSyncMessage, tarefaAtualId],
  )

  const mudarStatus = useCallback(
    async (novoStatus: AlunoStatus) => {
      if (!nome) return
      await realtime.mudarStatus(nome, novoStatus)
      setStatus(novoStatus)
      realtime.solicitarTimeout()
    },
    [nome, realtime],
  )

  function handleTerminei() {
    void executarAcaoComSync(async () => {
      await mudarStatus('terminou')
      await marcarConclusaoTarefa(true)
    })
  }

  function handleAjuda() {
    void executarAcaoComSync(async () => {
      await mudarStatus('aguardando_ajuda')
    })
  }

  function handleFazendo() {
    void executarAcaoComSync(async () => {
      await mudarStatus('fazendo')
      await marcarConclusaoTarefa(false)
    })
  }

  function handleSairTarefa() {
    navigate('/tarefas')
  }

  function handleIrParaMonitor() {
    navigate('/monitor')
  }

  function handleEnviarAvaliacao() {
    if (!avaliacaoId || !notaSelecionada) return
    realtime.submeterAvaliacao(avaliacaoId, notaSelecionada)
    setAvaliacaoId(null)
    setAvaliacaoMonitorNome('')
    setNotaSelecionada(0)
  }

  const statusTexto = useMemo(
    () => STATUS_LABELS[statusEfetivo] || statusEfetivo,
    [statusEfetivo],
  )
  const statusTextoCurto = useMemo(() => statusTexto.replace(/^Status:\s*/i, ''), [statusTexto])
  const statusClassName = useMemo(
    () => STATUS_CLASS[statusEfetivo] || STATUS_CLASS.fazendo,
    [statusEfetivo],
  )

  return (
    <main className="min-h-screen bg-[#f0f2f5] p-4 text-[#333]">
      <BloqueioModal
        open={showBloqueio}
        info={bloqueioInfo}
        onClose={() => setShowBloqueio(false)}
      />

      <section id="tela-principal" className="flex min-h-screen items-center justify-center">
        <AlunoStatusCard
          nome={nome}
          roleLabel={isMonitor ? 'Aluno e monitor' : 'Aluno'}
          etapaTitulo={etapaTitulo}
          statusTexto={statusTexto}
          statusClassName={statusClassName}
          queueMessage={actions.showQueue ? queueMessage : null}
          syncMessage={syncMessage}
        >
          <AlunoActions
            canHelp={actions.canHelp}
            canFinish={actions.canFinish}
            canResume={actions.canResume}
            canLeaveTask={actions.canLeaveTask}
            isMonitor={isMonitor}
            helpRequestsCount={helpRequestsCount}
            timeoutActive={actions.timeoutActive}
            currentStatusLabel={statusTextoCurto}
            onTerminei={handleTerminei}
            onAjuda={handleAjuda}
            onFazendo={handleFazendo}
            onSairTarefa={handleSairTarefa}
            onIrParaMonitor={handleIrParaMonitor}
          />

          <p className="mt-4 text-xs text-[#7f8c8d]">
            {realtime.connected ? 'Socket conectado' : 'Reconectando socket...'}
          </p>
        </AlunoStatusCard>
      </section>

      <AvaliacaoMonitorModal
        open={Boolean(avaliacaoId)}
        monitorNome={avaliacaoMonitorNome}
        notaSelecionada={notaSelecionada}
        onSelectNota={setNotaSelecionada}
        onSubmit={handleEnviarAvaliacao}
      />
    </main>
  )
}
