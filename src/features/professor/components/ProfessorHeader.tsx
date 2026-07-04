import { Link } from 'react-router-dom'
import type { StageInfo, TaskOption } from '../../../shared/types/professor.types'

type ProfessorView = 'dashboard' | 'relatorios'

type ProfessorHeaderProps = {
  etapa: StageInfo
  etapaTitulo: string
  tarefas: TaskOption[]
  tarefaSelecionada: string
  currentView: ProfessorView
  isSavingTask: boolean
  isSocketConnected: boolean
  alunosTotal: number
  totalPresentes: number
  onChangeTarefaSelecionada: (value: string) => void
  onDefinirTarefaAtual: () => void
}

export default function ProfessorHeader({
  etapa,
  etapaTitulo,
  tarefas,
  tarefaSelecionada,
  currentView,
  isSavingTask,
  isSocketConnected,
  alunosTotal,
  totalPresentes,
  onChangeTarefaSelecionada,
  onDefinirTarefaAtual,
}: ProfessorHeaderProps) {
  return (
    <header className="border-b border-white/10 bg-[#24313f] px-4 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.22)] md:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-semibold text-white">Sala do professor</h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                isSocketConnected
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-red-500/15 text-red-200'
              }`}
            >
              {isSocketConnected ? 'Socket online' : 'Socket offline'}
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#d6dde5]">
            <span className="mr-2 text-[11px] uppercase tracking-[0.18em] text-[#8fa3b8]">Etapa atual</span>
            <strong id="etapa-atual-label" data-etapa-id={etapa.id} className="font-semibold text-white">
              {etapaTitulo}
            </strong>
          </div>

          <nav className="inline-flex w-fit rounded-2xl border border-white/10 bg-[#1d2833] p-1">
            <Link
              to="/professor"
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                currentView === 'dashboard'
                  ? 'bg-[#3498db] text-white shadow-[0_10px_24px_rgba(52,152,219,0.28)]'
                  : 'text-[#aab7c4] hover:bg-white/5 hover:text-white'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/professor/relatorios"
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                currentView === 'relatorios'
                  ? 'bg-[#8e44ad] text-white shadow-[0_10px_24px_rgba(142,68,173,0.28)]'
                  : 'text-[#aab7c4] hover:bg-white/5 hover:text-white'
              }`}
            >
              Relatorios
            </Link>
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select
            id="select-tarefa-atual"
            className="min-w-56 rounded-xl border border-[#455a64] bg-[#1e272e] px-3 py-2 text-[#ecf0f1]"
            value={tarefaSelecionada}
            onChange={(event) => onChangeTarefaSelecionada(event.target.value)}
          >
            <option value="">Selecionar tarefa</option>
            {tarefas.map((tarefa) => (
              <option key={tarefa.id} value={tarefa.id}>
                {tarefa.nome}
              </option>
            ))}
          </select>

          <button
            id="btn-definir-tarefa"
            type="button"
            disabled={isSavingTask}
            onClick={onDefinirTarefaAtual}
            className="rounded-xl bg-[#3498db] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Definir tarefa atual
          </button>

          <span
            id="total-alunos"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[#bdc3c7]"
          >
            {alunosTotal} cadastrado(s) - {totalPresentes} presente(s)
          </span>

          <Link
            to="/admin"
            className="rounded-xl border border-[#ecf0f1]/20 px-3 py-2 text-xs font-semibold text-[#ecf0f1] transition hover:bg-white/10"
          >
            Administracao
          </Link>
        </div>
      </div>
    </header>
  )
}
