import type { TarefaAluno } from '../services/tarefas-service'

type TarefasListProps = {
	tarefasAgrupadas: Record<string, TarefaAluno[]>
	tarefaIdEmAndamento: number | null
	loadingTaskId: number | null
	onIniciarTarefa: (tarefa: TarefaAluno) => void
}

export default function TarefasList({
	tarefasAgrupadas,
	tarefaIdEmAndamento,
	loadingTaskId,
	onIniciarTarefa,
}: TarefasListProps) {
	const unidades = Object.entries(tarefasAgrupadas)

	if (unidades.length === 0) {
		return (
			<section className="overflow-hidden rounded-[22px] border border-white/10 bg-[#22313f]/92 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
				<div className="border-b border-white/8 bg-[linear-gradient(135deg,rgba(52,152,219,0.16),rgba(236,240,241,0.04))] px-6 py-5">
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7fc7ff]">
						Situacao
					</p>
					<h2 className="mt-2 text-xl font-semibold text-[#ecf0f1]">
						Nenhuma tarefa vinculada
					</h2>
				</div>
				<div className="px-6 py-5">
					<p className="text-[0.98rem] leading-relaxed text-[#95a5a6]">
						Fale com o professor para liberar suas tarefas.
					</p>
				</div>
			</section>
		)
	}

	return (
		<>
			{unidades.map(([unidade, lista], unidadeIndex) => (
				<section
					key={unidade}
					className="overflow-hidden rounded-[22px] border border-white/10 bg-[#22313f]/92 shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
				>
					<div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 bg-[linear-gradient(135deg,rgba(52,152,219,0.16),rgba(236,240,241,0.04))] px-6 py-5">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7fc7ff]">
								Unidade curricular
							</p>
							<h2 className="mt-2 text-xl font-semibold text-[#ecf0f1]">
								{unidade}
							</h2>
						</div>
						<span className="rounded-full border border-[#7fc7ff]/30 bg-[#7fc7ff]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#cfeeff]">
							{String(lista.length).padStart(2, '0')} tarefa{lista.length > 1 ? 's' : ''}
						</span>
					</div>

					<div
						className={`grid gap-4 px-5 py-5 ${
							unidadeIndex === 0 ? 'lg:grid-cols-2 2xl:grid-cols-3' : 'md:grid-cols-2 2xl:grid-cols-3'
						}`}
					>
						{lista.map((tarefa) => {
							const concluida = Number(tarefa.concluida) === 1
							const emAndamento = Number(tarefa.id) === Number(tarefaIdEmAndamento)
							const sincronizando = loadingTaskId === tarefa.id
							const desabilitado = concluida || !emAndamento || sincronizando

							const statusTexto = concluida ? 'Concluida' : 'Pendente'
							const statusClass = concluida
								? 'border-[#66bb6a]/30 bg-[#d4edda] text-[#155724]'
								: 'border-white/10 bg-[#dfe6e9] text-[#2d3436]'

							let textoBotao = '▶ Iniciar tarefa'
							if (sincronizando) textoBotao = '⏳ Sincronizando...'
							else if (concluida) textoBotao = '✅ Concluida'
							else if (!emAndamento) textoBotao = '⏸ Aguardando inicio'

							return (
								<article
									key={tarefa.id}
									data-id={tarefa.id}
									data-concluida={concluida ? 1 : 0}
									data-em-andamento={emAndamento ? 1 : 0}
									className="tarefa-card flex min-h-[220px] flex-col rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:-translate-y-0.5 hover:border-[#7fc7ff]/30"
								>
									<div className="tarefa-topo flex items-start justify-between gap-3">
										<h3 className="line-clamp-2 text-[1.02rem] font-semibold text-[#ecf0f1]">
											{tarefa.nome}
										</h3>
										<span
											className={`status-atual inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${statusClass}`}
										>
											{statusTexto}
										</span>
									</div>

									<p className="tarefa-descricao mt-3 flex-1 text-sm leading-6 text-[#bdc3c7]">
										{tarefa.descricao || 'Sem descricao'}
									</p>

									<div className="mt-4 flex items-center justify-between gap-3">
										<span
											className={`rounded-full px-2.5 py-1 text-[0.72rem] font-medium ${
												emAndamento
													? 'bg-[#3498db]/18 text-[#8fd3ff]'
													: 'bg-white/8 text-[#9db1bd]'
											}`}
										>
											{emAndamento ? 'Liberada agora' : 'Aguardando professor'}
										</span>

										<button
											type="button"
											disabled={desabilitado}
											onClick={() => onIniciarTarefa(tarefa)}
											className="btn-acao-tarefa rounded-xl bg-[linear-gradient(135deg,#3498db,#217dbb)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(52,152,219,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#7f8c8d] disabled:shadow-none disabled:opacity-55"
										>
											{textoBotao}
										</button>
									</div>
								</article>
							)
						})}
					</div>
				</section>
			))}
		</>
	)
}
