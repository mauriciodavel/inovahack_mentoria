import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DescricaoModal from '../components/DescricaoModal'
import FilaAjudaList from '../components/FilaAjudaList'
import MeusAtendimentosList from '../components/MeusAtendimentosList'
import AvaliacaoAlunoModal from '../components/AvaliacaoAlunoModal'
import { useMonitorRealtime } from '../hooks/useMonitorRealtime'
import { clearAuthToken } from '../../../shared/lib/token'
import type {
	AvaliarAlunoPayload,
	AtendimentoMonitor,
	FilaAjudaAluno,
	MonitorSessionUser,
} from '../../../shared/types/monitor.types'

function getCurrentUser() {
	try {
		return JSON.parse(localStorage.getItem('currentUser') || 'null') as MonitorSessionUser | null
	} catch {
		return null
	}
}

export default function MonitorPage() {
	const navigate = useNavigate()
	const [user] = useState<MonitorSessionUser | null>(() => getCurrentUser())
	const [nomeMonitor, setNomeMonitor] = useState('')
	const [filaAjuda, setFilaAjuda] = useState<FilaAjudaAluno[]>([])
	const [atendimentos, setAtendimentos] = useState<AtendimentoMonitor[]>([])
	const [totalAtendimentos, setTotalAtendimentos] = useState(0)
	const [mensagemErro, setMensagemErro] = useState<string | null>(null)
	const [descricaoModalOpen, setDescricaoModalOpen] = useState(false)
	const [descricao, setDescricao] = useState('')
	const [descricaoErro, setDescricaoErro] = useState<string | null>(null)
	const [finalizandoAluno, setFinalizandoAluno] = useState('')
	const [avaliacaoAtualId, setAvaliacaoAtualId] = useState<number | null>(null)
	const [nomeAlunoAvaliacao, setNomeAlunoAvaliacao] = useState('')
	const [notaSelecionada, setNotaSelecionada] = useState(0)

	const handlers = useMemo(
		() => ({
			onConnect: () => {
				if (user?.nome) {
					setMensagemErro(null)
				}
			},
			onDisconnect: () => {
				setMensagemErro('Conexao com o servidor instavel. Tentando reconectar...')
			},
			onMonitorRegistrado: ({ nome }: { nome: string }) => {
				setNomeMonitor(nome)
				setMensagemErro(null)
			},
			onFilaAtualizada: ({
				filaAjuda: nextFilaAjuda,
				atendimentos: nextAtendimentos,
			}: {
				filaAjuda: FilaAjudaAluno[]
				atendimentos: AtendimentoMonitor[]
			}) => {
				setFilaAjuda(nextFilaAjuda)
				setAtendimentos(nextAtendimentos)
			},
			onEstatisticasAtualizadas: ({
				monitores,
			}: {
				monitores: Record<string, { atendimentos: number }>
			}) => {
				const nomeAtual = nomeMonitor || user?.nome || ''
				if (!nomeAtual) return
				setTotalAtendimentos(monitores[nomeAtual]?.atendimentos ?? 0)
			},
			onAvaliarAluno: ({ id, nomeAluno }: AvaliarAlunoPayload) => {
				setAvaliacaoAtualId(id)
				setNomeAlunoAvaliacao(nomeAluno)
				setNotaSelecionada(0)
			},
			onNaoAutorizado: () => {
				setMensagemErro('Seu usuario nao esta autorizado como monitor nesta turma.')
			},
		}),
		[nomeMonitor, user?.nome],
	)

	const realtime = useMonitorRealtime(handlers)

	useEffect(() => {
		if (!user || user.perfil !== 'Monitor') {
			navigate('/login', { replace: true })
		}
	}, [navigate, user])

	useEffect(() => {
		if (!realtime.connected || !user?.nome) return
		realtime.registrarMonitor(nomeMonitor || user.nome)
	}, [nomeMonitor, realtime, realtime.connected, user?.nome])

	function handleLogout() {
		clearAuthToken()
		navigate('/login', { replace: true })
	}

	function handleIrParaTarefas() {
		navigate('/tarefas')
	}

	function handleAtenderAluno(nomeAluno: string) {
		const monitorAtual = nomeMonitor || user?.nome || ''
		if (!monitorAtual) return
		realtime.atenderAluno(monitorAtual, nomeAluno)
	}

	function handleAbrirFinalizacao(nomeAluno: string) {
		setFinalizandoAluno(nomeAluno)
		setDescricao('')
		setDescricaoErro(null)
		setDescricaoModalOpen(true)
	}

	function handleCancelarFinalizacao() {
		setDescricaoModalOpen(false)
		setDescricao('')
		setDescricaoErro(null)
		setFinalizandoAluno('')
	}

	function handleConfirmarFinalizacao() {
		const descricaoLimpa = descricao.trim()
		const monitorAtual = nomeMonitor || user?.nome || ''

		if (!descricaoLimpa) {
			setDescricaoErro('⚠️ A descricao e obrigatoria.')
			return
		}

		if (!monitorAtual || !finalizandoAluno) return

		realtime.finalizarAtendimento(monitorAtual, finalizandoAluno, descricaoLimpa)
		handleCancelarFinalizacao()
	}

	function handleEnviarAvaliacaoAluno() {
		if (!avaliacaoAtualId || !notaSelecionada) return
		realtime.submeterAvaliacaoAluno(avaliacaoAtualId, notaSelecionada)
		setAvaliacaoAtualId(null)
		setNomeAlunoAvaliacao('')
		setNotaSelecionada(0)
	}

	return (
		<main className="monitor-body min-h-screen bg-[#1e272e] text-[#ecf0f1]">
			<header className="prof-header border-b border-white/8 bg-[#2c3e50] px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.4)] md:px-8">
				<div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8ecdf7]">
							Painel de monitoria
						</p>
						<h1 className="mt-1 text-xl font-semibold text-[#ecf0f1]">
							👨‍🏫 Monitor: <span id="nome-monitor">{nomeMonitor || user?.nome || ''}</span>
						</h1>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<button
							type="button"
							onClick={handleIrParaTarefas}
							className="rounded-md border border-white/15 bg-white/8 px-4 py-2.5 text-base font-medium text-white transition hover:bg-white/14 active:scale-95"
						>
							Iniciar minha tarefa
						</button>
						<button
							id="logoutBtn"
							type="button"
							onClick={handleLogout}
							className="logout-btn rounded-md bg-[#e74c3c] px-4 py-2.5 text-base font-medium text-white transition hover:bg-[#c0392b] active:scale-95"
						>
							Sair
						</button>
						<span
							id="contador-atendimentos"
							className="badge-contador rounded-full bg-white/10 px-4 py-2 text-sm text-[#ecf0f1]"
						>
							{totalAtendimentos} atendimento(s) realizados
						</span>
					</div>
				</div>
			</header>

			<section className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 md:px-8">
				{mensagemErro ? (
					<div className="msg-erro rounded-lg bg-[#f8d7da] px-4 py-3 text-sm text-[#721c24]">
						{mensagemErro}
					</div>
				) : null}

				<div className="rounded-[20px] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-5 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.2)]">
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9ad3ff]">
						Operacao atual
					</p>
					<p className="mt-2 text-sm leading-6 text-[#d7e0e6]">
						Acompanhe a fila de ajuda, assuma atendimentos e finalize cada suporte com uma
						descricao curta para manter o historico completo.
					</p>
					<p className="mt-2 text-xs text-[#9fb0ba]">
						{realtime.connected ? 'Socket conectado' : 'Reconectando socket...'}
					</p>
				</div>

				<div className="monitor-main grid flex-1 gap-4 md:grid-cols-2">
					<section className="monitor-secao flex flex-col gap-4 rounded-[16px] bg-[#2c3e50] px-5 py-5 shadow-[0_16px_36px_rgba(0,0,0,0.18)]">
						<h2 className="border-b-2 border-white/10 pb-2 text-base font-semibold uppercase tracking-[0.05em]">
							🆘 Fila de ajuda
						</h2>
						<ul id="fila-ajuda" className="lista-alunos lista-monitor flex flex-col gap-3">
							<FilaAjudaList
								filaAjuda={filaAjuda}
								atendimentos={atendimentos}
								onAtender={handleAtenderAluno}
							/>
						</ul>
					</section>

					<section className="monitor-secao flex flex-col gap-4 rounded-[16px] bg-[#2c3e50] px-5 py-5 shadow-[0_16px_36px_rgba(0,0,0,0.18)]">
						<h2 className="border-b-2 border-white/10 pb-2 text-base font-semibold uppercase tracking-[0.05em]">
							🤝 Em atendimento por mim
						</h2>
						<ul
							id="meus-atendimentos"
							className="lista-alunos lista-monitor flex flex-col gap-3"
						>
							<MeusAtendimentosList
								atendimentos={atendimentos}
								nomeMonitor={nomeMonitor || user?.nome || ''}
								onFinalizar={handleAbrirFinalizacao}
							/>
						</ul>
					</section>
				</div>
			</section>

			<DescricaoModal
				open={descricaoModalOpen}
				descricao={descricao}
				erro={descricaoErro}
				onChangeDescricao={(value) => {
					setDescricao(value)
					if (value.trim()) setDescricaoErro(null)
				}}
				onConfirm={handleConfirmarFinalizacao}
				onCancel={handleCancelarFinalizacao}
			/>

			<AvaliacaoAlunoModal
				open={Boolean(avaliacaoAtualId)}
				nomeAluno={nomeAlunoAvaliacao}
				notaSelecionada={notaSelecionada}
				onSelectNota={setNotaSelecionada}
				onSubmit={handleEnviarAvaliacaoAluno}
			/>
		</main>
	)
}
