import type {
	ConclusoesPayload,
	TaskOption,
	TurmaOption,
} from '../../../shared/types/professor.types'

type RelatoriosPanelProps = {
	turmas: TurmaOption[]
	tarefas: TaskOption[]
	filtroTurma: string
	filtroTarefa: string
	relatorio: ConclusoesPayload | null
	onFiltroTurmaChange: (value: string) => void
	onFiltroTarefaChange: (value: string) => void
}

function cardTitleStyle(color: string) {
	return `text-sm font-semibold uppercase tracking-[0.18em] ${color}`
}

export default function RelatoriosPanel({
	turmas,
	tarefas,
	filtroTurma,
	filtroTarefa,
	relatorio,
	onFiltroTurmaChange,
	onFiltroTarefaChange,
}: RelatoriosPanelProps) {
	const percentualGeral = relatorio?.geral.percentual_conclusao ?? 0

	return (
		<section className="space-y-6">
			<div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
				<article className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(142,68,173,0.24),rgba(52,152,219,0.14))] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
					<p className={cardTitleStyle('text-[#d8b4fe]')}>Painel de conclusao</p>
					<div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
						<div>
							<h2 className="text-2xl font-semibold text-white">Relatorios da turma em um lugar so</h2>
							<p className="mt-2 max-w-2xl text-sm text-[#d3dae3]">
								Filtre por turma ou tarefa e acompanhe conclusoes, pendencias e o ritmo da aula
								sem misturar isso com a operacao do kanban.
							</p>
						</div>

						<div className="min-w-52 rounded-2xl border border-white/10 bg-[#17212b]/80 px-4 py-3">
							<div className="text-[11px] uppercase tracking-[0.18em] text-[#a5b4c3]">
								Conclusao geral
							</div>
							<div className="mt-2 text-3xl font-semibold text-white">{percentualGeral}%</div>
							<div className="mt-3 h-2 rounded-full bg-white/10">
								<div
									className="h-2 rounded-full bg-[#c084fc] transition-[width]"
									style={{ width: `${Math.max(0, Math.min(100, percentualGeral))}%` }}
								/>
							</div>
						</div>
					</div>
				</article>

				<article className="rounded-2xl border border-white/10 bg-[#24313f] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
					<h3 className={cardTitleStyle('text-[#ecf0f1]')}>Filtros do relatorio</h3>

					<div className="mt-4 space-y-3">
						<label className="block text-xs font-medium uppercase tracking-[0.16em] text-[#8fa3b8]">
							Turma
							<select
								id="select-relatorio-turma"
								className="mt-2 w-full rounded-xl border border-[#455a64] bg-[#1e272e] px-3 py-2.5 text-sm text-[#ecf0f1]"
								value={filtroTurma}
								onChange={(event) => onFiltroTurmaChange(event.target.value)}
							>
								<option value="">Todas as turmas</option>
								{turmas.map((turma) => (
									<option key={turma.id} value={turma.id}>
										{turma.nome}
									</option>
								))}
							</select>
						</label>

						<label className="block text-xs font-medium uppercase tracking-[0.16em] text-[#8fa3b8]">
							Tarefa
							<select
								id="select-relatorio-tarefa"
								className="mt-2 w-full rounded-xl border border-[#455a64] bg-[#1e272e] px-3 py-2.5 text-sm text-[#ecf0f1]"
								value={filtroTarefa}
								onChange={(event) => onFiltroTarefaChange(event.target.value)}
							>
								<option value="">Todas as tarefas</option>
								{tarefas.map((tarefa) => (
									<option key={tarefa.id} value={tarefa.id}>
										{tarefa.nome}
									</option>
								))}
							</select>
						</label>
					</div>
				</article>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{!relatorio ? (
					<div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-sm text-[#95a5a6] md:col-span-2 xl:col-span-4">
						Sem dados para exibir no momento.
					</div>
				) : (
					<>
						<div className="rounded-2xl border border-white/10 bg-[#24313f] p-4">
							<div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa3b8]">Total de vinculos</div>
							<div className="mt-3 text-3xl font-semibold text-white">{relatorio.geral.total_vinculos}</div>
						</div>
						<div className="rounded-2xl border border-white/10 bg-[#24313f] p-4">
							<div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa3b8]">Concluidas</div>
							<div className="mt-3 text-3xl font-semibold text-emerald-300">{relatorio.geral.concluidas}</div>
						</div>
						<div className="rounded-2xl border border-white/10 bg-[#24313f] p-4">
							<div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa3b8]">Pendentes</div>
							<div className="mt-3 text-3xl font-semibold text-amber-300">{relatorio.geral.pendentes}</div>
						</div>
						<div className="rounded-2xl border border-white/10 bg-[#24313f] p-4">
							<div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa3b8]">Taxa de conclusao</div>
							<div className="mt-3 text-3xl font-semibold text-violet-300">{relatorio.geral.percentual_conclusao}%</div>
						</div>
					</>
				)}
			</div>

			<div className="grid gap-4 xl:grid-cols-2">
				<article className="rounded-2xl border border-white/10 bg-[#24313f] p-5">
					<h3 className={cardTitleStyle('text-[#ecf0f1]')}>Conclusoes por turma</h3>
					<ul id="relatorio-por-turma" className="mt-4 space-y-3 text-sm">
						{!relatorio || relatorio.porTurma.length === 0 ? (
							<li className="rounded-xl border border-dashed border-white/10 px-4 py-4 italic text-[#7f8c8d]">
								Sem dados
							</li>
						) : (
							relatorio.porTurma.map((item) => (
								<li key={item.turma_id} className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
									<div className="flex items-center justify-between gap-4">
										<div>
											<div className="font-medium text-white">{item.turma_nome}</div>
											<div className="mt-1 text-xs text-[#95a5a6]">
												{item.concluidas} concluidas de {item.total_vinculos} vinculadas
											</div>
										</div>
										<div className="text-right">
											<div className="text-lg font-semibold text-violet-300">
												{item.percentual_conclusao}%
											</div>
											<div className="text-xs text-[#95a5a6]">{item.pendentes} pendentes</div>
										</div>
									</div>
								</li>
							))
						)}
					</ul>
				</article>

				<article className="rounded-2xl border border-white/10 bg-[#24313f] p-5">
					<h3 className={cardTitleStyle('text-[#ecf0f1]')}>Conclusoes por tarefa</h3>
					<ul id="relatorio-por-tarefa" className="mt-4 space-y-3 text-sm">
						{!relatorio || relatorio.porTarefa.length === 0 ? (
							<li className="rounded-xl border border-dashed border-white/10 px-4 py-4 italic text-[#7f8c8d]">
								Sem dados
							</li>
						) : (
							relatorio.porTarefa.map((item) => (
								<li key={item.tarefa_id} className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
									<div className="flex items-center justify-between gap-4">
										<div>
											<div className="font-medium text-white">{item.tarefa_nome}</div>
											<div className="mt-1 text-xs text-[#95a5a6]">
												{item.concluidas} concluidas de {item.total_vinculos} vinculadas
											</div>
										</div>
										<div className="text-right">
											<div className="text-lg font-semibold text-sky-300">
												{item.percentual_conclusao}%
											</div>
											<div className="text-xs text-[#95a5a6]">{item.pendentes} pendentes</div>
										</div>
									</div>
								</li>
							))
						)}
					</ul>
				</article>
			</div>
		</section>
	)
}
