import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useProfessorRealtime } from '../hooks/useProfessorRealtime'
import {
  definirTarefaAtual,
  listarTarefas,
  listarTurmas,
  obterConclusoes,
  obterEtapaAtual,
} from '../services/professor-service'
import type {
  AtendimentoHistoricoItem,
  AverageCounter,
  ConclusoesPayload,
  ProfessorStudent,
  StageInfo,
  StudentCounter,
  StudentStatus,
  TaskOption,
  TaskStatusHistoryItem,
  TurmaOption,
} from '../../../shared/types/professor.types'
import DashboardStatus from '../components/DashboardStatus'
import HistoricoList from '../components/HistoricoList'
import PresenceColumns from '../components/PresenceColumns'
import ProfessorHeader from '../components/ProfessorHeader'
import RelatoriosPanel from '../components/RelatoriosPanel'
import TimeoutModal from '../components/TimeoutModal'
import {
  estrelasPorMedia,
  formatarData,
  tocarSomAjuda,
  tocarSomConclusao,
} from '../utils/professor-helpers'

type FlashType = 'error' | 'info' | 'success'

type FlashMessage = {
  type: FlashType
  text: string
}

const emptyStage: StageInfo = {
  id: 1,
  titulo: 'Etapa 1',
  tarefa_id: null,
}

const emptyResumoStatus: Record<StudentStatus, number> = {
  ausente: 0,
  aguardando_ajuda: 0,
  em_atendimento: 0,
  fazendo: 0,
  terminou: 0,
}

const statusLabels: Record<StudentStatus, string> = {
  ausente: 'Ausente',
  aguardando_ajuda: 'Aguardando ajuda',
  em_atendimento: 'Em atendimento',
  fazendo: 'Fazendo',
  terminou: 'Terminou',
}

