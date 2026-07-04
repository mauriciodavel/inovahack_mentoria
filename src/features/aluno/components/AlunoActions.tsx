type AlunoActionsProps = {
	canHelp: boolean
	canFinish: boolean
	canResume: boolean
	canLeaveTask: boolean
	isMonitor: boolean
	helpRequestsCount: number
	timeoutActive: boolean
	currentStatusLabel: string
	onTerminei: () => void
	onAjuda: () => void
	onFazendo: () => void
	onSairTarefa: () => void
	onIrParaMonitor: () => void
}

function buttonClass(baseColor: string) {
	return `w-full cursor-pointer rounded-xl px-5 py-3.5 text-left text-[1.02rem] font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:active:scale-100 ${baseColor}`
}

export default function AlunoActions({
	canHelp,
	canFinish,
	canResume,
	canLeaveTask,
	isMonitor,
	helpRequestsCount,
	timeoutActive,
	currentStatusLabel,
	onTerminei,
	onAjuda,
	onFazendo,
	onSairTarefa,
	onIrParaMonitor,
}: AlunoActionsProps) {
	const hasHelpRequests = helpRequestsCount > 0

	return (
		<div className="flex flex-col gap-4" id="botoes-acoes-aluno">
			<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
				<p className="text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
					Proximo passo
				</p>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Status atual: <strong className="text-slate-800">{currentStatusLabel}</strong>. Escolha a
					acao que melhor representa o que voce precisa fazer agora.
				</p>
			</div>

			<div className="grid gap-3">
				<button
					id="btn-terminei"
					type="button"
					disabled={!canFinish || timeoutActive}
					onClick={onTerminei}
					className={buttonClass('bg-[#27ae60]')}
				>
					<span className="block">Concluir esta etapa</span>
					<span className="mt-1 block text-sm font-medium text-white/85">
						Use quando terminar a atividade atual.
					</span>
				</button>

				<button
					id="btn-ajuda"
					type="button"
					disabled={!canHelp || timeoutActive}
					onClick={onAjuda}
					className={buttonClass('bg-[#e74c3c]')}
				>
					<span className="block">Pedir ajuda ao monitor</span>
					<span className="mt-1 block text-sm font-medium text-white/85">
						Entra na fila de atendimento e mostra sua posicao.
					</span>
				</button>

				<button
					id="btn-fazendo"
					type="button"
					disabled={!canResume}
					onClick={onFazendo}
					className={buttonClass('bg-[#64748b]')}
				>
					<span className="block">Voltar para fazendo</span>
					<span className="mt-1 block text-sm font-medium text-white/85">
						Sai da fila ou do status concluido para continuar a tarefa.
					</span>
				</button>

				{isMonitor ? (
					<button
						id="btn-ir-monitor"
						type="button"
						onClick={onIrParaMonitor}
						className={`${buttonClass('bg-[#1d4ed8]')} ${hasHelpRequests ? 'animate-pulse' : ''}`}
					>
						<span className="flex items-center justify-between gap-3">
							<span className="min-w-0">
								<span className="block">Ir para painel de monitoria</span>
								<span className="mt-1 block text-sm font-medium text-white/85">
									Atenda alunos que estao aguardando ajuda.
								</span>
							</span>
							<span className="relative inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-white/18 px-3 text-lg font-bold text-white">
								🆘
								<span className="absolute -right-1 -top-1 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-[#facc15] px-1.5 text-xs font-bold text-slate-900">
									{helpRequestsCount}
								</span>
							</span>
						</span>
					</button>
				) : null}

				<button
					id="btn-sair-tarefa"
					type="button"
					disabled={!canLeaveTask}
					onClick={onSairTarefa}
					className={buttonClass('bg-[#475569]')}
				>
					<span className="block">Voltar para minhas tarefas</span>
					<span className="mt-1 block text-sm font-medium text-white/85">
						Retorna para a lista de atividades liberadas.
					</span>
				</button>
			</div>
		</div>
	)
}
