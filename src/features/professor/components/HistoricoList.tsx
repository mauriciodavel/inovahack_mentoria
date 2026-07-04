import type {
	AtendimentoHistoricoItem,
	StudentStatus,
	TaskStatusHistoryItem,
} from '../../../shared/types/professor.types'

type HistoricoListProps = {
	historico: AtendimentoHistoricoItem[]
	resumoStatus: Record<StudentStatus, number>
	historicoStatus: TaskStatusHistoryItem[]
	statusLabels: Record<StudentStatus, string>
	formatarData: (timestamp: number) => string
}

function cardTitleStyle(color: string) {
	return `text-sm font-semibold uppercase tracking-[0.18em] ${color}`
}

export default function HistoricoList({
	historico,
	resumoStatus,
	historicoStatus,
	statusLabels,
	formatarData,
}: HistoricoListProps) {
	return (
		<div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
			<section className="rounded-2xl border border-white/10 bg-[#24313f] p-5">
				<h3 className={cardTitleStyle('text-[#ecf0f1]')}>Historico de atendimentos</h3>
				<ul id="historico-lista" className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
					{historico.length === 0 ? (
						<li className="rounded-xl border border-dashed border-white/10 px-4 py-4 text-sm italic text-[#7f8c8d]">
							Nenhum atendimento finalizado ainda
						</li>
					) : (
						[...historico].reverse().map((item) => (
							<li
								key={item.id}
								className="rounded-xl border border-white/8 bg-[linear-gradient(135deg,rgba(52,152,219,0.14),rgba(255,255,255,0.04))] p-4"
							>
								<div className="flex flex-wrap items-center justify-between gap-1 text-sm font-semibold text-[#ecf0f1]">
									<span>
										{item.aluno} &lt;- {item.monitor}
									</span>
									<span className="text-xs font-normal text-[#95a5a6]">
										{formatarData(item.data)}
									</span>
								</div>
								<p className="mt-1 text-sm italic text-[#bdc3c7]">
									{item.descricao || '(sem descricao)'}
								</p>
								<div className="mt-2 flex flex-wrap gap-4 text-xs text-[#f39c12]">
									<span>
										Monitor:{' '}
										{item.notaMonitor === null
											? 'aguardando'
											: `${'★'.repeat(item.notaMonitor)}${'☆'.repeat(
													5 - item.notaMonitor,
												)}`}
									</span>
									<span>
										Aluno:{' '}
										{item.notaAluno === null
											? 'aguardando'
											: `${'★'.repeat(item.notaAluno)}${'☆'.repeat(5 - item.notaAluno)}`}
									</span>
								</div>
							</li>
						))
					)}
				</ul>
			</section>

			<section className="rounded-2xl border border-white/10 bg-[#24313f] p-5">
				<h3 className={cardTitleStyle('text-[#ecf0f1]')}>Historico de status da tarefa atual</h3>

				<ul id="resumo-status-tarefa" className="mt-4 grid gap-2 sm:grid-cols-2">
					{Object.entries(resumoStatus).map(([status, total]) => (
						<li key={status} className="rounded-xl border border-white/8 bg-white/5 px-3 py-3 text-sm">
							{statusLabels[status as StudentStatus]}: {total}
						</li>
					))}
				</ul>

				<ul
					id="historico-status-tarefa"
					className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1"
				>
					{historicoStatus.length === 0 ? (
						<li className="rounded-xl border border-dashed border-white/10 px-4 py-4 text-sm italic text-[#7f8c8d]">
							Nenhuma movimentacao de status registrada
						</li>
					) : (
						historicoStatus.slice(0, 80).map((item) => (
							<li
								key={item.id}
								className="rounded-xl border border-white/8 bg-white/5 p-4 text-sm"
							>
								<div className="flex flex-wrap items-center justify-between gap-1">
									<span className="font-semibold">
										{item.aluno_nome || item.aluno_matricula}
									</span>
									<span className="text-xs text-[#95a5a6]">{formatarData(item.data)}</span>
								</div>
								<p className="mt-1 text-[#bdc3c7]">
									Status: {statusLabels[item.status] || item.status}
								</p>
							</li>
						))
					)}
				</ul>
			</section>
		</div>
	)
}