export default function ProfessorPage() {
  const location = useLocation()
  const [alunos, setAlunos] = useState<ProfessorStudent[]>([])
  const [tarefas, setTarefas] = useState<TaskOption[]>([])
  const [turmas, setTurmas] = useState<TurmaOption[]>([])
  const [etapa, setEtapa] = useState<StageInfo>(emptyStage)
  const [tarefaSelecionada, setTarefaSelecionada] = useState('')

  const [statsAlunos, setStatsAlunos] = useState<Record<string, StudentCounter>>({})
  const [statsMonitores, setStatsMonitores] = useState<Record<string, { atendimentos: number }>>({})
  const [mediasMonitores, setMediasMonitores] = useState<Record<string, AverageCounter>>({})
  const [mediasAlunos, setMediasAlunos] = useState<Record<string, AverageCounter>>({})

  const [historico, setHistorico] = useState<AtendimentoHistoricoItem[]>([])
  const [resumoStatus, setResumoStatus] = useState<Record<StudentStatus, number>>(emptyResumoStatus)
  const [historicoStatus, setHistoricoStatus] = useState<TaskStatusHistoryItem[]>([])

  const [relatorio, setRelatorio] = useState<ConclusoesPayload | null>(null)
  const [filtroTurma, setFiltroTurma] = useState('')
  const [filtroTarefa, setFiltroTarefa] = useState('')

  const [showTimeoutModal, setShowTimeoutModal] = useState(false)
  const [timeoutSegundos, setTimeoutSegundos] = useState('')
  const [allDoneVisible, setAllDoneVisible] = useState(false)
  const [flash, setFlash] = useState<FlashMessage | null>(null)
  const [isSavingTask, setIsSavingTask] = useState(false)

  const helpCountRef = useRef(0)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const loadRelatorio = useCallback(async () => {
    try {
      const data = await obterConclusoes({
        turmaId: filtroTurma ? Number(filtroTurma) : undefined,
        tarefaId: filtroTarefa ? Number(filtroTarefa) : undefined,
      })
      setRelatorio(data)
    } catch {
      setFlash({ type: 'error', text: 'Falha ao carregar relatorio de conclusoes' })
    }
  }, [filtroTarefa, filtroTurma])

  const onListUpdate = useCallback(
    (list: ProfessorStudent[]) => {
      setAlunos(list)
      setAllDoneVisible(false)

      const helpCount = list.filter((item) => item.status === 'aguardando_ajuda').length
      if (helpCount > helpCountRef.current) {
        tocarSomAjuda(audioCtxRef)
      }
      helpCountRef.current = helpCount

      void loadRelatorio()
    },
    [loadRelatorio],
  )

  const onAllFinished = useCallback(() => {
    setAllDoneVisible(true)
    tocarSomConclusao(audioCtxRef)
  }, [])

  const onStatsUpdate = useCallback(
    (payload: {
      alunos: Record<string, StudentCounter>
      monitores: Record<string, { atendimentos: number }>
      mediasMonitores: Record<string, AverageCounter>
      mediasAlunos: Record<string, AverageCounter>
    }) => {
      setStatsAlunos(payload.alunos ?? {})
      setStatsMonitores(payload.monitores ?? {})
      setMediasMonitores(payload.mediasMonitores ?? {})
      setMediasAlunos(payload.mediasAlunos ?? {})
    },
    [],
  )

  const onHistoryUpdate = useCallback((items: AtendimentoHistoricoItem[]) => {
    setHistorico(items)
  }, [])

  const onStageUpdate = useCallback(
    (nextStage: StageInfo) => {
      setEtapa(nextStage)
      setTarefaSelecionada(nextStage.tarefa_id ? String(nextStage.tarefa_id) : '')
      void loadRelatorio()
    },
    [loadRelatorio],
  )

  const onTaskStatusHistoryUpdate = useCallback(
    (payload: {
      resumoAtual: Record<StudentStatus, number>
      historico: TaskStatusHistoryItem[]
    }) => {
      setResumoStatus(payload.resumoAtual ?? emptyResumoStatus)
      setHistoricoStatus(payload.historico ?? [])
    },
    [],
  )

  const handlers = useMemo(
    () => ({
      onListUpdate,
      onAllFinished,
      onStatsUpdate,
      onHistoryUpdate,
      onStageUpdate,
      onTaskStatusHistoryUpdate,
    }),
    [
      onAllFinished,
      onHistoryUpdate,
      onListUpdate,
      onStageUpdate,
      onStatsUpdate,
      onTaskStatusHistoryUpdate,
    ],
  )

  const realtime = useProfessorRealtime(handlers)

  useEffect(() => {
    async function loadInitialState() {
      try {
        const [tarefasData, turmasData, etapaData] = await Promise.all([
          listarTarefas(),
          listarTurmas(),
          obterEtapaAtual(),
        ])

        setTarefas(tarefasData)
        setTurmas(turmasData)
        setEtapa(etapaData)
        setTarefaSelecionada(etapaData.tarefa_id ? String(etapaData.tarefa_id) : '')
      } catch {
        setFlash({ type: 'error', text: 'Falha ao carregar dados iniciais da tela' })
      }
    }

    void loadInitialState()
  }, [])

  useEffect(() => {
    void loadRelatorio()
  }, [loadRelatorio])

  useEffect(() => {
    if (!flash) return
    const timer = window.setTimeout(() => setFlash(null), 4500)
    return () => window.clearTimeout(timer)
  }, [flash])

  const ajuda = useMemo(
    () => alunos.filter((student) => student.status === 'aguardando_ajuda'),
    [alunos],
  )
  const atendimento = useMemo(
    () => alunos.filter((student) => student.status === 'em_atendimento'),
    [alunos],
  )
  const fazendo = useMemo(
    () => alunos.filter((student) => student.status === 'fazendo'),
    [alunos],
  )
  const terminou = useMemo(
    () => alunos.filter((student) => student.status === 'terminou'),
    [alunos],
  )

  const totalPresentes = useMemo(
    () => alunos.filter((student) => student.status !== 'ausente').length,
    [alunos],
  )

  const listaPresenca = useMemo(
    () =>
      [...alunos].sort((a, b) => {
        const presenteA = a.status === 'ausente' ? 0 : 1
        const presenteB = b.status === 'ausente' ? 0 : 1
        return presenteB - presenteA
      }),
    [alunos],
  )

  const currentView = location.pathname === '/professor/relatorios' ? 'relatorios' : 'dashboard'

  const etapaTitulo = useMemo(() => {
    if (!etapa.tarefa_id) return `${etapa.id} - ${etapa.titulo} - sem tarefa vinculada`
    const tarefaAtual = tarefas.find((tarefa) => Number(tarefa.id) === Number(etapa.tarefa_id))
    if (!tarefaAtual) return `${etapa.id} - ${etapa.titulo} - tarefa ${etapa.tarefa_id}`
    return `${etapa.id} - ${etapa.titulo} - ${tarefaAtual.nome}`
  }, [etapa.id, etapa.tarefa_id, etapa.titulo, tarefas])

  async function handleDefinirTarefaAtual() {
    const tarefaId = Number(tarefaSelecionada)
    if (!tarefaId) {
      setFlash({ type: 'info', text: 'Selecione uma tarefa antes de definir' })
      return
    }

    try {
      setIsSavingTask(true)
      await definirTarefaAtual(tarefaId)
      setFlash({ type: 'success', text: 'Tarefa atual definida com sucesso' })
    } catch (error) {
      setFlash({
        type: 'error',
        text: error instanceof Error ? error.message : 'Falha ao definir tarefa atual',
      })
    } finally {
      setIsSavingTask(false)
    }
  }

  function handleDefinirTimeout() {
    const segundos = Number(timeoutSegundos)
    if (!Number.isFinite(segundos) || segundos < 1) {
      setFlash({ type: 'info', text: 'Digite um timeout valido (minimo 1 segundo)' })
      return
    }

    realtime.definirTimeout(segundos)
    setTimeoutSegundos('')
    setShowTimeoutModal(false)
    setFlash({ type: 'success', text: `Timeout definido para ${segundos}s` })
  }

  return (
    <main className="min-h-screen bg-[#1e272e] text-[#ecf0f1]">
      <ProfessorHeader
        etapa={etapa}
        etapaTitulo={etapaTitulo}
        tarefas={tarefas}
        tarefaSelecionada={tarefaSelecionada}
        currentView={currentView}
        isSavingTask={isSavingTask}
        isSocketConnected={realtime.connected}
        alunosTotal={alunos.length}
        totalPresentes={totalPresentes}
        onChangeTarefaSelecionada={setTarefaSelecionada}
        onDefinirTarefaAtual={() => {
          void handleDefinirTarefaAtual()
        }}
      />

      {flash ? (
        <div
          className={`mx-4 mt-4 rounded px-4 py-2 text-sm md:mx-8 ${
            flash.type === 'error'
              ? 'bg-red-500/20 text-red-200'
              : flash.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-200'
                : 'bg-sky-500/20 text-sky-100'
          }`}
        >
          {flash.text}
        </div>
      ) : null}

      {allDoneVisible ? (
        <div id="aviso-todos" className="mx-4 mt-4 rounded-xl bg-[#27ae60] px-4 py-2 text-center text-base font-bold text-white md:mx-8">
          Todos os alunos presentes terminaram.
        </div>
      ) : null}

      {currentView === 'dashboard' ? (
        <>
          <section className="px-4 pt-5 md:px-6">
            <div className="rounded-2xl border border-white/10 bg-[#24313f] px-4 py-4 text-sm text-[#d5dde6] shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Visao operacional da turma</h2>
                  <p className="mt-1 text-sm text-[#9db0c3]">
                    Mantivemos aqui apenas o acompanhamento dos cards do kanban para a leitura ficar mais limpa.
                  </p>
                </div>

                <button
                  id="btn-set-timeout"
                  type="button"
                  onClick={() => setShowTimeoutModal(true)}
                  className="rounded-xl bg-[#2c5264] px-4 py-2 text-sm font-semibold text-[#efefef] transition hover:bg-[#356882]"
                >
                  Definir tempo de timeout
                </button>
              </div>
            </div>
          </section>

          <PresenceColumns
            listaPresenca={listaPresenca}
            ajuda={ajuda}
            atendimento={atendimento}
            fazendo={fazendo}
            terminou={terminou}
          />
        </>
      ) : (
        <section className="px-4 py-6 md:px-6">
          <div className="space-y-6">
            <DashboardStatus
              statsAlunos={statsAlunos}
              statsMonitores={statsMonitores}
              mediasMonitores={mediasMonitores}
              mediasAlunos={mediasAlunos}
              estrelasPorMedia={estrelasPorMedia}
            />

            <RelatoriosPanel
              turmas={turmas}
              tarefas={tarefas}
              filtroTurma={filtroTurma}
              filtroTarefa={filtroTarefa}
              relatorio={relatorio}
              onFiltroTurmaChange={setFiltroTurma}
              onFiltroTarefaChange={setFiltroTarefa}
            />

            <HistoricoList
              historico={historico}
              resumoStatus={resumoStatus}
              historicoStatus={historicoStatus}
              statusLabels={statusLabels}
              formatarData={formatarData}
            />
          </div>
        </section>
      )}

      <TimeoutModal
        open={showTimeoutModal}
        timeoutSegundos={timeoutSegundos}
        onChangeTimeoutSegundos={setTimeoutSegundos}
        onClose={() => setShowTimeoutModal(false)}
        onConfirm={handleDefinirTimeout}
      />
    </main>
  )
}
