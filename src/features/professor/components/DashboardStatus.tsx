import type { AverageCounter, StudentCounter } from '../../../shared/types/professor.types'

type DashboardStatusProps = {
	statsAlunos: Record<string, StudentCounter>
	statsMonitores: Record<string, { atendimentos: number }>
	mediasMonitores: Record<string, AverageCounter>
	mediasAlunos: Record<string, AverageCounter>
	estrelasPorMedia: (media: number) => string
}

function cardTitleStyle(color: string) {
	return `text-sm font-semibold uppercase tracking-[0.18em] ${color}`
}

export default function DashboardStatus({
	statsAlunos,
	statsMonitores,
	mediasMonitores,
	mediasAlunos,
	estrelasPorMedia,
}: DashboardStatusProps) {
	return (
		<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			<article className="rounded-2xl border border-white/10 bg-[#24313f] p-5">
				<h3 className={cardTitleStyle('text-[#ecf0f1]')}>Pedidos de ajuda por aluno</h3>
				<ul id="stats-alunos" className="mt-4 space-y-2">
					{Object.entries(statsAlunos).length === 0 ? (
						<li className="rounded-xl border border-dashed border-white/10 px-4 py-4 text-sm italic text-[#7f8c8d]">
							Nenhum registro ainda
						</li>
					) : (
						Object.entries(statsAlunos)
							.sort(([, a], [, b]) => b.pedidosAjuda - a.pedidosAjuda)
							.map(([nome, item]) => (
								<li key={nome} className="rounded-xl border border-white/8 bg-white/5 px-3 py-3 text-sm">
									{nome}: {item.pedidosAjuda} pedido(s)
								</li>
							))
					)}
				</ul>
			</article>

			<article className="rounded-2xl border border-white/10 bg-[#24313f] p-5">
				<h3 className={cardTitleStyle('text-[#ecf0f1]')}>Atendimentos por monitor</h3>
				<ul id="stats-monitores" className="mt-4 space-y-2">
					{Object.entries(statsMonitores).length === 0 ? (
						<li className="rounded-xl border border-dashed border-white/10 px-4 py-4 text-sm italic text-[#7f8c8d]">
							Nenhum registro ainda
						</li>
					) : (
						Object.entries(statsMonitores)
							.sort(([, a], [, b]) => b.atendimentos - a.atendimentos)
							.map(([nome, item]) => (
								<li key={nome} className="rounded-xl border border-white/8 bg-white/5 px-3 py-3 text-sm">
									{nome}: {item.atendimentos} atendimento(s)
								</li>
							))
					)}
				</ul>
			</article>

			<article className="rounded-2xl border border-white/10 bg-[#24313f] p-5">
				<h3 className={cardTitleStyle('text-[#ecf0f1]')}>Media de avaliacao dos monitores</h3>
				<p className="text-xs italic text-[#95a5a6]">Nota dada pelos alunos</p>
				<ul id="stats-media-monitores" className="mt-4 space-y-2">
					{Object.entries(mediasMonitores).length === 0 ? (
						<li className="rounded-xl border border-dashed border-white/10 px-4 py-4 text-sm italic text-[#7f8c8d]">
							Nenhuma avaliacao ainda
						</li>
					) : (
						Object.entries(mediasMonitores)
							.sort(([, a], [, b]) => b.soma / b.total - a.soma / a.total)
							.map(([nome, value]) => {
								const media = value.soma / value.total
								return (
									<li key={nome} className="rounded-xl border border-white/8 bg-white/5 px-3 py-3 text-sm">
										{nome}: {estrelasPorMedia(media)} {media.toFixed(1)}/5 ({value.total}{' '}
										avaliacao/oes)
									</li>
								)
							})
					)}
				</ul>
			</article>

			<article className="rounded-2xl border border-white/10 bg-[#24313f] p-5">
				<h3 className={cardTitleStyle('text-[#ecf0f1]')}>Media de avaliacao dos alunos</h3>
				<p className="text-xs italic text-[#95a5a6]">Nota dada pelos monitores</p>
				<ul id="stats-media-alunos" className="mt-4 space-y-2">
					{Object.entries(mediasAlunos).length === 0 ? (
						<li className="rounded-xl border border-dashed border-white/10 px-4 py-4 text-sm italic text-[#7f8c8d]">
							Nenhuma avaliacao ainda
						</li>
					) : (
						Object.entries(mediasAlunos)
							.sort(([, a], [, b]) => b.soma / b.total - a.soma / a.total)
							.map(([nome, value]) => {
								const media = value.soma / value.total
								return (
									<li key={nome} className="rounded-xl border border-white/8 bg-white/5 px-3 py-3 text-sm">
										{nome}: {estrelasPorMedia(media)} {media.toFixed(1)}/5 ({value.total}{' '}
										avaliacao/oes)
									</li>
								)
							})
					)}
				</ul>
			</article>
		</section>
	)
}
